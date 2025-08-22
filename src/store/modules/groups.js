import { reqGetGroupList, reqCreateGroup, reqGetGroupMessages, reqGetGroupInfo } from '@/api'

const state = {
  groupList: [],
  currentGroup: null, // 添加这个属性
  groupMessages: {}, // 添加这个属性，用于存储不同群组的消息
}

const mutations = {
  SET_GROUP_LIST(state, groups) {
    state.groupList = groups
  },
  SET_CURRENT_GROUP(state, group) {
    state.currentGroup = group
  },
  // 添加以下mutations
  SET_GROUP_MESSAGES(state, { groupId, messages }) {
    state.groupMessages = {
      ...state.groupMessages,
      [groupId]: messages.records || []
    }
  },
  ADD_GROUP_MESSAGE(state, message) {
    const groupId = message.groupId
    if (!state.groupMessages[groupId]) {
      state.groupMessages[groupId] = []
    }
    state.groupMessages[groupId].push(message)
  }
}

const actions = {
  // 获取群组列表
  async fetchGroupList({ commit }) {
    try {
      const response = await reqGetGroupList()
      if (response.success) {
        commit('SET_GROUP_LIST', response.data)
      } else {
        throw new Error(response.message || '获取群组列表失败')
      }
    } catch (error) {
      console.error('获取群组列表失败:', error)
      throw error
    }
  },

  // 创建群组
  async createGroup({ dispatch }, groupData) {
    try {
      const response = await reqCreateGroup(groupData)
      if (response.success) {
        // 创建成功后刷新群组列表
        await dispatch('fetchGroupList')
        return response.data
      } else {
        throw new Error(response.message || '创建群组失败')
      }
    } catch (error) {
      console.error('创建群组失败:', error)
      throw error
    }
  },
  
  // 添加以下action
  // 获取群聊消息历史
  async fetchGroupMessages({ commit }, { groupId, params = { page: 1, size: 20 } }) {
    try {
      const response = await reqGetGroupMessages(groupId, params)
      if (response.success) {
        commit('SET_GROUP_MESSAGES', { groupId, messages: response.data })
        return response.data
      } else {
        throw new Error(response.message || '获取群聊消息失败')
      }
    } catch (error) {
      console.error('获取群聊消息失败:', error)
      throw error
    }
  },
  
  // 添加新的群聊消息
  addNewGroupMessage({ commit }, message) {
    commit('ADD_GROUP_MESSAGE', message)
  },
  
  // 添加到actions中
  async fetchGroupInfo({ commit }, groupId) {
    try {
      const response = await reqGetGroupInfo(groupId)
      if (response.success) {
        // 更新当前群组信息
        commit('SET_CURRENT_GROUP', response.data)
        return response.data
      } else {
        throw new Error(response.message || '获取群组信息失败')
      }
    } catch (error) {
      console.error('获取群组信息失败:', error)
      throw error
    }
  }
}

const getters = {
  // 添加currentGroup getter
  currentGroup: (state) => state.currentGroup,
  
  // 添加以下getter
  getGroupMessages: (state) => (groupId) => {
    return state.groupMessages[groupId] || []
  },
  
  // 获取群组成员信息
  getGroupMember: (state) => (userId) => {
    if (!state.currentGroup || !state.currentGroup.members) return null
    return state.currentGroup.members.find(member => member.userId === userId)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
