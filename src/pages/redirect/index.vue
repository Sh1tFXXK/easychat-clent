<template>
  <div class="redirect-page">
    <div class="loading">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <p>页面重定向中...</p>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'

export default {
  name: 'Redirect',
  components: {
    Loading
  },
  setup() {
    const route = useRoute()
    const router = useRouter()

    onMounted(() => {
      const { params } = route
      const { path } = params
      router.replace('/' + path)
    })

    return {}
  }
}
</script>

<style scoped>
.redirect-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--bg-color);
}

.loading {
  text-align: center;
  color: var(--text-color-primary);
}

.loading .el-icon {
  font-size: 32px;
  margin-bottom: 16px;
}

.loading p {
  font-size: 16px;
  margin: 0;
}
</style>