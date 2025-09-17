<template>
  <div class="group-preview">
    <div class="group-info">
      <el-avatar
        :size="40"
        :src="item.avatar"
        :alt="item.group_name"
        shape="square"
      >
        {{ item.group_name?.charAt(0) }}
      </el-avatar>
      
      <div class="group-details">
        <div class="group-name">
          <span class="name">{{ item.group_name }}</span>
          <el-tag
            v-if="item.group_type"
            :type="getGroupTypeStyle(item.group_type)"
            size="small"
            class="group-type"
          >
            {{ getGroupTypeLabel(item.group_type) }}
          </el-tag>
        </div>
        
        <div class="group-meta">
          <span v-if="item.group_id" class="group-id">ID: {{ item.group_id }}</span>
          <span v-if="item.member_count" class="member-count">
            <icon-ep-user />
            {{ item.member_count }} 人
          </span>
        </div>
        
        <div v-if="item.description" class="group-description">
          {{ item.description }}
        </div>
      </div>
    </div>
    
    <div v-if="item.my_role" class="role-info">
      <el-tag
        :type="getRoleTypeStyle(item.my_role)"
        size="small"
      >
        {{ getRoleLabel(item.my_role) }}
      </el-tag>
      
      <span v-if="item.join_time" class="join-time">
        加入时间: {{ formatJoinTime(item.join_time) }}
      </span>
    </div>
    
    <div v-if="item.recent_members && item.recent_members.length > 0" class="recent-members">
      <div class="members-title">
        <icon-ep-user />
        <span>最近活跃成员</span>
      </div>
      
      <div class="members-list">
        <div
          v-for="member in item.recent_members.slice(0, 6)"
          :key="member.id"
          class="member-item"
        >
          <el-avatar
            :size="24"
            :src="member.avatar"
            :alt="member.username"
          >
            {{ member.username?.charAt(0) }}
          </el-avatar>
          <span class="member-name">{{ member.nickname || member.username }}</span>
        </div>
        
        <div v-if="item.member_count > 6" class="more-members">
          <el-avatar :size="24" class="more-avatar">
            +{{ item.member_count - 6 }}
          </el-avatar>
        </div>
      </div>
    </div>
    
    <div v-if="item.stats" class="group-stats">
      <div class="stat-item">
        <span class="stat-label">今日消息</span>
        <span class="stat-value">{{ item.stats.today_messages || 0 }}</span>
      </div>
      
      <div class="stat-item">
        <span class="stat-label">活跃度</span>
        <span class="stat-value">{{ getActivityLevel(item.stats.activity_score) }}</span>
      </div>
      
      <div v-if="item.stats.last_message_time" class="stat-item">
        <span class="stat-label">最后消息</span>
        <span class="stat-value">{{ formatLastMessage(item.stats.last_message_time) }}</span>
      </div>
    </div>
    
    <div v-if="item.tags && item.tags.length > 0" class="group-tags">
      <el-tag
        v-for="tag in item.tags"
        :key="tag"
        size="small"
        class="tag-item"
      >
        {{ tag }}
      </el-tag>
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

// 获取群组类型样式
const getGroupTypeStyle = (type) => {
  const styleMap = {
    public: 'success',
    private: 'warning',
    official: 'primary',
    temporary: 'info'
  }
  return styleMap[type] || 'default'
}

// 获取群组类型标签
const getGroupTypeLabel = (type) => {
  const labelMap = {
    public: '公开群',
    private: '私密群',
    official: '官方群',
    temporary: '临时群'
  }
  return labelMap[type] || type
}

// 获取角色样式
const getRoleTypeStyle = (role) => {
  const styleMap = {
    owner: 'danger',
    admin: 'warning',
    member: 'success'
  }
  return styleMap[role] || 'default'
}

// 获取角色标签
const getRoleLabel = (role) => {
  const labelMap = {
    owner: '群主',
    admin: '管理员',
    member: '成员'
  }
  return labelMap[role] || role
}

// 格式化加入时间
const formatJoinTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN')
}

// 格式化最后消息时间
const formatLastMessage = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 1天内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 获取活跃度等级
const getActivityLevel = (score) => {
  if (!score) return '低'
  
  if (score >= 80) return '很高'
  if (score >= 60) return '高'
  if (score >= 40) return '中等'
  if (score >= 20) return '较低'
  return '低'
}
</script>

<style scoped>
.group-preview {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.group-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.group-details {
  flex: 1;
  min-width: 0;
}

.group-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.group-type {
  font-size: 10px;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.group-id {
  font-size: 11px;
  color: #909399;
}

.member-count {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #606266;
}

.group-description {
  font-size: 12px;
  color: #909399;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.role-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.join-time {
  font-size: 12px;
  color: #909399;
}

.recent-members {
  margin-bottom: 12px;
}

.members-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f0f9ff;
  border-radius: 12px;
  font-size: 11px;
}

.member-name {
  color: #606266;
  max-width: 60px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-members {
  display: flex;
  align-items: center;
}

.more-avatar {
  background: #e6a23c;
  color: white;
  font-size: 10px;
}

.group-stats {
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

.group-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.tag-item {
  font-size: 11px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .group-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .group-name {
    justify-content: center;
  }
  
  .group-meta {
    justify-content: center;
  }
  
  .group-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .members-list {
    justify-content: center;
  }
}
</style>