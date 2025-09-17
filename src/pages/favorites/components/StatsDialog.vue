<template>
  <el-dialog
    v-model="visible"
    title="收藏统计报告"
    width="800px"
    :before-close="handleClose"
  >
    <div class="stats-content" v-loading="loading">
      <!-- 总体统计 -->
      <div class="stats-section">
        <h3 class="section-title">总体统计</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total">
              <icon-ep-star />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_count || 0 }}</div>
              <div class="stat-label">总收藏数</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon special">
              <icon-ep-heart-filled />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.special_count || 0 }}</div>
              <div class="stat-label">特别关心</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon categories">
              <icon-ep-folder />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.category_count || 0 }}</div>
              <div class="stat-label">分类数量</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon today">
              <icon-ep-calendar />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.today_added || 0 }}</div>
              <div class="stat-label">今日新增</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 类型分布 -->
      <div class="stats-section">
        <h3 class="section-title">类型分布</h3>
        <div class="chart-container">
          <div class="type-stats">
            <div
              v-for="(count, type) in stats.type_counts"
              :key="type"
              class="type-item"
            >
              <div class="type-info">
                <div class="type-icon">
                  <component :is="getTypeIcon(type)" />
                </div>
                <div class="type-details">
                  <div class="type-name">{{ getTypeLabel(type) }}</div>
                  <div class="type-count">{{ count }} 个</div>
                </div>
              </div>
              <div class="type-progress">
                <el-progress
                  :percentage="getTypePercentage(count)"
                  :color="getTypeColor(type)"
                  :show-text="false"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类统计 -->
      <div class="stats-section" v-if="stats.category_stats && stats.category_stats.length > 0">
        <h3 class="section-title">分类统计</h3>
        <div class="category-stats">
          <div
            v-for="category in stats.category_stats"
            :key="category.id"
            class="category-item"
          >
            <div class="category-info">
              <div
                class="category-color"
                :style="{ backgroundColor: category.color }"
              />
              <div class="category-details">
                <div class="category-name">{{ category.name }}</div>
                <div class="category-count">{{ category.count }} 个收藏</div>
              </div>
            </div>
            <div class="category-progress">
              <el-progress
                :percentage="getCategoryPercentage(category.count)"
                :color="category.color"
                :show-text="false"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 时间趋势 -->
      <div class="stats-section" v-if="stats.time_trend && stats.time_trend.length > 0">
        <h3 class="section-title">收藏趋势</h3>
        <div class="trend-chart">
          <div class="trend-list">
            <div
              v-for="item in stats.time_trend"
              :key="item.date"
              class="trend-item"
            >
              <div class="trend-date">{{ formatTrendDate(item.date) }}</div>
              <div class="trend-bar">
                <div
                  class="trend-fill"
                  :style="{
                    width: getTrendWidth(item.count) + '%',
                    backgroundColor: '#409eff'
                  }"
                />
              </div>
              <div class="trend-count">{{ item.count }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 活跃度统计 -->
      <div class="stats-section">
        <h3 class="section-title">使用情况</h3>
        <div class="activity-stats">
          <div class="activity-item">
            <div class="activity-label">平均每日收藏</div>
            <div class="activity-value">{{ stats.daily_average || 0 }} 个</div>
          </div>
          
          <div class="activity-item">
            <div class="activity-label">最活跃的一天</div>
            <div class="activity-value">
              {{ stats.most_active_date ? formatDate(stats.most_active_date) : '暂无数据' }}
            </div>
          </div>
          
          <div class="activity-item">
            <div class="activity-label">连续收藏天数</div>
            <div class="activity-value">{{ stats.consecutive_days || 0 }} 天</div>
          </div>
          
          <div class="activity-item">
            <div class="activity-label">最常用的标签</div>
            <div class="activity-value">
              <el-tag
                v-for="tag in stats.popular_tags?.slice(0, 3)"
                :key="tag.name"
                size="small"
                class="popular-tag"
              >
                {{ tag.name }} ({{ tag.count }})
              </el-tag>
              <span v-if="!stats.popular_tags || stats.popular_tags.length === 0">
                暂无数据
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 存储统计 -->
      <div class="stats-section" v-if="stats.storage_stats">
        <h3 class="section-title">存储统计</h3>
        <div class="storage-stats">
          <div class="storage-item">
            <div class="storage-label">总存储大小</div>
            <div class="storage-value">{{ formatFileSize(stats.storage_stats.total_size) }}</div>
          </div>
          
          <div class="storage-item">
            <div class="storage-label">文件收藏数量</div>
            <div class="storage-value">{{ stats.storage_stats.file_count || 0 }} 个</div>
          </div>
          
          <div class="storage-item">
            <div class="storage-label">平均文件大小</div>
            <div class="storage-value">{{ formatFileSize(stats.storage_stats.average_size) }}</div>
          </div>
          
          <div class="storage-item">
            <div class="storage-label">最大文件</div>
            <div class="storage-value">{{ formatFileSize(stats.storage_stats.max_file_size) }}</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="exportStats">导出报告</el-button>
        <el-button type="primary" @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  stats: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible'])

// 响应式数据
const loading = ref(false)

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 方法
const getTypeIcon = (type) => {
  const iconMap = {
    message: 'icon-ep-chat-line-round',
    user: 'icon-ep-user',
    group: 'icon-ep-user-filled',
    file: 'icon-ep-document'
  }
  return iconMap[type] || 'icon-ep-star'
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

const getTypeColor = (type) => {
  const colorMap = {
    message: '#409eff',
    user: '#67c23a',
    group: '#e6a23c',
    file: '#909399'
  }
  return colorMap[type] || '#409eff'
}

const getTypePercentage = (count) => {
  const total = props.stats.total_count || 1
  return Math.round((count / total) * 100)
}

const getCategoryPercentage = (count) => {
  const total = props.stats.total_count || 1
  return Math.round((count / total) * 100)
}

const getTrendWidth = (count) => {
  if (!props.stats.time_trend || props.stats.time_trend.length === 0) return 0
  
  const maxCount = Math.max(...props.stats.time_trend.map(item => item.count))
  return maxCount > 0 ? (count / maxCount) * 100 : 0
}

const formatTrendDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const exportStats = () => {
  // 导出统计报告
  const reportData = {
    generated_at: new Date().toISOString(),
    stats: props.stats
  }
  
  const blob = new Blob([JSON.stringify(reportData, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `收藏统计报告_${new Date().toLocaleDateString('zh-CN')}.json`
  link.click()
  
  URL.revokeObjectURL(url)
  ElMessage.success('统计报告已导出')
}

const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
.stats-content {
  max-height: 600px;
  overflow-y: auto;
}

.stats-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid transparent;
}

.stat-card .stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.stat-icon.total {
  background: #409eff;
  border-color: #409eff;
}

.stat-icon.special {
  background: #f56c6c;
  border-color: #f56c6c;
}

.stat-icon.categories {
  background: #e6a23c;
  border-color: #e6a23c;
}

.stat-icon.today {
  background: #67c23a;
  border-color: #67c23a;
}

.stat-card:nth-child(1) {
  border-left-color: #409eff;
}

.stat-card:nth-child(2) {
  border-left-color: #f56c6c;
}

.stat-card:nth-child(3) {
  border-left-color: #e6a23c;
}

.stat-card:nth-child(4) {
  border-left-color: #67c23a;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.chart-container {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.type-stats,
.category-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-item,
.category-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.type-info,
.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.type-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #606266;
}

.category-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.type-details,
.category-details {
  flex: 1;
}

.type-name,
.category-name {
  font-size: 13px;
  color: #303133;
  margin-bottom: 2px;
}

.type-count,
.category-count {
  font-size: 11px;
  color: #909399;
}

.type-progress,
.category-progress {
  flex: 1;
  max-width: 200px;
}

.trend-chart {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.trend-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trend-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trend-date {
  font-size: 12px;
  color: #606266;
  min-width: 60px;
}

.trend-bar {
  flex: 1;
  height: 8px;
  background: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.trend-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.trend-count {
  font-size: 12px;
  color: #303133;
  min-width: 30px;
  text-align: right;
}

.activity-stats,
.storage-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.activity-item,
.storage-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.activity-label,
.storage-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.activity-value,
.storage-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.popular-tag {
  margin-right: 4px;
  margin-bottom: 2px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .type-item,
  .category-item {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .type-info,
  .category-info {
    min-width: auto;
  }
  
  .type-progress,
  .category-progress {
    max-width: none;
  }
  
  .trend-item {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  
  .trend-date {
    min-width: auto;
  }
  
  .trend-count {
    min-width: auto;
    text-align: left;
  }
  
  .activity-stats,
  .storage-stats {
    grid-template-columns: 1fr;
  }
}
</style>