<template>
  <div class="chat">
    <!-- Header -->
    <header>
      <div class="connection-status" :class="{ disconnected: !isConnected }">
        {{ isConnected ? '已连接' : '未连接' }}
      </div>
      <div class="header-user">
        <figure>
          <el-avatar :src="chatInfo.avatar" size="large" shape="square" @error="() => true">
            <img v-if="!isGroupChat" src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png" />
            <icon-mdi-account-group v-else style="font-size: 30px" />
          </el-avatar>
        </figure>
        <div>
          <p>{{ chatInfo.name }}</p>
          <small v-if="!isGroupChat && checkOnline(chatInfo.id)" class="success">
            <icon-mdi-circle style="font-size: 12px" />
            <span>在 线</span>
          </small>
          <small v-else-if="!isGroupChat" class="info">
            <icon-mdi-circle style="font-size: 12px" />
            <span>离 线</span>
          </small>
          <small v-else class="info">
            <icon-mdi-account-group style="font-size: 12px" />
            <span>{{ currentGroup.members?.length || 0 }} 位成员</span>
          </small>
        </div>
      </div>
      <div class="header-action">
        <el-button type="danger" size="large" text title="关闭窗口" @click="emit('update:showChat', null)">
          <icon-ep-close style="font-size: 26px" />
        </el-button>
      </div>
    </header>

    <!-- Message Body -->
    <el-scrollbar ref="scrollbarRef" class="chat-scrollbar">
      <div class="chat-body" ref="chatBodyRef">
        <div class="messages" v-if="messageList.length > 0">
          <div
            class="message-item"
            v-for="message in messageList"
            :key="message.id || message.messageId"
            :class="{ send: message.senderId === user.userId }"
          >
            <!-- Time Divider -->
            <div
              v-if="message.showTime === 1"
              class="divider"
              :label="formatMessageTime(message.createTime || message.sentAt)"
            />
            <!-- Message Content -->
            <div class="message">
              <div class="header">
                <el-avatar :src="getSender(message.senderId).avatar" :size="45" @error="() => true">
                  <img src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png" />
                </el-avatar>
                <div :class="{ 'sender-info-right': message.senderId === user.userId }">
                  <span>{{ getSender(message.senderId).name }}</span>
                  <small>{{ formatDate(message.createTime || message.sentAt, "YYYY-MM-DD HH:mm") }}</small>
                </div>
              </div>
              <!-- Text Message -->
              <div v-if="message.type === 0 || message.messageType === 'text'" class="content">
                {{ message.content }}
              </div>
              <!-- Image Message -->
              <div v-if="message.type === 1 || message.messageType === 'image'" class="content-image">
                <el-image
                  v-if="message.content"
                  class="image"
                  :src="message.content.startsWith('http') ? message.content : 'https://wc-chat.oss-cn-beijing.aliyuncs.com' + message.content"
                  fit="contain"
                  :preview-src-list="[
                    message.content.startsWith('http') ? message.content : 'https://wc-chat.oss-cn-beijing.aliyuncs.com' + message.content,
                  ]"
                  hide-on-click-modal
                  @error="() => true"
                >
                  <template #placeholder>
                    <div style="height: 200px"></div>
                  </template>
                  <template #error>
                    <img
                      src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png"
                    />
                  </template>
                </el-image>
              </div>
              <!-- File Message -->
              <div v-if="message.type === 2 || message.messageType === 'file'" class="content-file">
                <div class="file">
                  <div class="file-icon">
                    <icon-mdi-file />
                  </div>
                  <div class="file-info">
                    <div class="filename">
                      <span>{{ getFilename(message.content) }}</span>
                    </div>
                    <div class="options">
                      <a
                        class="download"
                        :href="
                          message.content
                            ? message.content.startsWith('http') ? message.content : 'https://wc-chat.oss-cn-beijing.aliyuncs.com' + message.content
                            : ''
                        "
                      >
                        下载
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="message.type === 3" class="content">
                [暂不支持语音消息]
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <!-- Footer -->
    <footer>
      <div class="input-area">
        <el-input
          ref="inputRef"
          type="textarea"
          v-model="inputValue"
          maxlength="200"
          :autosize="{ minRows: 1, maxRows: 6 }"
          resize="none"
          spellcheck="false"
          @blur="focusIndex = $event.target.selectionStart"
          @focus="setFocusIndex"
          @keyup.enter.exact="sendMessage"
          @keydown.enter.exact="$event.preventDefault()"
        />
        <div class="buttons">
          <el-popover
            placement="top"
            trigger="click"
            :width="400"
            popper-class="emoticon-popper"
          >
            <template #reference>
              <el-button type="info" size="large" link title="表情">
                <icon-mdi-emoticon-happy-outline style="font-size: 26px" />
              </el-button>
            </template>
            <div class="emoticons">
              <button
                v-for="emoticon in emoticons"
                :key="emoticon"
                class="emoticon-item"
                @click="addEmoticon(emoticon)"
              >
                {{ emoticon }}
              </button>
            </div>
          </el-popover>
          <el-button type="info" size="large" link title="图片" @click="triggerImageUpload">
            <icon-mdi-panorama-outline style="font-size: 26px" />
          </el-button>
          <input
            ref="imageInput"
            type="file"
            accept="image/jpeg, image/png"
            style="display: none"
            @change="handleImageUpload"
          />
          <el-button type="info" size="large" link title="文件" @click="triggerFileUpload">
            <icon-mdi-folder-outline style="font-size: 26px" />
          </el-button>
          <input
            ref="fileInput"
            type="file"
            style="display: none"
            @change="handleFileUpload"
          />
          <button class="send" type="button" title="发送" :disabled="inputValue.length === 0" @click="sendMessage">
            <icon-ep-promotion style="font-size: 24px" />
          </button>
        </div>
      </div>
    </footer>
    <el-dialog v-model="showImagePreview" title="发送图片" width="30%">
      <div style="text-align: center">
        <el-image :src="previewImageUrl" style="max-width: 100%; max-height: 300px" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelSend">取消</el-button>
          <el-button type="primary" @click="confirmSendImage">
            发送
          </el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog v-model="showFilePreview" title="发送文件" width="30%">
      <div style="text-align: center">
        <p>确定要发送文件: {{ selectedFile ? selectedFile.name : '' }}?</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelSend">取消</el-button>
          <el-button type="primary" @click="confirmSendFile">
            发送
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, inject, nextTick, onMounted, onBeforeUnmount, reactive, ref, toRefs, watch } from "vue";
import { useStore } from "vuex";
import { ElMessage } from "element-plus";
import { compareYear, compareDate, computeMinuteDiff, formatDate } from "@/utils/date";
import { reqSavePictureMsg, reqSaveFileMsg, reqSendGroupImage, reqSendGroupFile, reqSendGroupTextMessage } from "@/api";
import emoticons from "./emoticons.json";

const props = defineProps({
  showChat: Object, // { type: 'friend' | 'group', id: String }
});
const emit = defineEmits(['update:showChat']);

const socket = getCurrentInstance().appContext.config.globalProperties.socket;
const store = useStore();
const user = inject("user");

const { showChat } = toRefs(props);

// --- Computed Properties for Dynamic Chat Handling ---

const isConnected = computed(() => store.state.socket.isConnected);
const isGroupChat = computed(() => showChat.value?.type === 'group');
const chatSessionId = computed(() => showChat.value?.id);

// Friend-specific state
const chatList = computed(() => store.state.home.chatList);
const onlineUsers = computed(() => store.state.home.onlineUsers);

// Group-specific state
const currentGroup = computed(() => store.getters["groups/currentGroup"]);

// Combined state
const messageList = computed(() => {
  if (isGroupChat.value) {
    if (!chatSessionId.value) return [];
    const getMsgs = store.getters["groups/getGroupMessages"];
    return typeof getMsgs === 'function' ? (getMsgs(chatSessionId.value) || []) : [];
  }
  return store.state.home.chatHistories || [];
});

const chatInfo = computed(() => {
  if (!chatSessionId.value) return { id: '', name: '', avatar: '' };
  if (isGroupChat.value) {
    const group = currentGroup.value;
    return {
      id: group?.groupId ?? chatSessionId.value,
      name: group?.groupName ?? '',
      avatar: group?.avatar ?? ''
    };
  } else {
    const chat = chatList.value.find(c => c.sessionId === chatSessionId.value);
    return chat ? {
      id: chat.friendUserId,
      name: chat.friendRemark || chat.friendNickName,
      avatar: chat.friendAvatar,
    } : { name: '私聊', avatar: '' };
  }
});

// --- UI & Interaction ---

const scrollbarRef = ref();
const chatBodyRef = ref();
const inputRef = ref();
const inputValue = ref("");
const focusIndex = ref(0);

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollbarRef.value) {
      scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
    }
  });
};

// --- Watcher for Handling Chat Switch ---

watch(chatSessionId, async (newId) => {
  if (!newId) return;
  
  if (isGroupChat.value) {
    await store.dispatch('groups/fetchGroupMessages', {
      groupId: newId,
      params: { page: 1, size: 20 }
    });
    await store.dispatch('groups/fetchGroupInfo', newId);
    scrollToBottom();
  } else {
    const paramsForHistory = {
      id: String(user.userId),
      session: String(newId),
      page: 1,
      size: 15,
    };
    await store.dispatch("home/getHistory", paramsForHistory);
  }
});

// --- Emoticon, Image, and File Handling ---
const imageInput = ref(null);
const fileInput = ref(null);
const showImagePreview = ref(false);
const showFilePreview = ref(false);
const selectedFile = ref(null);
const previewImageUrl = ref('');

const getFilename = (filePath) => {
  if (!filePath) return '';
  let arr = filePath.split("/");
  let filename = arr[arr.length - 1];
  return filename.length > 20
    ? filename.substring(0, 14) +
        "..." +
        filename.substring(filename.lastIndexOf(".") - 3)
    : filename;
};

const setFocusIndex = (event) => {
  const maxLength = inputValue.value ? inputValue.value.length : 0;
  focusIndex.value = Math.min(event.target.selectionStart, maxLength);
};

const addEmoticon = (emoticon) => {
  let inputContent = inputValue.value || "";
  inputValue.value =
    inputContent.slice(0, focusIndex.value) +
    emoticon +
    inputContent.slice(focusIndex.value);
  focusIndex.value += emoticon.length;
  nextTick(() => {
    inputRef.value?.focus();
  });
};

const triggerImageUpload = () => imageInput.value.click();
const triggerFileUpload = () => fileInput.value.click();

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    return ElMessage.warning("上传的图片仅支持 JPG 或 PNG 格式！");
  }
  if (file.size / 1024 / 1024 > 2) {
    return ElMessage.warning("上传的图片大小不能超过 2MB！");
  }
  selectedFile.value = file;
  previewImageUrl.value = URL.createObjectURL(file);
  showImagePreview.value = true;
  event.target.value = '';
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size / 1024 / 1024 > 30) {
    return ElMessage.warning("上传的文件大小不能超过 30MB！");
  }
  selectedFile.value = file;
  showFilePreview.value = true;
  event.target.value = '';
};

const cancelSend = () => {
  showImagePreview.value = false;
  showFilePreview.value = false;
  selectedFile.value = null;
  previewImageUrl.value = '';
};

const confirmSendImage = async () => {
  if (!selectedFile.value) return;

  const formData = new FormData();
  formData.append('file', selectedFile.value);

  try {
    showImagePreview.value = false;
    ElMessage.info('正在上传图片...');

    let result;
    if (isGroupChat.value) {
      formData.append('groupId', chatSessionId.value);
      result = await reqSendGroupImage(formData);
    } else {
      formData.append('senderId', user.userId);
      formData.append('receiverId', chatInfo.value.id);
      formData.append('sessionId', chatSessionId.value);
      result = await reqSavePictureMsg(formData);
    }

    if (result.success) {
      ElMessage.success('图片发送成功');
      if (isGroupChat.value) {
        await store.dispatch('groups/fetchGroupMessages', { groupId: chatSessionId.value });
        scrollToBottom();
      } else {
        const message = {
          senderId: user.userId,
          receiverId: chatInfo.value.id,
          sessionId: chatSessionId.value,
          type: 1,
          content: result.data,
          createTime: formatDate(new Date(), "YYYY-MM-DD HH:mm:ss"),
          hasRead: 0,
          showTime: 1,
        };
        await store.dispatch('socket/sendMessage', { socket, message });
        scrollToBottom();
      }
    } else {
      ElMessage.error(result.message || "图片上传失败");
    }
  } catch (error) {
    ElMessage.error("图片上传失败，请检查网络连接或后端服务");
  } finally {
    selectedFile.value = null;
    previewImageUrl.value = '';
  }
};

const confirmSendFile = async () => {
  if (!selectedFile.value) return;

  const formData = new FormData();
  formData.append('file', selectedFile.value);

  try {
    showFilePreview.value = false;
    ElMessage.info('正在上传文件...');

    let result;
    if (isGroupChat.value) {
      formData.append('groupId', chatSessionId.value);
      result = await reqSendGroupFile(formData);
    } else {
      formData.append('senderId', user.userId);
      formData.append('receiverId', chatInfo.value.id);
      formData.append('sessionId', chatSessionId.value);
      result = await reqSaveFileMsg(formData);
    }

    if (result.success) {
      ElMessage.success('文件发送成功');
      if (isGroupChat.value) {
        await store.dispatch('groups/fetchGroupMessages', { groupId: chatSessionId.value });
        scrollToBottom();
      } else {
        const message = {
          senderId: user.userId,
          receiverId: chatInfo.value.id,
          sessionId: chatSessionId.value,
          type: 2,
          content: result.data,
          createTime: formatDate(new Date(), "YYYY-MM-DD HH:mm:ss"),
          hasRead: 0,
          showTime: 1,
        };
        await store.dispatch('socket/sendMessage', { socket, message });
        scrollToBottom();
      }
    } else {
      ElMessage.error(result.message || "文件上传失败");
    }
  } catch (error) {
    ElMessage.error("文件上传失败，请检查网络连接或后端服务");
  } finally {
    selectedFile.value = null;
  }
};


const checkOnline = (userId) => onlineUsers.value.includes(userId);

const getSender = (senderId) => {
  if (senderId === user.userId) {
    return { name: user.nickName, avatar: user.avatar };
  }
  if (isGroupChat.value) {
    const member = store.getters['groups/getGroupMember'](senderId);
    return {
      name: member?.nickName || '成员',
      avatar: member?.avatar,
    };
  } else {
    return { name: chatInfo.value.name, avatar: chatInfo.value.avatar };
  }
};

const formatMessageTime = (timeStr) => {
  if (!timeStr) return '';
  if (compareDate(timeStr)) return formatDate(timeStr, 'ah:mm');
  if (compareDate(timeStr, 1)) return '昨天 ' + formatDate(timeStr, 'ah:mm');
  if (compareYear(timeStr)) return formatDate(timeStr, 'MM-DD ah:mm');
  return formatDate(timeStr, 'YYYY-MM-DD ah:mm');
};

// --- Message Sending ---

const sendMessage = async () => {
  const messageText = inputValue.value.trim();
  if (!messageText || !chatSessionId.value) return;

  const originalText = inputValue.value;
  inputValue.value = '';
  
  if (isGroupChat.value) {
    try {
      const result = await reqSendGroupTextMessage({
        groupId: chatSessionId.value,
        content: messageText,
        messageType: 'text',
      });
      if (result.success) {
        // Also emit via socket to notify other users in real-time
        socket.emit('send_group_message', {
          groupId: chatSessionId.value,
          content: messageText,
          messageType: 'text',
        });
        // Refetch messages to show the new message for the sender
        await store.dispatch('groups/fetchGroupMessages', { groupId: chatSessionId.value });
        scrollToBottom();
      } else {
        ElMessage.error(result.message || '消息发送失败');
        inputValue.value = originalText; // Restore input on failure
      }
    } catch (error) {
      ElMessage.error('消息发送失败，请检查网络');
      inputValue.value = originalText; // Restore input on failure
    }
  } else {
    // Private chat logic remains the same (optimistic UI with WebSocket)
    const currentTime = new Date();
    const lastMessage = messageList.value.slice(-1)[0];
    const showTime = !lastMessage || computeMinuteDiff(lastMessage.createTime || lastMessage.sentAt, currentTime) >= 5 ? 1 : 0;
    const tempMessage = {
      id: `temp_${Date.now()}`,
      senderId: user.userId,
      receiverId: chatInfo.value.id,
      sessionId: chatSessionId.value,
      type: 0,
      content: messageText,
      createTime: formatDate(currentTime, "YYYY-MM-DD HH:mm:ss"),
      hasRead: 0,
      showTime: showTime,
    };
    store.commit('home/ADD_CHAT_HISTORY', tempMessage);
    scrollToBottom();

    store.dispatch('socket/sendMessage', { socket, message: tempMessage })
      .catch(error => {
        console.error('[Send] 发送失败:', error);
        ElMessage.error(error.message || "发送失败，请重试");
        inputValue.value = originalText; // Restore input on failure
      });
  }

  nextTick(() => inputRef.value?.focus());
};

// --- WebSocket Event Listeners ---

onMounted(() => {
  socket.on("receiveMsg", (message) => {
    if (showChat.value?.type === 'friend' && message.sessionId === chatSessionId.value) {
      scrollToBottom();
    }
  });

  socket.on("receive_group_message", (message) => {
    if (isGroupChat.value && message.groupId === chatSessionId.value) {
      const exists = messageList.value.some(m => m.messageId === message.messageId);
      if (!exists) {
        store.dispatch('groups/addNewGroupMessage', message);
      }
      scrollToBottom();
    }
  });
});

onBeforeUnmount(() => {
  socket.off("receiveMsg");
  socket.off("receive_group_message");
});

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
  align-items: center;
  height: 65px;
}
.header-user figure {
  margin: 0 15px 0 0;
}
.header-user p {
  font-size: 26px;
  font-weight: 600;
  margin: 0;
}
.header-user small {
  display: flex;
  align-items: center;
  font-size: 14px;
}
.header-user small.success { color: var(--color-success); }
.header-user small.info { color: var(--color-info); }
.header-user small span, .header-user small .icon-mdi-account-group {
  margin-left: 4px;
}
.chat-scrollbar {
  flex: 1;
}
.chat-body {
  padding: 30px;
  padding-bottom: 10px;
}
.messages {
  display: flex;
  flex-flow: column nowrap;
}
.message-item {
  display: flex;
  width: 100%;
  flex-flow: column nowrap;
  align-items: flex-start;
  margin-bottom: 20px;
}
.message-item.send {
  align-items: flex-end;
}
.divider {
  position: relative;
  width: 100%;
  margin-bottom: 10px;
  text-align: center;
}
.divider::before {
  content: attr(label);
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  background-color: var(--color-info-light-8);
  color: var(--text-color-regular);
}
.message {
  display: flex;
  max-width: 60%;
  flex-flow: column nowrap;
  align-items: flex-start;
}
.message-item.send .message {
  align-items: flex-end;
}
.message .header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 5px;
}
.message .header .el-avatar {
  order: 1;
}
.message .header div {
  display: flex;
  flex-flow: column nowrap;
  margin-left: 10px;
  order: 2;
}
.message-item.send .message .header .el-avatar {
  order: 2;
}
.message-item.send .message .header div {
  margin-left: 0;
  margin-right: 10px;
  order: 1;
  align-items: flex-end;
}
.message .header div span {
  font-size: 16px;
  color: var(--text-color-primary);
  margin-bottom: 2px;
}
.message .header div small {
  font-style: italic;
  color: var(--text-color-secondary);
  font-size: 12px;
}
.content {
  white-space: pre-wrap;
  font-size: 15px;
  background-color: var(--color-info-light-8);
  border-radius: 7px;
  padding: 10px 15px;
  margin-left: 55px;
}
.message-item.send .content {
  background-color: var(--color-primary);
  color: var(--bg-color);
  margin-left: 0;
  margin-right: 55px;
}
.content-image, .content-file {
  margin-left: 55px;
}
.message-item.send .content-image, .message-item.send .content-file {
  margin-left: 0;
  margin-right: 55px;
}
footer {
  position: relative;
  background-color: var(--bg-color);
  padding: 20px 30px;
}
.input-area {
  display: flex;
  align-items: center;
}
.input-area .buttons {
  margin-left: 20px;
}
.buttons .send {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 40px;
  background-color: var(--el-color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.buttons .send:hover:not(:disabled) {
  background-color: var(--el-color-primary-light-3);
}
.buttons .send:disabled {
  background-color: var(--el-color-primary-light-5);
  cursor: not-allowed;
}
.connection-status {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: var(--el-color-success-light-8);
  color: var(--el-color-success);
}
.connection-status.disconnected {
  background: var(--el-color-danger-light-8);
  color: var(--el-color-danger);
}
</style>
