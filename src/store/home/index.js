import { mockGetChatList, mockGetFriendList, mockGetFriendVerify, mockGetHistory, reqGetChatList, reqGetFriendList, reqGetFriendVerify, reqGetHistory, reqGetUserInfo } from "@/api";

const state = {
    userInfo: {},
    onlineUsers: [],
    chatList: [],
    friendList: [],
    friendVerifyList: [],
    chatHistories: []
};
const mutations = {
    ONLINEUSERS(state, onlineUsers) {
        state.onlineUsers = onlineUsers;
    },
    CHATLIST(state, chatList) {
        console.log('[Store] 更新聊天列表:', chatList);
        state.chatList = chatList;
    },
    FRIENDLIST(state, friendList) {
        console.log('[Store] 更新好友列表:', friendList);
        state.friendList = friendList;
    },
    FRIENDVERIFY(state, friendVerifyList) {
        console.log('[Store] 更新好友验证:', friendVerifyList);
        state.friendVerifyList = friendVerifyList
    },
    SET_USER_INFO(state, userInfo) {
        state.userInfo = userInfo;
    },
    HISTORY(state, chatHistories) {
        state.chatHistories = chatHistories;
    },
    ADD_CHAT_HISTORY(state, message) {
        state.chatHistories.push(message);
    }
};
const actions = {
    // async getChatList({ commit }) {
    //     let result = await mockGetChatList();
    //     if (result.code === 200) {
    //         commit("CHATLIST", result.data.sort((obj1, obj2) => {
    //             if (obj1.createTime > obj2.createTime) {
    //                 return -1;
    //             } else if (obj1.createTime < obj2.createTime) {
    //                 return 1;
    //             } else {
    //                 return 0;
    //             }
    //         }));
    //     }
    // },
    // async getFriendList({ commit }) {
    //     let result = await mockGetFriendList();
    //     if (result.code === 200) {
    //         commit("FRIENDLIST", result.data.sort());
    //     }
    // },
    // async getFriendVerify({ commit }) {
    //     let result = await mockGetFriendVerify();
    //     if (result.code === 200) {
    //         commit("FRIENDVERIFY", result.data.sort((obj1, obj2) => {
    //             if (obj1.createTime > obj2.createTime) {
    //                 return -1;
    //             } else if (obj1.createTime < obj2.createTime) {
    //                 return 1;
    //             } else {
    //                 return 0;
    //             }
    //         }));
    //     }
    // },
    // async getHistory({ commit }) {
    //     let result = await mockGetHistory();
    //     if (result.code === 200) {
    //         commit("HISTORY", result.data);
    //     }
    // },

    async getChatList({ commit }, userId) {
        console.log('🔥 [Store] getChatList 被调用，用户ID:', userId);
        try {
            console.log('[Store] 开始获取聊天列表，用户ID:', userId);
            let result = await reqGetChatList({ id: userId });
            console.log('[Store] 聊天列表API返回:', result);
            if (result.success) {
                let chatList = Array.isArray(result.data) ? result.data : [result.data];
                console.log('[Store] 处理后的聊天列表:', chatList);
                
                // 检查数据结构
                if (chatList.length > 0) {
                    console.log('[Store] 第一个聊天对象结构:', Object.keys(chatList[0]));
                    console.log('[Store] 第一个聊天对象内容:', chatList[0]);
                }
                
                commit("CHATLIST", chatList.sort((obj1, obj2) => {
                    let time1 = obj1.latestChatHistory ? obj1.latestChatHistory.createTime : obj1.sessionTime;
                    let time2 = obj2.latestChatHistory ? obj2.latestChatHistory.createTime : obj2.sessionTime;
                    if (time1 > time2) {
                        return -1;
                    } else if (time1 < time2) {
                        return 1;
                    } else {
                        return 0;
                    }
                }));
                console.log('✅ [Store] 聊天列表更新完成');
            }
        } catch (error) {
            console.error('❌ 获取聊天列表失败，使用模拟数据:', error);
            // 使用模拟数据
            let result = await mockGetChatList();
            if (result.code === 200) {
                commit("CHATLIST", result.data.sort((obj1, obj2) => {
                    if (obj1.createTime > obj2.createTime) {
                        return -1;
                    } else if (obj1.createTime < obj2.createTime) {
                        return 1;
                    } else {
                        return 0;
                    }
                }));
            }
        }
    },
    async getFriendList({ commit }, userId) {
        try {
            let result = await reqGetFriendList({ id: userId });
            if (result.success) {
                let friendList = Array.isArray(result.data) ? result.data : [result.data];
                commit("FRIENDLIST", [...friendList].sort((a, b) => (a.friendNickName || '').localeCompare(b.friendNickName || '')));
            }
        } catch (error) {
            console.error('获取好友列表失败，使用模拟数据:', error);
            // 使用模拟数据
            let result = await mockGetFriendList();
            if (result.code === 200) {
                commit("FRIENDLIST", result.data.sort());
            }
        }
    },
    async getFriendVerify({ commit }, userId) {
        try {
            let result = await reqGetFriendVerify({ id: userId });
            if (result.success) {
                commit("FRIENDVERIFY", result.data.sort((obj1, obj2) => {
                    if (obj1.createTime > obj2.createTime) {
                        return -1;
                    } else if (obj1.createTime < obj2.createTime) {
                        return 1;
                    } else {
                        return 0;
                    }
                }));
            }
        } catch (error) {
            console.error('获取好友验证失败，使用模拟数据:', error);
            // 使用模拟数据
            let result = await mockGetFriendVerify();
            if (result.code === 200) {
                commit("FRIENDVERIFY", result.data.sort((obj1, obj2) => {
                    if (obj1.createTime > obj2.createTime) {
                        return -1;
                    } else if (obj1.createTime < obj2.createTime) {
                        return 1;
                    } else {
                        return 0;
                    }
                }));
            }
        }
    },
    async getHistory({ commit }, params) {
        console.log("[Store] getHistory action received params:", JSON.parse(JSON.stringify(params)));
        let result = await reqGetHistory(params);
        if (result.success) {
            if (result.data.records) {
                commit("HISTORY", result.data.records.sort((obj1, obj2) => {
                    if (obj1.createTime < obj2.createTime) {
                        return -1;
                    } else if (obj1.createTime > obj2.createTime) {
                        return 1;
                    } else {
                        return 0;
                    }
                }));
            } else {
                commit("HISTORY", []);
            }
        }
    },
    async getUserInfo({ commit }, userId) {
        try {
            const response = await reqGetUserInfo({ id: userId });
            if (response.success) {
                commit("SET_USER_INFO", response.data);
            }
            return response;
        } catch (error) {
            console.error("Error fetching user info:", error);
            return Promise.reject(error);
        }
    }
};
const getters = {
    userInfo: (state) => state.userInfo,
};

export default {
    namespaced: true,

    state,
    mutations,
    actions,
    getters
}
