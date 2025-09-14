<template>
  <div class="navigation-demo">
    <div class="demo-header">
      <h1>导航系统演示</h1>
      <p>展示优化后的页面跳转逻辑</p>
    </div>

    <div class="demo-content">
      <div class="demo-section">
        <h2>基础导航</h2>
        <div class="button-group">
          <el-button type="primary" @click="navigateToHome">
            <el-icon><House /></el-icon>
            返回首页
          </el-button>
          <el-button type="success" @click="navigateToLogin">
            <el-icon><User /></el-icon>
            登录页面
          </el-button>
          <el-button type="info" @click="navigateWithParams">
            <el-icon><Link /></el-icon>
            带参数跳转
          </el-button>
        </div>
      </div>

      <div class="demo-section">
        <h2>高级导航功能</h2>
        <div class="button-group">
          <el-button type="warning" @click="navigateWithLoading">
            <el-icon><Loading /></el-icon>
            带加载状态跳转
          </el-button>
          <el-button type="danger" @click="navigateWithConfirm">
            <el-icon><QuestionFilled /></el-icon>
            确认后跳转
          </el-button>
          <el-button @click="navigateBack">
            <el-icon><Back /></el-icon>
            返回上一页
          </el-button>
        </div>
      </div>

      <div class="demo-section">
        <h2>导航历史</h2>
        <div class="history-list">
          <div 
            v-for="(item, index) in navigationHistory" 
            :key="index"
            class="history-item"
            @click="navigateToHistoryItem(item)"
          >
            <el-icon><Clock /></el-icon>
            <span>{{ item.name || item.path }}</span>
            <small>{{ formatTime(item.timestamp) }}</small>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>导航状态</h2>
        <div class="status-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="当前路径">
              {{ currentRoute.path }}
            </el-descriptions-item>
            <el-descriptions-item label="路由名称">
              {{ currentRoute.name || '未命名' }}
            </el-descriptions-item>
            <el-descriptions-item label="是否可返回">
              {{ canGoBack ? '是' : '否' }}
            </el-descriptions-item>
            <el-descriptions-item label="导航状态">
              {{ isNavigating ? '导航中' : '空闲' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { 
  navigateTo, 
  navigateBack, 
  navigateWithLoading,
  navigateWithConfirm 
} from '@/utils/navigation'
import { 
  House, 
  User, 
  Link, 
  Loading, 
  QuestionFilled, 
  Back, 
  Clock 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const store = useStore()

const currentRoute = computed(() => route)
const navigationHistory = computed(() => store.state.navigation.history)
const canGoBack = computed(() => store.state.navigation.canGoBack)
const isNavigating = computed(() => store.state.navigation.isNavigating)

// 基础导航方法
const navigateToHome = () => {
  navigateTo('/home', {
    title: '返回首页',
    transition: 'slide-left'
  })
}

const navigateToLogin = () => {
  navigateTo('/login', {
    title: '前往登录',
    transition: 'fade'
  })
}

const navigateWithParams = () => {
  navigateTo('/home', {
    query: { from: 'demo', timestamp: Date.now() },
    title: '带参数跳转',
    transition: 'slide-up'
  })
}

// 高级导航方法
const navigateWithLoadingDemo = async () => {
  try {
    await navigateWithLoading('/home', {
      loadingText: '正在跳转到首页...',
      minLoadingTime: 1000
    })
    ElMessage.success('跳转成功！')
  } catch (error) {
    ElMessage.error('跳转失败：' + error.message)
  }
}

const navigateWithConfirmDemo = async () => {
  try {
    await navigateWithConfirm('/login', {
      title: '确认跳转',
      message: '确定要跳转到登录页面吗？',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    ElMessage.success('跳转成功！')
  } catch (error) {
    if (error.message !== 'cancel') {
      ElMessage.error('跳转失败：' + error.message)
    }
  }
}

// 历史导航
const navigateToHistoryItem = (item) => {
  navigateTo(item.path, {
    query: item.query,
    title: `返回到 ${item.name || item.path}`
  })
}

// 工具方法
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

onMounted(() => {
  ElMessage.info('导航系统演示页面已加载')
})
</script>

<style scoped>
.navigation-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
}

.demo-header h1 {
  color: #409eff;
  margin-bottom: 10px;
}

.demo-header p {
  color: #666;
  font-size: 16px;
}

.demo-content {
  display: grid;
  gap: 30px;
}

.demo-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.demo-section h2 {
  margin-bottom: 20px;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

.button-group {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.button-group .el-button {
  min-width: 120px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.history-item:hover {
  background-color: #f5f7fa;
}

.history-item small {
  margin-left: auto;
  color: #909399;
}

.status-info {
  margin-top: 10px;
}

@media (max-width: 768px) {
  .navigation-demo {
    padding: 10px;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .button-group .el-button {
    width: 100%;
  }
}
</style>