# SocketManager - Socket.IO连接管理器

## 概述

SocketManager是一个专门为EasyChat应用设计的Socket.IO连接管理器，提供了完整的连接管理、错误处理、自动重连和性能监控功能。

## 主要特性

### 🔗 连接管理
- 自动连接和断开管理
- 支持token认证
- 连接状态实时监控
- 页面可见性和焦点事件处理

### 🔄 自动重连机制
- 指数退避策略
- 可配置的重连次数和延迟
- 智能重连判断（区分服务器主动断开和网络问题）
- 连接失败时的降级处理

### 📨 消息队列
- 离线消息缓存
- 连接恢复后自动发送队列中的消息
- 队列大小限制防止内存溢出

### 💓 心跳检测
- 定期心跳检测保持连接活跃
- 延迟监控和性能指标收集
- 连接质量评估

### 🛡️ 错误处理
- 完整的错误分类和处理
- 错误历史记录
- 连接问题诊断信息

### 📊 性能监控
- 连接延迟监控
- 平均延迟计算
- 连接质量指标

## 使用方法

### 基本使用

```javascript
import SocketManager from '@/utils/SocketManager.js'

// 创建实例
const socketManager = new SocketManager({
  url: 'ws://localhost:8082',
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  heartbeatTimeout: 30000
})

// 连接
await socketManager.connect('your-auth-token')

// 监听事件
socketManager.on('receiveMsg', (message) => {
  console.log('收到消息:', message)
})

// 发送事件
socketManager.emit('sendMsg', { content: 'Hello' })

// 断开连接
socketManager.disconnect()
```

### 配置选项

```javascript
const options = {
  url: 'ws://localhost:8082',           // Socket.IO服务器地址
  path: '/socket.io',                   // Socket.IO路径
  transports: ['websocket', 'polling'], // 传输方式
  timeout: 20000,                       // 连接超时时间
  reconnection: true,                   // 是否启用自动重连
  reconnectionAttempts: 5,              // 最大重连次数
  reconnectionDelay: 1000,              // 重连延迟
  autoConnect: true,                    // 是否自动连接
  forceNew: false,                      // 是否强制新连接
  maxQueueSize: 100,                    // 消息队列最大大小
  heartbeatTimeout: 30000               // 心跳间隔
}
```

### 事件监听

```javascript
// 连接状态变化
socketManager.on('connectionStateChanged', (state) => {
  console.log('连接状态:', state)
})

// 业务事件
socketManager.on('receiveMsg', handleMessage)
socketManager.on('userOnline', handleUserOnline)
socketManager.on('favoriteAdded', handleFavoriteAdded)
```

### 获取连接状态

```javascript
const state = socketManager.getConnectionState()
console.log('连接状态:', state)
/*
{
  isConnected: true,
  isReconnecting: false,
  lastConnectedTime: Date,
  lastDisconnectedTime: Date,
  totalReconnectAttempts: 0,
  connectionErrors: [],
  socketId: 'socket-id',
  queueSize: 0,
  performanceMetrics: {
    connectionLatency: 150,
    averageLatency: 120,
    latencyHistory: [100, 120, 150]
  }
}
*/
```

## API参考

### 构造函数
- `new SocketManager(options)` - 创建SocketManager实例

### 连接管理
- `connect(token)` - 连接到服务器
- `disconnect()` - 断开连接
- `reconnect()` - 手动重连
- `isConnected()` - 检查连接状态

### 事件管理
- `on(event, handler)` - 注册事件监听器
- `off(event, handler)` - 移除事件监听器
- `emit(event, data, callback)` - 发送事件

### 状态和监控
- `getConnectionState()` - 获取连接状态信息
- `updateConnectionState(updates)` - 更新连接状态

### 清理
- `destroy()` - 销毁SocketManager实例

## 与现有代码集成

### 替换main.js中的socket实现

```javascript
// 旧的实现
import io from 'socket.io-client'
const socket = io(url, options)

// 新的实现
import SocketManager from '@/utils/SocketManager.js'
const socketManager = new SocketManager(options)
await socketManager.connect(token)
```

### 更新Vuex store

```javascript
// 在store中使用SocketManager
import socketManager from '@/utils/socketManagerExample.js'

// 初始化
store.dispatch('socket/initSocketManager', socketManager)

// 监听状态变化
socketManager.on('connectionStateChanged', (state) => {
  store.commit('socket/SET_CONNECTION_STATE', state)
})
```

## 测试

运行单元测试：

```bash
npm run test
```

测试覆盖了以下方面：
- 连接管理
- 事件处理
- 重连机制
- 消息队列
- 心跳检测
- 错误处理
- 性能监控

## 故障排除

### 常见问题

1. **连接失败**
   - 检查服务器地址和端口
   - 验证token是否有效
   - 查看控制台错误信息

2. **重连不工作**
   - 检查`reconnection`选项是否为true
   - 验证重连次数是否已达上限
   - 查看断开原因（服务器主动断开不会自动重连）

3. **消息丢失**
   - 检查消息队列是否已满
   - 验证连接状态
   - 查看错误日志

### 调试信息

```javascript
// 获取详细的连接状态
const state = socketManager.getConnectionState()
console.log('调试信息:', state)

// 监听所有错误
socketManager.on('connectionStateChanged', (state) => {
  if (state.lastError) {
    console.error('连接错误:', state.lastError)
  }
})
```

## 性能优化建议

1. **合理设置重连参数**
   - 不要设置过短的重连延迟
   - 限制最大重连次数

2. **控制消息队列大小**
   - 根据应用需求设置合适的队列大小
   - 定期清理过期消息

3. **监控连接质量**
   - 定期检查延迟指标
   - 根据网络状况调整心跳间隔

## 版本历史

- v1.0.0 - 初始版本，包含基本连接管理和重连功能
- 支持Socket.IO v4.8.1
- 兼容netty-socketio后端