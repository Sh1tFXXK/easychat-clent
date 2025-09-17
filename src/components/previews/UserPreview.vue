<template>
  <div class="user-preview">
    <div class="user-info">
      <el-avatar
        :size="40"
        :src="item.avatar"
        :alt="item.username"
      >
        {{ item.username?.charAt(0) }}
      </el-avatar>
      
      <div class="user-details">
        <div class="user-name">
          <span class="username">{{ item.username }}</span>
          <el-tag
            v-if="item.is_online"
            type="success"
            size="small"
            class="online-status"
          >
            在线
          </el-tag>
        </div>
        
        <div class="user-meta">
          <span v-if="item.nickname" class="nickname">{{ item.nickname }}</span>
          <span v-if="item.user_id" class="user-id">ID: {{ item.user_id }}</span>
        </div>
        
        <div v-if="item.signature" class="user-signature">
          {{ item.signature }}
        </div>
      </div>
    </div>
    
    <div v-if="item.relationship" class="relationship-info">
      <el-tag
        :type="getRelationshipType(item.relationship)"
        size="small"
      >
        {{ getRelationshipLabel(item.relationship) }}
      </el-tag>
      
      <span v-if="item.remark" class="remark">
        备注: {{ item.remark }}
      </span>
    </div>
    
    <div v-if="item.stats" class="user-stats">
      <div class="stat-item">
        <span class="stat-label">好友</span>
        <span class="stat-value">{{ item.stats.friends_count || 0 }}</span>
      </div>
      
      <div class="stat-item">
        <span class="stat-label">群组</span>
        <span class="stat-value">{{ item.stats.groups_count || 0 }}</span>
      </div>
      
      <div v-if="item.stats.last_active" class="stat-item">
        <span class="stat-label">最后活跃</span>
        <span class="stat-value">{{ formatLastActive(item.stats.last_active) }}</span>
      </div>
    </div>
    
    <div v-if="item.mutual_friends && item.mutual_friends.length > 0" class="mutual-friends">
      <div class="mutual-title">
        <icon-ep-user />
        <span>共同好友 ({{ item.mutual_friends.length }})</span>
      </div>
      
      <div class="mutual-list">
        <el-avatar
          v-for="friend in item.mutual_friends.slice(0, 3)"
          :key="friend.id"
          :size="20"
          :src="friend.avatar"
          :alt="friend.username"
          class="mutual-avatar"
        >
          {{ friend.username?.charAt(0) }}
        </el-avatar>
        
        <span v-if="item.mutual_friends.length > 3" class="more-count">
          +{{ item.mutual_friends.length - 3 }}
        </span>
      </div>
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

// 获取关系类型样式
const getRelationshipType = (relationship) => {
  const typeMap = {
    friend: 'success',
    pending: 'warning',
    blocked: 'danger',
    stranger: 'info'
  }
  return typeMap[relationship] || 'default'
}

// 获取关系标签
const getRelationshipLabel = (relationship) => {
  const labelMap = {
    friend: '好友',
    pending: '待验证',
    blocked: '已屏蔽',
    stranger: '陌生人'
  }
  return labelMap[relationship] || relationship
}

// 格式化最后活跃时间
const formatLastActive = (timestamp) => {
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
    return date.toLocaleDateString('zh-CN')
  }
}
</script>

<style scoped>
.user-preview {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.user-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.online-status {
  font-size: 10px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}

.nickname {
  font-size: 12px;
  color: #606266;
}

.user-id {
  font-size: 11px;
  color: #909399;
}

.user-signature {
  font-size: 12px;
  color: #909399;
  font-style: italic;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.relationship-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.remark {
  font-size: 12px;
  color: #606266;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 4px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: #909399;
}

.stat-value {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.mutual-friends {
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.mutual-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
}

.mutual-list {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mutual-avatar {
  border: 1px solid #ebeef5;
}

.more-count {
  font-size: 11px;
  color: #909399;
  margin-left: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .user-name {
    justify-content: center;
  }
  
  .user-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>