<template>
  <div class="favorite-detail" v-loading="loading">
    <div v-if="item" class="detail-content">
      <!-- 收藏头部信息 -->
      <div class="detail-header">
        <div class="item-type">
          <el-tag :type="getTypeTagType(item.item_type)" size="large">
            <component :is="getTypeIcon(item.item_type)" />
            {{ getTypeLabel(item.item_type) }}
          </el-tag>
          
          <el-tag
            v-if="item.is_special"
            type="danger"
            size="large"
            class="special-tag"
          >
            <icon-ep-heart-filled />
            特别关心
          </el-tag>
        </div>
        
        <div class="item-actions">
          <el-button
            type="primary"
            size="small"
            @click="editItem"
          >
            <icon-ep-edit />
            编辑
          </el-button>
          
          <el-button
            type="danger"
            size="small"
            @click="deleteItem"
          >
            <icon-ep-delete />
            删除
          </el-button>
        </div>
      </div>

      <!-- 收藏标题 -->
      <div class="detail-title">
        <h2>{{ item.title }}</h2>
        <div class="title-meta">
          <span class="create-time">
            创建于 {{ formatTime(item.created_at) }}
          </span>
          <span v-if="item.updated_at !== item.created_at" class="update-time">
            更新于 {{ formatTime(item.updated_at) }}
          </span>
        </div>
      </div>

      <!-- 收藏内容预览 -->
      <div class="detail-preview">
        <component
          :is="getPreviewComponent(item.item_type)"
          :item="item"
          @download="handleDownload"
          @preview="handlePreview"
          @play="handlePlay"
        />
      </div>

      <!-- 分类和标签 -->
      <div class="detail-meta">
        <div class="meta-item" v-if="item.category">
          <div class="meta-label">分类</div>
          <div class="meta-value">
            <div class="category-tag">
              <div
                class="category-color"
                :style="{ backgroundColor: item.category.color }"
              />
              {{ item.category.name }}
            </div>
          </div>
        </div>
        
        <div class="meta-item" v-if="item.tags && item.tags.length > 0">
          <div class="meta-label">标签</div>
          <div class="meta-value">
            <el-tag
              v-for="tag in item.tags"
              :key="tag"
              size="small"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 备注信息 -->
      <div class="detail-notes" v-if="item.notes">
        <div class="notes-title">
          <icon-ep-edit-pen />
          备注
        </div>
        <div class="notes-content">
          {{ item.notes }}
        </div>
      </div>

      <!-- 特别关心信息 -->
      <div class="special-care-info" v-if="item.is_special && item.special_care">
        <div class="care-title">
          <icon-ep-heart-filled />
          特别关心信息
        </div>
        
        <div class="care-content">
          <div class="care-item">
            <span class="care-label">优先级:</span>
            <el-tag :type="getPriorityType(item.special_care.priority)">
              {{ getPriorityLabel(item.special_care.priority) }}
            </el-tag>
          </div>
          
          <div class="care-item" v-if="item.special_care.notes">
            <span class="care-label">关心原因:</span>
            <span class="care-value">{{ item.special_care.notes }}</span>
          </div>
          
          <div class="care-item">
            <span class="care-label">设置时间:</span>
            <span class="care-value">{{ formatTime(item.special_care.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 操作历史 -->
      <div class="detail-history" v-if="item.history && item.history.length > 0">
        <div class="history-title">
          <icon-ep-clock />
          操作历史
        </div>
        
        <div class="history-list">
          <div
            v-for="record in item.history"
            :key="record.id"
            class="history-item"
          >
            <div class="history-icon">
              <component :is="getHistoryIcon(record.action)" />
            </div>
            <div class="history-content">
              <div class="history-action">{{ getHistoryLabel(record.action) }}</div>
              <div class="history-time">{{ formatTime(record.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关收藏 -->
      <div class="related-favorites" v-if="relatedItems.length > 0">
        <div class="related-title">
          <icon-ep-connection />
          相关收藏
        </div>
        
        <div class="related-list">
          <div
            v-for="related in relatedItems"
            :key="related.id"
            class="related-item"
            @click="$emit('itemClick', related)"
          >
            <div class="related-preview">
              <component
                :is="getPreviewComponent(related.item_type)"
                :item="related"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <EditFavoriteDialog
      v-model:visible="showEditDialog"
      :favorite="item"
      :categories="categories"
      @updated="handleUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  reqGetFavoriteDetail,
  reqRemoveFavorite,
  reqGetFavoritesList
} from '@/api'
import EditFavoriteDialog from '@/components/EditFavoriteDialog.vue'
import MessagePreview from '@/components/previews/MessagePreview.vue'
import UserPreview from '@/components/previews/UserPreview.vue'
import GroupPreview from '@/components/previews/GroupPreview.vue'
import FilePreview from '@/components/previews/FilePreview.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['updated', 'deleted', 'itemClick'])

// 响应式数据
const loading = ref(false)
const showEditDialog = ref(false)
const relatedItems = ref([])

// 生命周期
onMounted(() => {
  loadRelatedItems()
})

// 方法
const loadRelatedItems = async () => {
  if (!props.item) return
  
  try {
    const result = await reqGetFavoritesList({
      page: 1,
      page_size: 5,
      category_id: props.item.category_id,
      exclude_id: props.item.id
    })
    
    if (result.success) {
      relatedItems.value = result.data.items || []
    }
  } catch (error) {
    console.error('加载相关收藏失败:', error)
  }
}

const editItem = () => {
  showEditDialog.value = true
}

const deleteItem = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个收藏吗？删除后无法恢复。',
      '删除收藏',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    const result = await reqRemoveFavorite(props.item.id)
    
    if (result.success) {
      ElMessage.success('收藏删除成功')
      emit('deleted')
    } else {
      throw new Error(result.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除收藏失败:', error)
      ElMessage.error(error.message || '删除收藏失败')
    }
  } finally {
    loading.value = false
  }
}

const handleUpdated = () => {
  emit('updated')
}

const handleDownload = (item) => {
  // 处理文件下载
  console.log('下载文件:', item)
}

const handlePreview = (item) => {
  // 处理文件预览
  console.log('预览文件:', item)
}

const handlePlay = (item) => {
  // 处理媒体播放
  console.log('播放媒体:', item)
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

const getTypeIcon = (type) => {
  const iconMap = {
    message: 'icon-ep-chat-line-round',
    user: 'icon-ep-user',
    group: 'icon-ep-user-filled',
    file: 'icon-ep-document'
  }
  return iconMap[type] || 'icon-ep-star'
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

const getPriorityType = (priority) => {
  const typeMap = {
    1: 'info',
    2: 'success',
    3: 'warning',
    4: 'danger'
  }
  return typeMap[priority] || 'default'
}

const getPriorityLabel = (priority) => {
  const labelMap = {
    1: '低',
    2: '中',
    3: '高',
    4: '紧急'
  }
  return labelMap[priority] || '未知'
}

const getHistoryIcon = (action) => {
  const iconMap = {
    create: 'icon-ep-plus',
    update: 'icon-ep-edit',
    delete: 'icon-ep-delete',
    special_add: 'icon-ep-heart-filled',
    special_remove: 'icon-ep-heart'
  }
  return iconMap[action] || 'icon-ep-operation'
}

const getHistoryLabel = (action) => {
  const labelMap = {
    create: '创建收藏',
    update: '更新收藏',
    delete: '删除收藏',
    special_add: '设为特别关心',
    special_remove: '取消特别关心'
  }
  return labelMap[action] || action
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
    return date.toLocaleString('zh-CN')
  }
}
</script>

<style scoped>
.favorite-detail {
  height: 100%;
  overflow-y: auto;
}

.detail-content {
  padding: 16px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
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
  gap: 8px;
}

.detail-title {
  margin-bottom: 20px;
}

.detail-title h2 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.title-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.detail-preview {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-meta {
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  min-width: 60px;
}

.meta-value {
  flex: 1;
}

.category-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #303133;
}

.category-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.tag-item {
  margin-right: 6px;
  margin-bottom: 4px;
}

.detail-notes {
  margin-bottom: 20px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.notes-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #409eff;
  margin-bottom: 8px;
}

.notes-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.special-care-info {
  margin-bottom: 20px;
  padding: 16px;
  background: #fef0f0;
  border-radius: 8px;
  border-left: 4px solid #f56c6c;
}

.care-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #f56c6c;
  margin-bottom: 12px;
}

.care-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.care-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.care-label {
  color: #909399;
  min-width: 60px;
}

.care-value {
  color: #606266;
}

.detail-history {
  margin-bottom: 20px;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.history-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e6f7ff;
  border-radius: 50%;
  color: #1890ff;
  font-size: 12px;
}

.history-content {
  flex: 1;
}

.history-action {
  font-size: 13px;
  color: #303133;
  margin-bottom: 2px;
}

.history-time {
  font-size: 11px;
  color: #909399;
}

.related-favorites {
  margin-bottom: 20px;
}

.related-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-item {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 6px;
  overflow: hidden;
}

.related-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.related-preview {
  pointer-events: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .item-type {
    justify-content: center;
  }
  
  .item-actions {
    justify-content: center;
  }
  
  .meta-item {
    flex-direction: column;
    gap: 4px;
  }
  
  .care-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .title-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>