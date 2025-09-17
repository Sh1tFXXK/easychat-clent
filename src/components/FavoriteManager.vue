<template>
  <div class="favorite-manager">
    <!-- 头部操作栏 -->
    <div class="header-actions">
      <div class="left-actions">
        <el-select
          v-model="selectedCategory"
          placeholder="选择分类"
          size="small"
          style="width: 120px"
          @change="handleCategoryChange"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
        
        <el-select
          v-model="selectedType"
          placeholder="内容类型"
          size="small"
          style="width: 100px"
          @change="handleTypeChange"
        >
          <el-option label="全部" value="" />
          <el-option label="消息" value="message" />
          <el-option label="用户" value="user" />
          <el-option label="群组" value="group" />
          <el-option label="文件" value="file" />
        </el-select>
        
        <el-switch
          v-model="showSpecialOnly"
          active-text="仅特别关心"
          size="small"
          @change="handleSpecialFilter"
        />
      </div>
      
      <div class="right-actions">
        <el-button
          v-if="selectedItems.length > 0"
          type="danger"
          size="small"
          @click="batchDelete"
        >
          删除选中 ({{ selectedItems.length }})
        </el-button>
        
        <el-button
          v-if="selectedItems.length > 0"
          type="warning"
          size="small"
          @click="batchSetSpecial"
        >
          批量关心
        </el-button>
        
        <el-button
          type="primary"
          size="small"
          @click="showCategoryManager = true"
        >
          管理分类
        </el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索收藏内容..."
        size="small"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <icon-ep-search />
        </template>
      </el-input>
    </div>

    <!-- 收藏列表 -->
    <div class="favorite-list" v-loading="loading">
      <div class="list-header">
        <el-checkbox
          v-model="selectAll"
          :indeterminate="isIndeterminate"
          @change="handleSelectAll"
        >
          全选
        </el-checkbox>
        
        <div class="sort-options">
          <el-dropdown @command="handleSort">
            <span class="sort-trigger">
              排序 <icon-ep-arrow-down />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="created_desc">创建时间 ↓</el-dropdown-item>
                <el-dropdown-item command="created_asc">创建时间 ↑</el-dropdown-item>
                <el-dropdown-item command="updated_desc">更新时间 ↓</el-dropdown-item>
                <el-dropdown-item command="updated_asc">更新时间 ↑</el-dropdown-item>
                <el-dropdown-item command="priority_desc">优先级 ↓</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 拖拽排序容器 -->
      <draggable
        v-model="favoriteItems"
        item-key="id"
        :animation="200"
        ghost-class="ghost"
        chosen-class="chosen"
        drag-class="drag"
        @end="handleDragEnd"
        :disabled="!enableDragSort"
      >
        <template #item="{ element: item }">
          <div
            :class="['favorite-item', { 'selected': selectedItems.includes(item.id), 'special-care': item.is_special }]"
            @click="handleItemClick(item)"
          >
            <div class="item-checkbox">
              <el-checkbox
                :model-value="selectedItems.includes(item.id)"
                @change="(checked) => handleItemSelect(item.id, checked)"
                @click.stop
              />
            </div>
            
            <div class="item-content">
              <div class="item-header">
                <div class="item-type">
                  <el-tag :type="getTypeTagType(item.item_type)" size="small">
                    {{ getTypeLabel(item.item_type) }}
                  </el-tag>
                  
                  <el-tag
                    v-if="item.is_special"
                    type="danger"
                    size="small"
                    class="special-tag"
                  >
                    <icon-ep-heart-filled />
                    特别关心
                  </el-tag>
                </div>
                
                <div class="item-actions">
                  <el-button
                    type="text"
                    size="small"
                    @click.stop="editItem(item)"
                  >
                    <icon-ep-edit />
                  </el-button>
                  
                  <el-button
                    type="text"
                    size="small"
                    @click.stop="deleteItem(item)"
                  >
                    <icon-ep-delete />
                  </el-button>
                </div>
              </div>
              
              <div class="item-body">
                <div class="item-preview">
                  <component
                    :is="getPreviewComponent(item.item_type)"
                    :item="item"
                  />
                </div>
                
                <div class="item-meta">
                  <div class="item-tags">
                    <el-tag
                      v-for="tag in item.tags"
                      :key="tag"
                      size="small"
                      class="tag-item"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                  
                  <div class="item-time">
                    <span>{{ formatTime(item.created_at) }}</span>
                    <span v-if="item.updated_at !== item.created_at">
                      (更新: {{ formatTime(item.updated_at) }})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </draggable>

      <!-- 空状态 -->
      <el-empty
        v-if="favoriteItems.length === 0 && !loading"
        :description="getEmptyDescription()"
        class="empty-state"
      >
        <template #image>
          <icon-ep-star />
        </template>
      </el-empty>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 分类管理对话框 -->
    <CategoryManager
      v-model:visible="showCategoryManager"
      :categories="categories"
      @categoriesChanged="loadCategories"
    />

    <!-- 编辑收藏对话框 -->
    <EditFavoriteDialog
      v-model:visible="showEditDialog"
      :favorite="editingFavorite"
      :categories="categories"
      @updated="handleFavoriteUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, inject } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import {
  reqGetFavoritesList,
  reqGetFavoriteCategories
} from '@/api'
import SocketManager from '@/utils/SocketManager.js'
import FavoriteSocketHandler from '@/utils/FavoriteSocketHandler.js'
import CategoryManager from './CategoryManager.vue'
import EditFavoriteDialog from './EditFavoriteDialog.vue'
import MessagePreview from './previews/MessagePreview.vue'
import UserPreview from './previews/UserPreview.vue'
import GroupPreview from './previews/GroupPreview.vue'
import FilePreview from './previews/FilePreview.vue'

const props = defineProps({
  height: {
    type: String,
    default: '600px'
  },
  enableDragSort: {
    type: Boolean,
    default: true
  },
  socketManager: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['itemClick', 'itemsChanged', 'connectionStatusChanged'])

// 响应式数据
const loading = ref(false)
const favoriteItems = ref([])
const categories = ref([])
const selectedItems = ref([])
const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedType = ref('')
const showSpecialOnly = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const sortBy = ref('created_desc')

// 对话框状态
const showCategoryManager = ref(false)
const showEditDialog = ref(false)
const editingFavorite = ref(null)

// Socket相关
const socketManager = ref(null)
const favoriteSocketHandler = ref(null)
const connectionStatus = ref({
  isSocketAvailable: false,
  isConnected: false,
  lastSyncTime: null
})

// 计算属性
const selectAll = computed({
  get: () => selectedItems.value.length === favoriteItems.value.length && favoriteItems.value.length > 0,
  set: (value) => {
    if (value) {
      selectedItems.value = favoriteItems.value.map(item => item.id)
    } else {
      selectedItems.value = []
    }
  }
})

const isIndeterminate = computed(() => {
  const selectedCount = selectedItems.value.length
  return selectedCount > 0 && selectedCount < favoriteItems.value.length
})

// 生命周期
onMounted(() => {
  initializeSocketHandler()
  loadCategories()
  loadFavorites()
})

onUnmounted(() => {
  cleanupSocketHandler()
})

// 监听搜索关键词变化
watch(searchKeyword, (newVal) => {
  if (searchTimer.value) {
    clearTimeout(searchTimer.value)
  }
  searchTimer.value = setTimeout(() => {
    currentPage.value = 1
    loadFavorites()
  }, 300)
})

const searchTimer = ref(null)

// Socket初始化和清理方法
const initializeSocketHandler = () => {
  try {
    // 使用传入的socketManager或创建新的
    if (props.socketManager) {
      socketManager.value = props.socketManager
    } else {
      // 创建新的SocketManager实例
      socketManager.value = new SocketManager({
        url: process.env.VUE_APP_SOCKET_URL || 'ws://localhost:8082',
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })
    }

    // 创建收藏Socket处理器
    favoriteSocketHandler.value = new FavoriteSocketHandler(socketManager.value)
    
    // 设置实时事件监听器
    setupRealtimeEventListeners()
    
    // 更新连接状态
    updateConnectionStatus()
    
    console.log('[FavoriteManager] Socket处理器初始化完成')
  } catch (error) {
    console.error('[FavoriteManager] Socket处理器初始化失败:', error)
    ElMessage.warning('实时同步功能不可用，将使用HTTP模式')
  }
}

const cleanupSocketHandler = () => {
  if (favoriteSocketHandler.value) {
    favoriteSocketHandler.value.destroy()
    favoriteSocketHandler.value = null
  }
  
  if (socketManager.value && !props.socketManager) {
    // 只有当socketManager是我们创建的时候才销毁它
    socketManager.value.destroy()
    socketManager.value = null
  }
  
  console.log('[FavoriteManager] Socket处理器已清理')
}

const setupRealtimeEventListeners = () => {
  if (!favoriteSocketHandler.value) return

  // 监听收藏添加事件
  favoriteSocketHandler.value.onFavoriteAdded((data) => {
    console.log('[FavoriteManager] 收到收藏添加事件:', data)
    handleRealtimeFavoriteAdded(data)
  })

  // 监听收藏删除事件
  favoriteSocketHandler.value.onFavoriteRemoved((data) => {
    console.log('[FavoriteManager] 收到收藏删除事件:', data)
    handleRealtimeFavoriteRemoved(data)
  })

  // 监听收藏更新事件
  favoriteSocketHandler.value.onFavoriteUpdated((data) => {
    console.log('[FavoriteManager] 收到收藏更新事件:', data)
    handleRealtimeFavoriteUpdated(data)
  })

  // 监听特别关心状态变化事件
  favoriteSocketHandler.value.onSpecialCareChanged((data) => {
    console.log('[FavoriteManager] 收到特别关心状态变化事件:', data)
    handleRealtimeSpecialCareChanged(data)
  })

  // 监听批量更新事件
  favoriteSocketHandler.value.onBatchUpdated((data) => {
    console.log('[FavoriteManager] 收到批量更新事件:', data)
    handleRealtimeBatchUpdated(data)
  })

  // 监听同步事件
  favoriteSocketHandler.value.onSync((data) => {
    console.log('[FavoriteManager] 收到同步事件:', data)
    handleRealtimeSync(data)
  })
}

const updateConnectionStatus = () => {
  if (favoriteSocketHandler.value) {
    const status = favoriteSocketHandler.value.getConnectionStatus()
    connectionStatus.value = {
      ...status,
      lastSyncTime: new Date()
    }
    
    emit('connectionStatusChanged', connectionStatus.value)
  }
}

// 实时事件处理方法
const handleRealtimeFavoriteAdded = (data) => {
  // 如果是当前用户的操作，可能已经在本地更新了，避免重复
  if (data.userId === getCurrentUserId()) {
    return
  }
  
  // 检查是否需要添加到当前列表
  if (shouldShowInCurrentView(data.favorite)) {
    favoriteItems.value.unshift(data.favorite)
    total.value++
    
    ElMessage.success(`收到新收藏: ${data.favorite.title || '未命名'}`)
  }
  
  emit('itemsChanged')
}

const handleRealtimeFavoriteRemoved = (data) => {
  const index = favoriteItems.value.findIndex(item => item.id === data.favoriteId)
  if (index > -1) {
    const removedItem = favoriteItems.value.splice(index, 1)[0]
    total.value--
    
    // 如果删除的是选中项，从选中列表中移除
    const selectedIndex = selectedItems.value.indexOf(data.favoriteId)
    if (selectedIndex > -1) {
      selectedItems.value.splice(selectedIndex, 1)
    }
    
    if (data.userId !== getCurrentUserId()) {
      ElMessage.info(`收藏已被删除: ${removedItem.title || '未命名'}`)
    }
  }
  
  emit('itemsChanged')
}

const handleRealtimeFavoriteUpdated = (data) => {
  const index = favoriteItems.value.findIndex(item => item.id === data.favoriteId)
  if (index > -1) {
    // 更新本地数据
    Object.assign(favoriteItems.value[index], data.updates)
    
    if (data.userId !== getCurrentUserId()) {
      ElMessage.info(`收藏已更新: ${data.updates.title || favoriteItems.value[index].title || '未命名'}`)
    }
  }
  
  emit('itemsChanged')
}

const handleRealtimeSpecialCareChanged = (data) => {
  const index = favoriteItems.value.findIndex(item => item.id === data.favoriteId)
  if (index > -1) {
    favoriteItems.value[index].is_special = data.isSpecial
    favoriteItems.value[index].special_care_priority = data.priority || 0
    
    if (data.userId !== getCurrentUserId()) {
      const message = data.isSpecial ? '已设为特别关心' : '已取消特别关心'
      ElMessage.info(`${favoriteItems.value[index].title || '收藏'} ${message}`)
    }
  }
  
  emit('itemsChanged')
}

const handleRealtimeBatchUpdated = (data) => {
  // 批量更新本地数据
  data.updates.forEach(update => {
    const index = favoriteItems.value.findIndex(item => item.id === update.id)
    if (index > -1) {
      if (update.operation === 'update') {
        Object.assign(favoriteItems.value[index], update.data)
      } else if (update.operation === 'delete') {
        favoriteItems.value.splice(index, 1)
        total.value--
      }
    }
  })
  
  if (data.userId !== getCurrentUserId()) {
    ElMessage.info(`收到批量更新: ${data.updates.length} 个收藏`)
  }
  
  emit('itemsChanged')
}

const handleRealtimeSync = (data) => {
  // 全量同步数据
  console.log('[FavoriteManager] 执行数据同步')
  loadFavorites()
  connectionStatus.value.lastSyncTime = new Date()
}

// 工具方法
const getCurrentUserId = () => {
  // 从store或其他地方获取当前用户ID
  // 这里需要根据实际的用户状态管理来实现
  return localStorage.getItem('userId') || 'current_user'
}

const shouldShowInCurrentView = (favorite) => {
  // 根据当前的筛选条件判断是否应该显示这个收藏
  if (selectedCategory.value && favorite.category_id !== selectedCategory.value) {
    return false
  }
  
  if (selectedType.value && favorite.item_type !== selectedType.value) {
    return false
  }
  
  if (showSpecialOnly.value && !favorite.is_special) {
    return false
  }
  
  if (searchKeyword.value && !favorite.title?.includes(searchKeyword.value)) {
    return false
  }
  
  return true
}

// 方法
const loadCategories = async () => {
  try {
    const result = await reqGetFavoriteCategories()
    if (result.success) {
      categories.value = result.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadFavorites = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      keyword: searchKeyword.value,
      category_id: selectedCategory.value,
      type_filter: selectedType.value,
      special_only: showSpecialOnly.value,
      sort_by: sortBy.value
    }
    
    const result = await reqGetFavoritesList(params)
    if (result.success) {
      favoriteItems.value = result.data.items
      total.value = result.data.total
      
      // 清空选中项
      selectedItems.value = []
    } else {
      throw new Error(result.message || '加载收藏列表失败')
    }
  } catch (error) {
    console.error('加载收藏列表失败:', error)
    ElMessage.error(error.message || '加载收藏列表失败')
  } finally {
    loading.value = false
  }
}

const handleCategoryChange = () => {
  currentPage.value = 1
  loadFavorites()
}

const handleTypeChange = () => {
  currentPage.value = 1
  loadFavorites()
}

const handleSpecialFilter = () => {
  currentPage.value = 1
  loadFavorites()
}

const handleSearch = () => {
  // 搜索逻辑在watch中处理
}

const handleSelectAll = (checked) => {
  if (checked) {
    selectedItems.value = favoriteItems.value.map(item => item.id)
  } else {
    selectedItems.value = []
  }
}

const handleItemSelect = (itemId, checked) => {
  if (checked) {
    if (!selectedItems.value.includes(itemId)) {
      selectedItems.value.push(itemId)
    }
  } else {
    const index = selectedItems.value.indexOf(itemId)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    }
  }
}

const handleItemClick = (item) => {
  emit('itemClick', item)
}

const handleSort = (command) => {
  sortBy.value = command
  currentPage.value = 1
  loadFavorites()
}

const handleDragEnd = async (event) => {
  if (!props.enableDragSort) return
  
  const { oldIndex, newIndex } = event
  if (oldIndex === newIndex) return
  
  try {
    // 更新排序
    const updates = favoriteItems.value.map((item, index) => ({
      id: item.id,
      operation: 'update',
      data: { sort_order: index }
    }))
    
    // 使用Socket处理器进行批量更新
    if (favoriteSocketHandler.value) {
      await favoriteSocketHandler.value.batchUpdateFavorites(updates)
    } else {
      // 降级到HTTP API
      await reqBatchUpdateFavorites({ updates: updates.map(u => ({ id: u.id, sort_order: u.data.sort_order })) })
    }
    
    ElMessage.success('排序已更新')
  } catch (error) {
    console.error('更新排序失败:', error)
    ElMessage.error('更新排序失败')
    // 恢复原始顺序
    loadFavorites()
  }
}

const batchDelete = async () => {
  if (selectedItems.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedItems.value.length} 个收藏吗？`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 使用Socket处理器进行批量删除
    if (favoriteSocketHandler.value) {
      const updates = selectedItems.value.map(id => ({
        id: id,
        operation: 'delete'
      }))
      
      await favoriteSocketHandler.value.batchUpdateFavorites(updates)
    } else {
      // 降级到HTTP API
      const deletePromises = selectedItems.value.map(id => reqRemoveFavorite(id))
      await Promise.all(deletePromises)
    }
    
    ElMessage.success(`已删除 ${selectedItems.value.length} 个收藏`)
    selectedItems.value = []
    loadFavorites()
    emit('itemsChanged')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

const batchSetSpecial = async () => {
  if (selectedItems.value.length === 0) return
  
  try {
    // 使用Socket处理器进行批量设置特别关心
    if (favoriteSocketHandler.value) {
      const setSpecialPromises = selectedItems.value.map(id => 
        favoriteSocketHandler.value.setSpecialCare({
          favorite_id: id,
          priority: 3,
          notes: ''
        })
      )
      
      await Promise.all(setSpecialPromises)
    } else {
      // 降级到HTTP API
      const setSpecialPromises = selectedItems.value.map(id => 
        reqSetSpecialCare({
          favorite_id: id,
          priority: 3,
          notes: ''
        })
      )
      
      await Promise.all(setSpecialPromises)
    }
    
    ElMessage.success(`已将 ${selectedItems.value.length} 个收藏设为特别关心`)
    selectedItems.value = []
    loadFavorites()
    emit('itemsChanged')
  } catch (error) {
    console.error('批量设置特别关心失败:', error)
    ElMessage.error('批量设置特别关心失败')
  }
}

const editItem = (item) => {
  editingFavorite.value = { ...item }
  showEditDialog.value = true
}

const deleteItem = async (item) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个收藏吗？',
      '删除收藏',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 使用Socket处理器删除收藏
    if (favoriteSocketHandler.value) {
      await favoriteSocketHandler.value.removeFavorite(item.id)
    } else {
      // 降级到HTTP API
      await reqRemoveFavorite(item.id)
    }
    
    ElMessage.success('删除成功')
    loadFavorites()
    emit('itemsChanged')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除收藏失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleFavoriteUpdated = () => {
  loadFavorites()
  emit('itemsChanged')
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadFavorites()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  loadFavorites()
}

// 工具方法
const getTypeTagType = (type) => {
  const typeMap = {
    message: 'primary',
    user: 'success',
    group: 'warning',
    file: 'info'
  }
  return typeMap[type] || 'default'
}

const getTypeLabel = (type) => {
  const labelMap = {
    message: '消息',
    user: '用户',
    group: '群组',
    file: '文件'
  }
  return labelMap[type] || type
}

const getPreviewComponent = (type) => {
  const componentMap = {
    message: MessagePreview,
    user: UserPreview,
    group: GroupPreview,
    file: FilePreview
  }
  return componentMap[type] || 'div'
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 1天内
    return `${Math.floor(diff / 3600000)}小时前`
  } else if (diff < 604800000) { // 1周内
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return date.toLocaleDateString()
  }
}

const getEmptyDescription = () => {
  if (searchKeyword.value) {
    return `没有找到包含"${searchKeyword.value}"的收藏`
  } else if (showSpecialOnly.value) {
    return '还没有特别关心的收藏'
  } else if (selectedCategory.value) {
    return '该分类下还没有收藏'
  } else if (selectedType.value) {
    return `还没有${getTypeLabel(selectedType.value)}类型的收藏`
  } else {
    return '还没有任何收藏'
  }
}

// 暴露方法给父组件
defineExpose({
  loadFavorites,
  selectedItems: computed(() => selectedItems.value),
  favoriteItems: computed(() => favoriteItems.value)
})
</script>

<style scoped>
.favorite-manager {
  display: flex;
  flex-direction: column;
  height: v-bind(height);
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-bar {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.favorite-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.sort-trigger {
  cursor: pointer;
  color: #606266;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-trigger:hover {
  color: #409eff;
}

.favorite-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fff;
}

.favorite-item:hover {
  border-color: #c6e2ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.favorite-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.favorite-item.special-care {
  border-left: 4px solid #f56c6c;
}

.item-checkbox {
  margin-right: 12px;
  margin-top: 2px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.special-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.favorite-item:hover .item-actions {
  opacity: 1;
}

.item-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-preview {
  flex: 1;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-item {
  font-size: 11px;
}

.item-time {
  white-space: nowrap;
}

.empty-state {
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.pagination {
  padding: 16px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
}

/* 拖拽样式 */
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.chosen {
  opacity: 0.9;
}

.drag {
  background: #42b983;
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .left-actions {
    justify-content: space-between;
  }
  
  .right-actions {
    justify-content: center;
  }
  
  .list-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .item-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>