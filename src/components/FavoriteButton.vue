<template>
  <div class="favorite-button-container">
    <!-- 收藏按钮 -->
    <el-tooltip
      :content="isFavorited ? '取消收藏' : '添加收藏'"
      placement="top"
      :show-arrow="false"
      :hide-after="100"
    >
      <el-button
        :type="isFavorited ? 'warning' : 'default'"
        :class="['favorite-btn', { 'favorited': isFavorited, 'animating': isAnimating }]"
        size="small"
        circle
        @click="toggleFavorite"
        :loading="loading"
      >
        <icon-ep-star-filled v-if="isFavorited" />
        <icon-ep-star v-else />
      </el-button>
    </el-tooltip>

    <!-- 特别关心按钮 -->
    <el-tooltip
      v-if="isFavorited"
      :content="isSpecialCare ? '取消特别关心' : '设为特别关心'"
      placement="top"
      :show-arrow="false"
      :hide-after="100"
    >
      <el-button
        :type="isSpecialCare ? 'danger' : 'default'"
        :class="['special-care-btn', { 'special': isSpecialCare, 'pulse': isSpecialCare }]"
        size="small"
        circle
        @click="toggleSpecialCare"
        :loading="specialCareLoading"
      >
        <icon-ep-heart-filled v-if="isSpecialCare" />
        <icon-ep-heart v-else />
      </el-button>
    </el-tooltip>

    <!-- 快速标签选择 -->
    <el-popover
      v-if="showTagSelector && isFavorited"
      placement="bottom"
      :width="200"
      trigger="click"
      :hide-after="0"
    >
      <template #reference>
        <el-button
          type="info"
          size="small"
          circle
          class="tag-btn"
        >
          <icon-ep-price-tag />
        </el-button>
      </template>
      <div class="tag-selector">
        <div class="tag-input">
          <el-input
            v-model="newTag"
            placeholder="添加标签"
            size="small"
            @keyup.enter="addTag"
          >
            <template #append>
              <el-button @click="addTag" size="small">
                <icon-ep-plus />
              </el-button>
            </template>
          </el-input>
        </div>
        <div class="tag-list">
          <el-tag
            v-for="tag in currentTags"
            :key="tag"
            closable
            size="small"
            @close="removeTag(tag)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, inject } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  reqAddFavorite, 
  reqRemoveFavorite, 
  reqUpdateFavorite,
  reqSetSpecialCare,
  reqRemoveSpecialCare
} from '@/api'
import SocketManager from '@/utils/SocketManager.js'
import FavoriteSocketHandler from '@/utils/FavoriteSocketHandler.js'

const props = defineProps({
  itemId: {
    type: [String, Number],
    required: true
  },
  itemType: {
    type: String,
    required: true,
    validator: (value) => ['message', 'user', 'group', 'file'].includes(value)
  },
  itemData: {
    type: Object,
    default: () => ({})
  },
  favoriteId: {
    type: [String, Number],
    default: null
  },
  initialFavorited: {
    type: Boolean,
    default: false
  },
  initialSpecialCare: {
    type: Boolean,
    default: false
  },
  initialTags: {
    type: Array,
    default: () => []
  },
  showTagSelector: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'small',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  favoriteSocketHandler: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['favoriteChanged', 'specialCareChanged', 'tagsChanged'])

// 响应式数据
const isFavorited = ref(props.initialFavorited)
const isSpecialCare = ref(props.initialSpecialCare)
const currentTags = ref([...props.initialTags])
const currentFavoriteId = ref(props.favoriteId)
const loading = ref(false)
const specialCareLoading = ref(false)
const isAnimating = ref(false)
const newTag = ref('')

// Socket处理器
const socketHandler = ref(props.favoriteSocketHandler)

// 监听props变化
watch(() => props.initialFavorited, (newVal) => {
  isFavorited.value = newVal
})

watch(() => props.initialSpecialCare, (newVal) => {
  isSpecialCare.value = newVal
})

watch(() => props.initialTags, (newVal) => {
  currentTags.value = [...newVal]
})

watch(() => props.favoriteId, (newVal) => {
  currentFavoriteId.value = newVal
})

watch(() => props.favoriteSocketHandler, (newVal) => {
  socketHandler.value = newVal
})

// 切换收藏状态
const toggleFavorite = async () => {
  if (loading.value) return
  
  loading.value = true
  isAnimating.value = true
  
  try {
    if (isFavorited.value) {
      // 取消收藏
      if (currentFavoriteId.value) {
        // 使用Socket处理器或HTTP API
        if (socketHandler.value) {
          await socketHandler.value.removeFavorite(currentFavoriteId.value)
        } else {
          await reqRemoveFavorite(currentFavoriteId.value)
        }
        
        isFavorited.value = false
        isSpecialCare.value = false
        currentTags.value = []
        currentFavoriteId.value = null
        ElMessage.success('已取消收藏')
        
        emit('favoriteChanged', {
          favorited: false,
          favoriteId: null,
          specialCare: false,
          tags: []
        })
      }
    } else {
      // 添加收藏
      const favoriteData = {
        item_id: props.itemId,
        item_type: props.itemType,
        item_data: props.itemData,
        tags: currentTags.value
      }
      
      let result
      // 使用Socket处理器或HTTP API
      if (socketHandler.value) {
        result = await socketHandler.value.addFavorite(favoriteData)
      } else {
        result = await reqAddFavorite(favoriteData)
      }
      
      if (result.success) {
        isFavorited.value = true
        currentFavoriteId.value = result.data.favorite_id
        ElMessage.success('收藏成功')
        
        emit('favoriteChanged', {
          favorited: true,
          favoriteId: result.data.favorite_id,
          specialCare: false,
          tags: currentTags.value
        })
      } else {
        throw new Error(result.message || '收藏失败')
      }
    }
  } catch (error) {
    console.error('切换收藏状态失败:', error)
    ElMessage.error(error.message || '操作失败，请重试')
  } finally {
    loading.value = false
    setTimeout(() => {
      isAnimating.value = false
    }, 300)
  }
}

// 切换特别关心状态
const toggleSpecialCare = async () => {
  if (!isFavorited.value || !currentFavoriteId.value || specialCareLoading.value) return
  
  specialCareLoading.value = true
  
  try {
    if (isSpecialCare.value) {
      // 取消特别关心
      if (socketHandler.value) {
        await socketHandler.value.removeSpecialCare(currentFavoriteId.value)
      } else {
        await reqRemoveSpecialCare(currentFavoriteId.value)
      }
      
      isSpecialCare.value = false
      ElMessage.success('已取消特别关心')
    } else {
      // 设为特别关心
      const specialCareData = {
        favorite_id: currentFavoriteId.value,
        priority: 3, // 默认优先级
        notes: ''
      }
      
      let result
      if (socketHandler.value) {
        result = await socketHandler.value.setSpecialCare(specialCareData)
      } else {
        result = await reqSetSpecialCare(specialCareData)
      }
      
      if (result.success) {
        isSpecialCare.value = true
        ElMessage.success('已设为特别关心')
      } else {
        throw new Error(result.message || '设置特别关心失败')
      }
    }
    
    emit('specialCareChanged', {
      specialCare: isSpecialCare.value,
      favoriteId: currentFavoriteId.value
    })
  } catch (error) {
    console.error('切换特别关心状态失败:', error)
    ElMessage.error(error.message || '操作失败，请重试')
  } finally {
    specialCareLoading.value = false
  }
}

// 添加标签
const addTag = async () => {
  const tag = newTag.value.trim()
  if (!tag || currentTags.value.includes(tag)) {
    newTag.value = ''
    return
  }
  
  if (currentTags.value.length >= 5) {
    ElMessage.warning('最多只能添加5个标签')
    return
  }
  
  currentTags.value.push(tag)
  newTag.value = ''
  
  // 如果已收藏，更新标签
  if (isFavorited.value && currentFavoriteId.value) {
    try {
      if (socketHandler.value) {
        await socketHandler.value.updateFavorite(currentFavoriteId.value, {
          tags: currentTags.value
        })
      } else {
        await reqUpdateFavorite(currentFavoriteId.value, {
          tags: currentTags.value
        })
      }
      
      emit('tagsChanged', {
        tags: currentTags.value,
        favoriteId: currentFavoriteId.value
      })
    } catch (error) {
      console.error('更新标签失败:', error)
      // 回滚
      currentTags.value.pop()
      ElMessage.error('更新标签失败')
    }
  }
}

// 移除标签
const removeTag = async (tag) => {
  const index = currentTags.value.indexOf(tag)
  if (index > -1) {
    currentTags.value.splice(index, 1)
    
    // 如果已收藏，更新标签
    if (isFavorited.value && currentFavoriteId.value) {
      try {
        if (socketHandler.value) {
          await socketHandler.value.updateFavorite(currentFavoriteId.value, {
            tags: currentTags.value
          })
        } else {
          await reqUpdateFavorite(currentFavoriteId.value, {
            tags: currentTags.value
          })
        }
        
        emit('tagsChanged', {
          tags: currentTags.value,
          favoriteId: currentFavoriteId.value
        })
      } catch (error) {
        console.error('更新标签失败:', error)
        // 回滚
        currentTags.value.splice(index, 0, tag)
        ElMessage.error('更新标签失败')
      }
    }
  }
}

// 暴露方法给父组件
defineExpose({
  toggleFavorite,
  toggleSpecialCare,
  addTag,
  removeTag,
  isFavorited: computed(() => isFavorited.value),
  isSpecialCare: computed(() => isSpecialCare.value),
  currentTags: computed(() => currentTags.value)
})
</script>

<style scoped>
.favorite-button-container {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.favorite-btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.favorite-btn.favorited {
  color: #f39c12;
  border-color: #f39c12;
}

.favorite-btn.animating {
  transform: scale(1.1);
}

.favorite-btn.animating::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(243, 156, 18, 0.3);
  transform: translate(-50%, -50%);
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  to {
    width: 40px;
    height: 40px;
    opacity: 0;
  }
}

.special-care-btn {
  transition: all 0.3s ease;
}

.special-care-btn.special {
  color: #e74c3c;
  border-color: #e74c3c;
}

.special-care-btn.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
  }
}

.tag-btn {
  transition: all 0.3s ease;
}

.tag-btn:hover {
  transform: scale(1.05);
}

.tag-selector {
  padding: 8px 0;
}

.tag-input {
  margin-bottom: 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 100px;
  overflow-y: auto;
}

.tag-item {
  margin: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-item:hover {
  transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .favorite-button-container {
    gap: 2px;
  }
  
  .tag-selector {
    width: 150px !important;
  }
}
</style>