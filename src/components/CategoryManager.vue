<template>
  <el-dialog
    v-model="visible"
    title="管理收藏分类"
    width="600px"
    :before-close="handleClose"
  >
    <div class="category-manager">
      <!-- 添加新分类 -->
      <div class="add-category">
        <el-input
          v-model="newCategoryName"
          placeholder="输入分类名称"
          size="small"
          style="width: 200px"
          @keyup.enter="addCategory"
        />
        <el-color-picker
          v-model="newCategoryColor"
          size="small"
          :predefine="predefineColors"
        />
        <el-button
          type="primary"
          size="small"
          @click="addCategory"
          :disabled="!newCategoryName.trim()"
        >
          添加分类
        </el-button>
      </div>

      <!-- 分类列表 -->
      <div class="category-list" v-loading="loading">
        <div class="list-header">
          <span>分类名称</span>
          <span>颜色</span>
          <span>收藏数量</span>
          <span>操作</span>
        </div>

        <draggable
          v-model="categoryList"
          item-key="id"
          :animation="200"
          ghost-class="ghost"
          @end="handleDragEnd"
        >
          <template #item="{ element: category }">
            <div class="category-item">
              <div class="category-info">
                <div class="drag-handle">
                  <icon-ep-rank />
                </div>
                
                <div class="category-name">
                  <el-input
                    v-if="editingCategory === category.id"
                    v-model="editingName"
                    size="small"
                    @blur="saveEdit(category)"
                    @keyup.enter="saveEdit(category)"
                    @keyup.esc="cancelEdit"
                    ref="editInput"
                  />
                  <span v-else @dblclick="startEdit(category)">
                    {{ category.name }}
                  </span>
                </div>
              </div>

              <div class="category-color">
                <el-color-picker
                  v-model="category.color"
                  size="small"
                  :predefine="predefineColors"
                  @change="updateCategoryColor(category)"
                />
              </div>

              <div class="category-count">
                <el-tag size="small" type="info">
                  {{ category.count || 0 }}
                </el-tag>
              </div>

              <div class="category-actions">
                <el-button
                  type="text"
                  size="small"
                  @click="startEdit(category)"
                >
                  <icon-ep-edit />
                </el-button>
                
                <el-button
                  type="text"
                  size="small"
                  @click="deleteCategory(category)"
                  :disabled="category.count > 0"
                >
                  <icon-ep-delete />
                </el-button>
              </div>
            </div>
          </template>
        </draggable>

        <!-- 空状态 -->
        <el-empty
          v-if="categoryList.length === 0 && !loading"
          description="还没有创建任何分类"
          :image-size="80"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import {
  reqGetFavoriteCategories,
  reqCreateFavoriteCategory,
  reqUpdateFavoriteCategory,
  reqDeleteFavoriteCategory,
  reqBatchUpdateCategoryOrder
} from '@/api'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'categoriesChanged'])

// 响应式数据
const loading = ref(false)
const categoryList = ref([])
const newCategoryName = ref('')
const newCategoryColor = ref('#409EFF')
const editingCategory = ref(null)
const editingName = ref('')
const editInput = ref(null)

// 预定义颜色
const predefineColors = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8'
]

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 监听器
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadCategories()
  }
})

watch(() => props.categories, (newVal) => {
  if (newVal && newVal.length > 0) {
    categoryList.value = [...newVal]
  }
}, { immediate: true })

// 方法
const loadCategories = async () => {
  loading.value = true
  try {
    const result = await reqGetFavoriteCategories()
    if (result.success) {
      categoryList.value = result.data.map(category => ({
        ...category,
        count: category.favorite_count || 0
      }))
    } else {
      throw new Error(result.message || '加载分类失败')
    }
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error(error.message || '加载分类失败')
  } finally {
    loading.value = false
  }
}

const addCategory = async () => {
  const name = newCategoryName.value.trim()
  if (!name) {
    ElMessage.warning('请输入分类名称')
    return
  }

  // 检查重名
  if (categoryList.value.some(cat => cat.name === name)) {
    ElMessage.warning('分类名称已存在')
    return
  }

  try {
    const result = await reqCreateFavoriteCategory({
      name,
      color: newCategoryColor.value,
      sort_order: categoryList.value.length
    })

    if (result.success) {
      categoryList.value.push({
        id: result.data.id,
        name,
        color: newCategoryColor.value,
        count: 0,
        sort_order: categoryList.value.length
      })
      
      // 重置输入
      newCategoryName.value = ''
      newCategoryColor.value = '#409EFF'
      
      ElMessage.success('分类创建成功')
    } else {
      throw new Error(result.message || '创建分类失败')
    }
  } catch (error) {
    console.error('创建分类失败:', error)
    ElMessage.error(error.message || '创建分类失败')
  }
}

const startEdit = (category) => {
  editingCategory.value = category.id
  editingName.value = category.name
  
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus()
    }
  })
}

const saveEdit = async (category) => {
  const newName = editingName.value.trim()
  if (!newName) {
    ElMessage.warning('分类名称不能为空')
    return
  }

  if (newName === category.name) {
    cancelEdit()
    return
  }

  // 检查重名
  if (categoryList.value.some(cat => cat.id !== category.id && cat.name === newName)) {
    ElMessage.warning('分类名称已存在')
    return
  }

  try {
    const result = await reqUpdateFavoriteCategory(category.id, {
      name: newName
    })

    if (result.success) {
      category.name = newName
      cancelEdit()
      ElMessage.success('分类名称已更新')
    } else {
      throw new Error(result.message || '更新分类失败')
    }
  } catch (error) {
    console.error('更新分类失败:', error)
    ElMessage.error(error.message || '更新分类失败')
  }
}

const cancelEdit = () => {
  editingCategory.value = null
  editingName.value = ''
}

const updateCategoryColor = async (category) => {
  try {
    const result = await reqUpdateFavoriteCategory(category.id, {
      color: category.color
    })

    if (result.success) {
      ElMessage.success('分类颜色已更新')
    } else {
      throw new Error(result.message || '更新分类颜色失败')
    }
  } catch (error) {
    console.error('更新分类颜色失败:', error)
    ElMessage.error(error.message || '更新分类颜色失败')
  }
}

const deleteCategory = async (category) => {
  if (category.count > 0) {
    ElMessage.warning('该分类下还有收藏，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${category.name}"吗？`,
      '删除分类',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await reqDeleteFavoriteCategory(category.id)
    if (result.success) {
      const index = categoryList.value.findIndex(cat => cat.id === category.id)
      if (index > -1) {
        categoryList.value.splice(index, 1)
      }
      ElMessage.success('分类删除成功')
    } else {
      throw new Error(result.message || '删除分类失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类失败:', error)
      ElMessage.error(error.message || '删除分类失败')
    }
  }
}

const handleDragEnd = async (event) => {
  const { oldIndex, newIndex } = event
  if (oldIndex === newIndex) return

  try {
    // 更新排序
    const updates = categoryList.value.map((category, index) => ({
      id: category.id,
      sort_order: index
    }))

    await reqBatchUpdateCategoryOrder({ updates })
    ElMessage.success('分类排序已更新')
  } catch (error) {
    console.error('更新分类排序失败:', error)
    ElMessage.error('更新分类排序失败')
    // 恢复原始顺序
    loadCategories()
  }
}

const handleClose = () => {
  cancelEdit()
  visible.value = false
}

const handleConfirm = () => {
  emit('categoriesChanged', categoryList.value)
  handleClose()
}
</script>

<style scoped>
.category-manager {
  max-height: 500px;
  overflow-y: auto;
}

.add-category {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.category-list {
  min-height: 200px;
}

.list-header {
  display: grid;
  grid-template-columns: 1fr 80px 80px 100px;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.category-item {
  display: grid;
  grid-template-columns: 1fr 80px 80px 100px;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #fff;
  transition: all 0.3s ease;
}

.category-item:hover {
  border-color: #c6e2ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drag-handle {
  cursor: move;
  color: #c0c4cc;
  display: flex;
  align-items: center;
}

.drag-handle:hover {
  color: #409eff;
}

.category-name {
  flex: 1;
  min-width: 0;
}

.category-name span {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.category-name span:hover {
  background: #f0f9ff;
}

.category-color {
  display: flex;
  justify-content: center;
}

.category-count {
  display: flex;
  justify-content: center;
}

.category-actions {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 拖拽样式 */
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .add-category {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .list-header,
  .category-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .category-info {
    justify-content: space-between;
  }
  
  .category-color,
  .category-count,
  .category-actions {
    justify-content: flex-start;
  }
}
</style>