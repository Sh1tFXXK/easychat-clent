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

    onMounted(() => {
      if (socket) {
        socket.connect();
      }
    });

    return {
      isLoad,
    };
  },
};
</script>

<style scoped>
</style>
