/**
 * SocketManager使用示例
 * 展示如何使用新的SocketManager替换现有的socket实现
 */

import SocketManager from './SocketManager.js'

// 创建SocketManager实例
const socketManager = new SocketManager({
  url: 'ws://localhost:8082',
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  heartbeatTimeout: 30000,
  maxQueueSize: 100
})

// 使用示例
export function initializeSocket(token) {
  // 连接到服务器
  socketManager.connect(token).then(success => {
    if (success) {
      console.log('[SocketManager] 连接成功')
      
      // 设置事件监听器
      setupEventListeners()
      
      // 开始监听连接状态变化
      socketManager.on('connectionStateChanged', (state) => {
        console.log('[SocketManager] 连接状态变化:', state)
        // 可以在这里更新Vuex store或触发其他操作
      })
      
    } else {
      console.error('[SocketManager] 连接失败')
    }
  })
}

// 设置事件监听器
function setupEventListeners() {
  // 监听消息接收
  socketManager.on('receiveMsg', (message) => {
    console.log('[SocketManager] 收到消息:', message)
    // 处理接收到的消息
  })

  // 监听用户上线
  socketManager.on('userOnline', (user) => {
    console.log('[SocketManager] 用户上线:', user)
    // 更新在线用户列表
  })

  // 监听用户下线
  socketManager.on('userOffline', (user) => {
    console.log('[SocketManager] 用户下线:', user)
    // 更新在线用户列表
  })

  // 监听收藏相关事件
  socketManager.on('favoriteAdded', (favorite) => {
    console.log('[SocketManager] 收藏添加:', favorite)
    // 更新收藏列表
  })

  socketManager.on('favoriteRemoved', (favoriteId) => {
    console.log('[SocketManager] 收藏删除:', favoriteId)
    // 从收藏列表中移除
  })

  socketManager.on('favoriteUpdated', (favorite) => {
    console.log('[SocketManager] 收藏更新:', favorite)
    // 更新收藏项
  })
}

// 发送消息
export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    socketManager.emit('sendMsg', message, (response, error) => {
      if (response) {
        resolve(response)
      } else {
        reject(new Error(error || '发送失败'))
      }
    })
  })
}

// 发送收藏操作
export function addFavorite(favoriteData) {
  socketManager.emit('addFavorite', favoriteData)
}

export function removeFavorite(favoriteId) {
  socketManager.emit('removeFavorite', favoriteId)
}

export function updateFavorite(favoriteId, updateData) {
  socketManager.emit('updateFavorite', { favoriteId, ...updateData })
}

// 获取连接状态
export function getConnectionStatus() {
  return socketManager.getConnectionState()
}

// 手动重连
export function reconnectSocket() {
  return socketManager.reconnect()
}

// 断开连接
export function disconnectSocket() {
  socketManager.disconnect()
}

// 更新token并重连
export function updateSocketToken(newToken) {
  socketManager.disconnect()
  return socketManager.connect(newToken)
}

// 导出socketManager实例供其他地方使用
export default socketManager