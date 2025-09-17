<template>
  <div class="file-preview">
    <div class="file-info">
      <div class="file-icon">
        <component :is="getFileIcon(item.file_type)" />
      </div>
      
      <div class="file-details">
        <div class="file-name">{{ item.file_name }}</div>
        <div class="file-meta">
          <span class="file-size">{{ formatFileSize(item.file_size) }}</span>
          <span v-if="item.file_type" class="file-type">{{ item.file_type.toUpperCase() }}</span>
        </div>
      </div>
      
      <div class="file-actions">
        <el-button
          type="text"
          size="small"
          @click="downloadFile"
          :loading="downloading"
        >
          <icon-ep-download />
        </el-button>
        
        <el-button
          v-if="canPreview(item.file_type)"
          type="text"
          size="small"
          @click="previewFile"
        >
          <icon-ep-view />
        </el-button>
      </div>
    </div>
    
    <!-- 图片预览 -->
    <div v-if="isImage(item.file_type)" class="image-preview">
      <el-image
        :src="item.file_url"
        :preview-src-list="[item.file_url]"
        fit="cover"
        class="preview-image"
        lazy
      >
        <template #error>
          <div class="image-error">
            <icon-ep-picture />
            <span>图片加载失败</span>
          </div>
        </template>
      </el-image>
    </div>
    
    <!-- 视频预览 -->
    <div v-else-if="isVideo(item.file_type)" class="video-preview">
      <div class="video-thumbnail">
        <el-image
          :src="item.thumbnail || getVideoThumbnail()"
          fit="cover"
          class="thumbnail-image"
        >
          <template #error>
            <div class="video-error">
              <icon-ep-video-camera />
              <span>视频缩略图</span>
            </div>
          </template>
        </el-image>
        <div class="play-overlay" @click="playVideo">
          <icon-ep-video-play />
        </div>
      </div>
      <div v-if="item.duration" class="video-duration">
        {{ formatDuration(item.duration) }}
      </div>
    </div>
    
    <!-- 音频预览 -->
    <div v-else-if="isAudio(item.file_type)" class="audio-preview">
      <div class="audio-player">
        <div class="audio-icon">
          <icon-ep-headphones />
        </div>
        <div class="audio-info">
          <div class="audio-name">{{ item.file_name }}</div>
          <div v-if="item.duration" class="audio-duration">
            时长: {{ formatDuration(item.duration) }}
          </div>
        </div>
        <div class="audio-controls">
          <el-button
            type="text"
            size="small"
            @click="playAudio"
            :loading="playing"
          >
            <icon-ep-video-play v-if="!playing" />
            <icon-ep-video-pause v-else />
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 文档预览 -->
    <div v-else-if="isDocument(item.file_type)" class="document-preview">
      <div class="document-info">
        <div class="document-icon">
          <component :is="getDocumentIcon(item.file_type)" />
        </div>
        <div class="document-details">
          <div class="document-title">{{ item.file_name }}</div>
          <div class="document-meta">
            <span v-if="item.pages" class="page-count">{{ item.pages }} 页</span>
            <span v-if="item.created_by" class="creator">创建者: {{ item.created_by }}</span>
          </div>
        </div>
      </div>
      
      <div v-if="item.preview_text" class="document-content">
        <p class="preview-text">{{ item.preview_text }}</p>
      </div>
    </div>
    
    <!-- 压缩包预览 -->
    <div v-else-if="isArchive(item.file_type)" class="archive-preview">
      <div class="archive-info">
        <div class="archive-icon">
          <icon-ep-folder />
        </div>
        <div class="archive-details">
          <div class="archive-name">{{ item.file_name }}</div>
          <div class="archive-meta">
            <span v-if="item.files_count" class="files-count">{{ item.files_count }} 个文件</span>
            <span v-if="item.compression_ratio" class="compression">
              压缩率: {{ Math.round(item.compression_ratio * 100) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 上传信息 -->
    <div v-if="item.upload_info" class="upload-info">
      <div class="upload-meta">
        <span v-if="item.upload_info.uploader" class="uploader">
          上传者: {{ item.upload_info.uploader }}
        </span>
        <span v-if="item.upload_info.upload_time" class="upload-time">
          {{ formatUploadTime(item.upload_info.upload_time) }}
        </span>
      </div>
      
      <div v-if="item.upload_info.source" class="upload-source">
        来源: {{ getSourceLabel(item.upload_info.source) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['download', 'preview', 'play'])

// 响应式数据
const downloading = ref(false)
const playing = ref(false)

// 文件类型判断
const isImage = (type) => {
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(type?.toLowerCase())
}

const isVideo = (type) => {
  return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(type?.toLowerCase())
}

const isAudio = (type) => {
  return ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(type?.toLowerCase())
}

const isDocument = (type) => {
  return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(type?.toLowerCase())
}

const isArchive = (type) => {
  return ['zip', 'rar', '7z', 'tar', 'gz'].includes(type?.toLowerCase())
}

const canPreview = (type) => {
  return isImage(type) || isVideo(type) || isAudio(type) || ['pdf', 'txt'].includes(type?.toLowerCase())
}

// 获取文件图标
const getFileIcon = (type) => {
  if (isImage(type)) return 'icon-ep-picture'
  if (isVideo(type)) return 'icon-ep-video-camera'
  if (isAudio(type)) return 'icon-ep-headphones'
  if (isDocument(type)) return 'icon-ep-document'
  if (isArchive(type)) return 'icon-ep-folder'
  return 'icon-ep-document'
}

// 获取文档图标
const getDocumentIcon = (type) => {
  const iconMap = {
    pdf: 'icon-ep-document',
    doc: 'icon-ep-edit',
    docx: 'icon-ep-edit',
    xls: 'icon-ep-grid',
    xlsx: 'icon-ep-grid',
    ppt: 'icon-ep-present',
    pptx: 'icon-ep-present',
    txt: 'icon-ep-document'
  }
  return iconMap[type?.toLowerCase()] || 'icon-ep-document'
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
}

// 格式化上传时间
const formatUploadTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 86400000) { // 今天
    return '今天 ' + date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else if (diff < 172800000) { // 昨天
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 获取来源标签
const getSourceLabel = (source) => {
  const labelMap = {
    chat: '聊天',
    upload: '直接上传',
    forward: '转发',
    share: '分享'
  }
  return labelMap[source] || source
}

// 获取视频缩略图
const getVideoThumbnail = () => {
  return '/images/video-placeholder.png'
}

// 事件处理
const downloadFile = async () => {
  downloading.value = true
  try {
    emit('download', props.item)
    // 这里可以添加实际的下载逻辑
    ElMessage.success('开始下载文件')
  } catch (error) {
    console.error('下载文件失败:', error)
    ElMessage.error('下载文件失败')
  } finally {
    downloading.value = false
  }
}

const previewFile = () => {
  emit('preview', props.item)
}

const playVideo = () => {
  emit('play', { ...props.item, type: 'video' })
}

const playAudio = () => {
  playing.value = !playing.value
  emit('play', { ...props.item, type: 'audio', playing: playing.value })
}
</script>

<style scoped>
.file-preview {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.file-icon {
  font-size: 24px;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #ecf5ff;
  border-radius: 8px;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.image-preview {
  text-align: center;
  margin-bottom: 12px;
}

.preview-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: #f5f7fa;
  color: #c0c4cc;
  font-size: 12px;
  gap: 4px;
  border-radius: 8px;
}

.video-preview {
  text-align: center;
  margin-bottom: 12px;
}

.video-thumbnail {
  position: relative;
  display: inline-block;
}

.thumbnail-image {
  width: 160px;
  height: 90px;
  border-radius: 8px;
}

.video-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 90px;
  background: #f5f7fa;
  color: #c0c4cc;
  font-size: 12px;
  gap: 4px;
  border-radius: 8px;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-overlay:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: translate(-50%, -50%) scale(1.1);
}

.video-duration {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.audio-preview {
  margin-bottom: 12px;
}

.audio-player {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 8px;
}

.audio-icon {
  font-size: 20px;
  color: #67c23a;
}

.audio-info {
  flex: 1;
  min-width: 0;
}

.audio-name {
  font-size: 13px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.audio-duration {
  font-size: 11px;
  color: #909399;
}

.document-preview {
  margin-bottom: 12px;
}

.document-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.document-icon {
  font-size: 24px;
  color: #e6a23c;
}

.document-details {
  flex: 1;
  min-width: 0;
}

.document-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.document-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #909399;
}

.document-content {
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.preview-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.archive-preview {
  margin-bottom: 12px;
}

.archive-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.archive-icon {
  font-size: 24px;
  color: #f56c6c;
}

.archive-details {
  flex: 1;
  min-width: 0;
}

.archive-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.archive-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #909399;
}

.upload-info {
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.upload-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}

.upload-source {
  font-size: 11px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .file-actions {
    align-self: flex-end;
  }
  
  .preview-image,
  .thumbnail-image {
    width: 100px;
    height: 100px;
  }
  
  .thumbnail-image {
    height: 60px;
  }
  
  .upload-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}
</style>