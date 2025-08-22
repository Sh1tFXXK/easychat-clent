<template>
  <div class="sidebar-groups">
    <!-- 使用 v-if 确保数据存在再渲染 -->
    <template v-if="groupList && groupList.length">
      <div
        v-for="group in groupList"
        :key="group.groupId"
        class="group-item"
        @click="handleGroupSelect(group)"
      >
        <span class="group-name">{{ group.groupName }}</span>
        <span class="member-count">{{ group.memberCount }}人</span>
      </div>
    </template>
    <!-- 添加空状态显示 -->
    <div v-else class="empty-state">
      <el-empty description="暂无群聊" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useStore } from "vuex";
import { ElEmpty } from "element-plus";

const store = useStore();
const emit = defineEmits(['openGroup', 'hideSidebar']); // 定义emit

// 使用computed确保响应性
const groupList = computed(() => store.state.groups.groupList || []);

// 组件挂载时获取群组列表
onMounted(async () => {
  try {
    await store.dispatch("groups/fetchGroupList");
  } catch (error) {
    console.error("Failed to fetch group list:", error);
  }
});

// 群组选择处理
const handleGroupSelect = (group) => {
  store.commit("groups/SET_CURRENT_GROUP", group);
  // 添加这一行，触发openGroup事件，传递群组信息
  emit('openGroup', { type: 'group', id: group.groupId });
};
</script>

<style scoped>
.sidebar-groups {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-item:hover {
  background-color: var(--el-fill-color-light);
}

.group-name {
  font-weight: 500;
}

.member-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
