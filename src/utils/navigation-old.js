/**
 * 导航工具类 - 提供便捷的页面跳转方法
 */
import routerManager from './router'
import { ElMessage } from 'element-plus'

class NavigationHelper {
  /**
   * 跳转到首页
   */
  static toHome() {
    return routerManager.navigateTo({ name: 'home' })
  }

  /**
   * 跳转到登录页
   */
  static toLogin(redirect = null) {
    const route = { name: 'login' }
    if (redirect) {
      route.query = { redirect }
    }
    return routerManager.navigateTo(route, { replace: true })
  }

  /**
   * 跳转到注册页
   */
  static toRegister() {
    return routerManager.navigateTo({ name: 'register' })
  }

  /**
   * 跳转到找回密码页
   */
  static toFindPassword() {
    return routerManager.navigateTo({ name: 'findPassword' })
  }

  /**
   * 跳转到关于页面
   */
  static toAbout() {
    return routerManager.navigateTo({ name: 'about' })
  }

  /**
   * 在首页内切换侧边栏
   */
  static switchSidebar(sidebarType) {
    const sidebarMap = {
      'chats': 1,
      'groups': 2,
      'friends': 3,
      'favorites': 4,
      'collections': 5
    }

    const menuValue = sidebarMap[sidebarType] || 1
    
    // 通过事件总线通知首页组件切换侧边栏
    window.dispatchEvent(new CustomEvent('switchSidebar', {
      detail: { menuValue }
    }))
  }

  /**
   * 打开聊天窗口
   */
  static openChat(chatId, chatType = 'private') {
    window.dispatchEvent(new CustomEvent('openChat', {
      detail: { chatId, chatType }
    }))
  }

  /**
   * 显示用户资料
   */
  static showProfile(userId) {
    window.dispatchEvent(new CustomEvent('showProfile', {
      detail: { userId }
    }))
  }

  /**
   * 安全退出登录
   */
  static async logout() {
    try {
      // 清除认证数据
      routerManager.clearAuthData()
      
      // 断开Socket连接
      if (window.updateSocketToken) {
        window.updateSocketToken(null)
      }
      
      // 清除导航历史
      routerManager.clearNavigationHistory()
      
      // 跳转到登录页
      await this.toLogin()
      
      ElMessage.success('已安全退出')
    } catch (error) {
      console.error('[Navigation] 退出登录失败:', error)
      ElMessage.error('退出失败，请重试')
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

  /**
   * 延迟导航 - 延迟指定时间后跳转
   */
  static delayedNavigate(route, delay = 1000) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        await routerManager.navigateTo(route)
        resolve()
      }, delay)
    })
  }

  /**
   * 确认导航 - 显示确认对话框后跳转
   */
  static async confirmNavigate(route, message = '确定要离开当前页面吗？') {
    try {
      await ElMessageBox.confirm(message, '确认', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
      
      return routerManager.navigateTo(route)
    } catch {
      // 用户取消
      return Promise.resolve()
    }
  }

  /**
   * 获取当前路由信息
   */
  static getCurrentRoute() {
    return routerManager.router?.currentRoute?.value
  }

  /**
   * 检查是否在指定页面
   */
  static isCurrentPage(path) {
    const currentPath = this.getCurrentRoute()?.path
    return currentPath === path
  }

  /**
   * 获取导航历史
   */
  static getHistory() {
    return routerManager.getNavigationHistory()
  }
}

export default NavigationHelper