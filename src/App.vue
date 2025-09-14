<template>
  <div id="app" v-if="isLoad">
    <PageTransition>
      <router-view />
    </PageTransition>
  </div>
</template>

<script>
import { nextTick, provide, ref, onMounted, getCurrentInstance } from "vue";
import PageTransition from "@/components/PageTransition.vue";

export default {
  name: "App",
  components: {
    PageTransition
  },
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
#app {
  height: 100vh;
  overflow: hidden;
}
</style>
