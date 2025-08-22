<template>
  <div class="chat">
    <header>
      <div class="header-user">
        <figure>
          <el-avatar :size="45" shape="square" @error="() => true" @click="showInfo = true" style="cursor: pointer;">
            <img src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png" />
          </el-avatar>
        </figure>
        <div>
          <p>{{ groupInfo.groupName || `群 ${groupInfo.groupId}` }}</p>
          <small class="info">
            <icon-mdi-circle style="font-size: 12px" />
            <span>群聊中</span>
          </small>
        </div>
      </div>
      <div class="header-action">
        <el-button type="danger" size="large" text title="关闭窗口" @click="emit('update:showGroup', '')">
          <icon-ep-close style="font-size: 26px" />
        </el-button>
      </div>
    </header>

    <el-scrollbar>
      <div class="chat-body">
        <div class="messages" v-if="messages.length > 0">
          <div class="message-item" v-for="m in messages" :key="m.id">
            <div class="message">
              <div class="header">
                <div>
                  <span>{{ m.senderName }}</span>
                  <small>{{ m.createTime }}</small>
                </div>
              </div>
              <div class="content">{{ m.content }}</div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无群消息" />
      </div>
    </el-scrollbar>

    <footer>
      <div class="input-area">
        <el-input
          type="textarea"
          v-model="inputValue"
          :autosize="{ minRows: 1, maxRows: 6 }"
          resize="none"
          spellcheck="false"
          disabled
          placeholder="群聊发送功能稍后接入"
        />
        <div class="buttons">
          <button class="send" type="button" title="发送" disabled>
            <icon-ep-promotion style="font-size: 24px" />
          </button>
        </div>
      </div>
    </footer>
  </div>
  
  <!-- 群资料侧边栏 -->
  <el-drawer v-model="showInfo" title="Group Info" direction="rtl" size="380px">
    <div class="group-info">
      <div class="group-cover">
        <el-image :src="groupAvatar" fit="cover" style="width: 100%; height: 200px; border-radius: 8px;" />
      </div>
      <div class="group-meta">
        <div class="name">{{ groupInfo.groupName || `群 ${groupInfo.groupId}` }}</div>
        <div class="sub">共 {{ memberItems.length }} 位成员</div>
      </div>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="Members" name="members">
          <el-empty v-if="memberItems.length === 0" description="暂无成员信息" />
          <div v-else class="member-list">
            <div class="member-item" v-for="m in memberItems" :key="m.userId">
              <el-avatar :src="m.avatar" size="small" @error="() => true"><img src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png" /></el-avatar>
              <span class="name">{{ m.name || m.userId }}</span>
              <span class="role" v-if="m.role">{{ m.role }}</span>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="Media" name="media">
          <el-empty v-if="groupMedias.length === 0" description="暂无图片" />
        </el-tab-pane>
        <el-tab-pane label="Files" name="files">
          <el-empty v-if="groupFiles.length === 0" description="暂无文件" />
        </el-tab-pane>
        <el-tab-pane label="Links" name="links">
          <el-empty v-if="groupLinks.length === 0" description="暂无链接" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
  
</template>

<script setup>
import { computed, reactive, ref, toRefs, watch } from 'vue'
import { useStore } from 'vuex'

const props = defineProps({ showGroup: String })
const emit = defineEmits(['update:showGroup'])
const { showGroup } = toRefs(props)

const store = useStore()
const groupList = computed(() => (store.getters['groups/groupList'] || []))

const groupInfo = reactive({ groupId: '', groupName: '' })
const messages = ref([])
const inputValue = ref('')
const showInfo = ref(false)
const activeTab = ref('members')

const groupAvatar = computed(() => {
  // 先用默认占位图，后续可接后端字段 avatar
  return '/images/wechat/wechat1.png'
})

// 成员展示：优先使用 groupList 中的 group.members，否则为空
const friendList = computed(() => (store.state.home.friendList || []))
const memberItems = computed(() => {
  const g = groupList.value.find(x => String(x.groupId) === String(groupInfo.groupId))
  const ids = Array.isArray(g?.members) ? g.members.map(String) : []
  return ids.map(uid => {
    const f = friendList.value.find(ff => String(ff.friendUserId) === String(uid))
    return {
      userId: uid,
      name: f ? (f.friendRemark || f.friendNickName) : uid,
      avatar: f ? (f.friendAvatar?.startsWith('http') ? f.friendAvatar : (f.friendAvatar ? 'https://wc-chat.oss-cn-beijing.aliyuncs.com' + f.friendAvatar : '')) : '',
      role: (g && String(uid) === String(g.ownerId)) ? 'owner' : undefined
    }
  })
})

// 媒体/文件/链接占位
const groupMedias = ref([])
const groupFiles = ref([])
const groupLinks = ref([])

watch(showGroup, async (gid) => {
  if (!gid) return
  const g = groupList.value.find(x => String(x.groupId) === String(gid))
  groupInfo.groupId = gid
  groupInfo.groupName = g?.groupName || ''
  // 可选：尝试拉取群详情补充成员
  try {
    const resp = await store.dispatch('groups/fetchGroupDetail', gid)
    if (resp?.success && resp.data) {
      // 将成员ID注入到 store 当前 group 以便侧栏展示
      const list = [...groupList.value]
      const idx = list.findIndex(it => String(it.groupId) === String(gid))
      if (idx !== -1 && resp.data.members) {
        list[idx] = { ...list[idx], members: resp.data.members }
        store.commit('groups/SET_GROUP_LIST', list)
      }
    }
  } catch (_) {}
}, { immediate: true })
</script>

<style scoped>
.chat {
  display: flex;
  flex-flow: column nowrap;
  border-right: 1px solid var(--border-color);
  background-color: var(--fill-color-lighter);
  flex: 1;
}
.chat header {
  display: flex;
  height: 100px;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-color);
  color: var(--text-color-primary);
  padding: 20px 30px;
}
.header-user {
  display: flex;
  height: 65px;
}
.header-user figure { margin: 5px 15px 0 0; }
.header-user p { font-size: 26px; font-weight: 600; margin: 0; }
.header-user small { display: flex; align-items: center; font-size: 14px; }
.header-user small.info { color: var(--color-info); }
.header-user small span { margin-left: 4px; margin-bottom: 1px; }

.chat-body { padding: 30px 30px 10px; overflow: hidden; flex: 1; }
.messages { display: flex; flex-flow: column nowrap; }
.message-item { display: flex; width: 100%; flex-flow: column nowrap; align-items: flex-start; margin-bottom: 20px; }
.message .header { display: flex; align-items: center; margin-bottom: 5px; }
.message .header div { display: flex; flex-flow: column nowrap; margin-left: 10px; }
.message .header div span { font-size: 18px; font-weight: 600; color: var(--text-color-primary); }
.message .header div small { font-style: italic; color: var(--text-color-secondary); }
.message .content { white-space: pre-wrap; font-size: 15px; background: var(--color-info-light-8); border-radius: 7px; margin-left: 50px; padding: 10px 15px; }

.chat footer { background-color: var(--bg-color); padding: 20px 30px 50px; }
.input-area { display: flex; align-items: center; background-color: var(--bg-color); }
.buttons { display: flex; margin-left: 20px; }
.send { display: inline-flex; justify-content: center; align-items: center; width: 80px; height: 40px; background: var(--el-color-primary); color: #fff; border: none; border-radius: 4px; cursor: not-allowed; }

.group-info { padding: 4px 2px; }
.group-meta { margin: 10px 0 6px; }
.group-meta .name { font-size: 20px; font-weight: 600; }
.group-meta .sub { color: var(--text-color-secondary); font-size: 12px; }
.member-list { display: flex; flex-direction: column; gap: 10px; }
.member-item { display: flex; align-items: center; gap: 10px; }
.member-item .name { flex: 1; }
.member-item .role { color: var(--color-info); font-size: 12px; }
</style>


