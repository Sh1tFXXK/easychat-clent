<template>
  <div>
    <div class="groups">
      <header>
        <div>
          <span>Groups</span>
          <ul>
            <li>
              <el-tooltip
                effect="light"
                content="新建群聊"
                placement="bottom"
                :offset="6"
                :show-arrow="false"
                :hide-after="100"
                :enterable="false"
              >
                <el-button type="primary" link @click="openCreateDialog">
                  <icon-mdi-comment-plus-outline style="font-size: 30px" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                effect="light"
                content="隐藏窗口"
                placement="bottom"
                :offset="6"
                :show-arrow="false"
                :hide-after="100"
                :enterable="false"
              >
                <el-button
                  type="primary"
                  link
                  @click="this.$emit('hideSidebar', -1)"
                >
                  <icon-mdi-minus style="font-size: 30px" />
                </el-button>
              </el-tooltip>
            </li>
          </ul>
        </div>
        <p>有群聊，不孤单。</p>
      </header>
      <form @submit.prevent>
        <el-autocomplete
          v-model="searchValue"
          :fetch-suggestions="search"
          :trigger-on-focus="false"
          :maxlength="11"
          size="large"
          placeholder="搜索"
          spellcheck="false"
          clearable
        >
          <template #prefix><icon-ep-search /></template>
        </el-autocomplete>
      </form>

      <el-skeleton v-if="loading" :rows="6" animated class="groups-empty" />

      <template v-else>
        <el-empty
          v-if="!groups.length"
          class="groups-empty"
          description="还没有群聊哦..."
        >
          <template #image><icon-mdi-forum-remove-outline /></template>
        </el-empty>

        <div v-else class="groups-scroll" :key="groups.length">
          <div class="group-list">
            <div v-for="g in filteredGroups" :key="g.groupId" class="group-item" @click="openGroupChat(g)">
              <div class="item-left">
                <el-avatar :size="40" :src="resolveAvatar(g.avatar)" icon="UserFilled" />
              </div>
              <div class="item-right">
                <div class="title">{{ g.groupName }}</div>
                <div class="desc">ID: {{ g.groupId }}</div>
              </div>
              <div class="item-actions" @click.stop>
                <el-button type="danger" link title="解散群" @click="confirmDeleteGroup(g)">
                  <icon-ep-delete style="font-size: 18px" />
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <el-dialog v-model="createDialog.visible" title="新建群聊" width="420px" :close-on-click-modal="false">
      <el-form label-width="90px" @submit.prevent>
        <el-form-item label="群名称">
          <el-input v-model="createDialog.groupName" maxlength="30" show-word-limit placeholder="请输入群名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="createDialog.submitting" @click="handleCreateGroup">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, inject, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { reqGetUserGroups, reqCreateGroup, reqDeleteGroup } from "@/api";

export default {
  name: "SidebarGroups",
  emits: ['update:showChat'],
  setup(props, { emit }) {
    const user = inject('user', { userId: '' });
    const searchValue = ref("");
    const groups = ref([]);
    const loading = ref(false);

    const createDialog = ref({ visible: false, groupName: '', submitting: false });

    const search = (queryString, callback) => {
      const q = (queryString || '').trim().toLowerCase();
      const list = groups.value.map(g => ({ value: g.groupName, group: g }))
        .filter(i => !q || i.value.toLowerCase().includes(q));
      callback(list);
    };

    const filteredGroups = computed(() => {
      const q = (searchValue.value || '').trim().toLowerCase();
      if (!q) return groups.value;
      return groups.value.filter(g => (g.groupName || '').toLowerCase().includes(q));
    });

    const resolveAvatar = (path) => {
      if (!path) return '';
      return path.startsWith('http') ? path : `https://wc-chat.oss-cn-beijing.aliyuncs.com${path}`;
    };

    const fetchGroups = async () => {
      if (!user?.userId) return;
      loading.value = true;
      try {
        const res = await reqGetUserGroups(user.userId.toString());
        if (res && res.success && Array.isArray(res.data)) {
          groups.value = res.data;
        } else {
          groups.value = [];
        }
      } catch (e) {
        groups.value = [];
        ElMessage.error('获取群聊失败');
      } finally {
        loading.value = false;
      }
    };

    const openCreateDialog = () => {
      createDialog.value.visible = true;
      createDialog.value.groupName = '';
    };

    const handleCreateGroup = async () => {
      if (!createDialog.value.groupName.trim()) {
        ElMessage.warning('请输入群名称');
        return;
      }
      createDialog.value.submitting = true;
      try {
        const payload = { groupName: createDialog.value.groupName.trim(), initialMembers: [] };
        const res = await reqCreateGroup(payload);
        if (res && res.success) {
          ElMessage.success('创建成功');
          createDialog.value.visible = false;
          await fetchGroups();
        } else {
          ElMessage.error(res?.message || '创建失败');
        }
      } catch (e) {
        ElMessage.error('创建失败');
      } finally {
        createDialog.value.submitting = false;
      }
    };

    const openGroupChat = (group) => {
      const sessionId = `group:${group.groupId}`;
      emit('update:showChat', sessionId);
    };

    const confirmDeleteGroup = (group) => {
      ElMessageBox.confirm(`确定要解散群 “${group.groupName}” 吗？此操作不可恢复。`, '提示', {
        type: 'warning',
        confirmButtonText: '解散',
        cancelButtonText: '取消',
      }).then(async () => {
        try {
          const res = await reqDeleteGroup(group.groupId);
          if (res && res.success) {
            ElMessage.success('群聊已解散');
            // 若当前正在查看该群，关闭聊天
            emit('update:showChat', '');
            await fetchGroups();
          } else {
            ElMessage.error(res?.message || '解散失败');
          }
        } catch (e) {
          ElMessage.error('解散失败');
        }
      }).catch(() => {});
    };

    onMounted(() => {
      fetchGroups();
    });

    // 监听 userId，就绪后自动拉取群列表（修复首次进入空白的问题）
    watch(() => user && user.userId, (val, oldVal) => {
      if (val && val !== oldVal) {
        fetchGroups();
      }
    }, { immediate: false });

    return {
      searchValue,
      search,
      groups,
      loading,
      filteredGroups,
      resolveAvatar,
      createDialog,
      openCreateDialog,
      handleCreateGroup,
      openGroupChat,
      confirmDeleteGroup,
    };
  },
};
</script>

<style scoped>
.groups {
  display: flex;
  width: 400px;
  flex-flow: column nowrap;
  flex: 1;
}
.groups header {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-end;
  height: 100px;
  padding: 0 30px 0 35px;
}
.groups header div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}
.groups header span {
  font-size: 32px;
  font-weight: 600;
  color: var(--theme-color-light-1);
}
.groups header p {
  color: var(--theme-color-light-2);
  margin: 0;
  padding-left: 2px;
}
.groups header ul {
  list-style: none;
  margin-bottom: 0;
}
.groups header ul li {
  display: inline-block;
}
.groups form {
  display: flex;
  flex-flow: column nowrap;
  padding: 24px 30px;
}
.groups-empty {
  height: 730px;
  justify-content: flex-start;
  padding-top: 150px;
}
.group-list {
  padding: 8px 8px 16px;
}
.groups-scroll { max-height: 730px; overflow: auto; }
.group-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
}
.item-left { margin-right: 12px; }
.title { font-weight: 600; }
.desc { font-size: 12px; color: var(--theme-color-light-2); }
.item-actions { margin-left: auto; }
</style>
