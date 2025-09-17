<template>
  <el-dialog
    v-model="visible"
    title="导出收藏"
    width="500px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      v-loading="loading"
    >
      <el-form-item label="导出格式" prop="format">
        <el-radio-group v-model="form.format">
          <el-radio label="json">
            <icon-ep-document />
            JSON
          </el-radio>
          <el-radio label="csv">
            <icon-ep-grid />
            CSV
          </el-radio>
          <el-radio label="excel">
            <icon-ep-document />
            Excel
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="导出范围">
        <el-radio-group v-model="form.scope" @change="handleScopeChange">
          <el-radio label="all">全部收藏</el-radio>
          <el-radio label="category">指定分类</el-radio>
          <el-radio label="special">特别关心</el-radio>
          <el-radio label="custom">自定义筛选</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="form.scope === 'category'"
        label="选择分类"
        prop="category_ids"
      >
        <el-select
          v-model="form.category_ids"
          multiple
          placeholder="选择要导出的分类"
          style="width: 100%"
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

      <el-form-item
        v-if="form.scope === 'custom'"
        label="内容类型"
      >
        <el-checkbox-group v-model="form.type_filter">
          <el-checkbox label="message">消息</el-checkbox>
          <el-checkbox label="user">用户</el-checkbox>
          <el-checkbox label="group">群组</el-checkbox>
          <el-checkbox label="file">文件</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="时间范围">
        <el-date-picker
          v-model="form.date_range"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="导出字段">
        <el-checkbox-group v-model="form.fields">
          <el-checkbox label="title">标题</el-checkbox>
          <el-checkbox label="content">内容</el-checkbox>
          <el-checkbox label="category">分类</el-checkbox>
          <el-checkbox label="tags">标签</el-checkbox>
          <el-checkbox label="notes">备注</el-checkbox>
          <el-checkbox label="created_at">创建时间</el-checkbox>
          <el-checkbox label="updated_at">更新时间</el-checkbox>
          <el-checkbox label="special_care">特别关心</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="高级选项">
        <el-checkbox v-model="form.include_metadata">
          包含元数据
        </el-checkbox>
        <br>
        <el-checkbox v-model="form.compress">
          压缩导出文件
        </el-checkbox>
        <br>
        <el-checkbox v-model="form.encrypt">
          加密导出文件
        </el-checkbox>
      </el-form-item>

      <el-form-item
        v-if="form.encrypt"
        label="加密密码"
        prop="password"
      >
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入加密密码"
          show-password
        />
      </el-form-item>

      <el-form-item label="文件名">
        <el-input
          v-model="form.filename"
          placeholder="自动生成"
        >
          <template #append>
            .{{ getFileExtension() }}
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <!-- 预览信息 -->
    <div v-if="previewInfo" class="preview-info">
      <el-alert
        :title="`预计导出 ${previewInfo.count} 项收藏`"
        type="info"
        :closable="false"
      >
        <template #default>
          <div class="preview-details">
            <div>文件大小: 约 {{ formatFileSize(previewInfo.estimated_size) }}</div>
            <div v-if="previewInfo.categories">
              分类分布: {{ previewInfo.categories.map(c => `${c.name}(${c.count})`).join(', ') }}
            </div>
          </div>
        </template>
      </el-alert>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="info"
          @click="previewExport"
          :loading="previewing"
        >
          预览
        </el-button>
        <el-button
          type="primary"
          @click="startExport"
          :loading="loading"
        >
          导出
        </el-button>
      </div>
    </template>

    <!-- 导出进度对话框 -->
    <el-dialog
      v-model="showProgress"
      title="导出进度"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="progress-content">
        <el-progress
          :percentage="exportProgress"
          :status="exportStatus"
        />
        
        <div class="progress-info">
          <div>正在导出: {{ currentStep }}</div>
          <div>已处理: {{ processedCount }} / {{ totalCount }}</div>
        </div>
      </div>
      
      <template #footer>
        <el-button
          v-if="exportStatus === 'success'"
          type="primary"
          @click="downloadFile"
        >
          下载文件
        </el-button>
        <el-button
          v-else-if="exportStatus === 'exception'"
          @click="showProgress = false"
        >
          关闭
        </el-button>
        <el-button
          v-else
          @click="cancelExport"
        >
          取消
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { reqExportFavorites, reqGetFavoritesList } from '@/api'

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

const emit = defineEmits(['update:visible'])

// 响应式数据
const formRef = ref(null)
const loading = ref(false)
const previewing = ref(false)
const showProgress = ref(false)

const form = ref({
  format: 'json',
  scope: 'all',
  category_ids: [],
  type_filter: ['message', 'user', 'group', 'file'],
  date_range: null,
  fields: ['title', 'content', 'category', 'tags', 'created_at'],
  include_metadata: false,
  compress: false,
  encrypt: false,
  password: '',
  filename: ''
})

const previewInfo = ref(null)

// 导出进度相关
const exportProgress = ref(0)
const exportStatus = ref('')
const processedCount = ref(0)
const totalCount = ref(0)
const currentStep = ref('')
const exportedFile = ref(null)

// 表单验证规则
const rules = {
  format: [
    { required: true, message: '请选择导出格式', trigger: 'change' }
  ],
  category_ids: [
    { required: true, message: '请选择要导出的分类', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入加密密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 监听器
watch(() => form.value.scope, () => {
  previewInfo.value = null
})

watch(() => form.value.category_ids, () => {
  previewInfo.value = null
})

watch(() => form.value.date_range, () => {
  previewInfo.value = null
})

// 方法
const handleScopeChange = (scope) => {
  if (scope !== 'category') {
    form.value.category_ids = []
  }
  if (scope !== 'custom') {
    form.value.type_filter = ['message', 'user', 'group', 'file']
  }
}

const getFileExtension = () => {
  const extensions = {
    json: 'json',
    csv: 'csv',
    excel: 'xlsx'
  }
  return extensions[form.value.format] || 'json'
}

const previewExport = async () => {
  previewing.value = true
  try {
    const params = buildExportParams()
    
    // 获取预览信息
    const result = await reqGetFavoritesList({
      ...params,
      page: 1,
      page_size: 1
    })
    
    if (result.success) {
      previewInfo.value = {
        count: result.data.total,
        estimated_size: result.data.total * 500, // 估算每项500字节
        categories: result.data.category_stats || []
      }
    }
  } catch (error) {
    console.error('预览导出失败:', error)
    ElMessage.error('预览导出失败')
  } finally {
    previewing.value = false
  }
}

const startExport = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    showProgress.value = true
    
    // 重置进度
    exportProgress.value = 0
    exportStatus.value = ''
    processedCount.value = 0
    totalCount.value = previewInfo.value?.count || 0
    currentStep.value = '准备导出...'
    
    const exportData = buildExportParams()
    
    // 生成文件名
    if (!form.value.filename) {
      const timestamp = new Date().toISOString().slice(0, 10)
      form.value.filename = `收藏导出_${timestamp}`
    }
    
    exportData.filename = form.value.filename
    exportData.options = {
      include_metadata: form.value.include_metadata,
      compress: form.value.compress,
      encrypt: form.value.encrypt,
      password: form.value.password
    }
    
    // 模拟导出进度
    const progressSteps = [
      '查询数据...',
      '处理内容...',
      '生成文件...',
      '压缩文件...',
      '完成导出'
    ]
    
    for (let i = 0; i < progressSteps.length; i++) {
      currentStep.value = progressSteps[i]
      exportProgress.value = Math.round(((i + 1) / progressSteps.length) * 100)
      
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // 调用导出API
    const result = await reqExportFavorites(exportData)
    
    if (result instanceof Blob) {
      exportedFile.value = {
        blob: result,
        filename: `${form.value.filename}.${getFileExtension()}`
      }
      exportStatus.value = 'success'
      ElMessage.success('导出完成')
    } else {
      throw new Error('导出失败')
    }
  } catch (error) {
    console.error('导出失败:', error)
    exportStatus.value = 'exception'
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const buildExportParams = () => {
  const params = {
    format: form.value.format,
    fields: form.value.fields
  }
  
  // 根据范围设置参数
  switch (form.value.scope) {
    case 'category':
      params.category_ids = form.value.category_ids
      break
    case 'special':
      params.special_only = true
      break
    case 'custom':
      params.type_filter = form.value.type_filter
      break
  }
  
  // 时间范围
  if (form.value.date_range && form.value.date_range.length === 2) {
    params.start_date = form.value.date_range[0]
    params.end_date = form.value.date_range[1]
  }
  
  return params
}

const downloadFile = () => {
  if (!exportedFile.value) return
  
  const url = URL.createObjectURL(exportedFile.value.blob)
  const link = document.createElement('a')
  link.href = url
  link.download = exportedFile.value.filename
  link.click()
  
  URL.revokeObjectURL(url)
  showProgress.value = false
  handleClose()
}

const cancelExport = () => {
  loading.value = false
  showProgress.value = false
  exportStatus.value = ''
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const handleClose = () => {
  // 重置表单
  if (formRef.value) {
    formRef.value.resetFields()
  }
  
  // 重置状态
  previewInfo.value = null
  exportedFile.value = null
  
  visible.value = false
}
</script>

<style scoped>
.preview-info {
  margin-top: 16px;
}

.preview-details {
  font-size: 13px;
  color: #606266;
  margin-top: 8px;
}

.preview-details div {
  margin-bottom: 4px;
}

.progress-content {
  text-align: center;
}

.progress-info {
  margin: 16px 0;
  font-size: 13px;
  color: #606266;
}

.progress-info div {
  margin-bottom: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 表单样式调整 */
:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-checkbox) {
  margin-right: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-form-item__label) {
    width: 80px !important;
  }
  
  :deep(.el-radio-group) {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  :deep(.el-checkbox-group) {
    flex-direction: column;
  }
}
</style>