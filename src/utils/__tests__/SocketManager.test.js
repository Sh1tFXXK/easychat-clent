import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import SocketManager from '../SocketManager.js'

// Mock socket.io-client
const mockSocket = {
  id: 'test-socket-id',
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  removeAllListeners: vi.fn()
}

vi.mock('socket.io-client', () => ({
  default: vi.fn(() => mockSocket)
}))

describe('SocketManager', () => {
  let socketManager
  let mockOptions

  beforeEach(() => {
    vi.clearAllMocks()
    mockSocket.connected = false
    mockSocket.id = 'test-socket-id'
    
    mockOptions = {
      url: 'ws://localhost:8082',
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      heartbeatTimeout: 5000
    }
    
    socketManager = new SocketManager(mockOptions)
  })

  afterEach(() => {
    if (socketManager) {
      socketManager.destroy()
    }
  })

  describe('初始化', () => {
    it('应该使用默认选项初始化', () => {
      const manager = new SocketManager()
      expect(manager.options.url).toBe('ws://localhost:8082')
      expect(manager.options.reconnectionAttempts).toBe(5)
      expect(manager.options.reconnectionDelay).toBe(1000)
    })

    it('应该使用自定义选项初始化', () => {
      expect(socketManager.options.url).toBe('ws://localhost:8082')
      expect(socketManager.options.reconnectionAttempts).toBe(3)
      expect(socketManager.options.reconnectionDelay).toBe(1000)
    })

    it('应该初始化连接状态', () => {
      expect(socketManager.connectionState.isConnected).toBe(false)
      expect(socketManager.connectionState.isReconnecting).toBe(false)
      expect(socketManager.connectionState.totalReconnectAttempts).toBe(0)
    })
  })

  describe('连接管理', () => {
    it('应该能够连接到Socket服务器', async () => {
      const token = 'test-token'
      
      // 模拟连接成功 - 使用 once 方法的回调
      mockSocket.once.mockImplementation((event, callback) => {
        if (event === 'connect') {
          setTimeout(() => {
            mockSocket.connected = true
            callback()
          }, 10)
        }
      })

      const result = await socketManager.connect(token)
      
      expect(result).toBe(true)
      expect(mockSocket.connect).toHaveBeenCalled()
      expect(socketManager.token).toBe(token)
    })

    it('应该处理连接错误', async () => {
      const error = new Error('连接失败')
      
      // 模拟连接错误 - 使用 once 方法的回调
      mockSocket.once.mockImplementation((event, callback) => {
        if (event === 'connect_error') {
          setTimeout(() => {
            callback(error)
          }, 10)
        }
      })

      const result = await socketManager.connect('test-token')
      
      expect(result).toBe(false)
      expect(socketManager.connectionState.connectionErrors).toHaveLength(1)
      expect(socketManager.connectionState.connectionErrors[0].error).toBe('连接失败')
    })

    it('应该能够断开连接', () => {
      socketManager.socket = mockSocket
      socketManager.disconnect()
      
      expect(mockSocket.disconnect).toHaveBeenCalled()
      expect(socketManager.connectionState.isConnected).toBe(false)
    })

    it('应该检查连接状态', () => {
      mockSocket.connected = true
      socketManager.socket = mockSocket
      expect(socketManager.isConnected()).toBe(true)
      
      mockSocket.connected = false
      expect(socketManager.isConnected()).toBe(false)
    })
  })

  describe('事件管理', () => {
    beforeEach(() => {
      socketManager.socket = mockSocket
    })

    it('应该能够注册事件监听器', () => {
      const handler = vi.fn()
      socketManager.on('test-event', handler)
      
      expect(socketManager.eventListeners.get('test-event')).toContain(handler)
      expect(mockSocket.on).toHaveBeenCalledWith('test-event', handler)
    })

    it('应该能够移除事件监听器', () => {
      const handler = vi.fn()
      socketManager.on('test-event', handler)
      socketManager.off('test-event', handler)
      
      expect(socketManager.eventListeners.get('test-event')).not.toContain(handler)
      expect(mockSocket.off).toHaveBeenCalledWith('test-event', handler)
    })

    it('应该能够发送事件', () => {
      mockSocket.connected = true
      const data = { message: 'test' }
      const callback = vi.fn()
      
      socketManager.emit('test-event', data, callback)
      
      expect(mockSocket.emit).toHaveBeenCalledWith('test-event', data, callback)
    })

    it('连接断开时应该将消息加入队列', () => {
      mockSocket.connected = false
      const data = { message: 'test' }
      
      socketManager.emit('test-event', data)
      
      expect(socketManager.messageQueue).toHaveLength(1)
      expect(socketManager.messageQueue[0].event).toBe('test-event')
      expect(socketManager.messageQueue[0].data).toEqual(data)
    })
  })

  describe('重连机制', () => {
    it('应该在连接失败时尝试重连', async () => {
      const error = new Error('连接失败')
      
      // 模拟连接错误 - 使用 once 方法的回调
      mockSocket.once.mockImplementation((event, callback) => {
        if (event === 'connect_error') {
          setTimeout(() => {
            callback(error)
          }, 10)
        }
      })

      await socketManager.connect('test-token')
      
      expect(socketManager.connectionState.isReconnecting).toBe(true)
      expect(socketManager.reconnectAttempts).toBe(1)
    })

    it('应该实现指数退避策略', () => {
      const initialDelay = socketManager.reconnectDelay
      
      // 模拟重连失败
      socketManager.reconnectDelay = socketManager.reconnectDelay * 2
      
      expect(socketManager.reconnectDelay).toBe(initialDelay * 2)
    })

    it('应该在达到最大重连次数后停止重连', async () => {
      socketManager.reconnectAttempts = socketManager.maxReconnectAttempts
      
      const shouldReconnect = socketManager.shouldReconnect('transport error')
      
      expect(shouldReconnect).toBe(false)
    })

    it('服务器主动断开时不应该自动重连', () => {
      const shouldReconnect = socketManager.shouldReconnect('io server disconnect')
      expect(shouldReconnect).toBe(false)
    })
  })

  describe('消息队列', () => {
    it('应该处理消息队列', () => {
      const message1 = { event: 'test1', data: { msg: 'message1' } }
      const message2 = { event: 'test2', data: { msg: 'message2' } }
      
      socketManager.queueMessage(message1)
      socketManager.queueMessage(message2)
      
      expect(socketManager.messageQueue).toHaveLength(2)
      
      // 模拟连接成功
      mockSocket.connected = true
      socketManager.socket = mockSocket
      socketManager.processMessageQueue()
      
      expect(mockSocket.emit).toHaveBeenCalledTimes(2)
      expect(socketManager.messageQueue).toHaveLength(0)
    })

    it('队列满时应该移除最旧的消息', () => {
      socketManager.maxQueueSize = 2
      
      socketManager.queueMessage({ event: 'test1', data: {} })
      socketManager.queueMessage({ event: 'test2', data: {} })
      socketManager.queueMessage({ event: 'test3', data: {} })
      
      expect(socketManager.messageQueue).toHaveLength(2)
      expect(socketManager.messageQueue[0].event).toBe('test2')
      expect(socketManager.messageQueue[1].event).toBe('test3')
    })
  })

  describe('心跳检测', () => {
    it('应该开始心跳检测', () => {
      vi.useFakeTimers()
      mockSocket.connected = true
      socketManager.socket = mockSocket
      
      socketManager.startHeartbeat()
      
      // 快进时间
      vi.advanceTimersByTime(socketManager.heartbeatTimeout)
      
      expect(mockSocket.emit).toHaveBeenCalledWith('ping')
      
      vi.useRealTimers()
    })

    it('应该停止心跳检测', () => {
      socketManager.startHeartbeat()
      expect(socketManager.heartbeatInterval).not.toBeNull()
      
      socketManager.stopHeartbeat()
      expect(socketManager.heartbeatInterval).toBeNull()
    })

    it('应该更新延迟指标', () => {
      const latency = 100
      socketManager.updateLatencyMetrics(latency)
      
      expect(socketManager.performanceMetrics.latencyHistory).toContain(latency)
      expect(socketManager.performanceMetrics.averageLatency).toBe(latency)
    })
  })

  describe('连接状态管理', () => {
    it('应该更新连接状态', () => {
      const updates = {
        isConnected: true,
        lastConnectedTime: new Date()
      }
      
      socketManager.updateConnectionState(updates)
      
      expect(socketManager.connectionState.isConnected).toBe(true)
      expect(socketManager.connectionState.lastConnectedTime).toEqual(updates.lastConnectedTime)
    })

    it('应该获取完整的连接状态信息', () => {
      socketManager.socket = mockSocket
      const state = socketManager.getConnectionState()
      
      expect(state).toHaveProperty('isConnected')
      expect(state).toHaveProperty('socketId')
      expect(state).toHaveProperty('queueSize')
      expect(state).toHaveProperty('performanceMetrics')
    })
  })

  describe('URL构建', () => {
    it('应该构建不带token的URL', () => {
      const url = socketManager.buildConnectionUrl()
      expect(url).toBe('ws://localhost:8082')
    })

    it('应该构建带token的URL', () => {
      const token = 'test-token'
      const url = socketManager.buildConnectionUrl(token)
      expect(url).toBe('ws://localhost:8082?token=Bearer%20test-token')
    })

    it('应该处理已有Bearer前缀的token', () => {
      const token = 'Bearer test-token'
      const url = socketManager.buildConnectionUrl(token)
      expect(url).toBe('ws://localhost:8082?token=Bearer%20test-token')
    })
  })

  describe('页面事件处理', () => {
    it('应该处理页面可见性变化', () => {
      const connectSpy = vi.spyOn(socketManager, 'connect')
      socketManager.token = 'test-token'
      
      // 模拟页面变为可见
      global.document.visibilityState = 'visible'
      socketManager.handleVisibilityChange()
      
      expect(connectSpy).toHaveBeenCalledWith('test-token')
    })

    it('应该处理窗口焦点事件', () => {
      const connectSpy = vi.spyOn(socketManager, 'connect')
      socketManager.token = 'test-token'
      
      socketManager.handleWindowFocus()
      
      expect(connectSpy).toHaveBeenCalledWith('test-token')
    })
  })

  describe('清理和销毁', () => {
    it('应该清理Socket实例', () => {
      socketManager.socket = mockSocket
      socketManager.cleanupSocket()
      
      expect(mockSocket.removeAllListeners).toHaveBeenCalled()
      expect(socketManager.socket).toBeNull()
    })

    it('应该销毁Socket管理器', () => {
      const disconnectSpy = vi.spyOn(socketManager, 'disconnect')
      
      socketManager.destroy()
      
      expect(disconnectSpy).toHaveBeenCalled()
      expect(socketManager.eventListeners.size).toBe(0)
      expect(socketManager.messageQueue).toHaveLength(0)
    })
  })

  describe('错误处理', () => {
    it('应该记录连接错误历史', () => {
      const error1 = new Error('错误1')
      const error2 = new Error('错误2')
      
      socketManager.handleConnectionError(error1)
      socketManager.handleConnectionError(error2)
      
      expect(socketManager.connectionState.connectionErrors).toHaveLength(2)
      expect(socketManager.connectionState.connectionErrors[0].error).toBe('错误1')
      expect(socketManager.connectionState.connectionErrors[1].error).toBe('错误2')
    })

    it('应该限制错误历史记录数量', () => {
      // 添加超过10个错误
      for (let i = 0; i < 12; i++) {
        socketManager.handleConnectionError(new Error(`错误${i}`))
      }
      
      expect(socketManager.connectionState.connectionErrors).toHaveLength(10)
      // 应该保留最新的10个错误
      expect(socketManager.connectionState.connectionErrors[0].error).toBe('错误2')
      expect(socketManager.connectionState.connectionErrors[9].error).toBe('错误11')
    })
  })

  describe('性能监控', () => {
    it('应该记录连接延迟', async () => {
      // 模拟连接成功 - 使用 once 方法的回调
      mockSocket.once.mockImplementation((event, callback) => {
        if (event === 'connect') {
          setTimeout(() => {
            mockSocket.connected = true
            callback()
          }, 50)
        }
      })

      await socketManager.connect('test-token')
      
      expect(socketManager.performanceMetrics.connectionLatency).toBeGreaterThan(0)
    })

    it('应该维护延迟历史记录', () => {
      const latencies = [100, 150, 120, 200, 80]
      
      latencies.forEach(latency => {
        socketManager.updateLatencyMetrics(latency)
      })
      
      expect(socketManager.performanceMetrics.latencyHistory).toEqual(latencies)
      expect(socketManager.performanceMetrics.averageLatency).toBe(130) // (100+150+120+200+80)/5
    })

    it('应该限制延迟历史记录数量', () => {
      // 添加超过20个延迟记录
      for (let i = 0; i < 25; i++) {
        socketManager.updateLatencyMetrics(i * 10)
      }
      
      expect(socketManager.performanceMetrics.latencyHistory).toHaveLength(20)
      // 应该保留最新的20个记录
      expect(socketManager.performanceMetrics.latencyHistory[0]).toBe(50) // 5*10
      expect(socketManager.performanceMetrics.latencyHistory[19]).toBe(240) // 24*10
    })
  })
})