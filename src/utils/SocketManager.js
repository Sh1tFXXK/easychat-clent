import io from 'socket.io-client'

/**
 * Socket连接管理器
 * 提供连接、断开、事件监听等基础功能
 * 包含连接状态管理、监控功能和自动重连机制
 */
class SocketManager {
  constructor(options = {}) {
    this.options = {
      url: options.url || 'ws://localhost:8082',
      path: options.path || '/socket.io',
      transports: options.transports || ['websocket', 'polling'],
      timeout: options.timeout || 20000,
      reconnection: options.reconnection !== false,
      reconnectionDelay: options.reconnectionDelay || 1000,
      reconnectionAttempts: options.reconnectionAttempts || 5,
      autoConnect: options.autoConnect !== false,
      forceNew: options.forceNew || false,
      ...options
    }

    this.socket = null
    this.token = null
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = this.options.reconnectionAttempts
    this.reconnectDelay = this.options.reconnectionDelay
    this.baseReconnectDelay = this.options.reconnectionDelay
    
    // 连接状态
    this.connectionState = {
      isConnected: false,
      isReconnecting: false,
      lastConnectedTime: null,
      lastDisconnectedTime: null,
      totalReconnectAttempts: 0,
      connectionErrors: []
    }

    // 事件监听器
    this.eventListeners = new Map()
    
    // 消息队列（离线时缓存消息）
    this.messageQueue = []
    this.maxQueueSize = options.maxQueueSize || 100

    // 性能监控
    this.performanceMetrics = {
      connectionLatency: 0,
      lastPingTime: 0,
      averageLatency: 0,
      latencyHistory: []
    }

    // 心跳检测
    this.heartbeatInterval = null
    this.heartbeatTimeout = options.heartbeatTimeout || 30000

    this.init()
  }

  /**
   * 初始化Socket管理器
   */
  init() {
    console.log('[SocketManager] 初始化Socket管理器')
    
    // 监听页面可见性变化
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
      window.addEventListener('focus', this.handleWindowFocus.bind(this))
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this))
    }
  }

  /**
   * 连接到Socket服务器
   * @param {string} token - 认证token
   * @returns {Promise<boolean>} 连接是否成功
   */
  async connect(token = null) {
    if (this.isConnecting) {
      console.log('[SocketManager] 正在连接中，跳过重复连接请求')
      return false
    }

    if (this.socket && this.socket.connected) {
      console.log('[SocketManager] 已经连接，跳过连接请求')
      return true
    }

    this.isConnecting = true
    this.token = token

    try {
      console.log('[SocketManager] 开始连接到Socket服务器')
      
      // 如果已有socket实例，先清理
      if (this.socket) {
        this.cleanupSocket()
      }

      // 构建连接URL
      const url = this.buildConnectionUrl(token)
      
      // 创建新的socket连接
      this.socket = io(url, {
        path: this.options.path,
        transports: this.options.transports,
        timeout: this.options.timeout,
        reconnection: false, // 我们自己管理重连
        autoConnect: false,
        forceNew: this.options.forceNew
      })

      // 设置事件监听器
      this.setupEventListeners()

      // 记录连接开始时间（用于计算延迟）
      const connectStartTime = Date.now()

      // 连接到服务器
      this.socket.connect()

      // 等待连接结果
      return new Promise((resolve) => {
        const connectTimeout = setTimeout(() => {
          console.error('[SocketManager] 连接超时')
          this.handleConnectionError(new Error('连接超时'))
          resolve(false)
        }, this.options.timeout)

        this.socket.once('connect', () => {
          clearTimeout(connectTimeout)
          this.performanceMetrics.connectionLatency = Date.now() - connectStartTime
          this.handleConnectionSuccess()
          resolve(true)
        })

        this.socket.once('connect_error', (error) => {
          clearTimeout(connectTimeout)
          this.handleConnectionError(error)
          resolve(false)
        })
      })
    } catch (error) {
      console.error('[SocketManager] 连接过程中发生错误:', error)
      this.handleConnectionError(error)
      return false
    } finally {
      this.isConnecting = false
    }
  }

  /**
   * 断开Socket连接
   */
  disconnect() {
    console.log('[SocketManager] 断开Socket连接')
    
    this.stopHeartbeat()
    this.reconnectAttempts = 0
    
    if (this.socket) {
      this.socket.disconnect()
      this.cleanupSocket()
    }

    this.updateConnectionState({
      isConnected: false,
      isReconnecting: false,
      lastDisconnectedTime: new Date()
    })
  }

  /**
   * 监听事件
   * @param {string} event - 事件名称
   * @param {function} handler - 事件处理函数
   */
  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(handler)

    if (this.socket) {
      this.socket.on(event, handler)
    }
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {function} handler - 事件处理函数
   */
  off(event, handler) {
    if (this.eventListeners.has(event)) {
      const handlers = this.eventListeners.get(event)
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }

    if (this.socket) {
      this.socket.off(event, handler)
    }
  }

  /**
   * 发送事件
   * @param {string} event - 事件名称
   * @param {*} data - 发送的数据
   * @param {function} callback - 回调函数
   */
  emit(event, data, callback) {
    if (this.socket && this.socket.connected) {
      console.log(`[SocketManager] 发送事件: ${event}`, data)
      this.socket.emit(event, data, callback)
    } else {
      console.warn(`[SocketManager] Socket未连接，事件 ${event} 加入队列`)
      this.queueMessage({ event, data, callback })
    }
  }

  /**
   * 检查是否已连接
   * @returns {boolean} 连接状态
   */
  isConnected() {
    return this.socket && this.socket.connected
  }

  /**
   * 手动重连
   * @returns {Promise<boolean>} 重连是否成功
   */
  async reconnect() {
    console.log('[SocketManager] 手动重连')
    this.disconnect()
    return await this.connect(this.token)
  }

  /**
   * 获取连接状态信息
   * @returns {object} 连接状态对象
   */
  getConnectionState() {
    return {
      ...this.connectionState,
      socketId: this.socket ? this.socket.id : null,
      isConnected: this.isConnected(),
      queueSize: this.messageQueue.length,
      performanceMetrics: this.performanceMetrics
    }
  }

  /**
   * 构建连接URL
   * @param {string} token - 认证token
   * @returns {string} 完整的连接URL
   */
  buildConnectionUrl(token) {
    let url = this.options.url
    if (token) {
      const fullToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
      url += `?token=${encodeURIComponent(fullToken)}`
    }
    return url
  }

  /**
   * 设置Socket事件监听器
   */
  setupEventListeners() {
    if (!this.socket) return

    // 连接成功
    this.socket.on('connect', () => {
      console.log('[SocketManager] Socket连接成功, ID:', this.socket.id)
      this.handleConnectionSuccess()
    })

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('[SocketManager] Socket连接错误:', error)
      this.handleConnectionError(error)
    })

    // 连接断开
    this.socket.on('disconnect', (reason) => {
      console.warn('[SocketManager] Socket连接断开, 原因:', reason)
      this.handleDisconnection(reason)
    })

    // 重新应用用户注册的事件监听器
    this.eventListeners.forEach((handlers, event) => {
      handlers.forEach(handler => {
        this.socket.on(event, handler)
      })
    })

    // 心跳响应
    this.socket.on('pong', () => {
      const now = Date.now()
      if (this.performanceMetrics.lastPingTime > 0) {
        const latency = now - this.performanceMetrics.lastPingTime
        this.updateLatencyMetrics(latency)
      }
    })
  }

  /**
   * 处理连接成功
   */
  handleConnectionSuccess() {
    this.reconnectAttempts = 0
    this.reconnectDelay = this.baseReconnectDelay
    
    this.updateConnectionState({
      isConnected: true,
      isReconnecting: false,
      lastConnectedTime: new Date()
    })

    // 处理消息队列
    this.processMessageQueue()
    
    // 开始心跳检测
    this.startHeartbeat()

    console.log('[SocketManager] 连接成功，当前状态:', this.getConnectionState())
  }

  /**
   * 处理连接错误
   * @param {Error} error - 错误对象
   */
  handleConnectionError(error) {
    console.error('[SocketManager] 连接错误:', error)
    
    this.connectionState.connectionErrors.push({
      error: error.message,
      timestamp: new Date(),
      attempt: this.reconnectAttempts
    })

    // 保持错误历史记录不超过10条
    if (this.connectionState.connectionErrors.length > 10) {
      this.connectionState.connectionErrors.shift()
    }

    this.updateConnectionState({
      isConnected: false,
      lastError: error.message
    })

    // 如果启用了重连，则尝试重连
    if (this.options.reconnection && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  /**
   * 处理连接断开
   * @param {string} reason - 断开原因
   */
  handleDisconnection(reason) {
    this.stopHeartbeat()
    
    this.updateConnectionState({
      isConnected: false,
      lastDisconnectedTime: new Date(),
      lastDisconnectReason: reason
    })

    // 根据断开原因决定是否重连
    if (this.shouldReconnect(reason)) {
      this.scheduleReconnect()
    }
  }

  /**
   * 判断是否应该重连
   * @param {string} reason - 断开原因
   * @returns {boolean} 是否应该重连
   */
  shouldReconnect(reason) {
    if (!this.options.reconnection) return false
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return false
    
    // 服务器主动断开时不自动重连
    if (reason === 'io server disconnect') return false
    
    return true
  }

  /**
   * 安排重连
   */
  scheduleReconnect() {
    if (this.connectionState.isReconnecting) return

    this.updateConnectionState({ isReconnecting: true })
    this.reconnectAttempts++
    this.connectionState.totalReconnectAttempts++

    console.log(`[SocketManager] 安排重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts}), 延迟: ${this.reconnectDelay}ms`)

    setTimeout(async () => {
      if (this.connectionState.isReconnecting) {
        const success = await this.connect(this.token)
        if (!success) {
          // 指数退避策略
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000)
        }
      }
    }, this.reconnectDelay)
  }

  /**
   * 更新连接状态
   * @param {object} updates - 状态更新
   */
  updateConnectionState(updates) {
    Object.assign(this.connectionState, updates)
    
    // 触发状态变化事件
    this.emit('connectionStateChanged', this.connectionState)
  }

  /**
   * 将消息加入队列
   * @param {object} message - 消息对象
   */
  queueMessage(message) {
    if (this.messageQueue.length >= this.maxQueueSize) {
      console.warn('[SocketManager] 消息队列已满，移除最旧的消息')
      this.messageQueue.shift()
    }
    
    this.messageQueue.push({
      ...message,
      timestamp: Date.now()
    })
  }

  /**
   * 处理消息队列
   */
  processMessageQueue() {
    if (!this.isConnected() || this.messageQueue.length === 0) return

    console.log(`[SocketManager] 处理消息队列，共 ${this.messageQueue.length} 条消息`)
    
    const messages = [...this.messageQueue]
    this.messageQueue = []

    messages.forEach(message => {
      try {
        this.socket.emit(message.event, message.data, message.callback)
      } catch (error) {
        console.error('[SocketManager] 处理队列消息时出错:', error)
        // 重新加入队列
        this.queueMessage(message)
      }
    })
  }

  /**
   * 开始心跳检测
   */
  startHeartbeat() {
    this.stopHeartbeat()
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.performanceMetrics.lastPingTime = Date.now()
        this.socket.emit('ping')
      }
    }, this.heartbeatTimeout)
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 更新延迟指标
   * @param {number} latency - 延迟时间
   */
  updateLatencyMetrics(latency) {
    this.performanceMetrics.latencyHistory.push(latency)
    
    // 保持历史记录不超过20条
    if (this.performanceMetrics.latencyHistory.length > 20) {
      this.performanceMetrics.latencyHistory.shift()
    }

    // 计算平均延迟
    const sum = this.performanceMetrics.latencyHistory.reduce((a, b) => a + b, 0)
    this.performanceMetrics.averageLatency = Math.round(sum / this.performanceMetrics.latencyHistory.length)
    
    console.log(`[SocketManager] 心跳延迟: ${latency}ms, 平均延迟: ${this.performanceMetrics.averageLatency}ms`)
  }

  /**
   * 处理页面可见性变化
   */
  handleVisibilityChange() {
    if (typeof document === 'undefined') return

    if (document.visibilityState === 'visible') {
      console.log('[SocketManager] 页面变为可见，检查连接状态')
      if (!this.isConnected() && this.token) {
        this.connect(this.token)
      }
    } else {
      console.log('[SocketManager] 页面变为隐藏')
    }
  }

  /**
   * 处理窗口获得焦点
   */
  handleWindowFocus() {
    console.log('[SocketManager] 窗口获得焦点，检查连接状态')
    if (!this.isConnected() && this.token) {
      this.connect(this.token)
    }
  }

  /**
   * 处理页面卸载前
   */
  handleBeforeUnload() {
    console.log('[SocketManager] 页面即将卸载，断开连接')
    this.disconnect()
  }

  /**
   * 清理Socket实例
   */
  cleanupSocket() {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket = null
    }
  }

  /**
   * 销毁Socket管理器
   */
  destroy() {
    console.log('[SocketManager] 销毁Socket管理器')
    
    this.disconnect()
    
    // 移除页面事件监听器
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
      window.removeEventListener('focus', this.handleWindowFocus.bind(this))
      window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this))
    }

    this.eventListeners.clear()
    this.messageQueue = []
  }
}

export default SocketManager