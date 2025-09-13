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
import io from 'socket.io-client'
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

// 读取 token（优先 localStorage，其次 cookie）
function readToken() {
  try {
    let t = localStorage.getItem('token');
    if (!t) {
      const m = document.cookie.match(new RegExp('(^| )' + 'token' + '=([^;]+)'));
      t = m ? decodeURIComponent(m[2]) : null;
    }
    // 不要移除Bearer前缀，保持完整的token格式
    return t;
  } catch (e) {
    return null;
  }
}

// 判定 JWT 是否过期（提前30秒）
function isJwtExpired(token) {
  if (!token) return true;
  
  // 移除Bearer前缀进行JWT解析
  let jwtToken = token;
  if (token.startsWith('Bearer ')) {
    jwtToken = token.substring(7);
  }
  
  const parts = jwtToken.split('.');
  if (parts.length !== 3) return true;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number') return true;
    return (payload.exp - 30) <= now;
  } catch {
    return true;
  }
}

let token = readToken();
console.log('[Socket] 启动读取 token:', token ? token.substring(0, 20) + '...' : '(空)');
if (token && isJwtExpired(token)) {
  console.warn('[Socket] 本地 token 已过期，清理并不携带');
  try {
    localStorage.removeItem('token');
    document.cookie = 'token=; Max-Age=0; path=/';
  } catch (e) {}
  token = null;
}

function buildUrlWithToken(baseUrl, tk) {
  if (tk) {
    // 确保token是完整的JWT格式
    const fullToken = tk.startsWith('Bearer ') ? tk : `Bearer ${tk}`;
    return `${baseUrl}?token=${encodeURIComponent(fullToken)}`;
  }
  return baseUrl;
}

function createSocket(currentToken) {
  const url = buildUrlWithToken(wsUrl, currentToken);
  console.log('[Socket] 使用URL创建连接:', url);
  const s = io(url, {
    path: "/socket.io",
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: false,
    timeout: 10000
  });

  s.on('connect', () => {
    console.log('[Socket] 连接成功，ID:', s.id);
  });
  s.on('connect_error', (error) => {
    console.error('[Socket] 连接错误:', error);
  });
  s.on('disconnect', (reason) => {
    console.warn('[Socket] 连接断开，原因:', reason);
    // 如果是服务器主动断开，尝试重连
    if (reason === 'io server disconnect') {
      console.log('[Socket] 服务器断开连接，尝试重连...');
      setTimeout(() => {
        if (currentToken) {
          s.connect();
        }
      }, 2000);
    }
  });
  
  // 添加页面可见性变化监听
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[Socket] 页面变为可见，检查连接状态');
      if (!s.connected && currentToken) {
        console.log('[Socket] 页面可见时重新连接');
        s.connect();
      }
    } else {
      console.log('[Socket] 页面变为隐藏');
    }
  });
  
  // 添加窗口焦点监听
  window.addEventListener('focus', () => {
    console.log('[Socket] 窗口获得焦点，检查连接状态');
    if (!s.connected && currentToken) {
      console.log('[Socket] 窗口焦点时重新连接');
      s.connect();
    }
  });
  
  if (currentToken) {
    // 仅在存在有效 token 时连接
    try { s.connect(); } catch (e) {}
  }
  return s;
}

// 全局 Socket 实例，确保只有一个
let socket = null;

// 初始化 Socket
if (token) {
  socket = createSocket(token);
} else {
  // 没有 token 时创建但不连接
  socket = createSocket(null);
}

// 初始化 socket 状态管理
store.dispatch('socket/initSocket', socket);

// 添加全局调试方法（动态读取当前 socket）
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

// 提供全局方法以便登录/刷新后更新 token 并重建连接
window.updateSocketToken = function(newToken) {
  try {
    // 先断开现有连接
    if (socket && socket.connected) {
      console.log('[Socket] 断开现有连接');
      socket.disconnect();
    }
    
    if (!newToken || isJwtExpired(newToken)) {
      console.warn('[Socket] 更新的 token 无效或已过期，断开连接');
      socket = createSocket(null);
      app.config.globalProperties.socket = socket;
      store.dispatch('socket/initSocket', socket);
      return;
    }
    
    socket = createSocket(newToken);
    app.config.globalProperties.socket = socket;
    store.dispatch('socket/initSocket', socket);
    console.log('[Socket] 已使用新 token 重建连接');
  } catch (e) {
    console.error('[Socket] 更新 token 并重建失败', e);
  }
}

// 防止重复创建 Socket 的全局标志
window.socketInitialized = true;
app.component(ElCollapseTransition.name, ElCollapseTransition)
app.use(router)
app.use(store)
app.use(autoAnimatePlugin)
app.use(VueParticles)
app.mount('#app')
