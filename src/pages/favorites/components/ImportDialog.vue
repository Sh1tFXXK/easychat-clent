<template>
  <el-dialog
    v-model="visible"
    title="导入收藏"
    width="600px"
    :before-close="handleClose"
  >
    <div class="import-content">
      <!-- 导入方式选择 -->
      <div class="import-method">
        <h4>选择导入方式</h4>
        <el-radio-group v-model="importMethod" @change="handleMethodChange">
          <el-radio label="file">
            <icon-ep-upload />
            文件导入
          </el-radio>
          <el-radio label="text">
            <icon-ep-edit />
            文本导入
          </el-radio>
          <el-radio label="url">
            <icon-ep-link />
            URL导入
          </el-radio>
        </el-radio-group>
      </div>

      <!-- 文件导入 -->
      <div v-if="importMethod === 'file'" class="import-section">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="true"
          :limit="1"
          :accept="acceptedFileTypes"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :before-upload="beforeUpload"
          drag
        >
          <icon-ep-upload-filled />
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 JSON、CSV、Excel 格式，文件大小不超过 10MB
            </div>
          </template>
        </el-upload>
        
        <div v-if="selectedFile" class="file-preview">
          <div class="file-info">
            <icon-ep-document />
            <span>{{ selectedFile.name }}</span>
            <el-tag size="small">{{ formatFileSize(selectedFile.size) }}</el-tag>
          </div>
          
          <el-button
            type="primary"
            size="small"
            @click="previewFile"
            :loading="previewing"
          >
            预览内容
          </el-button>
        </div>
      </div>

      <!-- 文本导入 -->
      <div v-if="importMethod === 'text'" class="import-section">
        <el-form :model="textForm" label-width="80px">
          <el-form-item label="格式">
            <el-select v-model="textForm.format" @change="handleFormatChange">
              <el-option label="JSON" value="json" />
              <el-option label="CSV" value="csv" />
              <el-option label="纯文本" value="plain" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="内容">
            <el-input
              v-model="textForm.content"
              type="textarea"
              :rows="8"
              :placeholder="getTextPlaceholder()"
              maxlength="50000"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- URL导入 -->
      <div v-if="importMethod === 'url'" class="import-section">
        <el-form :model="urlForm" label-width="80px">
          <el-form-item label="URL地址">
            <el-input
              v-model="urlForm.url"
              placeholder="请输入要导入的URL地址"
            />
          </el-form-item>
          
          <el-form-item label="导入类型">
            <el-select v-model="urlForm.type">
              <el-option label="网页内容" value="webpage" />
              <el-option label="JSON数据" value="json" />
              <el-option label="RSS订阅" value="rss" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              @click="fetchUrlContent"
              :loading="fetching"
            >
              获取内容
            </el-button>
          </el-form-item>
        </el-form>
        
        <div v-if="urlContent" class="url-preview">
          <h5>预览内容</h5>
          <div class="content-preview">
            {{ urlContent.substring(0, 500) }}
            <span v-if="urlContent.length > 500">...</span>
          </div>
        </div>
      </div>

      <!-- 导入选项 -->
      <div class="import-options">
        <h4>导入选项</h4>
        
        <el-form :model="options" label-width="120px">
          <el-form-item label="默认分类">
            <el-select
              v-model="options.default_category"
              placeholder="选择默认分类"
              clearable
            >
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="重复处理">
            <el-radio-group v-model="options.duplicate_handling">
              <el-radio label="skip">跳过重复项</el-radio>
              <el-radio label="update">更新重复项</el-radio>
              <el-radio label="create">创建副本</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="自动标签">
            <el-checkbox v-model="options.auto_tags">
              根据内容自动生成标签
            </el-checkbox>
          </el-form-item>
          
          <el-form-item label="批量大小">
            <el-input-number
              v-model="options.batch_size"
              :min="10"
              :max="1000"
              :step="10"
            />
            <span class="form-tip">每批处理的数量，建议100-500</span>
          </el-form-item>
        </el-form>
      </div>

      <!-- 预览结果 -->
      <div v-if="previewData.length > 0" class="preview-section">
        <h4>导入预览 (共 {{ previewData.length }} 项)</h4>
        
        <div class="preview-stats">
          <el-tag type="success">有效: {{ validCount }}</el-tag>
          <el-tag type="warning">警告: {{ warningCount }}</el-tag>
          <el-tag type="danger">错误: {{ errorCount }}</el-tag>
        </div>
        
        <div class="preview-list">
          <div
            v-for="(item, index) in previewData.slice(0, 10)"
            :key="index"
            :class="['preview-item', item.status]"
          >
            <div class="item-status">
              <icon-ep-success-filled v-if="item.status === 'valid'" />
              <icon-ep-warning-filled v-else-if="item.status === 'warning'" />
              <icon-ep-circle-close-filled v-else />
            </div>
            
            <div class="item-content">
              <div class="item-title">{{ item.title || '无标题' }}</div>
              <div class="item-type">{{ getTypeLabel(item.item_type) }}</div>
              <div v-if="item.message" class="item-message">{{ item.message }}</div>
            </div>
          </div>
          
          <div v-if="previewData.length > 10" class="more-items">
            还有 {{ previewData.length - 10 }} 项...
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="startImport"
          :loading="importing"
          :disabled="!canImport"
        >
          开始导入 ({{ validCount }} 项)
        </el-button>
      </div>
    </template>

    <!-- 导入进度对话框 -->
    <el-dialog
      v-model="showProgress"
      title="导入进度"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="progress-content">
        <el-progress
          :percentage="importProgress"
          :status="importStatus"
        />
        
        <div class="progress-info">
          <div>已处理: {{ processedCount }} / {{ totalCount }}</div>
          <div>成功: {{ successCount }}</div>
          <div>失败: {{ failedCount }}</div>
        </div>
        
        <div v-if="currentItem" class="current-item">
          正在处理: {{ currentItem }}
        </div>
      </div>
      
      <template #footer>
        <el-button
          v-if="importStatus === 'success' || importStatus === 'exception'"
          type="primary"
          @click="finishImport"
        >
          完成
        </el-button>
        <el-button
          v-else
          @click="cancelImport"
        >
          取消
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { reqImportFavorites } from '@/api'

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

const emit = defineEmits(['update:visible', 'imported'])

// 响应式数据
const uploadRef = ref(null)
const importMethod = ref('file')
const selectedFile = ref(null)
const previewing = ref(false)
const fetching = ref(false)
const importing = ref(false)
const showProgress = ref(false)

const textForm = ref({
  format: 'json',
  content: ''
})

const urlForm = ref({
  url: '',
  type: 'webpage'
})

const urlContent = ref('')

const options = ref({
  default_category: null,
  duplicate_handling: 'skip',
  auto_tags: true,
  batch_size: 100
})

const previewData = ref([])

// 导入进度相关
const importProgress = ref(0)
const importStatus = ref('')
const processedCount = ref(0)
const totalCount = ref(0)
const successCount = ref(0)
const failedCount = ref(0)
const currentItem = ref('')

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const acceptedFileTypes = computed(() => {
  return '.json,.csv,.xlsx,.xls'
})

const validCount = computed(() => {
  return previewData.value.filter(item => item.status === 'valid').length
})

const warningCount = computed(() => {
  return previewData.value.filter(item => item.status === 'warning').length
})

const errorCount = computed(() => {
  return previewData.value.filter(item => item.status === 'error').length
})

const canImport = computed(() => {
  return validCount.value > 0 && !importing.value
})

// 方法
const handleMethodChange = () => {
  // 清空之前的数据
  selectedFile.value = null
  textForm.value.content = ''
  urlForm.value.url = ''
  urlContent.value = ''
  previewData.value = []
  
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const handleFileRemove = () => {
  selectedFile.value = null
  previewData.value = []
}

const beforeUpload = (file) => {
  const isValidType = ['application/json', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)
  const isValidSize = file.size / 1024 / 1024 < 10
  
  if (!isValidType) {
    ElMessage.error('文件格式不支持')
    return false
  }
  
  if (!isValidSize) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  
  return false // 阻止自动上传
}

const previewFile = async () => {
  if (!selectedFile.value) return
  
  previewing.value = true
  try {
    const content = await readFileContent(selectedFile.value)
    const parsed = parseFileContent(content, selectedFile.value.type)
    previewData.value = validateImportData(parsed)
  } catch (error) {
    console.error('预览文件失败:', error)
    ElMessage.error('预览文件失败: ' + error.message)
  } finally {
    previewing.value = false
  }
}

const handleFormatChange = () => {
  if (textForm.value.content) {
    try {
      const parsed = parseTextContent(textForm.value.content, textForm.value.format)
      previewData.value = validateImportData(parsed)
    } catch (error) {
      console.error('解析文本失败:', error)
    }
  }
}

const fetchUrlContent = async () => {
  if (!urlForm.value.url) {
    ElMessage.warning('请输入URL地址')
    return
  }
  
  fetching.value = true
  try {
    // 这里应该调用后端API获取URL内容
    // const response = await fetch(urlForm.value.url)
    // urlContent.value = await response.text()
    
    // 模拟获取内容
    urlContent.value = '模拟获取的URL内容...'
    ElMessage.success('内容获取成功')
  } catch (error) {
    console.error('获取URL内容失败:', error)
    ElMessage.error('获取URL内容失败')
  } finally {
    fetching.value = false
  }
}

const startImport = async () => {
  if (validCount.value === 0) {
    ElMessage.warning('没有有效的导入数据')
    return
  }
  
  importing.value = true
  showProgress.value = true
  
  // 重置进度
  importProgress.value = 0
  importStatus.value = ''
  processedCount.value = 0
  totalCount.value = validCount.value
  successCount.value = 0
  failedCount.value = 0
  
  try {
    const validItems = previewData.value.filter(item => item.status === 'valid')
    const batchSize = options.value.batch_size
    
    for (let i = 0; i < validItems.length; i += batchSize) {
      const batch = validItems.slice(i, i + batchSize)
      
      for (const item of batch) {
        currentItem.value = item.title || '无标题'
        
        try {
          // 调用导入API
          const result = await reqImportFavorites(item, options.value)
          if (result.success) {
            successCount.value++
          } else {
            failedCount.value++
          }
        } catch (error) {
          failedCount.value++
        }
        
        processedCount.value++
        importProgress.value = Math.round((processedCount.value / totalCount.value) * 100)
      }
    }
    
    importStatus.value = 'success'
    ElMessage.success(`导入完成！成功 ${successCount.value} 项，失败 ${failedCount.value} 项`)
  } catch (error) {
    console.error('导入失败:', error)
    importStatus.value = 'exception'
    ElMessage.error('导入过程中发生错误')
  } finally {
    importing.value = false
    currentItem.value = ''
  }
}

const cancelImport = () => {
  importing.value = false
  showProgress.value = false
  importStatus.value = ''
}

const finishImport = () => {
  showProgress.value = false
  emit('imported', {
    total: totalCount.value,
    success: successCount.value,
    failed: failedCount.value
  })
  handleClose()
}

const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(new Error('读取文件失败'))
    reader.readAsText(file)
  })
}

const parseFileContent = (content, fileType) => {
  try {
    if (fileType === 'application/json') {
      return JSON.parse(content)
    } else if (fileType === 'text/csv') {
      return parseCSV(content)
    } else {
      throw new Error('不支持的文件格式')
    }
  } catch (error) {
    throw new Error('解析文件内容失败: ' + error.message)
  }
}

const parseTextContent = (content, format) => {
  try {
    if (format === 'json') {
      return JSON.parse(content)
    } else if (format === 'csv') {
      return parseCSV(content)
    } else {
      // 纯文本，每行作为一个收藏项
      return content.split('\n').filter(line => line.trim()).map(line => ({
        title: line.trim(),
        item_type: 'message',
        content: line.trim()
      }))
    }
  } catch (error) {
    throw new Error('解析文本内容失败: ' + error.message)
  }
}

const parseCSV = (csvContent) => {
  const lines = csvContent.split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',').map(v => v.trim())
      const item = {}
      headers.forEach((header, index) => {
        item[header] = values[index] || ''
      })
      data.push(item)
    }
  }
  
  return data
}

const validateImportData = (data) => {
  if (!Array.isArray(data)) {
    data = [data]
  }
  
  return data.map(item => {
    const validated = { ...item }
    
    // 验证必填字段
    if (!validated.title) {
      validated.status = 'error'
      validated.message = '缺少标题'
    } else if (!validated.item_type) {
      validated.status = 'warning'
      validated.message = '缺少类型，将设为消息类型'
      validated.item_type = 'message'
    } else if (!['message', 'user', 'group', 'file'].includes(validated.item_type)) {
      validated.status = 'warning'
      validated.message = '类型不支持，将设为消息类型'
      validated.item_type = 'message'
    } else {
      validated.status = 'valid'
    }
    
    return validated
  })
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

const getTextPlaceholder = () => {
  const placeholders = {
    json: '请输入JSON格式的数据，例如：\n[{"title": "收藏标题", "item_type": "message", "content": "内容"}]',
    csv: '请输入CSV格式的数据，例如：\ntitle,item_type,content\n收藏标题,message,内容',
    plain: '请输入纯文本，每行一个收藏项'
  }
  return placeholders[textForm.value.format] || ''
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const handleClose = () => {
  // 重置所有状态
  importMethod.value = 'file'
  selectedFile.value = null
  textForm.value = { format: 'json', content: '' }
  urlForm.value = { url: '', type: 'webpage' }
  urlContent.value = ''
  previewData.value = []
  
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  
  visible.value = false
}
</script>

<style scoped>
.import-content {
  max-height: 600px;
  overflow-y: auto;
}

.import-method {
  margin-bottom: 24px;
}

.import-method h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.import-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.file-preview {
  margin-top: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.url-preview {
  margin-top: 16px;
}

.url-preview h5 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #606266;
}

.content-preview {
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #909399;
  max-height: 100px;
  overflow-y: auto;
}

.import-options {
  margin-bottom: 24px;
}

.import-options h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #303133;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.preview-section {
  margin-bottom: 24px;
}

.preview-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.preview-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.preview-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.preview-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-item.valid {
  background: #f0f9ff;
}

.preview-item.warning {
  background: #fdf6ec;
}

.preview-item.error {
  background: #fef0f0;
}

.item-status {
  margin-top: 2px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 13px;
  color: #303133;
  margin-bottom: 2px;
}

.item-type {
  font-size: 11px;
  color: #909399;
  margin-bottom: 2px;
}

.item-message {
  font-size: 11px;
  color: #f56c6c;
}

.more-items {
  padding: 8px 12px;
  text-align: center;
  font-size: 12px;
  color: #909399;
  background: #f8f9fa;
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

.current-item {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 上传组件样式 */
:deep(.el-upload-dragger) {
  width: 100%;
  height: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .import-method .el-radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .preview-stats {
    flex-wrap: wrap;
  }
  
  .file-info {
    flex-wrap: wrap;
  }
}
</style>