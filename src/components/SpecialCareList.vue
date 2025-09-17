<template>
  <div class="special-care-list">
    <!-- 头部操作栏 -->
    <div class="header">
      <div class="title">
        <icon-ep-star-filled />
        特别关心
        <el-tag v-if="specialCareItems.length > 0" size="small" type="warning">
          {{ specialCareItems.length }}
        </el-tag>
      </div>
      
      <div class="actions">
        <el-button
          size="small"
          @click="showBatchActions = !showBatchActions"
          :type="showBatchActions ? 'primary' : ''"
        >
          <icon-ep-operation />
          批量操作
        </el-button>
        
        <el-button
          size="small"
          @click="refreshList"
          :loading="loading"
        >
          <icon-ep-refresh />
          刷新
        </el-button>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="showBatchActions" class="batch-actions">
      <el-checkbox
        v-model="selectAll"
        :indeterminate="isIndeterminate"
        @change="handleSelectAll"
      >
        全选
      </el-checkbox>
      
      <div class="batch-buttons">
        <el-button
          size="small"
          type="warning"
          @click="batchUpdatePriority"
          :disabled="selectedItems.length === 0"
        >
          <icon-ep-sort />
          调整优先级
        </el-button>
        
        <el-button
          size="small"
          type="danger"
          @click="batchRemoveSpecialCare"
          :disabled="selectedItems.length === 0"
        >
          <icon-ep-delete />
          取消关心
        </el-button>
      </div>
    </div>

    <!-- 优先级筛选 -->
    <div class="priority-filter">
      <el-radio-group v-model="priorityFilter" size="small" @change="handleFilterChange">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="high">高优先级</el-radio-button>
        <el-radio-button label="medium">中优先级</el-radio-button>
        <el-radio-button label="low">低优先级</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 特别关心列表 -->
    <div class="care-list" v-loading="loading">
      <div v-if="filteredItems.length === 0" class="empty-state">
        <icon-ep-star />
        <div class="empty-text">
          <div v-if="specialCareItems.length === 0">暂无特别关心的内容</div>
          <div v-else>当前筛选条件下没有内容</div>
        </div>
        <el-button
          v-if="specialCareItems.length === 0"
          type="primary"
          size="small"
          @click="$emit('add-special-care')"
        >
          添加特别关心
        </el-button>
      </div>

      <div
        v-for="item in filteredItems"
        :key="item.id"
        :class="['care-item', `priority-${item.priority}`, { selected: selectedItems.includes(item.id) }]"
        @click="handleItemClick(item)"
      >
        <!-- 选择框 -->
        <el-checkbox
          v-if="showBatchActions"
          v-model="selectedItems"
          :value="item.id"
          @click.stop
        />

        <!-- 优先级指示器 -->
        <div class="priority-indicator">
          <div
            :class="['priority-dot', `priority-${item.priority}`]"
            :title="getPriorityLabel(item.priority)"
          />
        </div>

        <!-- 内容预览 -->
        <div class="item-content">
          <div class="item-header">
            <div class="item-title">{{ item.title || '无标题' }}</div>
            <div class="item-type">
              <el-tag size="small" :type="getTypeTagType(item.item_type)">
                {{ getTypeLabel(item.item_type) }}
              </el-tag>
            </div>
          </div>
          
          <div class="item-preview">
            {{ getContentPreview(item) }}
          </div>
          
          <div class="item-meta">
            <span class="care-time">
              关心于 {{ formatTime(item.special_care_time) }}
            </span>
            <span v-if="item.notes" class="notes">
              <icon-ep-document />
              {{ item.notes }}
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="item-actions">
          <el-dropdown
            trigger="click"
            @command="handleCommand"
            @click.stop
          >
            <el-button size="small" text>
              <icon-ep-more />
            </el-button>
            
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  :command="{ action: 'view', item }"
                  :icon="IconEpView"
                >
                  查看详情
                </el-dropdown-item>
                
                <el-dropdown-item
                  :command="{ action: 'edit-priority', item }"
                  :icon="IconEpSort"
                >
                  调整优先级
                </el-dropdown-item>
                
                <el-dropdown-item
                  :command="{ action: 'edit-notes', item }"
                  :icon="IconEpEdit"
                >
                  编辑备注
                </el-dropdown-item>
                
                <el-dropdown-item
                  :command="{ action: 'remove', item }"
                  :icon="IconEpDelete"
                  divided
                >
                  取消关心
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 优先级调整对话框 -->
    <el-dialog
      v-model="showPriorityDialog"
      title="调整优先级"
      width="400px"
    >
      <div class="priority-dialog">
        <div class="current-priority">
          当前优先级: 
          <el-tag :type="getPriorityTagType(currentItem?.priority)">
            {{ getPriorityLabel(currentItem?.priority) }}
          </el-tag>
        </div>
        
        <el-form label-width="80px">
          <el-form-item label="新优先级">
            <el-radio-group v-model="newPriority">
              <el-radio label="high">
                <div class="priority-option">
                  <div class="priority-dot priority-high" />
                  高优先级
                </div>
              </el-radio>
              <el-radio label="medium">
                <div class="priority-option">
                  <div class="priority-dot priority-medium" />
                  中优先级
                </div>
              </el-radio>
              <el-radio label="low">
                <div class="priority-option">
                  <div class="priority-dot priority-low" />
                  低优先级
                </div>
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="showPriorityDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="updatePriority"
          :loading="updating"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 备注编辑对话框 -->
    <el-dialog
      v-model="showNotesDialog"
      title="编辑备注"
      width="500px"
    >
      <el-input
        v-model="newNotes"
        type="textarea"
        :rows="4"
        placeholder="请输入备注内容"
        maxlength="500"
        show-word-limit
      />
      
      <template #footer>
        <el-button @click="showNotesDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="updateNotes"
          :loading="updating"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Edit as IconEpEdit,
  View as IconEpView,
  Sort as IconEpSort,
  Delete as IconEpDelete
} from '@element-plus/icons-vue'
import { reqGetSpecialCareList, reqUpdateSpecialCare, reqRemoveSpecialCare } from '@/api'

const props = defineProps({
  userId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['add-special-care', 'item-click'])

// 响应式数据
const loading = ref(false)
const updating = ref(false)
const showBatchActions = ref(false)
const priorityFilter = ref('all')
const selectedItems = ref([])
const specialCareItems = ref([])

// 对话框相关
const showPriorityDialog = ref(false)
const showNotesDialog = ref(false)
const currentItem = ref(null)
const newPriority = ref('')
const newNotes = ref('')

// 计算属性
const filteredItems = computed(() => {
  if (priorityFilter.value === 'all') {
    return specialCareItems.value
  }
  return specialCareItems.value.filter(item => item.priority === priorityFilter.value)
})

const selectAll = computed({
  get: () => {
    return filteredItems.value.length > 0 && 
           selectedItems.value.length === filteredItems.value.length
  },
  set: (value) => {
    if (value) {
      selectedItems.value = filteredItems.value.map(item => item.id)
    } else {
      selectedItems.value = []
    }
  }
})

const isIndeterminate = computed(() => {
  const selectedCount = selectedItems.value.length
  const totalCount = filteredItems.value.length
  return selectedCount > 0 && selectedCount < totalCount
})

// 监听器
watch(() => props.userId, () => {
  if (props.userId) {
    loadSpecialCareList()
  }
})

// 生命周期
onMounted(() => {
  if (props.userId) {
    loadSpecialCareList()
  }
})

// 方法
const loadSpecialCareList = async () => {
  loading.value = true
  try {
    const result = await reqGetSpecialCareList({
      user_id: props.userId
    })
    
    if (result.success) {
      specialCareItems.value = result.data || []
    }
  } catch (error) {
    console.error('加载特别关心列表失败:', error)
    ElMessage.error('加载特别关心列表失败')
  } finally {
    loading.value = false
  }
}

const refreshList = () => {
  loadSpecialCareList()
}

const handleFilterChange = () => {
  selectedItems.value = []
}

const handleSelectAll = (value) => {
  selectAll.value = value
}

const handleItemClick = (item) => {
  if (!showBatchActions.value) {
    emit('item-click', item)
  }
}

const handleCommand = ({ action, item }) => {
  currentItem.value = item
  
  switch (action) {
    case 'view':
      emit('item-click', item)
      break
    case 'edit-priority':
      newPriority.value = item.priority
      showPriorityDialog.value = true
      break
    case 'edit-notes':
      newNotes.value = item.notes || ''
      showNotesDialog.value = true
      break
    case 'remove':
      confirmRemoveSpecialCare([item.id])
      break
  }
}

const updatePriority = async () => {
  if (!currentItem.value || !newPriority.value) return
  
  updating.value = true
  try {
    const result = await reqUpdateSpecialCare(currentItem.value.id, {
      priority: newPriority.value
    })
    
    if (result.success) {
      // 更新本地数据
      const index = specialCareItems.value.findIndex(item => item.id === currentItem.value.id)
      if (index !== -1) {
        specialCareItems.value[index].priority = newPriority.value
      }
      
      ElMessage.success('优先级更新成功')
      showPriorityDialog.value = false
    }
  } catch (error) {
    console.error('更新优先级失败:', error)
    ElMessage.error('更新优先级失败')
  } finally {
    updating.value = false
  }
}

const updateNotes = async () => {
  if (!currentItem.value) return
  
  updating.value = true
  try {
    const result = await reqUpdateSpecialCare(currentItem.value.id, {
      notes: newNotes.value
    })
    
    if (result.success) {
      // 更新本地数据
      const index = specialCareItems.value.findIndex(item => item.id === currentItem.value.id)
      if (index !== -1) {
        specialCareItems.value[index].notes = newNotes.value
      }
      
      ElMessage.success('备注更新成功')
      showNotesDialog.value = false
    }
  } catch (error) {
    console.error('更新备注失败:', error)
    ElMessage.error('更新备注失败')
  } finally {
    updating.value = false
  }
}

const batchUpdatePriority = async () => {
  if (selectedItems.value.length === 0) return
  
  try {
    const { value: priority } = await ElMessageBox.prompt(
      '请选择新的优先级',
      '批量调整优先级',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'select',
        inputOptions: [
          { value: 'high', label: '高优先级' },
          { value: 'medium', label: '中优先级' },
          { value: 'low', label: '低优先级' }
        ]
      }
    )
    
    updating.value = true
    
    // 批量更新
    const promises = selectedItems.value.map(id => 
      reqUpdateSpecialCare(id, { priority })
    )
    
    await Promise.all(promises)
    
    // 更新本地数据
    selectedItems.value.forEach(id => {
      const index = specialCareItems.value.findIndex(item => item.id === id)
      if (index !== -1) {
        specialCareItems.value[index].priority = priority
      }
    })
    
    ElMessage.success(`已更新 ${selectedItems.value.length} 项的优先级`)
    selectedItems.value = []
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量更新优先级失败:', error)
      ElMessage.error('批量更新优先级失败')
    }
  } finally {
    updating.value = false
  }
}

const batchRemoveSpecialCare = () => {
  if (selectedItems.value.length === 0) return
  confirmRemoveSpecialCare(selectedItems.value)
}

const confirmRemoveSpecialCare = async (ids) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消 ${ids.length} 项的特别关心吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    updating.value = true
    
    // 批量删除
    const promises = ids.map(id => reqRemoveSpecialCare(id))
    await Promise.all(promises)
    
    // 更新本地数据
    specialCareItems.value = specialCareItems.value.filter(item => !ids.includes(item.id))
    selectedItems.value = []
    
    ElMessage.success(`已取消 ${ids.length} 项的特别关心`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消特别关心失败:', error)
      ElMessage.error('取消特别关心失败')
    }
  } finally {
    updating.value = false
  }
}

const getPriorityLabel = (priority) => {
  const labels = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return labels[priority] || priority
}

const getPriorityTagType = (priority) => {
  const types = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[priority] || ''
}

const getTypeLabel = (type) => {
  const labels = {
    message: '消息',
    user: '用户',
    group: '群组',
    file: '文件'
  }
  return labels[type] || type
}

const getTypeTagType = (type) => {
  const types = {
    message: '',
    user: 'success',
    group: 'warning',
    file: 'info'
  }
  return types[type] || ''
}

const getContentPreview = (item) => {
  if (item.content) {
    return item.content.length > 100 ? 
           item.content.substring(0, 100) + '...' : 
           item.content
  }
  return '无内容预览'
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return Math.floor(diff / 60000) + '分钟前'
  } else if (diff < 86400000) { // 1天内
    return Math.floor(diff / 3600000) + '小时前'
  } else if (diff < 604800000) { // 1周内
    return Math.floor(diff / 86400000) + '天前'
  } else {
    return date.toLocaleDateString()
  }
}
</script>

<style scoped>
.special-care-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.actions {
  display: flex;
  gap: 8px;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

.priority-filter {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.care-list {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  text-align: center;
  margin-bottom: 16px;
}

.care-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.care-item:hover {
  background: #f8f9fa;
}

.care-item.selected {
  background: #e6f7ff;
  border-color: #1890ff;
}

.priority-indicator {
  margin-top: 4px;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.priority-dot.priority-high {
  background: #f56c6c;
}

.priority-dot.priority-medium {
  background: #e6a23c;
}

.priority-dot.priority-low {
  background: #909399;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-right: 8px;
}

.item-preview {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.notes {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-actions {
  margin-top: 4px;
}

.priority-dialog {
  padding: 16px 0;
}

.current-priority {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;
}

.priority-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .batch-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .item-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .item-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>