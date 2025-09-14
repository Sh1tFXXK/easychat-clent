import routerManager from './router'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'

/**
 * 基础导航函数
 * @param {string} path - 目标路径
 * @param {object} options - 导航选项
 */
export const navigateTo = (path, options = {}) => {
  return routerManager.navigateTo(path, options)
}

/**
 * 返回上一页
 * @param {string} fallback - 回退路径
 */
export const navigateBack = (fallback = '/home') => {
  return routerManager.goBack(fallback)
}

/**
 * 带加载状态的导航
 * @param {string} path - 目标路径
 * @param {object} options - 导航选项
 */
export const navigateWithLoading = async (path, options = {}) => {
  const {
    loadingText = '正在跳转...',
    minLoadingTime = 500,
    showProgress = false,
    backdrop = true
  } = options

  let loadingInstance = null
  
  try {
    // 显示加载状态
    loadingInstance = ElLoading.service({
      lock: true,
      text: loadingText,
      background: backdrop ? 'rgba(0, 0, 0, 0.7)' : 'transparent'
    })

    // 确保最小加载时间
    const startTime = Date.now()
    
    // 执行导航
    const result = await routerManager.navigateTo(path, options)
    
    // 计算剩余等待时间
    const elapsed = Date.now() - startTime
    const remainingTime = Math.max(0, minLoadingTime - elapsed)
    
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime))
    }
    
    return result
  } catch (error) {
    throw error
  } finally {
    if (loadingInstance) {
      loadingInstance.close()
    }
  }
}

/**
 * 需要确认的导航
 * @param {string} path - 目标路径
 * @param {object} options - 导航选项
 */
export const navigateWithConfirm = async (path, options = {}) => {
  const {
    title = '确认跳转',
    message = '确定要跳转到新页面吗？',
    confirmButtonText = '确定',
    cancelButtonText = '取消',
    type = 'warning',
    ...navOptions
  } = options

  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText,
      cancelButtonText,
      type
    })
    
    return await routerManager.navigateTo(path, navOptions)
  } catch (error) {
    if (error === 'cancel') {
      throw new Error('cancel')
    }
    throw error
  }
}

/**
 * 替换当前路由
 * @param {string} path - 目标路径
 * @param {object} options - 导航选项
 */
export const navigateReplace = (path, options = {}) => {
  return routerManager.navigateTo(path, { ...options, replace: true })
}

/**
 * 前进到下一页
 */
export const navigateForward = () => {
  return routerManager.goForward()
}

/**
 * 清空导航历史
 */
export const clearHistory = () => {
  return routerManager.clearHistory()
}

/**
 * 获取导航历史
 */
export const getNavigationHistory = () => {
  return routerManager.getHistory()
}

/**
 * 检查是否可以返回
 */
export const canGoBack = () => {
  return routerManager.canGoBack()
}

/**
 * 检查是否可以前进
 */
export const canGoForward = () => {
  return routerManager.canGoForward()
}

/**
 * 智能导航类 - 提供高级导航功能
 */
export class SmartNavigation {
  /**
   * 智能跳转到首页
   */
  static async toHome(options = {}) {
    try {
      // 检查认证状态
      if (!routerManager.isAuthenticated()) {
        ElMessage.warning('请先登录')
        return this.toLogin()
      }
      
      return await routerManager.navigateTo('/home', {
        title: '返回首页',
        transition: 'slide-right',
        ...options
      })
    } catch (error) {
      console.error('[Navigation] 跳转首页失败:', error)
      ElMessage.error('跳转失败，请重试')
    }
  }

  /**
   * 智能跳转到登录页
   */
  static async toLogin(options = {}) {
    try {
      const currentPath = routerManager.router?.currentRoute?.value?.path
      
      return await routerManager.navigateTo('/login', {
        title: '前往登录',
        transition: 'fade',
        query: currentPath !== '/login' ? { redirect: currentPath } : {},
        ...options
      })
    } catch (error) {
      console.error('[Navigation] 跳转登录页失败:', error)
      ElMessage.error('跳转失败，请重试')
    }
  }

  /**
   * 智能退出登录
   */
  static async logout(options = {}) {
    try {
      // 确认退出
      await ElMessageBox.confirm(
        '确定要退出登录吗？',
        '确认退出',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      // 清除认证信息
      routerManager.clearAuth()
      
      // 清空导航历史
      routerManager.clearHistory()
      
      // 跳转到登录页
      await this.toLogin()
      
      ElMessage.success('已安全退出')
    } catch (error) {
      if (error !== 'cancel') {
        console.error('[Navigation] 退出登录失败:', error)
        ElMessage.error('退出失败，请重试')
      }
    }
  }

  /**
   * 智能返回 - 根据上下文决定返回行为
   */
  static smartBack() {
    const currentPath = routerManager.router?.currentRoute?.value?.path
    
    // 根据当前页面决定返回行为
    switch (currentPath) {
      case '/login':
      case '/register':
      case '/findPassword':
        // 认证相关页面，返回首页或关闭窗口
        if (routerManager.isAuthenticated()) {
          this.toHome()
        } else {
          window.close()
        }
        break
      
      case '/about':
        // 关于页面，返回上一页或首页
        routerManager.goBack('/home')
        break
        
      default:
        // 其他页面，正常返回
        routerManager.goBack()
    }
  }

  /**
   * 条件导航 - 根据条件决定是否跳转
   */
  static conditionalNavigate(condition, route, fallback = null) {
    if (condition) {
      return routerManager.navigateTo(route)
    } else if (fallback) {
      return routerManager.navigateTo(fallback)
    }
    return Promise.resolve()
  }
}

// 默认导出
export default {
  navigateTo,
  navigateBack,
  navigateWithLoading,
  navigateWithConfirm,
  navigateReplace,
  navigateForward,
  clearHistory,
  getNavigationHistory,
  canGoBack,
  canGoForward,
  SmartNavigation,
  // 直接暴露 SmartNavigation 的方法
  toHome: SmartNavigation.toHome.bind(SmartNavigation),
  toLogin: SmartNavigation.toLogin.bind(SmartNavigation),
  logout: SmartNavigation.logout.bind(SmartNavigation),
  smartBack: SmartNavigation.smartBack.bind(SmartNavigation),
  conditionalNavigate: SmartNavigation.conditionalNavigate.bind(SmartNavigation)
}