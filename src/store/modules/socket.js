// socket.js
export default {
  namespaced: true,
  state: {
    isConnected: false,
    reconnecting: false,
    lastMessage: null,
    messageQueue: [],
    error: null
  },
  mutations: {
    SET_CONNECTED(state, status) {
      state.isConnected = status;
      state.reconnecting = false;
      state.error = null;
    },
    SET_RECONNECTING(state) {
      state.reconnecting = true;
    },
    SET_MESSAGE(state, message) {
      state.lastMessage = message;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
    SET_QUEUE(state, queue) {
      state.messageQueue = queue;
    },
    ENQUEUE_MESSAGE(state, message) {
      state.messageQueue.push(message);
    },
    DEQUEUE_MESSAGE(state) {
      state.messageQueue.shift();
    }
  },
  actions: {
    initSocket({ commit, dispatch }, socket) {
      // 连接成功
      socket.on('connect', () => {
        console.log('[Socket] 连接成功，ID:', socket.id);
        commit('SET_CONNECTED', true);
        dispatch('processQueue', socket);
      });

      // 连接错误
      socket.on('connect_error', (error) => {
        console.error('[Socket] 连接错误:', error);
        commit('SET_ERROR', error.message);
        commit('SET_CONNECTED', false);
      });

      // 连接断开
      socket.on('disconnect', (reason) => {
        console.warn('[Socket] 连接断开，原因:', reason);
        if (reason === 'io server disconnect') {
          commit('SET_CONNECTED', false);
        } else {
          commit('SET_RECONNECTING');
        }
      });

      // 设置心跳检测
      setInterval(() => {
        if (socket.connected) {
          socket.emit('ping');
        }
      }, 30000);

      // 接收服务器心跳响应
      socket.on('pong', () => {
        console.log('[Socket] 心跳响应');
      });

      // 初始化时检查连接状态
      commit('SET_CONNECTED', socket.connected);
    },

    // 手动连接方法
    connectSocket({ commit }, socket) {
      if (!socket.connected) {
        console.log('[Socket] 手动连接...');
        socket.connect();
      }
    },

    sendMessage({ state, commit, dispatch }, { socket, message }) {
      return new Promise((resolve, reject) => {
        // 检查socket是否存在
        if (!socket) {
          reject(new Error('Socket实例不存在'));
          return;
        }
    
        // 检查连接状态
        if (!socket.connected) {
          console.log('[Socket] 连接断开，尝试重新连接...');
          socket.connect();
          
          // 等待连接建立后重试
          const checkConnection = () => {
            if (socket.connected) {
              console.log('[Socket] 重连成功，发送消息');
              dispatch('sendMessage', { socket, message }).then(resolve).catch(reject);
            } else {
              setTimeout(checkConnection, 1000);
            }
          };
          checkConnection();
          return;
        }
    
        // 发送消息
        console.log('[Socket] 发送消息:', message);
        socket.emit('sendMsg', message, (response, msg) => {
          console.log('[Socket] 收到响应:', response, msg);
          if (response) {
            resolve(response);
          } else {
            reject(new Error(msg || '发送失败'));
          }
        });
      });
    },

    processQueue({ state, commit, dispatch }, socket) {
      if (state.isConnected && state.messageQueue.length > 0) {
        console.log('[Socket] 处理消息队列，剩余消息:', state.messageQueue.length);
        const message = state.messageQueue[0];
        socket.emit('sendMsg', message, (response, msg) => {
          if (response) {
            commit('DEQUEUE_MESSAGE');
            // 继续处理队列
            if (state.messageQueue.length > 0) {
              setTimeout(() => {
                dispatch('socket/processQueue', socket);
              }, 100);
            }
          }
        });
      }
    }
  },
  getters: {
    connectionStatus: state => {
      return state.isConnected ? '已连接' : state.reconnecting ? '重连中...' : '未连接';
    }
  }
};
