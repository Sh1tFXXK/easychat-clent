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
                <el-avatar 
                  :size="56" 
                  :src="resolveAvatar(g.avatar || g.groupAvatar)" 
                  :icon="UserFilled"
                  style="background-color: var(--theme-color-light-3);"
                >
                  <span style="font-size: 20px; color: var(--theme-color-light-1);">群</span>
                </el-avatar>
              </div>
              <div class="item-right">
                <div class="item-header">
                  <div class="title">{{ g.groupName || g.name || '未命名群聊' }}</div>
                  <div class="time">{{ formatTime(g.lastMessageTime || g.createTime) }}</div>
                </div>
                <div class="desc">
                  {{ g.lastMessage || (g.memberCount ? `${g.memberCount}位成员` : '群聊') }}
                </div>
              </div>
              <div class="item-actions" @click.stop>
                <el-button v-if="isOwner(g)" type="danger" link title="解散群" @click="confirmDeleteGroup(g)">
                  <icon-ep-delete style="font-size: 18px" />
                </el-button>
                <el-button type="primary" link title="邀请成员" @click="openInviteDialog(g)">
                  <icon-ep-user style="font-size: 18px" />
                </el-button>
                <el-button type="warning" link title="移除成员" @click="openRemoveDialog(g)">
                  <icon-ep-remove style="font-size: 18px" />
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

  <el-dialog v-model="inviteDialog.visible" title="邀请成员" width="420px" :close-on-click-modal="false">
    <el-form label-width="100px" @submit.prevent>
      <el-form-item label="选择昵称">
        <el-select
          v-model="inviteDialog.selectedUserIds"
          multiple
          filterable
          remote
          :remote-method="remoteSearchUsersForInvite"
          :loading="inviteDialog.loading"
          placeholder="搜索昵称/用户名选择成员"
          style="width: 100%"
        >
          <el-option v-for="opt in inviteDialog.options" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="inviteDialog.visible = false">取消</el-button>
      <el-button type="primary" :loading="inviteDialog.submitting" @click="submitInvite">邀请</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="removeDialog.visible" title="移除成员" width="420px" :close-on-click-modal="false">
    <el-form label-width="100px" @submit.prevent>
      <el-form-item label="选择昵称">
        <el-select
          v-model="removeDialog.selectedUserId"
          filterable
          remote
          :remote-method="remoteSearchUsersForRemove"
          :loading="removeDialog.loading"
          placeholder="搜索昵称/用户名选择成员"
          style="width: 100%"
        >
          <el-option v-for="opt in removeDialog.options" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="removeDialog.visible = false">取消</el-button>
      <el-button type="warning" :loading="removeDialog.submitting" @click="submitRemove">移除</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed, onMounted, inject, watch } from "vue";
import { useStore } from 'vuex';
import { ElMessage, ElMessageBox } from "element-plus";
import { UserFilled } from '@element-plus/icons-vue';
import { reqGetUserGroups, reqCreateGroup, reqDeleteGroup, reqInviteGroupMembers, reqRemoveGroupMember, reqSearchUsers } from "@/api";

export default {
  name: "SidebarGroups",
  emits: ['update:showChat'],
  setup(props, { emit }) {
    const store = useStore();
    const user = inject('user', { userId: '' });
    const searchValue = ref("");
    const groups = computed(() => store.state.home.groupList);
    const loading = ref(false);

    const createDialog = ref({ visible: false, groupName: '', submitting: false });
    const inviteDialog = ref({ visible: false, submitting: false, groupId: '', selectedUserIds: [], options: [], loading: false });
    const removeDialog = ref({ visible: false, submitting: false, groupId: '', selectedUserId: '', options: [], loading: false });

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

    const formatTime = (timeStr) => {
      if (!timeStr) return '';
      try {
        const date = new Date(timeStr);
        const now = new Date();
        const diff = now - date;
        
        // 今天
        if (diff < 24 * 60 * 60 * 1000 && now.getDate() === date.getDate()) {
          return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
        // 昨天
        else if (diff < 48 * 60 * 60 * 1000) {
          return '昨天';
        }
        // 本周
        else if (diff < 7 * 24 * 60 * 60 * 1000) {
          const days = ['日', '一', '二', '三', '四', '五', '六'];
          return '周' + days[date.getDay()];
        }
        // 更早
        else {
          return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        }
      } catch (e) {
        return '';
      }
    };

    const fetchGroups = async () => {
      if (!user?.userId) return;
      loading.value = true;
      try {
        await store.dispatch('home/getGroupList', user.userId);
      } catch (e) {
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

    const isOwner = (group) => {
      const uid = user && user.userId ? String(user.userId) : '';
      const oid = group && group.ownerId ? String(group.ownerId) : '';
      return uid !== '' && uid === oid;
    };

    const confirmDeleteGroup = (group) => {
      if (String(user?.userId) !== String(group.ownerId)) {
        ElMessage.warning('仅群主可解散该群');
        return;
      }
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

    const openInviteDialog = (group) => {
      inviteDialog.value.visible = true;
      inviteDialog.value.groupId = group.groupId;
      inviteDialog.value.selectedUserIds = [];
      inviteDialog.value.options = [];
    };
    const remoteSearchUsersForInvite = async (query) => {
      const q = (query || '').trim();
      if (!q) { inviteDialog.value.options = []; return; }
      inviteDialog.value.loading = true;
      try {
        const res = await reqSearchUsers({ username: q });
        if (res?.success && res.data) {
          const arr = Array.isArray(res.data) ? res.data : [res.data];
          inviteDialog.value.options = arr.map(u => ({ value: u.id, label: u.nickName || u.username }));
        } else {
          inviteDialog.value.options = [];
        }
      } catch (e) {
        inviteDialog.value.options = [];
      } finally {
        inviteDialog.value.loading = false;
      }
    };
    const submitInvite = async () => {
      if (!inviteDialog.value.groupId) return;
      const ids = inviteDialog.value.selectedUserIds || [];
      if (!ids.length) { ElMessage.warning('请选择要邀请的用户'); return; }
      inviteDialog.value.submitting = true;
      try {
        const res = await reqInviteGroupMembers(inviteDialog.value.groupId, ids);
        if (res && res.success) {
          ElMessage.success('邀请成功');
          inviteDialog.value.visible = false;
        } else {
          ElMessage.error(res?.message || '邀请失败');
        }
      } catch (e) {
        ElMessage.error('邀请失败');
      } finally {
        inviteDialog.value.submitting = false;
      }
    };

    const openRemoveDialog = (group) => {
      removeDialog.value.visible = true;
      removeDialog.value.groupId = group.groupId;
      removeDialog.value.selectedUserId = '';
      removeDialog.value.options = [];
    };
    const remoteSearchUsersForRemove = async (query) => {
      const q = (query || '').trim();
      if (!q) { removeDialog.value.options = []; return; }
      removeDialog.value.loading = true;
      try {
        const res = await reqSearchUsers({ username: q });
        if (res?.success && res.data) {
          const arr = Array.isArray(res.data) ? res.data : [res.data];
          removeDialog.value.options = arr.map(u => ({ value: u.id, label: u.nickName || u.username }));
        } else {
          removeDialog.value.options = [];
        }
      } catch (e) {
        removeDialog.value.options = [];
      } finally {
        removeDialog.value.loading = false;
      }
    };
    const submitRemove = async () => {
      if (!removeDialog.value.groupId) return;
      const uid = removeDialog.value.selectedUserId;
      if (!uid) { ElMessage.warning('请选择要移除的用户'); return; }
      removeDialog.value.submitting = true;
      try {
        const res = await reqRemoveGroupMember(removeDialog.value.groupId, uid);
        if (res && res.success) {
          ElMessage.success('移除成功');
          removeDialog.value.visible = false;
        } else {
          ElMessage.error(res?.message || '移除失败');
        }
      } catch (e) {
        ElMessage.error('移除失败');
      } finally {
        removeDialog.value.submitting = false;
      }
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
      user,
      searchValue,
      search,
      groups,
      loading,
      filteredGroups,
      resolveAvatar,
      formatTime,
      UserFilled,
      createDialog,
      openCreateDialog,
      handleCreateGroup,
      openGroupChat,
      confirmDeleteGroup,
      inviteDialog,
      openInviteDialog,
      submitInvite,
      removeDialog,
      openRemoveDialog,
      submitRemove,
      isOwner,
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
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.2s;
}
.group-item:hover {
  background-color: var(--theme-color-light-4);
}
.item-left { 
  margin-right: 12px; 
  flex-shrink: 0;
}
.item-right {
  flex: 1;
  min-width: 0;
}
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.title { 
  font-weight: 600; 
  font-size: 16px;
  color: var(--text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}
.time {
  font-size: 12px;
  color: var(--text-color-secondary);
  flex-shrink: 0;
}
.desc { 
  font-size: 13px; 
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-actions { 
  margin-left: auto; 
  flex-shrink: 0;
}
</style>
