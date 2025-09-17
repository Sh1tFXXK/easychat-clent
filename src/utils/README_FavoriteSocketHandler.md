# FavoriteSocketHandler - 收藏功能Socket.IO集成

## 概述

FavoriteSocketHandler 是一个专门处理收藏功能实时同步的Socket.IO事件处理器。它提供了完整的Socket.IO集成，包括自动降级到HTTP API的机制，确保收藏功能在任何网络条件下都能正常工作。

## 主要特性

### 1. 实时同步功能
- **添加收藏**: 实时广播新收藏项到所有连接的客户端
- **删除收藏**: 实时同步收藏删除操作
- **更新收藏**: 实时同步收藏内容和属性更新
- **特别关心**: 实时同步特别关心状态变化
- **批量操作**: 支持批量收藏操作的实时同步

### 2. 自动降级机制
- **Socket.IO不可用时**: 自动降级到HTTP API
- **连接超时**: 5秒超时后自动降级
- **发送失败**: Socket发送失败时立即降级
- **网络中断**: 网络恢复后自动重连

### 3. 错误处理
- **连接错误**: 完善的连接错误处理和重试机制
- **事件错误**: 事件处理失败时的错误恢复
- **数据验证**: 确保数据完整性和一致性

## 使用方法

### 基本使用

```javascript
import SocketManager from '@/utils/SocketManager.js'
import FavoriteSocketHandler from '@/utils/FavoriteSocketHandler.js'

// 创建Socket管理器
const socketManager = new SocketManager({
  url: 'ws://localhost:8082',
  reconnection: true,
  reconnectionAttempts: 5
})

// 创建收藏Socket处理器
const favoriteHandler = new FavoriteSocketHandler(socketManager)

// 添加收藏
const favoriteData = {
  item_id: 'message-123',
  item_type: 'message',
  item_data: { content: 'Hello World' },
  tags: ['important']
}

try {
  const result = await favoriteHandler.addFavorite(favoriteData)
  console.log('收藏成功:', result)
} catch (error) {
  console.error('收藏失败:', error)
}
```

### 事件监听

```javascript
// 监听收藏添加事件
favoriteHandler.onFavoriteAdded((data) => {
  console.log('收到新收藏:', data.favorite)
  // 更新UI
  updateFavoritesList(data.favorite)
})

// 监听收藏删除事件
favoriteHandler.onFavoriteRemoved((data) => {
  console.log('收藏被删除:', data.favoriteId)
  // 从UI中移除
  removeFavoriteFromUI(data.favoriteId)
})

// 监听收藏更新事件
favoriteHandler.onFavoriteUpdated((data) => {
  console.log('收藏已更新:', data.favoriteId, data.updates)
  // 更新UI
  updateFavoriteInUI(data.favoriteId, data.updates)
})

// 监听特别关心状态变化
favoriteHandler.onSpecialCareChanged((data) => {
  console.log('特别关心状态变化:', data.favoriteId, data.isSpecial)
  // 更新UI
  updateSpecialCareStatus(data.favoriteId, data.isSpecial)
})
```

### 在Vue组件中使用

```javascript
// FavoriteManager.vue
import { ref, onMounted, onUnmounted } from 'vue'
import FavoriteSocketHandler from '@/utils/FavoriteSocketHandler.js'

export default {
  setup() {
    const favoriteHandler = ref(null)
    const favoriteItems = ref([])

    onMounted(() => {
      // 初始化Socket处理器
      favoriteHandler.value = new FavoriteSocketHandler(socketManager)
      
      // 设置事件监听器
      favoriteHandler.value.onFavoriteAdded((data) => {
        if (shouldShowInCurrentView(data.favorite)) {
          favoriteItems.value.unshift(data.favorite)
        }
      })

      favoriteHandler.value.onFavoriteRemoved((data) => {
        const index = favoriteItems.value.findIndex(item => item.id === data.favoriteId)
        if (index > -1) {
          favoriteItems.value.splice(index, 1)
        }
      })
    })

    onUnmounted(() => {
      if (favoriteHandler.value) {
        favoriteHandler.value.destroy()
      }
    })

    const addFavorite = async (favoriteData) => {
      try {
        await favoriteHandler.value.addFavorite(favoriteData)
        ElMessage.success('收藏成功')
      } catch (error) {
        ElMessage.error('收藏失败')
      }
    }

    return {
      favoriteItems,
      addFavorite
    }
  }
}
```

## API 参考

### 构造函数

```javascript
new FavoriteSocketHandler(socketManager)
```

**参数:**
- `socketManager`: SocketManager实例，如果为null则只使用HTTP API

### 方法

#### addFavorite(favoriteData)
添加收藏

**参数:**
- `favoriteData`: 收藏数据对象

**返回:** Promise<Object> - 操作结果

#### removeFavorite(favoriteId)
删除收藏

**参数:**
- `favoriteId`: 收藏ID

**返回:** Promise<Object> - 操作结果

#### updateFavorite(favoriteId, updateData)
更新收藏

**参数:**
- `favoriteId`: 收藏ID
- `updateData`: 更新数据

**返回:** Promise<Object> - 操作结果

#### setSpecialCare(specialCareData)
设置特别关心

**参数:**
- `specialCareData`: 特别关心数据

**返回:** Promise<Object> - 操作结果

#### removeSpecialCare(favoriteId)
取消特别关心

**参数:**
- `favoriteId`: 收藏ID

**返回:** Promise<Object> - 操作结果

#### batchUpdateFavorites(updates)
批量更新收藏

**参数:**
- `updates`: 更新操作数组

**返回:** Promise<Object> - 操作结果

### 事件监听方法

#### onFavoriteAdded(callback)
监听收藏添加事件

#### onFavoriteRemoved(callback)
监听收藏删除事件

#### onFavoriteUpdated(callback)
监听收藏更新事件

#### onSpecialCareChanged(callback)
监听特别关心状态变化事件

#### onBatchUpdated(callback)
监听批量更新事件

#### onSync(callback)
监听同步事件

### 工具方法

#### getConnectionStatus()
获取连接状态信息

**返回:** Object - 连接状态对象

#### requestSync()
请求数据同步

#### destroy()
销毁处理器，清理资源

## Socket.IO 事件

### 客户端发送事件

- `addFavorite`: 添加收藏
- `removeFavorite`: 删除收藏
- `updateFavorite`: 更新收藏
- `setSpecialCare`: 设置特别关心
- `removeSpecialCare`: 取消特别关心
- `batchUpdateFavorites`: 批量更新收藏
- `requestFavoritesSync`: 请求同步

### 服务端广播事件

- `favoriteAdded`: 收藏已添加
- `favoriteRemoved`: 收藏已删除
- `favoriteUpdated`: 收藏已更新
- `specialCareChanged`: 特别关心状态已变化
- `favoritesBatchUpdated`: 批量更新完成
- `favoritesSync`: 数据同步

## 数据格式

### 收藏数据格式

```javascript
{
  item_id: String,        // 项目ID
  item_type: String,      // 项目类型: 'message' | 'user' | 'group' | 'file'
  item_data: Object,      // 项目数据
  title: String,          // 收藏标题
  category_id: Number,    // 分类ID
  tags: Array<String>,    // 标签数组
  notes: String,          // 备注
  is_special: Boolean,    // 是否特别关心
  created_at: String,     // 创建时间
  updated_at: String      // 更新时间
}
```

### 事件数据格式

```javascript
// favoriteAdded 事件
{
  userId: String,         // 用户ID
  favorite: Object        // 收藏对象
}

// favoriteRemoved 事件
{
  userId: String,         // 用户ID
  favoriteId: String      // 收藏ID
}

// favoriteUpdated 事件
{
  userId: String,         // 用户ID
  favoriteId: String,     // 收藏ID
  updates: Object         // 更新数据
}

// specialCareChanged 事件
{
  userId: String,         // 用户ID
  favoriteId: String,     // 收藏ID
  isSpecial: Boolean,     // 是否特别关心
  priority: Number        // 优先级
}
```

## 错误处理

### 连接错误

```javascript
favoriteHandler.addEventListener('connectionStateChanged', (state) => {
  if (!state.isConnected) {
    console.warn('Socket连接断开，将使用HTTP API')
    showConnectionWarning()
  } else {
    console.log('Socket连接已恢复')
    hideConnectionWarning()
  }
})
```

### 操作错误

```javascript
try {
  await favoriteHandler.addFavorite(favoriteData)
} catch (error) {
  if (error.message.includes('timeout')) {
    ElMessage.warning('网络较慢，操作可能需要更多时间')
  } else if (error.message.includes('network')) {
    ElMessage.error('网络连接失败，请检查网络设置')
  } else {
    ElMessage.error('操作失败，请重试')
  }
}
```

## 性能优化

### 1. 事件去重
处理器会自动过滤重复的事件，避免不必要的UI更新。

### 2. 批量操作
支持批量操作以减少网络请求和提高性能。

### 3. 智能降级
根据网络状况智能选择Socket.IO或HTTP API。

### 4. 内存管理
自动清理事件监听器和资源，防止内存泄漏。

## 测试

运行测试：

```bash
npm test -- --run FavoriteSocketHandler.test.js
```

测试覆盖了以下场景：
- Socket.IO连接和断开
- 各种收藏操作
- 错误处理和降级机制
- 事件监听和触发
- 资源清理

## 注意事项

1. **版本兼容性**: 确保socket.io-client版本与后端netty-socketio兼容
2. **错误处理**: 始终使用try-catch包装异步操作
3. **资源清理**: 组件销毁时调用destroy()方法
4. **网络状况**: 在网络不稳定的环境下，降级机制会自动生效
5. **用户体验**: 提供适当的加载状态和错误提示

## 故障排除

### 常见问题

1. **连接失败**
   - 检查Socket.IO服务器地址和端口
   - 确认防火墙设置
   - 验证认证token

2. **事件不触发**
   - 检查事件监听器是否正确注册
   - 确认Socket连接状态
   - 验证事件名称拼写

3. **降级不工作**
   - 检查HTTP API是否可用
   - 确认错误处理逻辑
   - 验证超时设置

### 调试技巧

```javascript
// 启用详细日志
const favoriteHandler = new FavoriteSocketHandler(socketManager)

// 监听所有状态变化
favoriteHandler.addEventListener('connectionStateChanged', (state) => {
  console.log('连接状态:', state)
})

// 检查连接状态
console.log('当前状态:', favoriteHandler.getConnectionStatus())
```