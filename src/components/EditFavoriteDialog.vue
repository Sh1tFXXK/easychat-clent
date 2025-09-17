<template>
  <el-dialog
    v-model="visible"
    title="编辑收藏"
    width="500px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      v-loading="loading"
    >
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入收藏标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="分类" prop="category_id">
        <el-select
          v-model="form.category_id"
          placeholder="选择分类"
          style="width: 100%"
          clearable
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          >
            <div style="display: flex; align-items: center; gap: 8px;">
              <div
                :style="{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: category.color
                }"
              />
              {{ category.name }}
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="标签">
        <div class="tags-input">
          <el-tag
            v-for="tag in form.tags"
            :key="tag"
            closable
            @close="removeTag(tag)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
          
          <el-input
            v-if="inputVisible"
            ref="tagInput"
            v-model="inputValue"
            size="small"
            style="width: 100px"
            @keyup.enter="handleInputConfirm"
            @blur="handleInputConfirm"
          />
          
          <el-button
            v-else
            size="small"
            @click="showInput"
            class="add-tag-btn"
          >
            + 添加标签
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="添加备注信息..."
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="特别关心">
        <el-switch
          v-model="form.is_special"
          active-text="开启"
          inactive-text="关闭"
          @change="handleSpecialChange"
        />
      </el-form-item>

      <el-form-item
        v-if="form.is_special"
        label="优先级"
        prop="priority"
      >
        <el-radio-group v-model="form.priority">
          <el-radio :label="1">低</el-radio>
          <el-radio :label="2">中</el-radio>
          <el-radio :label="3">高</el-radio>
          <el-radio :label="4">紧急</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="form.is_special"
        label="关心备注"
      >
        <el-input
          v-model="form.special_notes"
          type="textarea"
          :rows="2"
          placeholder="为什么特别关心这个收藏？"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="loading"
        >
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  reqUpdateFavorite,
  reqSetSpecialCare,
  reqRemoveSpecialCare
} from '@/api'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  favorite: {
    type: Object,
    default: null
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'updated'])

// 响应式数据
const loading = ref(false)
const formRef = ref(null)
const tagInput = ref(null)
const inputVisible = ref(false)
const inputValue = ref('')

const form = ref({
  title: '',
  category_id: null,
  tags: [],
  notes: '',
  is_special: false,
  priority: 2,
  special_notes: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入收藏标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
}

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 监听器
watch(() => props.visible, (newVal) => {
  if (newVal && props.favorite) {
    initForm()
  }
})

watch(() => props.favorite, (newVal) => {
  if (newVal && props.visible) {
    initForm()
  }
})

// 方法
const initForm = () => {
  if (!props.favorite) return
  
  form.value = {
    title: props.favorite.title || '',
    category_id: props.favorite.category_id || null,
    tags: props.favorite.tags ? [...props.favorite.tags] : [],
    notes: props.favorite.notes || '',
    is_special: props.favorite.is_special || false,
    priority: props.favorite.priority || 2,
    special_notes: props.favorite.special_notes || ''
  }
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    if (tagInput.value) {
      tagInput.value.focus()
    }
  })
}

const handleInputConfirm = () => {
  const value = inputValue.value.trim()
  if (value && !form.value.tags.includes(value)) {
    form.value.tags.push(value)
  }
  
  inputVisible.value = false
  inputValue.value = ''
}

const removeTag = (tag) => {
  const index = form.value.tags.indexOf(tag)
  if (index > -1) {
    form.value.tags.splice(index, 1)
  }
}

const handleSpecialChange = (value) => {
  if (!value) {
    form.value.priority = 2
    form.value.special_notes = ''
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    // 更新基本信息
    const updateData = {
      title: form.value.title,
      category_id: form.value.category_id,
      tags: form.value.tags,
      notes: form.value.notes
    }
    
    const updateResult = await reqUpdateFavorite(props.favorite.id, updateData)
    if (!updateResult.success) {
      throw new Error(updateResult.message || '更新收藏失败')
    }
    
    // 处理特别关心状态
    if (form.value.is_special !== props.favorite.is_special) {
      if (form.value.is_special) {
        // 设置特别关心
        const specialResult = await reqSetSpecialCare({
          favorite_id: props.favorite.id,
          priority: form.value.priority,
          notes: form.value.special_notes
        })
        if (!specialResult.success) {
          throw new Error(specialResult.message || '设置特别关心失败')
        }
      } else {
        // 取消特别关心
        const removeResult = await reqRemoveSpecialCare(props.favorite.id)
        if (!removeResult.success) {
          throw new Error(removeResult.message || '取消特别关心失败')
        }
      }
    } else if (form.value.is_special) {
      // 更新特别关心信息
      const specialResult = await reqSetSpecialCare({
        favorite_id: props.favorite.id,
        priority: form.value.priority,
        notes: form.value.special_notes
      })
      if (!specialResult.success) {
        throw new Error(specialResult.message || '更新特别关心失败')
      }
    }
    
    ElMessage.success('收藏更新成功')
    emit('updated')
    handleClose()
  } catch (error) {
    console.error('更新收藏失败:', error)
    ElMessage.error(error.message || '更新收藏失败')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  // 重置表单
  if (formRef.value) {
    formRef.value.resetFields()
  }
  
  // 重置标签输入状态
  inputVisible.value = false
  inputValue.value = ''
  
  visible.value = false
}
</script>

<style scoped>
.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-item {
  margin: 0;
}

.add-tag-btn {
  border-style: dashed;
  color: #999;
}

.add-tag-btn:hover {
  color: #409eff;
  border-color: #409eff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tags-input {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>