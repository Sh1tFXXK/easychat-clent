<template>
  <div class="home">
    <Menu v-model:menu="menu" @showProfile="showProfile = $event" @toggleSidebar="handleToggleSidebar" />
    <div class="content">
      <div class="sidebar">
        <SidebarChats
          v-if="menu === 1"
          v-model:showChat="showChat"
          @hideSidebar="handleHideSidebar"
          @showProfile="showProfile = $event"
        />
        <SidebarGroups
          v-if="menu === 2"
          v-model:showChat="showChat"
          @hideSidebar="handleHideSidebar"
        />
        <SidebarFriends
          v-if="menu === 3"
          v-model:showChat="showChat"
          @hideSidebar="handleHideSidebar"
          @showProfile="showProfile = $event"
        />
        <SidebarFavorites
          v-if="menu === 4"
          @hideSidebar="handleHideSidebar"
        />
        <SidebarCollections
          v-if="menu === 5"
          @hideSidebar="handleHideSidebar"
        />
      </div>
      <transition name="el-zoom-in-center">
        <Chat v-show="showChat" v-model:showChat="showChat" @showSidebar="handleShowSidebar" />
      </transition>
      <Empty v-show="showEmpty" />
      <Profile v-model:show="showProfile" />
    </div>
  </div>
</template>

<script>
import {
  getCurrentInstance,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  readonly,
  ref,
  watch,
} from "vue";
import { useStore } from "vuex";
import { mockGetUserInfo, reqGetUserInfo } from "@/api";
import { getCookie, setCookie } from "@/utils/cookie";
import NavigationHelper from "@/utils/navigation";
import Menu from "@/pages/home/menu";
import SidebarChats from "@/pages/home/sidebar-chats";
import SidebarGroups from "@/pages/home/sidebar-groups";
import SidebarFriends from "@/pages/home/sidebar-friends";
import SidebarFavorites from "@/pages/home/sidebar-favorites";
import SidebarCollections from "@/pages/home/sidebar-collections";
import Chat from "@/pages/home/chat";
import Empty from "@/pages/home/empty";
import Profile from "@/pages/home/profile";

export default {
  name: "Home",
  components: {
    Menu,
    SidebarChats,
    SidebarGroups,
    SidebarFriends,
    SidebarFavorites,
    SidebarCollections,
    Chat,
    Empty,
    Profile,
  },
  setup() {
    const socket =
      getCurrentInstance().appContext.config.globalProperties.socket;
    const store = useStore();
    const user = reactive({
      userId: "",
      avatar: "",
      nickName: "",
    });

    const menu = ref(1);
    const showChat = ref("");
    const showEmpty = ref(true);
    const showProfile = ref("");
    const lastActiveMenu = ref(1); // 记录隐藏前的菜单状态

    // 处理sidebar隐藏事件
    const handleHideSidebar = (value) => {
      console.log('[Home] 处理hideSidebar事件，接收值:', value, '当前menu:', menu.value);
      try {
        if (value === -1) {
          // 记录当前菜单状态，以便后续恢复
          lastActiveMenu.value = menu.value;
          // 隐藏当前sidebar，进入聊天全屏模式
          // 如果当前有聊天窗口打开，保持聊天显示，否则显示空白页面
          if (!showChat.value) {
            showEmpty.value = true;
          }
          // 通过CSS隐藏sidebar
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) {
            sidebar.style.display = 'none';
          }
          console.log('[Home] 隐藏sidebar，进入全屏聊天模式，记录当前菜单:', lastActiveMenu.value);
        } else if (value >= 1 && value <= 5) {
          // 显示sidebar并切换到指定的sidebar
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) {
            sidebar.style.display = 'block';
          }
          menu.value = value;
          console.log('[Home] 显示sidebar并切换到:', value);
        } else {
          console.warn('[Home] 无效的sidebar值:', value, '使用默认值1');
          menu.value = 1; // 降级方案：切换到聊天列表
        }
      } catch (error) {
        console.error('[Home] 处理hideSidebar事件时发生错误:', error);
        // 降级方案：重置到默认状态
        menu.value = 1;
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.style.display = 'block';
        }
      }
    };

    // 处理显示sidebar事件
    const handleShowSidebar = (value) => {
      console.log('[Home] 处理showSidebar事件，接收值:', value, '上次活跃菜单:', lastActiveMenu.value);
      try {
        // 显示sidebar并切换到指定的sidebar
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.style.display = 'block';
        }
        // 如果没有指定值，恢复到上次活跃的菜单
        menu.value = value || lastActiveMenu.value || 1;
        console.log('[Home] 显示sidebar并切换到:', menu.value);
      } catch (error) {
        console.error('[Home] 处理showSidebar事件时发生错误:', error);
        // 降级方案：重置到默认状态
        menu.value = lastActiveMenu.value || 1;
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.style.display = 'block';
        }
      }
    };

    // 处理切换sidebar事件（用于全屏聊天模式下的切换）
    const handleToggleSidebar = (menuIndex) => {
      console.log('[Home] 处理toggleSidebar事件，菜单索引:', menuIndex);
      try {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          const isHidden = sidebar.style.display === 'none';
          if (isHidden) {
            // 如果侧边栏隐藏，显示它并切换到指定菜单
            sidebar.style.display = 'block';
            menu.value = menuIndex;
            console.log('[Home] 显示侧边栏并切换到菜单:', menuIndex);
          } else {
            // 如果侧边栏显示，隐藏它
            sidebar.style.display = 'none';
            console.log('[Home] 隐藏侧边栏');
          }
        }
      } catch (error) {
        console.error('[Home] 处理toggleSidebar事件时发生错误:', error);
      }
    };

    // 添加menu变化的监听，用于调试
    watch(menu, (newVal, oldVal) => {
      console.log('[Home] menu值变化:', oldVal, '->', newVal);
    });

    // 监听全局事件
    const setupGlobalEventListeners = () => {
      // 监听侧边栏切换事件
      window.addEventListener('switchSidebar', (event) => {
        const { menuValue } = event.detail;
        menu.value = menuValue;
        console.log('[Home] 收到切换侧边栏事件:', menuValue);
      });

      // 监听打开聊天事件
      window.addEventListener('openChat', (event) => {
        const { chatId, chatType } = event.detail;
        showChat.value = chatId;
        console.log('[Home] 收到打开聊天事件:', chatId, chatType);
      });

      // 监听显示用户资料事件
      window.addEventListener('showProfile', (event) => {
        const { userId } = event.detail;
        showProfile.value = userId;
        console.log('[Home] 收到显示用户资料事件:', userId);
      });
    };

    onMounted(async () => {
      console.log('[Home] 开始初始化...');
      console.log('[Home] 初始menu值:', menu.value);
      console.log('[Home] Store状态:', store.state);
      console.log('[Home] Store home模块:', store.state.home);
      
      // 设置全局事件监听器
      setupGlobalEventListeners();
      
      // 如果本地有有效 token，但当前 socket 未携带，主动更新并重连
      try {
        const readToken = () => {
          try {
            let t = localStorage.getItem('token');
            if (!t) {
              const m = document.cookie.match(new RegExp('(^| )' + 'token' + '=([^;]+)'));
              t = m ? decodeURIComponent(m[2]) : null;
            }
            if (t && t.startsWith('Bearer ')) t = t.substring(7);
            return t;
          } catch (e) { return null; }
        };
        const isJwtExpired = (token) => {
          if (!token) return true;
          const parts = token.split('.');
          if (parts.length !== 3) return true;
          try {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const now = Math.floor(Date.now() / 1000);
            return typeof payload.exp === 'number' ? (payload.exp - 30) <= now : true;
          } catch { return true; }
        };
        const tk = readToken();
        if (tk && !isJwtExpired(tk)) {
          // 检查是否需要更新 Socket token
          const currentQuery = socket?.io?.opts?.query?.token || '';
          if (!currentQuery || currentQuery === '') {
            console.log('[Home] 发现有效 token，但当前连接未携带，尝试更新并重连');
            if (typeof window.updateSocketToken === 'function') {
              window.updateSocketToken(tk);
            }
          }
        }
      } catch (e) { }

      user.userId = getCookie("uid");
      console.log('[Home] 从cookie获取用户ID:', user.userId);
      
      // 如果cookie中没有uid，尝试从token中解析
      if (!user.userId) {
        try {
          const token = readToken();
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            user.userId = payload.sub;
            console.log('[Home] 从token解析用户ID:', user.userId);
            // 设置cookie以备后用
            setCookie("uid", user.userId, 7 * 24 * 3600);
          }
        } catch (e) {
          console.error('[Home] 从token解析用户ID失败:', e);
        }
      }
      
      console.log('[Home] 最终用户ID:', user.userId);
      // 等待 token 可用（最多等待5秒）
      try {
        const waitForTokenReady = () => new Promise((resolve) => {
          const start = Date.now();
          const timer = setInterval(() => {
            const tk = localStorage.getItem('token');
            const ready = (() => {
              if (!tk) return false;
              const parts = tk.split('.');
              if (parts.length !== 3) return false;
              try {
                const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                const now = Math.floor(Date.now() / 1000);
                return typeof payload.exp === 'number' ? (payload.exp - 30) > now : false;
              } catch { return false; }
            })();
            if (ready || (Date.now() - start) > 5000) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
        await waitForTokenReady();
      } catch (e) {}
      
      // 确保socket连接已建立，添加超时处理
      if (!socket.connected) {
        console.log('[Home] 等待socket连接...');
        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              console.log('[Home] Socket连接超时，继续执行...');
              resolve();
            }, 5000); // 5秒超时
            
            if (socket.connected) {
              clearTimeout(timeout);
              resolve();
            } else {
              socket.on('connect', () => {
                clearTimeout(timeout);
                resolve();
              });
              // 移除手动连接，让 main.js 统一管理连接
              // socket.connect();
            }
          });
        } catch (error) {
          console.log('[Home] Socket连接失败，继续执行...');
        }
      }
      
      try {
        // let result = await mockGetUserInfo();
        console.log('[Home] 获取用户信息...');
        console.log('[Home] 当前 token 状态:', localStorage.getItem('token') ? '存在' : '不存在');
        console.log('[Home] 当前 uid:', user.userId);
        let result = await reqGetUserInfo({ id: user.userId.toString() });
        console.log('[Home] 用户信息结果:', result);
        if (result.success) {
          user.avatar = result.data.avatar.startsWith('http') ? result.data.avatar : "https://wc-chat.oss-cn-beijing.aliyuncs.com" + result.data.avatar;
          user.nickName = result.data.nickName;
          console.log('[Home] 准备发送上线事件:', user.userId, result.data.status);
          console.log('[Home] user.userId 类型:', typeof user.userId, '值:', user.userId);
          console.log('[Home] 即将发送的参数:', [user.userId, result.data.status]);
          socket.emit("online", user.userId, result.data.status);
          console.log('[Home] 上线事件已发送，参数:', user.userId, result.data.status);
        } else {
          console.error('[Home] 获取用户信息失败，无法发送上线事件:', result);
        }
        
        console.log('[Home] 获取聊天列表...');
        try {
          await store.dispatch("home/getChatList", user.userId);
          console.log('[Home] 聊天列表获取成功:', store.state.home.chatList);
        } catch (error) {
          console.error('[Home] 聊天列表获取失败:', error);
        }
        
        console.log('[Home] 获取好友列表...');
        try {
          await store.dispatch("home/getFriendList", user.userId);
          console.log('[Home] 好友列表获取成功:', store.state.home.friendList);
        } catch (error) {
          console.error('[Home] 好友列表获取失败:', error);
        }
        
        console.log('[Home] 获取好友验证...');
        try {
          await store.dispatch("home/getFriendVerify", user.userId);
          console.log('[Home] 好友验证获取成功:', store.state.home.friendVerifyList);
        } catch (error) {
          console.error('[Home] 好友验证获取失败:', error);
        }
        
        console.log('[Home] 获取群聊列表...');
        try {
          await store.dispatch("home/getGroupList", user.userId);
          console.log('[Home] 群聊列表获取成功:', store.state.home.groupList);
        } catch (error) {
          console.error('[Home] 群聊列表获取失败:', error);
        }
        
        // 注册socket事件监听器
        const handleOnlineUsers = (onlineUsers) => {
          if (Array.isArray(onlineUsers)) {
            store.commit("home/ONLINEUSERS", onlineUsers);
          } else {
            store.commit("home/ONLINEUSERS", Object.keys(onlineUsers));
          }
        };
        
        socket.on("onlineUsers", handleOnlineUsers);
        
        console.log('[Home] 初始化完成');
        
        // 清理函数，在组件卸载时移除事件监听器
        onUnmounted(() => {
          console.log('[Home] 组件卸载，清理事件监听器');
          if (socket) {
            socket.off("onlineUsers", handleOnlineUsers);
          }
        });
      } catch (error) {
        console.error('[Home] 初始化失败:', error);
        // 如果API请求失败，显示错误信息
        console.log('[Home] API请求失败，请检查后端服务是否正常运行');
      }
    });

    watch(showChat, (newVal, oldVal) => {
      console.log('[Home] showChat变化:', oldVal, '->', newVal);
      if (showChat.value !== "") {
        showEmpty.value = false;
      }
      if (showChat.value === "") {
        // 当聊天窗口关闭时，恢复侧边栏显示
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.style.display === 'none') {
          console.log('[Home] 聊天窗口关闭，恢复侧边栏显示');
          sidebar.style.display = 'block';
        }
        setTimeout(() => {
          showEmpty.value = true;
        }, 400);
      }
    });

    provide("user", readonly(user));

    return {
      menu,
      showChat,
      showEmpty,
      showProfile,
      handleHideSidebar,
      handleShowSidebar,
      handleToggleSidebar,
    };
  },
};
</script>

<style scoped>
.home {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.content {
  display: flex;
  flex: 1;
}
.sidebar {
  max-width: 400px;
  border-right: 1px solid var(--border-color);
  transition: all 0.3s ease;
}
.sidebar.hidden {
  display: none !important;
}
</style>