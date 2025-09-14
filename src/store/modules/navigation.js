/**
 * 导航状态管理模块
 */
const state = {
  // 当前页面信息
  currentPage: {
    name: '',
    path: '',
    params: {},
    query: {},
    meta: {}
  },
  
  // 页面历史记录
  pageHistory: [],
  
  // 页面切换状态
  isTransitioning: false,
  transitionDirection: 'forward', // forward, backward, none
  
  // 侧边栏状态
  sidebarState: {
    activeMenu: 'chats', // chats, groups, friends, favorites, collections
    lastActiveMenu: 'chats',
    isCollapsed: false
  },
  
  // 聊天相关状态
  chatState: {
    activeChatId: null,
    activeChatType: null, // private, group
    showProfile: null,
    lastOpenedChats: []
  },
  
  // 页面加载状态
  loadingStates: {
    pageLoading: false,
    chatLoading: false,
    userInfoLoading: false
  },
  
  // 错误状态
  errorStates: {
    lastError: null,
    errorCount: 0
  }
}

const mutations = {
  // 设置当前页面信息
  SET_CURRENT_PAGE(state, pageInfo) {
    state.currentPage = { ...pageInfo }
  },
  
  // 添加页面到历史记录
  ADD_TO_HISTORY(state, pageInfo) {
    // 避免重复添加相同页面
    const lastPage = state.pageHistory[state.pageHistory.length - 1]
    if (!lastPage || lastPage.path !== pageInfo.path) {
      state.pageHistory.push({
        ...pageInfo,
        timestamp: Date.now()
      })
      
      // 限制历史记录长度
      if (state.pageHistory.length > 20) {
        state.pageHistory.shift()
      }
    }
  },
  
  // 设置页面切换状态
  SET_TRANSITION_STATE(state, { isTransitioning, direction = 'forward' }) {
    state.isTransitioning = isTransitioning
    state.transitionDirection = direction
  },
  
  // 设置侧边栏状态
  SET_SIDEBAR_STATE(state, sidebarState) {
    if (sidebarState.activeMenu && sidebarState.activeMenu !== state.sidebarState.activeMenu) {
      state.sidebarState.lastActiveMenu = state.sidebarState.activeMenu
    }
    state.sidebarState = { ...state.sidebarState, ...sidebarState }
  },
  
  // 设置聊天状态
  SET_CHAT_STATE(state, chatState) {
    // 记录最近打开的聊天
    if (chatState.activeChatId && chatState.activeChatId !== state.chatState.activeChatId) {
      const lastOpenedChats = state.chatState.lastOpenedChats.filter(
        chat => chat.id !== chatState.activeChatId
      )
      lastOpenedChats.unshift({
        id: chatState.activeChatId,
        type: chatState.activeChatType,
        timestamp: Date.now()
      })
      
      // 限制记录数量
      if (lastOpenedChats.length > 10) {
        lastOpenedChats.pop()
      }
      
      chatState.lastOpenedChats = lastOpenedChats
    }
    
    state.chatState = { ...state.chatState, ...chatState }
  },
  
  // 设置加载状态
  SET_LOADING_STATE(state, { type, loading }) {
    state.loadingStates[type] = loading
  },
  
  // 设置错误状态
  SET_ERROR_STATE(state, error) {
    state.errorStates.lastError = error
    if (error) {
      state.errorStates.errorCount++
    }
  },
  
  // 清除错误状态
  CLEAR_ERROR_STATE(state) {
    state.errorStates.lastError = null
  },
  
  // 重置导航状态
  RESET_NAVIGATION_STATE(state) {
    state.pageHistory = []
    state.isTransitioning = false
    state.transitionDirection = 'forward'
    state.errorStates.lastError = null
    state.errorStates.errorCount = 0
  }
}

const actions = {
  // 页面跳转前的准备工作
  async beforePageTransition({ commit, state }, { to, from }) {
    commit('SET_TRANSITION_STATE', { isTransitioning: true })
    commit('SET_LOADING_STATE', { type: 'pageLoading', loading: true })
    
    // 确定切换方向
    const direction = determineTransitionDirection(to, from)
    commit('SET_TRANSITION_STATE', { isTransitioning: true, direction })
    
    // 记录页面信息
    if (to) {
      commit('SET_CURRENT_PAGE', {
        name: to.name,
        path: to.path,
        params: to.params,
        query: to.query,
        meta: to.meta
      })
      commit('ADD_TO_HISTORY', {
        name: to.name,
        path: to.path,
        params: to.params,
        query: to.query
      })
    }
  },
  
  // 页面跳转完成后的清理工作
  async afterPageTransition({ commit }) {
    commit('SET_TRANSITION_STATE', { isTransitioning: false })
    commit('SET_LOADING_STATE', { type: 'pageLoading', loading: false })
    commit('CLEAR_ERROR_STATE')
  },
  
  // 切换侧边栏
  async switchSidebar({ commit, dispatch }, menuType) {
    commit('SET_SIDEBAR_STATE', { activeMenu: menuType })
    
    // 触发全局事件
    window.dispatchEvent(new CustomEvent('switchSidebar', {
      detail: { menuValue: menuType }
    }))
    
    // 记录用户偏好
    try {
      localStorage.setItem('lastActiveMenu', menuType)
    } catch (error) {
      console.warn('无法保存侧边栏状态到本地存储:', error)
    }
  },
  
  // 打开聊天
  async openChat({ commit }, { chatId, chatType = 'private' }) {
    commit('SET_CHAT_STATE', {
      activeChatId: chatId,
      activeChatType: chatType,
      showProfile: null
    })
    
    // 触发全局事件
    window.dispatchEvent(new CustomEvent('openChat', {
      detail: { chatId, chatType }
    }))
  },
  
  // 显示用户资料
  async showUserProfile({ commit }, userId) {
    commit('SET_CHAT_STATE', { showProfile: userId })
    
    // 触发全局事件
    window.dispatchEvent(new CustomEvent('showProfile', {
      detail: { userId }
    }))
  },
  
  // 关闭聊天
  async closeChat({ commit }) {
    commit('SET_CHAT_STATE', {
      activeChatId: null,
      activeChatType: null,
      showProfile: null
    })
  },
  
  // 处理导航错误
  async handleNavigationError({ commit }, error) {
    console.error('导航错误:', error)
    commit('SET_ERROR_STATE', error)
    commit('SET_LOADING_STATE', { type: 'pageLoading', loading: false })
    commit('SET_TRANSITION_STATE', { isTransitioning: false })
  },
  
  // 恢复用户偏好设置
  async restoreUserPreferences({ commit }) {
    try {
      const lastActiveMenu = localStorage.getItem('lastActiveMenu')
      if (lastActiveMenu) {
        commit('SET_SIDEBAR_STATE', { activeMenu: lastActiveMenu })
      }
      
      const lastOpenedChats = JSON.parse(localStorage.getItem('lastOpenedChats') || '[]')
      if (lastOpenedChats.length > 0) {
        commit('SET_CHAT_STATE', { lastOpenedChats })
      }
    } catch (error) {
      console.warn('恢复用户偏好设置失败:', error)
    }
  },
  
  // 保存用户偏好设置
  async saveUserPreferences({ state }) {
    try {
      localStorage.setItem('lastActiveMenu', state.sidebarState.activeMenu)
      localStorage.setItem('lastOpenedChats', JSON.stringify(state.chatState.lastOpenedChats))
    } catch (error) {
      console.warn('保存用户偏好设置失败:', error)
    }
  }
}

const getters = {
  // 获取当前页面信息
  currentPageInfo: state => state.currentPage,
  
  // 获取页面历史记录
  pageHistory: state => state.pageHistory,
  
  // 获取是否正在切换页面
  isTransitioning: state => state.isTransitioning,
  
  // 获取切换方向
  transitionDirection: state => state.transitionDirection,
  
  // 获取侧边栏状态
  sidebarState: state => state.sidebarState,
  
  // 获取聊天状态
  chatState: state => state.chatState,
  
  // 获取加载状态
  loadingStates: state => state.loadingStates,
  
  // 获取错误状态
  errorStates: state => state.errorStates,
  
  // 获取最近访问的页面
  recentPages: state => {
    return state.pageHistory
      .slice(-5)
      .reverse()
      .filter((page, index, arr) => 
        arr.findIndex(p => p.path === page.path) === index
      )
  },
  
  // 获取最近打开的聊天
  recentChats: state => state.chatState.lastOpenedChats.slice(0, 5),
  
  // 检查是否可以返回上一页
  canGoBack: state => state.pageHistory.length > 1,
  
  // 获取上一页信息
  previousPage: state => {
    const history = state.pageHistory
    return history.length > 1 ? history[history.length - 2] : null
  }
}

// 辅助函数：确定页面切换方向
function determineTransitionDirection(to, from) {
  if (!from || !to) return 'forward'
  
  // 定义页面层级
  const pageLevel = {
    '/login': 1,
    '/register': 1,
    '/findPassword': 1,
    '/home': 2,
    '/about': 1
  }
  
  const toLevel = pageLevel[to.path] || 2
  const fromLevel = pageLevel[from.path] || 2
  
  if (toLevel > fromLevel) {
    return 'forward'
  } else if (toLevel < fromLevel) {
    return 'backward'
  } else {
    return 'none'
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}