<template>
  <el-dialog
    v-model="visible"
    title="快速收藏"
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
      <el-form-item label="收藏类型" prop="item_type">
        <el-radio-group v-model="form.item_type" @change="handleTypeChange">
          <el-radio label="message">
            <icon-ep-chat-line-round />
            消息
          </el-radio>
          <el-radio label="user">
            <icon-ep-user />
            用户
          </el-radio>
          <el-radio label="group">
            <icon-ep-user-filled />
            群组
          </el-radio>
          <el-radio label="file">
            <icon-ep-document />
            文件
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入收藏标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <!-- 消息类型特有字段 -->
      <template v-if="form.item_type === 'message'">
        <el-form-item label="消息内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="3"
            placeholder="请输入或粘贴消息内容"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="发送者">
          <el-input
            v-model="form.sender_name"
            placeholder="发送者名称（可选）"
          />
        </el-form-item>
      </template>

      <!-- 用户类型特有字段 -->
      <template v-if="form.item_type === 'user'">
        <el-form-item label="用户ID" prop="user_id">
          <el-input
            v-model="form.user_id"
            placeholder="请输入用户ID或用户名"
          />
        </el-form-item>
        
        <el-form-item label="用户昵称">
          <el-input
            v-model="form.username"
            placeholder="用户昵称（可选）"
          />
        </el-form-item>
      </template>

      <!-- 群组类型特有字段 -->
      <template v-if="form.item_type === 'group'">
        <el-form-item label="群组ID" prop="group_id">
          <el-input
            v-model="form.group_id"
            placeholder="请输入群组ID"
          />
        </el-form-item>
        
        <el-form-item label="群组名称">
          <el-input
            v-model="form.group_name"
            placeholder="群组名称（可选）"
          />
        </el-form-item>
      </template>

      <!-- 文件类型特有字段 -->
      <template v-if="form.item_type === 'file'">
        <el-form-item label="文件上传">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            drag
          >
            <icon-ep-upload-filled />
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持常见文件格式，单个文件不超过 100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </template>

      <el-form-item label="分类">
        <el-select
          v-model="form.category_id"
          placeholder="选择分类（可选）"
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
          :rows="2"
          placeholder="添加备注信息..."
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="form.is_special">
          设为特别关心
        </el-checkbox>
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
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="loading"
        >
          添加收藏
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { reqAddFavorite, reqSetSpecialCare } from '@/api'

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

const emit = defineEmits(['update:visible', 'added'])

// 响应式数据
const loading = ref(false)
const formRef = ref(null)
const uploadRef = ref(null)
const tagInput = ref(null)
const inputVisible = ref(false)
const inputValue = ref('')

const form = ref({
  item_type: 'message',
  title: '',
  content: '',
  sender_name: '',
  user_id: '',
  username: '',
  group_id: '',
  group_name: '',
  file: null,
  category_id: null,
  tags: [],
  notes: '',
  is_special: false,
  priority: 2
})

// 表单验证规则
const rules = {
  item_type: [
    { required: true, message: '请选择收藏类型', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入收藏标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入消息内容', trigger: 'blur' }
  ],
  user_id: [
    { required: true, message: '请输入用户ID', trigger: 'blur' }
  ],
  group_id: [
    { required: true, message: '请输入群组ID', trigger: 'blur' }
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

// 方法
const handleTypeChange = (type) => {
  // 根据类型生成默认标题
  const typeLabels = {
    message: '消息收藏',
    user: '用户收藏',
    group: '群组收藏',
    file: '文件收藏'
  }
  
  if (!form.value.title || Object.values(typeLabels).includes(form.value.title)) {
    form.value.title = typeLabels[type] || ''
  }
  
  // 清空类型特有字段
  form.value.content = ''
  form.value.sender_name = ''
  form.value.user_id = ''
  form.value.username = ''
  form.value.group_id = ''
  form.value.group_name = ''
  form.value.file = null
  
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

const handleFileChange = (file) => {
  form.value.file = file.raw
  if (!form.value.title || form.value.title === '文件收藏') {
    form.value.title = file.name
  }
}

const handleFileRemove = () => {
  form.value.file = null
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

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    // 准备提交数据
    const submitData = {
      item_type: form.value.item_type,
      title: form.value.title,
      category_id: form.value.category_id,
      tags: form.value.tags,
      notes: form.value.notes
    }
    
    // 根据类型添加特有字段
    switch (form.value.item_type) {
      case 'message':
        submitData.content = form.value.content
        submitData.sender_name = form.value.sender_name
        submitData.item_id = `msg_${Date.now()}`
        break
      case 'user':
        submitData.item_id = form.value.user_id
        submitData.content = JSON.stringify({
          username: form.value.username,
          user_id: form.value.user_id
        })
        break
      case 'group':
        submitData.item_id = form.value.group_id
        submitData.content = JSON.stringify({
          group_name: form.value.group_name,
          group_id: form.value.group_id
        })
        break
      case 'file':
        if (!form.value.file) {
          ElMessage.warning('请选择要收藏的文件')
          return
        }
        // 这里应该先上传文件，获取文件ID
        submitData.item_id = `file_${Date.now()}`
        submitData.content = JSON.stringify({
          file_name: form.value.file.name,
          file_size: form.value.file.size,
          file_type: form.value.file.type
        })
        break
    }
    
    // 添加收藏
    const result = await reqAddFavorite(submitData)
    if (!result.success) {
      throw new Error(result.message || '添加收藏失败')
    }
    
    // 如果设置了特别关心，添加特别关心
    if (form.value.is_special) {
      const specialResult = await reqSetSpecialCare({
        favorite_id: result.data.id,
        priority: form.value.priority,
        notes: form.value.notes
      })
      if (!specialResult.success) {
        console.warn('设置特别关心失败:', specialResult.message)
      }
    }
    
    ElMessage.success('收藏添加成功')
    emit('added', result.data)
    handleClose()
  } catch (error) {
    console.error('添加收藏失败:', error)
    ElMessage.error(error.message || '添加收藏失败')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  // 重置表单
  if (formRef.value) {
    formRef.value.resetFields()
  }
  
  // 重置文件上传
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  
  // 重置其他状态
  inputVisible.value = false
  inputValue.value = ''
  
  // 重置表单数据
  form.value = {
    item_type: 'message',
    title: '',
    content: '',
    sender_name: '',
    user_id: '',
    username: '',
    group_id: '',
    group_name: '',
    file: null,
    category_id: null,
    tags: [],
    notes: '',
    is_special: false,
    priority: 2
  }
  
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

/* 上传组件样式调整 */
:deep(.el-upload-dragger) {
  width: 100%;
  height: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tags-input {
    flex-direction: column;
    align-items: stretch;
  }
  
  :deep(.el-form-item__label) {
    width: 60px !important;
  }
}
</style>