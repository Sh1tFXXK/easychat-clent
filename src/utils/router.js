/**
 * 路由工具类 - 统一管理页面跳转逻辑
 */
import { ElMessage, ElLoading } from 'element-plus'
import { getCookie } from './cookie'

class RouterManager {
  constructor() {
    this.router = null
    this.store = null
    this.loadingInstance = null
    this.navigationHistory = []
    this.maxHistoryLength = 10
  }

  /**
   * 初始化路由管理器
   */
  init(router, store) {
    this.router = router
    this.store = store
    this.setupNavigationGuards()
    this.setupHistoryTracking()
  }

  /**
   * 设置导航守卫
   */
  setupNavigationGuards() {
    if (!this.router) return

    // 全局前置守卫
    this.router.beforeEach((to, from, next) => {
      console.log(`[Router] 导航: ${from.path} -> ${to.path}`)
      
      // 显示加载状态
      this.showLoading()
      
      // 检查认证状态
      if (this.requiresAuth(to)) {
        if (!this.isAuthenticated()) {
          console.log('[Router] 用户未认证，重定向到登录页')
          this.hideLoading()
          return this.redirectToLogin(to.fullPath)
        }
      }

      // 检查权限
      if (!this.hasPermission(to)) {
        console.log('[Router] 用户无权限访问该页面')
        this.hideLoading()
        ElMessage.error('您没有权限访问该页面')
        return next(false)
      }

      next()
    })

    // 全局后置钩子
    this.router.afterEach((to, from) => {
      // 隐藏加载状态
      this.hideLoading()
      
      // 更新页面标题
      this.updatePageTitle(to)
      
      // 记录导航历史
      this.recordNavigation(to, from)
      
      console.log(`[Router] 导航完成: ${to.path}`)
    })

    // 导航错误处理
    this.router.onError((error) => {
      console.error('[Router] 导航错误:', error)
      this.hideLoading()
      ElMessage.error('页面加载失败，请重试')
    })
  }

  /**
   * 设置历史记录跟踪
   */
  setupHistoryTracking() {
    // 监听浏览器前进后退
    window.addEventListener('popstate', (event) => {
      console.log('[Router] 浏览器历史变化:', event.state)
    })
  }

  /**
   * 检查路由是否需要认证
   */
  requiresAuth(route) {
    const publicRoutes = ['/login', '/register', '/findPassword', '/about']
    return !publicRoutes.includes(route.path)
  }

  /**
   * 检查用户是否已认证
   */
  isAuthenticated() {
    const uid = getCookie("uid")
    const token = this.getToken()
    
    if (!uid || !token) {
      return false
    }

    // 检查UID格式
    if (!/\d{19}/.test(uid)) {
      return false
    }

    // 检查token是否过期
    if (this.isTokenExpired(token)) {
      this.clearAuthData()
      return false
    }

    return true
  }

  /**
   * 获取token
   */
  getToken() {
    try {
      let token = localStorage.getItem('token')
      if (!token) {
        const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'))
        token = match ? decodeURIComponent(match[2]) : null
      }
      return token
    } catch (e) {
      return null
    }
  }

  /**
   * 检查token是否过期
   */
  isTokenExpired(token) {
    if (!token) return true
    
    try {
      // 移除Bearer前缀
      const jwtToken = token.startsWith('Bearer ') ? token.substring(7) : token
      const parts = jwtToken.split('.')
      
      if (parts.length !== 3) return true
      
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      const now = Math.floor(Date.now() / 1000)
      
      return typeof payload.exp === 'number' ? (payload.exp - 30) <= now : true
    } catch {
      return true
    }
  }

  /**
   * 清除认证数据
   */
  clearAuthData() {
    try {
      localStorage.removeItem('token')
      document.cookie = 'token=; Max-Age=0; path=/'
      document.cookie = 'uid=; Max-Age=0; path=/'
    } catch (e) {
      console.error('[Router] 清除认证数据失败:', e)
    }
  }

  /**
   * 检查用户权限
   */
  hasPermission(route) {
    // 这里可以根据用户角色和路由元信息检查权限
    // 目前简单返回true，后续可以扩展
    return true
  }

  /**
   * 重定向到登录页
   */
  redirectToLogin(redirect = null) {
    const query = redirect ? { redirect } : {}
    return this.router.push({ name: 'login', query })
  }

  /**
   * 智能导航 - 带有状态保存和恢复
   */
  async navigateTo(route, options = {}) {
    const {
      saveState = true,
      showLoading = true,
      replace = false,
      force = false
    } = options

    try {
      // 保存当前页面状态
      if (saveState) {
        this.saveCurrentPageState()
      }

      // 显示加载状态
      if (showLoading) {
        this.showLoading('页面跳转中...')
      }

      // 执行导航
      const method = replace ? 'replace' : 'push'
      await this.router[method](route)

      console.log(`[Router] 智能导航成功: ${JSON.stringify(route)}`)
      
    } catch (error) {
      console.error('[Router] 智能导航失败:', error)
      ElMessage.error('页面跳转失败')
      throw error
    } finally {
      if (showLoading) {
        this.hideLoading()
      }
    }
  }

  /**
   * 返回上一页
   */
  goBack(fallback = '/home') {
    if (this.navigationHistory.length > 1) {
      // 有历史记录，返回上一页
      this.router.go(-1)
    } else {
      // 没有历史记录，跳转到默认页面
      this.navigateTo(fallback)
    }
  }

  /**
   * 刷新当前页面
   */
  refresh() {
    const currentRoute = this.router.currentRoute.value
    this.router.replace({
      path: '/redirect' + currentRoute.fullPath
    })
  }

  /**
   * 保存当前页面状态
   */
  saveCurrentPageState() {
    try {
      const currentRoute = this.router.currentRoute.value
      const state = {
        path: currentRoute.path,
        query: currentRoute.query,
        params: currentRoute.params,
        timestamp: Date.now()
      }
      
      sessionStorage.setItem('lastPageState', JSON.stringify(state))
    } catch (e) {
      console.error('[Router] 保存页面状态失败:', e)
    }
  }

  /**
   * 恢复页面状态
   */
  restorePageState() {
    try {
      const stateStr = sessionStorage.getItem('lastPageState')
      if (stateStr) {
        const state = JSON.parse(stateStr)
        // 检查状态是否过期（30分钟）
        if (Date.now() - state.timestamp < 30 * 60 * 1000) {
          return state
        }
      }
    } catch (e) {
      console.error('[Router] 恢复页面状态失败:', e)
    }
    return null
  }

  /**
   * 记录导航历史
   */
  recordNavigation(to, from) {
    const record = {
      to: { path: to.path, name: to.name },
      from: { path: from.path, name: from.name },
      timestamp: Date.now()
    }

    this.navigationHistory.push(record)
    
    // 限制历史记录长度
    if (this.navigationHistory.length > this.maxHistoryLength) {
      this.navigationHistory.shift()
    }
  }

  /**
   * 更新页面标题
   */
  updatePageTitle(route) {
    const titles = {
      '/home': 'EasyChat - 首页',
      '/login': 'EasyChat - 登录',
      '/register': 'EasyChat - 注册',
      '/findPassword': 'EasyChat - 找回密码',
      '/about': 'EasyChat - 关于我们'
    }

    const title = titles[route.path] || 'EasyChat'
    document.title = title
  }

  /**
   * 显示加载状态
   */
  showLoading(text = '加载中...') {
    if (this.loadingInstance) {
      this.loadingInstance.close()
    }
    
    this.loadingInstance = ElLoading.service({
      lock: true,
      text,
      background: 'rgba(0, 0, 0, 0.7)'
    })
  }

  /**
   * 隐藏加载状态
   */
  hideLoading() {
    if (this.loadingInstance) {
      this.loadingInstance.close()
      this.loadingInstance = null
    }
  }

  /**
   * 获取导航历史
   */
  getNavigationHistory() {
    return [...this.navigationHistory]
  }

  /**
   * 清除导航历史
   */
  clearNavigationHistory() {
    this.navigationHistory = []
  }
}

// 创建单例实例
const routerManager = new RouterManager()

export default routerManager