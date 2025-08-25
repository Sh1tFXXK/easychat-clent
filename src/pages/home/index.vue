<template>
  <div class="home">
    <Menu v-model:menu="menu" @showProfile="showProfile = $event" />
    <div class="content">
      <div class="sidebar">
        <el-collapse-transition>
          <SidebarChats
            v-show="menu === 1"
            v-model:showChat="showChat"
            @hideSidebar="menu = $event"
            @showProfile="showProfile = $event"
          />
        </el-collapse-transition>
        <el-collapse-transition>
          <SidebarGroups
            v-show="menu === 2"
            @hideSidebar="menu = $event"
          />
        </el-collapse-transition>
        <el-collapse-transition>
          <SidebarFriends
            v-show="menu === 3"
            v-model:showChat="showChat"
            @hideSidebar="menu = $event"
            @showProfile="showProfile = $event"
          />
        </el-collapse-transition>
        <el-collapse-transition>
          <SidebarFavorites
            v-show="menu === 4"
            @hideSidebar="menu = $event"
          />
        </el-collapse-transition>
        <el-collapse-transition>
          <SidebarCollections
            v-show="menu === 5"
            @hideSidebar="menu = $event"
          />
        </el-collapse-transition>
      </div>
      <transition name="el-zoom-in-center">
        <Chat v-show="showChat" v-model:showChat="showChat" />
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
  provide,
  reactive,
  readonly,
  ref,
  watch,
} from "vue";
import { useStore } from "vuex";
import { mockGetUserInfo, reqGetUserInfo } from "@/api";
import { getCookie } from "@/utils/cookie";
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

    onMounted(async () => {
      console.log('[Home] 开始初始化...');
      console.log('[Home] Store状态:', store.state);
      console.log('[Home] Store home模块:', store.state.home);
      
      user.userId = getCookie("uid");
      console.log('[Home] 用户ID:', user.userId);
      
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
              socket.connect();
            }
          });
        } catch (error) {
          console.log('[Home] Socket连接失败，继续执行...');
        }
      }
      
      try {
        // let result = await mockGetUserInfo();
        console.log('[Home] 获取用户信息...');
        let result = await reqGetUserInfo({ id: user.userId.toString() });
        console.log('[Home] 用户信息结果:', result);
        if (result.success) {
          user.avatar = result.data.avatar.startsWith('http') ? result.data.avatar : "https://wc-chat.oss-cn-beijing.aliyuncs.com" + result.data.avatar;
          user.nickName = result.data.nickName;
          socket.emit("online", user.userId, result.data.status);
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
        
        socket.on("onlineUsers", (onlineUsers) => {
          if (Array.isArray(onlineUsers)) {
            store.commit("home/ONLINEUSERS", onlineUsers);
          } else {
            store.commit("home/ONLINEUSERS", Object.keys(onlineUsers));
          }
        });
        
        console.log('[Home] 初始化完成');
      } catch (error) {
        console.error('[Home] 初始化失败:', error);
        // 如果API请求失败，显示错误信息
        console.log('[Home] API请求失败，请检查后端服务是否正常运行');
      }
    });

    watch(showChat, () => {
      if (showChat.value !== "") {
        showEmpty.value = false;
      }
      if (showChat.value === "") {
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
}
</style>
