// src/store/modules/chat.js
export default {
  namespaced: true,
  state: {
    chatList: [], // 聊天列表，必须初始化为空数组
    // 你可以根据需要添加更多 state
  },
  mutations: {
    SET_CHAT_LIST(state, list) {
      state.chatList = list || [];
    },
    // 你可以根据需要添加更多 mutations
  },
  actions: {
    // 示例：异步获取聊天列表
    async fetchChatList({ commit }) {
      // 这里请替换为你的实际 API 请求
      // const response = await api.getChatList();
      // commit('SET_CHAT_LIST', response.data);
      commit('SET_CHAT_LIST', []); // 默认空实现
    },
    // 你可以根据需要添加更多 actions
  }
};