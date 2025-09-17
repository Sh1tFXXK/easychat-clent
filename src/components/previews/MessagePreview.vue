<template>
  <div class="message-preview">
    <div class="message-header">
      <div class="sender-info">
        <el-avatar
          :size="24"
          :src="item.sender_avatar"
          :alt="item.sender_name"
        >
          {{ item.sender_name?.charAt(0) }}
        </el-avatar>
        <span class="sender-name">{{ item.sender_name }}</span>
      </div>
      
      <div class="message-time">
        {{ formatMessageTime(item.message_time) }}
      </div>
    </div>
    
    <div class="message-content">
      <div v-if="item.message_type === 'text'" class="text-message">
        <p class="message-text">{{ item.content }}</p>
      </div>
      
      <div v-else-if="item.message_type === 'image'" class="image-message">
        <el-image
          :src="item.content"
          :preview-src-list="[item.content]"
          fit="cover"
          class="message-image"
          lazy
        >
          <template #error>
            <div class="image-error">
              <icon-ep-picture />
              <span>图片加载失败</span>
            </div>
          </template>
        </el-image>
        <p v-if="item.caption" class="image-caption">{{ item.caption }}</p>
      </div>
      
      <div v-else-if="item.message_type === 'file'" class="file-message">
        <div class="file-info">
          <div class="file-icon">
            <icon-ep-document />
          </div>
          <div class="file-details">
            <div class="file-name">{{ item.file_name }}</div>
            <div class="file-size">{{ formatFileSize(item.file_size) }}</div>
          </div>
        </div>
      </div>
      
      <div v-else-if="item.message_type === 'voice'" class="voice-message">
        <div class="voice-info">
          <icon-ep-microphone />
          <span>语音消息 {{ item.duration }}s</span>
        </div>
      </div>
      
      <div v-else-if="item.message_type === 'video'" class="video-message">
        <div class="video-thumbnail">
          <el-image
            :src="item.thumbnail"
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
          <div class="play-overlay">
            <icon-ep-video-play />
          </div>
        </div>
        <div class="video-duration">{{ formatDuration(item.duration) }}</div>
      </div>
      
      <div v-else class="unknown-message">
        <icon-ep-warning />
        <span>不支持的消息类型</span>
      </div>
    </div>
    
    <div v-if="item.chat_info" class="chat-info">
      <el-tag size="small" :type="item.chat_info.type === 'group' ? 'warning' : 'success'">
        {{ item.chat_info.type === 'group' ? '群聊' : '私聊' }}
      </el-tag>
      <span class="chat-name">{{ item.chat_info.name }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

// 格式化消息时间
const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 86400000) { // 今天
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else if (diff < 172800000) { // 昨天
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.message-preview {
  padding: 8px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sender-name {
  font-size: 12px;
  font-weight: 500;
  color: #303133;
}

.message-time {
  font-size: 11px;
  color: #909399;
}

.message-content {
  margin-bottom: 8px;
}

.text-message .message-text {
  font-size: 13px;
  line-height: 1.4;
  color: #606266;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.image-message {
  text-align: center;
}

.message-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
}

.image-error,
.video-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: #f5f7fa;
  color: #c0c4cc;
  font-size: 12px;
  gap: 4px;
}

.image-caption {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0 0;
}

.file-message {
  display: flex;
  align-items: center;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: #409eff;
  font-size: 20px;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 11px;
  color: #909399;
}

.voice-message {
  display: flex;
  align-items: center;
}

.voice-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #67c23a;
  font-size: 13px;
}

.video-message {
  text-align: center;
}

.video-thumbnail {
  position: relative;
  display: inline-block;
}

.thumbnail-image {
  width: 120px;
  height: 80px;
  border-radius: 4px;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.video-duration {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.unknown-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #e6a23c;
  font-size: 13px;
}

.chat-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.chat-name {
  font-size: 12px;
  color: #909399;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .message-image,
  .thumbnail-image {
    width: 80px;
    height: 80px;
  }
  
  .thumbnail-image {
    height: 60px;
  }
}
</style>