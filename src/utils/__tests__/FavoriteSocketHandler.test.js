import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import FavoriteSocketHandler from '../FavoriteSocketHandler.js'

// Mock the API functions
vi.mock('@/api', () => ({
  reqAddFavorite: vi.fn(),
  reqRemoveFavorite: vi.fn(),
  reqUpdateFavorite: vi.fn(),
  reqSetSpecialCare: vi.fn(),
  reqRemoveSpecialCare: vi.fn()
}))

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}))

describe('FavoriteSocketHandler', () => {
  let mockSocketManager
  let favoriteSocketHandler

  beforeEach(() => {
    // Create mock socket manager
    mockSocketManager = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      isConnected: vi.fn(() => true),
      getConnectionState: vi.fn(() => ({
        isConnected: true,
        isReconnecting: false
      }))
    }

    favoriteSocketHandler = new FavoriteSocketHandler(mockSocketManager)
  })

  afterEach(() => {
    if (favoriteSocketHandler) {
      favoriteSocketHandler.destroy()
    }
    vi.clearAllMocks()
  })

  describe('初始化', () => {
    it('应该正确初始化Socket事件监听器', () => {
      expect(mockSocketManager.on).toHaveBeenCalledWith('connectionStateChanged', expect.any(Function))
      expect(mockSocketManager.on).toHaveBeenCalledWith('favoriteAdded', expect.any(Function))
      expect(mockSocketManager.on).toHaveBeenCalledWith('favoriteRemoved', expect.any(Function))
      expect(mockSocketManager.on).toHaveBeenCalledWith('favoriteUpdated', expect.any(Function))
      expect(mockSocketManager.on).toHaveBeenCalledWith('specialCareChanged', expect.any(Function))
      expect(mockSocketManager.on).toHaveBeenCalledWith('favoritesBatchUpdated', expect.any(Function))
      expect(mockSocketManager.on).toHaveBeenCalledWith('favoritesSync', expect.any(Function))
    })

    it('应该在没有SocketManager时正确处理', () => {
      const handler = new FavoriteSocketHandler(null)
      expect(handler.isSocketAvailable).toBe(false)
      handler.destroy()
    })
  })

  describe('添加收藏', () => {
    it('应该在Socket可用时使用Socket发送事件', async () => {
      const favoriteData = {
        item_id: 'test-item',
        item_type: 'message',
        item_data: { content: 'test message' }
      }

      const mockResponse = {
        success: true,
        data: { favorite_id: 'test-favorite-id' }
      }

      // Mock socket emit with callback
      mockSocketManager.emit.mockImplementation((event, data, callback) => {
        setTimeout(() => callback(mockResponse), 0)
      })

      favoriteSocketHandler.isSocketAvailable = true

      const result = await favoriteSocketHandler.addFavorite(favoriteData)

      expect(mockSocketManager.emit).toHaveBeenCalledWith(
        'addFavorite',
        favoriteData,
        expect.any(Function)
      )
      expect(result).toEqual(mockResponse)
    })

    it('应该在Socket不可用时降级到HTTP API', async () => {
      const { reqAddFavorite } = await import('@/api')
      
      const favoriteData = {
        item_id: 'test-item',
        item_type: 'message',
        item_data: { content: 'test message' }
      }

      const mockResponse = {
        success: true,
        data: { favorite_id: 'test-favorite-id' }
      }

      reqAddFavorite.mockResolvedValue(mockResponse)
      favoriteSocketHandler.isSocketAvailable = false

      const result = await favoriteSocketHandler.addFavorite(favoriteData)

      expect(reqAddFavorite).toHaveBeenCalledWith(favoriteData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('删除收藏', () => {
    it('应该在Socket可用时使用Socket发送事件', async () => {
      const favoriteId = 'test-favorite-id'
      const mockResponse = {
        success: true,
        data: { favoriteId }
      }

      mockSocketManager.emit.mockImplementation((event, data, callback) => {
        setTimeout(() => callback(mockResponse), 0)
      })

      favoriteSocketHandler.isSocketAvailable = true

      const result = await favoriteSocketHandler.removeFavorite(favoriteId)

      expect(mockSocketManager.emit).toHaveBeenCalledWith(
        'removeFavorite',
        { favoriteId },
        expect.any(Function)
      )
      expect(result).toEqual(mockResponse)
    })

    it('应该在Socket不可用时降级到HTTP API', async () => {
      const { reqRemoveFavorite } = await import('@/api')
      
      const favoriteId = 'test-favorite-id'
      const mockResponse = {
        success: true,
        data: { favoriteId }
      }

      reqRemoveFavorite.mockResolvedValue(mockResponse)
      favoriteSocketHandler.isSocketAvailable = false

      const result = await favoriteSocketHandler.removeFavorite(favoriteId)

      expect(reqRemoveFavorite).toHaveBeenCalledWith(favoriteId)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('事件监听', () => {
    it('应该正确添加和触发事件监听器', () => {
      const mockCallback = vi.fn()
      
      favoriteSocketHandler.onFavoriteAdded(mockCallback)
      
      // 模拟触发事件
      favoriteSocketHandler.triggerEvent('favoriteAdded', { test: 'data' })
      
      expect(mockCallback).toHaveBeenCalledWith({ test: 'data' })
    })

    it('应该正确移除事件监听器', () => {
      const mockCallback = vi.fn()
      
      favoriteSocketHandler.addEventListener('favoriteAdded', mockCallback)
      favoriteSocketHandler.removeEventListener('favoriteAdded', mockCallback)
      
      // 触发事件应该不会调用回调
      favoriteSocketHandler.triggerEvent('favoriteAdded', { test: 'data' })
      
      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe('连接状态', () => {
    it('应该正确返回连接状态', () => {
      const status = favoriteSocketHandler.getConnectionStatus()
      
      expect(status).toHaveProperty('isSocketAvailable')
      expect(status).toHaveProperty('isConnected')
      expect(status).toHaveProperty('socketState')
    })
  })

  describe('批量操作', () => {
    it('应该正确处理批量更新', async () => {
      const updates = [
        { id: '1', operation: 'update', data: { title: 'Updated 1' } },
        { id: '2', operation: 'delete' }
      ]

      const mockResponse = {
        success: true,
        data: {
          successful: 2,
          failed: 0,
          errors: []
        }
      }

      mockSocketManager.emit.mockImplementation((event, data, callback) => {
        setTimeout(() => callback(mockResponse), 0)
      })

      favoriteSocketHandler.isSocketAvailable = true

      const result = await favoriteSocketHandler.batchUpdateFavorites(updates)

      expect(mockSocketManager.emit).toHaveBeenCalledWith(
        'batchUpdateFavorites',
        { updates },
        expect.any(Function)
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('错误处理', () => {
    it('应该在Socket超时时降级到HTTP API', async () => {
      const { reqAddFavorite } = await import('@/api')
      
      const favoriteData = {
        item_id: 'test-item',
        item_type: 'message'
      }

      const mockResponse = {
        success: true,
        data: { favorite_id: 'test-favorite-id' }
      }

      // Mock socket emit without calling callback (timeout scenario)
      mockSocketManager.emit.mockImplementation(() => {
        // Don't call callback to simulate timeout
      })

      reqAddFavorite.mockResolvedValue(mockResponse)
      favoriteSocketHandler.isSocketAvailable = true

      const result = await favoriteSocketHandler.addFavorite(favoriteData)

      // Should fallback to HTTP API after timeout
      expect(reqAddFavorite).toHaveBeenCalledWith(favoriteData)
      expect(result).toEqual(mockResponse)
    }, 10000) // 10 second timeout for this test

    it('应该在Socket发送失败时降级到HTTP API', async () => {
      const { reqAddFavorite } = await import('@/api')
      
      const favoriteData = {
        item_id: 'test-item',
        item_type: 'message'
      }

      const mockResponse = {
        success: true,
        data: { favorite_id: 'test-favorite-id' }
      }

      // Mock socket emit to throw error
      mockSocketManager.emit.mockImplementation(() => {
        throw new Error('Socket error')
      })

      reqAddFavorite.mockResolvedValue(mockResponse)
      favoriteSocketHandler.isSocketAvailable = true

      const result = await favoriteSocketHandler.addFavorite(favoriteData)

      expect(reqAddFavorite).toHaveBeenCalledWith(favoriteData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('销毁', () => {
    it('应该正确清理资源', () => {
      favoriteSocketHandler.destroy()

      expect(mockSocketManager.off).toHaveBeenCalledWith('connectionStateChanged')
      expect(mockSocketManager.off).toHaveBeenCalledWith('favoriteAdded')
      expect(mockSocketManager.off).toHaveBeenCalledWith('favoriteRemoved')
      expect(mockSocketManager.off).toHaveBeenCalledWith('favoriteUpdated')
      expect(mockSocketManager.off).toHaveBeenCalledWith('specialCareChanged')
      expect(mockSocketManager.off).toHaveBeenCalledWith('favoritesBatchUpdated')
      expect(mockSocketManager.off).toHaveBeenCalledWith('favoritesSync')
    })
  })
})