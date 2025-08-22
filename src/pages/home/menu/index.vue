<template>
  <div class="menu">
    <ul>
      <li class="logo">
        <a @click="reload">
          <img src="/images/logo.svg" alt="EasyChat" />
        </a>
      </li>
      <li>
        <a :class="{ active: activeIndex === 1 }" @click="activeIndex = 1" title="聊天">
          <el-badge class="badge" is-dot :hidden="newMsgCount < 1">
            <icon-ep-chat-round />
          </el-badge>
        </a>
      </li>
      <li>
        <a :class="{ active: activeIndex === 2 }" @click="activeIndex = 2" title="聊天组">
          <icon-ep-connection />
        </a>
      </li>
      <li>
        <a :class="{ active: activeIndex === 3 }" @click="activeIndex = 3" title="好友">
          <el-badge class="badge" is-dot :hidden="true">
            <icon-ep-user />
          </el-badge>
        </a>
      </li>
      <li>
        <a :class="{ active: activeIndex === 4 }" @click="activeIndex = 4" title="特别关心">
          <icon-ep-star />
        </a>
      </li>
      <li class="space">
        <a :class="{ active: activeIndex === 5 }" @click="activeIndex = 5" title="收藏">
          <icon-ep-collection />
        </a>
      </li>
      <li>
        <el-dropdown>
          <a class="dropdown-link" title="小抽屉">
            <icon-ep-takeaway-box />
          </a>
          <template #dropdown>
            <el-dropdown-menu class="dropdown-box">
              <el-dropdown-item @click="showSearch = true">
                <icon-ep-search class="dropdown-icons" />搜一搜
              </el-dropdown-item>
              <el-dropdown-item @click="showCalendar = true">
                <icon-ep-calendar class="dropdown-icons" />日历
              </el-dropdown-item>
              <el-dropdown-item>
                <icon-ep-headset class="dropdown-icons" />听音乐
              </el-dropdown-item>
              <el-dropdown-item>
                <icon-ep-film class="dropdown-icons" />看电影
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </li>
      <li v-if="mode === 'light'">
        <a @click="mode = 'dark'" title="夜间模式"><icon-ep-moon /></a>
      </li>
      <li v-if="mode === 'dark'">
        <a @click="mode = 'light'" title="日间模式"><icon-ep-sunny /></a>
      </li>
      <li>
        <el-dropdown>
          <a class="dropdown-link" title="我">
            <el-avatar :src="user.avatar" size="large" @error="() => true">
              <img
                src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png"
              />
            </el-avatar>
          </a>
          <template #dropdown>
            <el-dropdown-menu class="dropdown-user">
              <el-dropdown-item @click="$emit('showProfile', user.userId)">
                <icon-ep-user class="dropdown-icons" />个人资料
              </el-dropdown-item>
              <el-dropdown-item @click="showProfileEdit = true">
                <icon-ep-edit class="dropdown-icons" />修改信息
              </el-dropdown-item>
              <el-dropdown-item @click="showSettings = true">
                <icon-ep-setting class="dropdown-icons" />设置
              </el-dropdown-item>
              <el-dropdown-item divided @click="logout">
                <icon-ep-switch-button class="dropdown-icons divided" />
                <span class="text-danger">退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </li>
    </ul>
    <Search v-model:show="showSearch" />
    <Calendar v-model:show="showCalendar" />

    <ProfileEdit v-model:show="showProfileEdit" />
    <Settings v-model:show="showSettings" />
  </div>
</template>

<script>
import { getCurrentInstance, inject, ref, toRefs, watch } from "vue";
import { useRouter } from "vue-router";
import { useColorMode } from "@vueuse/core";
import { ElMessage, ElMessageBox } from "element-plus";
import { reqLogout } from "@/api";
import { setCookie } from "@/utils/cookie";
import ProfileEdit from "@/pages/home/menu/profile-edit";
import Settings from "@/pages/home/menu/settings";
import Search from "@/pages/home/menu/search";
import Calendar from "@/pages/home/menu/calendar";

export default {
  name: "Menu",
  components: {
    ProfileEdit,
    Settings,
    Search,
    Calendar,
  },
  props: {
    menu: Number,
  },
  emits: ["update:menu", "showProfile"],
  setup(props, { emit }) {
    const socket =
      getCurrentInstance().appContext.config.globalProperties.socket;
    const user = inject("user");
    const reload = inject("reload");
    const router = useRouter();
    const mode = useColorMode();

    const { menu } = toRefs(props);
    const activeIndex = ref(1);
    const newMsgCount = ref(0);
    const showProfileEdit = ref(false);
    const showSettings = ref(false);
    const showSearch = ref(false);
    const showCalendar = ref(false);
    const logout = () => {
      ElMessageBox.confirm("您确定退出吗？", "", {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        beforeClose: async (action, instance, done) => {
          if (action === "confirm") {
            instance.confirmButtonLoading = true;
            instance.confirmButtonText = "正在退出...";
            instance.confirmButtonDisabled = true;
            let result = await reqLogout();
            if (!result.success) {
              setCookie("uid", "", 0);
            }
            socket.emit("offline", user.userId);
            done();
          } else {
            done();
          }
        },
      })
        .then(() => {
          router.push({ name: "login" });
          ElMessage.success("已退出");
        })
        .catch(() => {});
    };

    watch(activeIndex, () => {
      emit("update:menu", activeIndex.value);
    });
    watch(menu, () => {
      activeIndex.value = menu.value;
    });

    socket.on("receiveMsg", (message) => {
      console.log('收到新消息：', message);
      // 后续处理逻辑
    });

    // 移除在菜单中直接提交在线用户列表的逻辑，改由 Home 统一处理

    return {
      user,
      reload,
      mode,
      activeIndex,
      newMsgCount,
      showProfileEdit,
      showSettings,
      showSearch,
      showCalendar,
      logout,
    };
  },
};
</script>

<style scoped>
.menu {
  width: 150px;
  border-right: 1px solid var(--border-color);
}
.menu ul {
  display: flex;
  height: 100vh;
  flex-flow: column nowrap;
  align-items: center;
  list-style: none;
  margin: 0;
  padding-left: 0;
}
.menu li:not(.logo) {
  margin: 10px 20px;
}
.menu li a {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  padding: 15px 20px;
  cursor: pointer;
  position: relative;
  text-decoration: none;
  transition: all 0.3s;
}
.menu li a:hover {
  color: var(--theme-color-light-1);
}
.menu li a.active {
  background-color: var(--theme-color-light-4);
  color: var(--theme-color-light-1);
}
.menu li:not(.logo) a {
  border-radius: 7px;
}
.menu li .badge {
  height: 24px;
}
.menu li .badge:deep(.el-badge__content.is-dot) {
  height: 10px;
  width: 10px;
  right: 0;
}
.logo {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100px;
  height: 100px;
}
.logo img {
  position: relative;
  width: 50px;
  height: 50px;
  border-style: none;
}
.space {
  flex: 1;
}
.dropdown-box {
  width: 120px;
}
.dropdown-user {
  width: 150px;
}
.dropdown-icons {
  margin-right: 8px;
}
.dropdown-icons.divided {
  margin-top: 2px;
}
.text-danger {
  display: flex;
  color: var(--color-danger);
}
</style>
