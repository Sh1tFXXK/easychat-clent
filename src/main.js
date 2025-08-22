// 解决 ResizeObserver 错误
const debounce = (fn, delay) => {
  let timer = null;
  return function () {
    let context = this;
    let args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  }
}

const _ResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
  constructor(callback) {
    callback = debounce(callback, 16);
    super(callback);
  }
}

import { createApp } from 'vue'
import { ElCollapseTransition } from 'element-plus'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import io from 'socket.io-client/dist/socket.io'
import VueParticles from 'vue-particles'
import router from '@/router'
import store from '@/store'
import App from '@/App.vue'

import "@/mock/mockServer"
import "@/moment/moment"

// 不再使用模拟Socket.io服务器
// import createMockSocketServer from '@/mock/mockSocketServer'

import "@/assets/css/index.css"
import "element-plus/theme-chalk/base.css"
import "element-plus/theme-chalk/el-loading.css"
import "element-plus/theme-chalk/el-message.css"
import "element-plus/theme-chalk/el-message-box.css"
import "element-plus/theme-chalk/el-notification.css"
import "vue3-slide-verify/dist/style.css"

const app = createApp(App)

// 使用真实Socket.io连接到后端服务器
const wsUrl = `ws://localhost:8082`;
console.log('[Socket] 初始化连接:', wsUrl);

const token = (() => { try { return localStorage.getItem('token') } catch (_) { return null } })();
const socket = io(wsUrl, {
  path: "/socket.io",
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: false, 
  timeout: 10000,
  query: {
    token: token
  }
});

// 将socket实例和Vuex store/router传入，以便在action中访问
store.dispatch('socket/initSocket', { socket, store, router });

// 只有在有token的情况下才尝试连接
if (token) {
  store.dispatch('socket/connectSocket', socket);
}

// 添加全局调试方法
window.debugSocket = () => {
  console.log('=== Socket 调试信息 ===');
  console.log('连接状态:', socket.connected);
  console.log('Socket ID:', socket.id);
  console.log('Store 连接状态:', store.state.socket.isConnected);
  console.log('消息队列长度:', store.state.socket.messageQueue.length);
  console.log('错误信息:', store.state.socket.error);
  console.log('====================');
};

app.config.globalProperties.socket = socket
app.component(ElCollapseTransition.name, ElCollapseTransition)
app.use(router)
app.use(store)
app.use(autoAnimatePlugin)
app.use(VueParticles)
app.mount('#app')
