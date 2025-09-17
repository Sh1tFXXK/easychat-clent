import { ElMessage } from 'element-plus'
import {
  reqAddFavorite,
  reqRemoveFavorite,
  reqUpdateFavorite,
  reqSetSpecialCare,
  reqRemoveSpecialCare
} from '@/api'

/**
 * 收藏功能Socket.IO事件处理器
 * 处理收藏相关的实时同步功能
 */
class FavoriteSocketHandler {
  constructor(socketManager) {
    this.socketManager = socketManager
    this.eventListeners = new Map()
    this.isSocketAvailable = false
    
    // 初始化Socket事件监听
    this.initSocketListeners()
    
    console.log('[FavoriteSocketHandler] 收藏Socket处理器已初始化')
  }

  /**
   * 初始化Socket事件监听器
   */
  initSocketListeners() {
    if (!this.socketManager) {
      console.warn('[FavoriteSocketHandler] SocketManager未提供，将使用HTTP API降级模式')
      return
    }

    // 监听Socket连接状态变化
    this.socketManager.on('connectionStateChanged', (state) => {
      this.isSocketAvailable = state.isConnected
      console.log(`[FavoriteSocketHandler] Socket连接状态变化: ${this.isSocketAvailable ? '已连接' : '已断开'}`)
    })

    // 监听收藏相关的Socket事件
    this.setupFavoriteEventListeners()
  }

  /**
   * 设置收藏相关的Socket事件监听器
   */
  setupFavoriteEventListeners() {
    // 收藏添加事件
    this.socketManager.on('favoriteAdded', (data) => {
      console.log('[FavoriteSocketHandler] 收到收藏添加事件:', data)
      this.triggerEvent('favoriteAdded', data)
    })

    // 收藏删除事件
    this.socketManager.on('favoriteRemoved', (data) => {
      console.log('[FavoriteSocketHandler] 收到收藏删除事件:', data)
      this.triggerEvent('favoriteRemoved', data)
    })

    // 收藏更新事件
    this.socketManager.on('favoriteUpdated', (data) => {
      console.log('[FavoriteSocketHandler] 收到收藏更新事件:', data)
      this.triggerEvent('favoriteUpdated', data)
    })

    // 特别关心状态变化事件
    this.socketManager.on('specialCareChanged', (data) => {
      console.log('[FavoriteSocketHandler] 收到特别关心状态变化事件:', data)
      this.triggerEvent('specialCareChanged', data)
    })

    // 收藏批量操作事件
    this.socketManager.on('favoritesBatchUpdated', (data) => {
      console.log('[FavoriteSocketHandler] 收到收藏批量更新事件:', data)
      this.triggerEvent('favoritesBatchUpdated', data)
    })

    // 收藏同步事件（用于多设备同步）
    this.socketManager.on('favoritesSync', (data) => {
      console.log('[FavoriteSocketHandler] 收到收藏同步事件:', data)
      this.triggerEvent('favoritesSync', data)
    })
  }

  /**
   * 添加收藏
   * @param {Object} favoriteData - 收藏数据
   * @returns {Promise<Object>} 操作结果
   */
  async addFavorite(favoriteData) {
    const operation = 'addFavorite'
    console.log(`[FavoriteSocketHandler] 执行${operation}:`, favoriteData)

    try {
      if (this.isSocketAvailable && this.socketManager.isConnected()) {
        // 使用Socket.IO发送事件
        return await this.emitWithFallback('addFavorite', favoriteData, () => 
          reqAddFavorite(favoriteData)
        )
      } else {
        // 降级到HTTP API
        console.log(`[FavoriteSocketHandler] Socket不可用，降级到HTTP API执行${operation}`)
        return await this.fallbackToHttp(() => reqAddFavorite(favoriteData))
      }
    } catch (error) {
      console.error(`[FavoriteSocketHandler] ${operation}失败:`, error)
      throw error
    }
  }

  /**
   * 删除收藏
   * @param {String|Number} favoriteId - 收藏ID
   * @returns {Promise<Object>} 操作结果
   */
  async removeFavorite(favoriteId) {
    const operation = 'removeFavorite'
    console.log(`[FavoriteSocketHandler] 执行${operation}:`, favoriteId)

    try {
      if (this.isSocketAvailable && this.socketManager.isConnected()) {
        // 使用Socket.IO发送事件
        return await this.emitWithFallback('removeFavorite', { favoriteId }, () => 
          reqRemoveFavorite(favoriteId)
        )
      } else {
        // 降级到HTTP API
        console.log(`[FavoriteSocketHandler] Socket不可用，降级到HTTP API执行${operation}`)
        return await this.fallbackToHttp(() => reqRemoveFavorite(favoriteId))
      }
    } catch (error) {
      console.error(`[FavoriteSocketHandler] ${operation}失败:`, error)
      throw error
    }
  }

  /**
   * 更新收藏
   * @param {String|Number} favoriteId - 收藏ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 操作结果
   */
  async updateFavorite(favoriteId, updateData) {
    const operation = 'updateFavorite'
    console.log(`[FavoriteSocketHandler] 执行${operation}:`, { favoriteId, updateData })

    try {
      if (this.isSocketAvailable && this.socketManager.isConnected()) {
        // 使用Socket.IO发送事件
        return await this.emitWithFallback('updateFavorite', { favoriteId, ...updateData }, () => 
          reqUpdateFavorite(favoriteId, updateData)
        )
      } else {
        // 降级到HTTP API
        console.log(`[FavoriteSocketHandler] Socket不可用，降级到HTTP API执行${operation}`)
        return await this.fallbackToHttp(() => reqUpdateFavorite(favoriteId, updateData))
      }
    } catch (error) {
      console.error(`[FavoriteSocketHandler] ${operation}失败:`, error)
      throw error
    }
  }

  /**
   * 设置特别关心
   * @param {Object} specialCareData - 特别关心数据
   * @returns {Promise<Object>} 操作结果
   */
  async setSpecialCare(specialCareData) {
    const operation = 'setSpecialCare'
    console.log(`[FavoriteSocketHandler] 执行${operation}:`, specialCareData)

    try {
      if (this.isSocketAvailable && this.socketManager.isConnected()) {
        // 使用Socket.IO发送事件
        return await this.emitWithFallback('setSpecialCare', specialCareData, () => 
          reqSetSpecialCare(specialCareData)
        )
      } else {
        // 降级到HTTP API
        console.log(`[FavoriteSocketHandler] Socket不可用，降级到HTTP API执行${operation}`)
        return await this.fallbackToHttp(() => reqSetSpecialCare(specialCareData))
      }
    } catch (error) {
      console.error(`[FavoriteSocketHandler] ${operation}失败:`, error)
      throw error
    }
  }

  /**
   * 取消特别关心
   * @param {String|Number} favoriteId - 收藏ID
   * @returns {Promise<Object>} 操作结果
   */
  async removeSpecialCare(favoriteId) {
    const operation = 'removeSpecialCare'
    console.log(`[FavoriteSocketHandler] 执行${operation}:`, favoriteId)

    try {
      if (this.isSocketAvailable && this.socketManager.isConnected()) {
        // 使用Socket.IO发送事件
        return await this.emitWithFallback('removeSpecialCare', { favoriteId }, () => 
          reqRemoveSpecialCare(favoriteId)
        )
      } else {
        // 降级到HTTP API
        console.log(`[FavoriteSocketHandler] Socket不可用，降级到HTTP API执行${operation}`)
        return await this.fallbackToHttp(() => reqRemoveSpecialCare(favoriteId))
      }
    } catch (error) {
      console.error(`[FavoriteSocketHandler] ${operation}失败:`, error)
      throw error
    }
  }

  /**
   * 批量更新收藏
   * @param {Array} updates - 批量更新数据
   * @returns {Promise<Object>} 操作结果
   */
  async batchUpdateFavorites(updates) {
    const operation = 'batchUpdateFavorites'
    console.log(`[FavoriteSocketHandler] 执行${operation}:`, updates)

    try {
      if (this.isSocketAvailable && this.socketManager.isConnected()) {
        // 使用Socket.IO发送事件
        return await this.emitWithFallback('batchUpdateFavorites', { updates }, () => 
          this.batchHttpFallback(updates)
        )
      } else {
        // 降级到HTTP API
        console.log(`[FavoriteSocketHandler] Socket不可用，降级到HTTP API执行${operation}`)
        return await this.fallbackToHttp(() => this.batchHttpFallback(updates))
      }
    } catch (error) {
      console.error(`[FavoriteSocketHandler] ${operation}失败:`, error)
      throw error
    }
  }

  /**
   * 使用Socket发送事件，失败时降级到HTTP API
   * @param {String} event - 事件名称
   * @param {Object} data - 发送数据
   * @param {Function} fallbackFn - 降级函数
   * @returns {Promise<Object>} 操作结果
   */
  async emitWithFallback(event, data, fallbackFn) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn(`[FavoriteSocketHandler] Socket事件${event}超时，降级到HTTP API`)
        this.fallbackToHttp(fallbackFn).then(resolve).catch(reject)
      }, 5000) // 5秒超时

      try {
        this.socketManager.emit(event, data, (response) => {
          clearTimeout(timeout)
          
          if (response && response.success) {
            console.log(`[FavoriteSocketHandler] Socket事件${event}成功:`, response)
            resolve(response)
          } else {
            console.warn(`[FavoriteSocketHandler] Socket事件${event}失败，降级到HTTP API:`, response)
            this.fallbackToHttp(fallbackFn).then(resolve).catch(reject)
          }
        })
      } catch (error) {
        clearTimeout(timeout)
        console.error(`[FavoriteSocketHandler] Socket事件${event}发送失败:`, error)
        this.fallbackToHttp(fallbackFn).then(resolve).catch(reject)
      }
    })
  }

  /**
   * 降级到HTTP API
   * @param {Function} httpFn - HTTP API函数
   * @returns {Promise<Object>} 操作结果
   */
  async fallbackToHttp(httpFn) {
    try {
      console.log('[FavoriteSocketHandler] 使用HTTP API降级模式')
      const result = await httpFn()
      
      // 模拟Socket事件通知（用于本地状态更新）
      if (result.success) {
        this.emitLocalEvent('httpFallbackSuccess', result)
      }
      
      return result
    } catch (error) {
      console.error('[FavoriteSocketHandler] HTTP API降级也失败:', error)
      ElMessage.error('操作失败，请检查网络连接')
      throw error
    }
  }

  /**
   * 批量操作的HTTP降级处理
   * @param {Array} updates - 更新数据
   * @returns {Promise<Object>} 操作结果
   */
  async batchHttpFallback(updates) {
    const results = []
    const errors = []

    for (const update of updates) {
      try {
        let result
        if (update.operation === 'update') {
          result = await reqUpdateFavorite(update.id, update.data)
        } else if (update.operation === 'delete') {
          result = await reqRemoveFavorite(update.id)
        }
        results.push(result)
      } catch (error) {
        errors.push({ id: update.id, error: error.message })
      }
    }

    return {
      success: errors.length === 0,
      data: {
        successful: results.length,
        failed: errors.length,
        errors: errors
      }
    }
  }

  /**
   * 监听收藏事件
   * @param {String} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  onFavoriteAdded(callback) {
    this.addEventListener('favoriteAdded', callback)
  }

  /**
   * 监听收藏删除事件
   * @param {Function} callback - 回调函数
   */
  onFavoriteRemoved(callback) {
    this.addEventListener('favoriteRemoved', callback)
  }

  /**
   * 监听收藏更新事件
   * @param {Function} callback - 回调函数
   */
  onFavoriteUpdated(callback) {
    this.addEventListener('favoriteUpdated', callback)
  }

  /**
   * 监听特别关心状态变化事件
   * @param {Function} callback - 回调函数
   */
  onSpecialCareChanged(callback) {
    this.addEventListener('specialCareChanged', callback)
  }

  /**
   * 监听批量更新事件
   * @param {Function} callback - 回调函数
   */
  onBatchUpdated(callback) {
    this.addEventListener('favoritesBatchUpdated', callback)
  }

  /**
   * 监听同步事件
   * @param {Function} callback - 回调函数
   */
  onSync(callback) {
    this.addEventListener('favoritesSync', callback)
  }

  /**
   * 添加事件监听器
   * @param {String} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
    console.log(`[FavoriteSocketHandler] 添加事件监听器: ${event}`)
  }

  /**
   * 移除事件监听器
   * @param {String} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
        console.log(`[FavoriteSocketHandler] 移除事件监听器: ${event}`)
      }
    }
  }

  /**
   * 触发事件
   * @param {String} event - 事件名称
   * @param {Object} data - 事件数据
   */
  triggerEvent(event, data) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`[FavoriteSocketHandler] 事件回调执行失败 [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 发送本地事件（用于HTTP降级时的状态同步）
   * @param {String} event - 事件名称
   * @param {Object} data - 事件数据
   */
  emitLocalEvent(event, data) {
    // 延迟触发，模拟网络延迟
    setTimeout(() => {
      this.triggerEvent(event, data)
    }, 100)
  }

  /**
   * 请求收藏同步
   * 用于页面重新获得焦点时同步数据
   */
  requestSync() {
    if (this.isSocketAvailable && this.socketManager.isConnected()) {
      console.log('[FavoriteSocketHandler] 请求收藏数据同步')
      this.socketManager.emit('requestFavoritesSync', {
        timestamp: Date.now()
      })
    }
  }

  /**
   * 获取连接状态
   * @returns {Object} 连接状态信息
   */
  getConnectionStatus() {
    return {
      isSocketAvailable: this.isSocketAvailable,
      isConnected: this.socketManager ? this.socketManager.isConnected() : false,
      socketState: this.socketManager ? this.socketManager.getConnectionState() : null
    }
  }

  /**
   * 销毁处理器
   */
  destroy() {
    console.log('[FavoriteSocketHandler] 销毁收藏Socket处理器')
    
    // 清理事件监听器
    this.eventListeners.clear()
    
    // 移除Socket事件监听器
    if (this.socketManager) {
      this.socketManager.off('connectionStateChanged')
      this.socketManager.off('favoriteAdded')
      this.socketManager.off('favoriteRemoved')
      this.socketManager.off('favoriteUpdated')
      this.socketManager.off('specialCareChanged')
      this.socketManager.off('favoritesBatchUpdated')
      this.socketManager.off('favoritesSync')
    }
  }
}

export default FavoriteSocketHandler