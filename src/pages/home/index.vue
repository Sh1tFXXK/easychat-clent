<template>
  <div class="home">
    <Menu v-model:menu="menu" @showProfile="showProfile = $event" />
    <div class="content">
      <div class="sidebar">
        <el-collapse-transition>
          <SidebarChats
            v-show="menu === 1"
            @openChat="openChatWindow"
            @hideSidebar="menu = $event"
            @showProfile="showProfile = $event"
          />
        </el-collapse-transition>
        <el-collapse-transition>
          <SidebarGroups
            v-if="menu === 2"
            :key="sidebarGroupsKey"
            @hideSidebar="menu = $event"
            @openGroup="openChatWindow"
            @groupCreated="sidebarGroupsKey++"
          />
        </el-collapse-transition>
        <el-collapse-transition>
          <SidebarFriends
            v-show="menu === 3"
            @openChat="openChatWindow"
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
        <Chat v-if="activeChat" :showChat="activeChat" @update:showChat="activeChat = $event" />
      </transition>
      <Empty v-if="!activeChat" />
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
import { getCookie } from "@/utils/cookie";
import Menu from "@/pages/home/menu";
import SidebarChats from "@/pages/home/sidebar-chats";
import SidebarGroups from "@/pages/home/sidebar-groups";
import SidebarFriends from "@/pages/home/sidebar-friends";
import SidebarFavorites from "@/pages/home/sidebar-favorites";
import SidebarCollections from "@/pages/home/sidebar-collections";
import Chat from "@/pages/home/chat";
// import GroupChat from "@/pages/home/group"; // No longer needed
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
    // GroupChat,
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
    const activeChat = ref(null); // { type: 'friend' | 'group', id: String }
    const showProfile = ref("");
    const sidebarGroupsKey = ref(0);

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
        console.log('[Home] 获取用户信息...');
        const userInfoResult = await store.dispatch("home/getUserInfo", user.userId);
        if (userInfoResult.success) {
          const userInfo = userInfoResult.data;
          user.avatar = userInfo.avatar.startsWith('http') ? userInfo.avatar : "https://wc-chat.oss-cn-beijing.aliyuncs.com" + userInfo.avatar;
          user.nickName = userInfo.nickName;
          socket.emit("online", user.userId, userInfo.status);
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

    // Watcher is no longer needed as openChatWindow handles all cases.

    const openChatWindow = (chat) => {
      // This function now handles both direct object from groups
      // and potentially strings from single chats if they are adapted to emit objects.
      if (typeof chat === 'object' && chat.type && chat.id) {
        activeChat.value = chat;
      } else if (typeof chat === 'string') { // Fallback for single chats
        activeChat.value = { type: 'friend', id: chat };
      }
    };

    provide("user", readonly(user));

    return {
      menu,
      activeChat,
      showProfile,
      sidebarGroupsKey,
      openChatWindow,
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
