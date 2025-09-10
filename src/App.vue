<template>
  <router-view v-if="isLoad"></router-view>
</template>

<script>
import { nextTick, provide, ref, onMounted, getCurrentInstance } from "vue";

export default {
  name: "App",
  setup() {
    const isLoad = ref(true);
    const socket = getCurrentInstance().appContext.config.globalProperties.socket;

    const reload = () => {
      isLoad.value = false;
      nextTick(() => {
        isLoad.value = true;
      });
    };

    provide("reload", reload);

    // 移除自动 connect，连接由 main.js 持有并按 token 控制

    return {
      isLoad,
    };
  },
};
</script>

<style scoped>
</style>
