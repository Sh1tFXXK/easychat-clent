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
    setConnected(state, status) {
      state.isConnected = status;
      if(status) {
        state.reconnecting = false;
        state.error = null;
      }
    },
    setError(state, error) {
      state.error = error;
    },
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
    /**
     * @description 初始化socket，监听各种事件
     * @param {object} context - vuex上下文
     * @param {object} payload - 包含socket, store, router
     */
    initSocket({ commit, dispatch }, { socket, store, router }) {
      // 连接成功事件
      socket.on('connect', () => {
        console.log('[Socket] 连接成功，ID:', socket.id);
        commit('setConnected', true);
        dispatch('processQueue', socket);
      });

      // 连接错误事件
      socket.on('connect_error', (error) => {
        console.error('[Socket] 连接错误:', error.message);
        commit('setError', error.message);
        commit('setConnected', false);
        // 如果是认证失败，则登出
        if (error.message.includes('authentication failed')) {
          store.dispatch('auth/logout'); // 假设你有一个auth模块处理登出
          router.push('/login');
        }
      });

      // 连接断开事件
      socket.on('disconnect', (reason) => {
        console.warn('[Socket] 连接断开，原因:', reason);
        commit('setConnected', false);
        // 如果是服务器主动断开，则尝试重连
        if (reason === 'io server disconnect') {
          dispatch('connectSocket', socket);
        } else {
          commit('SET_RECONNECTING');
        }
      });

      // 心跳检测
      setInterval(() => {
        if (socket.connected) {
          socket.emit('ping');
        }
      }, 30000);

      socket.on('pong', () => {
        // console.log('[Socket] 心跳响应');
      });
    },

    /**
     * @description 手动连接socket
     * @param {object} context - vuex上下文
     * @param {object} socket - socket.io实例
     */
    connectSocket({ commit }, socket) {
      if (!socket.connected) {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('[Socket] 正在尝试连接...');
          socket.io.opts.query = { token };
          socket.connect();
        } else {
          console.warn('[Socket] 无Token，无法连接。');
        }
      }
    },

    /**
     * @description 发送消息
     * @param {object} context - vuex上下文
     * @param {object} payload - 参数
     * @param {object} payload.socket - socket.io实例
     * @param {any} payload.message - 要发送的消息内容
     * @returns {Promise}
     */
    sendMessage({ state, commit, dispatch }, { socket, message }) {
      return new Promise((resolve, reject) => {
        // 检查socket是否存在
        if (!socket) {
          reject(new Error('Socket实例不存在'));
          return;
        }
    
        // 检查连接状态，如果未连接则尝试重连
        if (!socket.connected) {
          console.log('[Socket] 连接断开，尝试重新连接...');
          socket.connect();
          
          // 等待连接建立后重试发送
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
        // @param {string} event - 事件名 'sendMsg'
        // @param {any} message - 消息内容
        // @param {function} callback - 服务器响应回调
        // @param {any} callback.response - 响应数据
        // @param {string} callback.msg - 响应消息
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

    /**
     * @description 处理因断线等原因未发送成功的消息队列
     * @param {object} context - vuex上下文
     * @param {object} socket - socket.io实例
     */
    processQueue({ state, commit, dispatch }, socket) {
      if (state.isConnected && state.messageQueue.length > 0) {
        console.log('[Socket] 处理消息队列，剩余消息:', state.messageQueue.length);
        const message = state.messageQueue[0];
        // @param {string} event - 事件名 'sendMsg'
        // @param {any} message - 消息内容
        // @param {function} callback - 服务器响应回调
        // @param {any} callback.response - 响应数据
        // @param {string} callback.msg - 响应消息
        socket.emit('sendMsg', message, (response, msg) => {
          if (response) {
            commit('DEQUEUE_MESSAGE');
            // 如果队列中还有消息，继续处理
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
