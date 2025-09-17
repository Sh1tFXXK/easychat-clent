<template>
  <div class="favorites-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <icon-ep-star />
          我的收藏
        </h1>
        <div class="page-stats">
          <el-tag type="info" size="small">
            总计 {{ stats.total_count || 0 }} 个收藏
          </el-tag>
          <el-tag type="danger" size="small" v-if="stats.special_count > 0">
            特别关心 {{ stats.special_count }} 个
          </el-tag>
        </div>
      </div>
      
      <div class="header-actions">
        <el-button
          type="primary"
          @click="showQuickAdd = true"
        >
          <icon-ep-plus />
          快速收藏
        </el-button>
        
        <el-dropdown @command="handleHeaderAction">
          <el-button>
            更多操作
            <icon-ep-arrow-down />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="import">
                <icon-ep-upload />
                导入收藏
              </el-dropdown-item>
              <el-dropdown-item command="export">
                <icon-ep-download />
                导出收藏
              </el-dropdown-item>
              <el-dropdown-item command="stats">
                <icon-ep-data-analysis />
                统计报告
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <icon-ep-setting />
                设置
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="page-content">
      <!-- 左侧边栏 -->
      <div class="sidebar">
        <!-- 快速导航 -->
        <div class="nav-section">
          <div class="section-title">快速导航</div>
          <div class="nav-list">
            <div
              :class="['nav-item', { active: activeView === 'all' }]"
              @click="switchView('all')"
            >
              <icon-ep-star />
              <span>全部收藏</span>
              <el-badge :value="stats.total_count" :max="99" />
            </div>
            
            <div
              :class="['nav-item', { active: activeView === 'special' }]"
              @click="switchView('special')"
            >
              <icon-ep-heart-filled />
              <span>特别关心</span>
              <el-badge :value="stats.special_count" :max="99" type="danger" />
            </div>
            
            <div
              :class="['nav-item', { active: activeView === 'recent' }]"
              @click="switchView('recent')"
            >
              <icon-ep-clock />
              <span>最近添加</span>
            </div>
          </div>
        </div>

        <!-- 分类导航 -->
        <div class="nav-section">
          <div class="section-title">
            <span>收藏分类</span>
            <el-button
              type="text"
              size="small"
              @click="showCategoryManager = true"
            >
              <icon-ep-setting />
            </el-button>
          </div>
          
          <div class="category-list" v-loading="loadingCategories">
            <div
              v-for="category in categories"
              :key="category.id"
              :class="['category-item', { active: selectedCategory === category.id }]"
              @click="selectCategory(category.id)"
            >
              <div
                class="category-color"
                :style="{ backgroundColor: category.color }"
              />
              <span class="category-name">{{ category.name }}</span>
              <el-badge :value="category.count" :max="99" />
            </div>
            
            <el-empty
              v-if="categories.length === 0 && !loadingCategories"
              description="还没有创建分类"
              :image-size="60"
            />
          </div>
        </div>

        <!-- 类型筛选 -->
        <div class="nav-section">
          <div class="section-title">内容类型</div>
          <div class="type-filters">
            <el-checkbox-group v-model="selectedTypes" @change="handleTypeFilter">
              <el-checkbox label="message">
                <icon-ep-chat-line-round />
                消息
              </el-checkbox>
              <el-checkbox label="user">
                <icon-ep-user />
                用户
              </el-checkbox>
              <el-checkbox label="group">
                <icon-ep-user-filled />
                群组
              </el-checkbox>
              <el-checkbox label="file">
                <icon-ep-document />
                文件
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 收藏管理器 -->
        <FavoriteManager
          ref="favoriteManagerRef"
          :height="'calc(100vh - 200px)'"
          :enable-drag-sort="true"
          :socket-manager="socketManager"
          @itemClick="handleItemClick"
          @itemsChanged="loadStats"
          @connectionStatusChanged="handleConnectionStatusChanged"
        />
      </div>
    </div>

    <!-- 快速添加收藏对话框 -->
    <QuickAddDialog
      v-model:visible="showQuickAdd"
      :categories="categories"
      @added="handleFavoriteAdded"
    />

    <!-- 分类管理对话框 -->
    <CategoryManager
      v-model:visible="showCategoryManager"
      :categories="categories"
      @categoriesChanged="loadCategories"
    />

    <!-- 导入对话框 -->
    <ImportDialog
      v-model:visible="showImportDialog"
      @imported="handleImportSuccess"
    />

    <!-- 导出对话框 -->
    <ExportDialog
      v-model:visible="showExportDialog"
      :categories="categories"
    />

    <!-- 统计报告对话框 -->
    <StatsDialog
      v-model:visible="showStatsDialog"
      :stats="detailedStats"
    />

    <!-- 设置对话框 -->
    <SettingsDialog
      v-model:visible="showSettingsDialog"
      @settingsChanged="handleSettingsChanged"
    />

    <!-- 收藏详情抽屉 -->
    <el-drawer
      v-model="showDetailDrawer"
      title="收藏详情"
      size="400px"
      direction="rtl"
    >
      <FavoriteDetail
        v-if="selectedItem"
        :item="selectedItem"
        :categories="categories"
        @updated="handleItemUpdated"
        @deleted="handleItemDeleted"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  reqGetFavoriteStats,
  reqGetFavoriteCategories,
  reqGetFavoritesList
} from '@/api'
import SocketManager from '@/utils/SocketManager.js'
import FavoriteSocketHandler from '@/utils/FavoriteSocketHandler.js'
import FavoriteManager from '@/components/FavoriteManager.vue'
import CategoryManager from '@/components/CategoryManager.vue'
import QuickAddDialog from './components/QuickAddDialog.vue'
import ImportDialog from './components/ImportDialog.vue'
import ExportDialog from './components/ExportDialog.vue'
import StatsDialog from './components/StatsDialog.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import FavoriteDetail from './components/FavoriteDetail.vue'

// 响应式数据
const favoriteManagerRef = ref(null)
const stats = ref({
  total_count: 0,
  special_count: 0,
  category_counts: {},
  type_counts: {}
})
const detailedStats = ref({})
const categories = ref([])
const loadingCategories = ref(false)

// Socket相关
const socketManager = ref(null)
const favoriteSocketHandler = ref(null)
const connectionStatus = ref({
  isSocketAvailable: false,
  isConnected: false,
  lastSyncTime: null
})

// 视图状态
const activeView = ref('all')
const selectedCategory = ref('')
const selectedTypes = ref([])
const selectedItem = ref(null)

// 对话框状态
const showQuickAdd = ref(false)
const showCategoryManager = ref(false)
const showImportDialog = ref(false)
const showExportDialog = ref(false)
const showStatsDialog = ref(false)
const showSettingsDialog = ref(false)
const showDetailDrawer = ref(false)

// 生命周期
onMounted(() => {
  initializeSocket()
  loadStats()
  loadCategories()
})

onUnmounted(() => {
  cleanupSocket()
})

// 监听器
watch(activeView, (newView) => {
  updateFavoriteManager()
})

watch(selectedCategory, (newCategory) => {
  updateFavoriteManager()
})

watch(selectedTypes, (newTypes) => {
  updateFavoriteManager()
})

// Socket初始化方法
const initializeSocket = () => {
  try {
    // 创建SocketManager实例
    socketManager.value = new SocketManager({
      url: process.env.VUE_APP_SOCKET_URL || 'ws://localhost:8082',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    // 创建收藏Socket处理器
    favoriteSocketHandler.value = new FavoriteSocketHandler(socketManager.value)
    
    // 监听连接状态变化
    favoriteSocketHandler.value.addEventListener('connectionStateChanged', (state) => {
      connectionStatus.value = {
        isSocketAvailable: state.isConnected,
        isConnected: state.isConnected,
        lastSyncTime: new Date()
      }
    })
    
    console.log('[FavoritesPage] Socket初始化完成')
  } catch (error) {
    console.error('[FavoritesPage] Socket初始化失败:', error)
    ElMessage.warning('实时同步功能不可用')
  }
}

const cleanupSocket = () => {
  if (favoriteSocketHandler.value) {
    favoriteSocketHandler.value.destroy()
    favoriteSocketHandler.value = null
  }
  
  if (socketManager.value) {
    socketManager.value.destroy()
    socketManager.value = null
  }
  
  console.log('[FavoritesPage] Socket已清理')
}

// 方法
const loadStats = async () => {
  try {
    const result = await reqGetFavoriteStats()
    if (result.success) {
      stats.value = result.data
    }
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const loadCategories = async () => {
  loadingCategories.value = true
  try {
    const result = await reqGetFavoriteCategories()
    if (result.success) {
      categories.value = result.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类失败')
  } finally {
    loadingCategories.value = false
  }
}

const switchView = (view) => {
  activeView.value = view
  selectedCategory.value = ''
  
  // 根据视图类型设置筛选条件
  if (view === 'special') {
    // 特别关心视图
  } else if (view === 'recent') {
    // 最近添加视图
  } else {
    // 全部收藏视图
  }
}

const selectCategory = (categoryId) => {
  selectedCategory.value = selectedCategory.value === categoryId ? '' : categoryId
  activeView.value = 'all'
}

const handleTypeFilter = () => {
  updateFavoriteManager()
}

const updateFavoriteManager = () => {
  if (favoriteManagerRef.value) {
    // 触发收藏管理器重新加载数据
    favoriteManagerRef.value.loadFavorites()
  }
}

const handleHeaderAction = async (command) => {
  switch (command) {
    case 'import':
      showImportDialog.value = true
      break
    case 'export':
      showExportDialog.value = true
      break
    case 'stats':
      await loadDetailedStats()
      showStatsDialog.value = true
      break
    case 'settings':
      showSettingsDialog.value = true
      break
  }
}

const loadDetailedStats = async () => {
  try {
    const result = await reqGetFavoriteStats()
    if (result.success) {
      detailedStats.value = result.data
    }
  } catch (error) {
    console.error('加载详细统计失败:', error)
  }
}

const handleItemClick = (item) => {
  selectedItem.value = item
  showDetailDrawer.value = true
}

const handleFavoriteAdded = () => {
  loadStats()
  updateFavoriteManager()
  ElMessage.success('收藏添加成功')
}

const handleItemUpdated = () => {
  loadStats()
  updateFavoriteManager()
  ElMessage.success('收藏更新成功')
}

const handleItemDeleted = () => {
  loadStats()
  updateFavoriteManager()
  showDetailDrawer.value = false
  ElMessage.success('收藏删除成功')
}

const handleImportSuccess = (result) => {
  loadStats()
  loadCategories()
  updateFavoriteManager()
  ElMessage.success(`成功导入 ${result.imported_count} 个收藏`)
}

const handleSettingsChanged = () => {
  // 重新加载相关数据
  loadStats()
  updateFavoriteManager()
}

const handleConnectionStatusChanged = (status) => {
  connectionStatus.value = status
  console.log('[FavoritesPage] 连接状态变化:', status)
}

// 计算属性
const currentViewTitle = computed(() => {
  if (activeView.value === 'special') return '特别关心'
  if (activeView.value === 'recent') return '最近添加'
  if (selectedCategory.value) {
    const category = categories.value.find(c => c.id === selectedCategory.value)
    return category ? category.name : '全部收藏'
  }
  return '全部收藏'
})
</script>

<style scoped>
.favorites-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.page-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #ebeef5;
  overflow-y: auto;
  padding: 16px;
}

.nav-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
  padding: 0 8px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
}

.nav-item:hover {
  background: #f0f9ff;
  color: #409eff;
}

.nav-item.active {
  background: #409eff;
  color: #fff;
}

.nav-item.active .el-badge {
  --el-badge-bg-color: #fff;
  --el-badge-text-color: #409eff;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 100px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
}

.category-item:hover {
  background: #f0f9ff;
}

.category-item.active {
  background: #ecf5ff;
  color: #409eff;
}

.category-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.category-name {
  flex: 1;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-filters {
  padding: 0 8px;
}

.type-filters .el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-filters .el-checkbox {
  margin: 0;
}

.type-filters .el-checkbox__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.main-content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-left {
    justify-content: space-between;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .page-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #ebeef5;
  }
  
  .nav-section {
    margin-bottom: 16px;
  }
  
  .nav-list {
    flex-direction: row;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 8px;
  }
  
  .nav-item {
    white-space: nowrap;
    flex-shrink: 0;
  }
  
  .category-list {
    flex-direction: row;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 8px;
  }
  
  .category-item {
    white-space: nowrap;
    flex-shrink: 0;
  }
  
  .type-filters .el-checkbox-group {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>