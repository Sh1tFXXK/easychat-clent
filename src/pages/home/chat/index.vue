<template>
  <div class="chat">
    <header>
      <!-- 添加连接状态指示器 -->
  <div class="connection-status" :class="{ disconnected: !isConnected }">
    {{ isConnected ? '已连接' : '未连接' }}
  </div>
  <div class="header-user">
        <figure>
          <el-avatar
            :src=" isGroupChat
              ? (groupDetail.avatar ? (groupDetail.avatar.startsWith('http') ? groupDetail.avatar : 'https://wc-chat.oss-cn-beijing.aliyuncs.com' + groupDetail.avatar) : '')
              : (friend.avatar
                ? friend.avatar.startsWith('http') ? friend.avatar : 'https://wc-chat.oss-cn-beijing.aliyuncs.com' + friend.avatar
                : '')
            "
            size="large"
            shape="square"
            @error="() => true"
          >
            <img
              src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png"
            />
          </el-avatar>
        </figure>
        <div>
          <p>{{ isGroupChat ? groupDetail.groupName || '群聊' : friend.remark }}</p>
          <small v-if="!isGroupChat && checkOnline(friend.userId)" class="success">
            <icon-mdi-circle style="font-size: 12px" />
            <span>在 线</span>
          </small>
          <small v-else-if="!isGroupChat" class="info">
            <icon-mdi-circle style="font-size: 12px" />
            <span>离 线</span>
          </small>
        </div>
      </div>
      <div class="header-action">
        <el-button type="info" size="large" text title="显示侧边栏" @click="showSidebar">
          <icon-ep-menu style="font-size: 26px" />
        </el-button>
        <el-button type="success" size="large" text title="语音通话（敬请期待）">
          <icon-ep-phone style="font-size: 26px" />
        </el-button>
        <el-button type="warning" size="large" text title="视频通话（敬请期待）">
          <icon-ep-video-camera style="font-size: 26px" />
        </el-button>
        <el-button
          type="danger"
          size="large"
          text
          title="关闭窗口"
          @click="emit('update:showChat', '')"
        >
          <icon-ep-close style="font-size: 26px" />
        </el-button>
      </div>
    </header>
    <el-scrollbar ref="scrollbarRef">
      <div class="chat-body" ref="chatBodyRef">
        <div class="messages" v-if="!isGroupChat && chatHistoryList.length > 0">
          <!-- 单聊消息渲染 -->
          <div
            class="message-item"
            v-for="message in chatHistoryList"
            :key="message.id"
            :class="{ send: message.senderId === user.userId }"
          >
            <!-- 保持原有单聊渲染 -->
            <div
              v-if="message.showTime === 1"
              class="divider"
              :label="
                compareDate(message.createTime)
                  ? formatDate(message.createTime, 'ah:mm')
                  : compareDate(message.createTime, 1)
                  ? '昨天 ' + formatDate(message.createTime, 'ah:mm')
                  : compareDate(message.createTime, 2)
                  ? '前天 ' + formatDate(message.createTime, 'ah:mm')
                  : compareYear(message.createTime)
                  ? formatDate(message.createTime, 'MM-DD ah:mm')
                  : formatDate(message.createTime, 'YYYY-MM-DD ah:mm')
              "
            />
            <div class="message">
              <div v-if="message.senderId === user.userId" class="header">
                <div>
                  <span>{{ user.nickName }}</span>
                  <small>
                    {{ formatDate(message.createTime, "YYYY-MM-DD HH:mm") }}
                  </small>
                </div>
                <el-avatar :src="user.avatar" :size="45" @error="() => true">
                  <img
                    src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png"
                  />
                </el-avatar>
              </div>
              <div v-else class="header">
                <el-avatar
                  :src="
                    friend.avatar
                      ? friend.avatar.startsWith('http') ? friend.avatar : 'https://wc-chat.oss-cn-beijing.aliyuncs.com' + friend.avatar
                      : ''
                  "
                  :size="45"
                  @error="() => true"
                >
                  <img
                    src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png"
                  />
                </el-avatar>
                <div>
                  <span>{{ friend.remark }}</span>
                  <small>
                    {{ formatDate(message.createTime, "YYYY-MM-DD HH:mm") }}
                  </small>
                </div>
              </div>
              <div v-if="message.type === 0" class="content">
                {{ message.content }}
              </div>
              <div v-if="message.type === 1" class="content-image">
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
              <div v-if="message.type === 2" class="content-file">
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
        <div class="messages" v-else-if="isGroupChat && groupHistoryList.length > 0">
          <!-- 群聊消息渲染（只读） -->
          <div
            class="message-item"
            v-for="msg in groupHistoryList"
            :key="msg.messageId || msg.id"
            :class="{ send: msg.senderId === user.userId }"
          >
            <div class="message">
              <div class="header">
                <div>
                  <span>{{ msg.senderId }}</span>
                  <small>{{ typeof msg.sentAt === 'number' ? formatDate(new Date(msg.sentAt), 'YYYY-MM-DD HH:mm') : (msg.createTime ? formatDate(msg.createTime, 'YYYY-MM-DD HH:mm') : '') }}</small>
                </div>
              </div>
              <div v-if="normalizeMsgType(msg) === 0" class="content">{{ resolveMsgText(msg) }}</div>
              <div v-else-if="normalizeMsgType(msg) === 1" class="content">[图片消息，暂未预览]</div>
              <div v-else-if="normalizeMsgType(msg) === 2" class="content">[文件消息，暂未预览]</div>
              <div v-else class="content">{{ resolveMsgText(msg) }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <footer v-if="!isGroupChat">
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
          <el-button type="info" size="large" link title="语音（暂不支持）">
            <icon-ep-microphone style="font-size: 26px" />
          </el-button>
          <button
            class="send"
            type="button"
            title="发送"
            :disabled="inputValue.length === 0"
            @click="sendMessage"
          >
            <icon-ep-promotion style="font-size: 24px" />
          </button>
        </div>
      </div>
    </footer>
    <footer v-else>
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
          @keyup.enter.exact="sendGroupText"
          @keydown.enter.exact="$event.preventDefault()"
        />
        <div class="buttons">
          <el-button type="info" size="large" link title="图片" @click="triggerImageUpload">
            <icon-mdi-panorama-outline style="font-size: 26px" />
          </el-button>
          <input
            ref="imageInput"
            type="file"
            accept="image/jpeg, image/png"
            style="display: none"
            @change="handleGroupImageUpload"
          />
          <el-button type="info" size="large" link title="文件" @click="triggerFileUpload">
            <icon-mdi-folder-outline style="font-size: 26px" />
          </el-button>
          <input
            ref="fileInput"
            type="file"
            style="display: none"
            @change="handleGroupFileUpload"
          />
          <button
            class="send"
            type="button"
            title="发送"
            :disabled="inputValue.length === 0"
            @click="sendGroupText"
          >
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
import {
  computed,
  getCurrentInstance,
  inject,
  nextTick,
  onMounted,
  onBeforeUnmount,
  reactive,
  ref,
  toRefs,
  watch,
} from "vue";
import { useStore } from "vuex";
import { ElMessage } from "element-plus";
import {
  compareYear,
  compareDate,
  computeMinuteDiff,
  formatDate,
} from "@/utils/date";
import { reqSavePictureMsg, reqSaveFileMsg, reqGetGroupDetail, reqGetGroupMessages } from "@/api";
// 替换为引入群聊发送接口
import { reqSendGroupText, reqSendGroupImage, reqSendGroupFile } from "@/api";
import emoticons from "./emoticons.json";

const props = defineProps({
  showChat: String,
});

const emit = defineEmits(['update:showChat', 'showSidebar']);

// 显示侧边栏的方法
const showSidebar = () => {
  emit('showSidebar', 1); // 显示聊天列表侧边栏
};

const socket = getCurrentInstance().appContext.config.globalProperties.socket;
const store = useStore();
const user = inject("user");

// 从 Vuex store 获取 WebSocket 连接状态
const isConnected = computed(() => store.state.socket.isConnected);

// 监听连接状态，成功连接后发送在线状态
watch(isConnected, (newValue) => {
  if (newValue) {
    console.log('[Chat] 连接成功，发送在线状态');
    socket.emit('online', user.userId, 1);
  }
}, { immediate: true });

const { showChat } = toRefs(props);
const isGroupChat = computed(() => typeof showChat.value === 'string' && showChat.value.startsWith('group:'));
const currentGroupId = computed(() => isGroupChat.value ? showChat.value.substring('group:'.length) : '');
// 单聊相关
const chatList = computed(() => store.state.home.chatList);
const chatHistoryList = computed(() => store.state.home.chatHistories);
const onlineUsers = computed(() => store.state.home.onlineUsers);
// 群聊相关
const groupDetail = reactive({ groupId: '', groupName: '', avatar: '', ownerId: '' });
const groupHistoryList = reactive([]);
// 规范化群消息类型：支持 0/1/2 或 'TEXT'/'IMAGE'/'FILE'
const normalizeMsgType = (m) => {
  const t = m?.messageType ?? m?.type;
  if (t === 0 || t === 1 || t === 2) return t;
  if (typeof t === 'string') {
    const upper = t.toUpperCase();
    if (upper === 'TEXT') return 0;
    if (upper === 'IMAGE') return 1;
    if (upper === 'FILE') return 2;
  }
  return 0; // 默认为文本
};
const resolveMsgText = (m) => {
  const text = m?.content ?? m?.text ?? '';
  return typeof text === 'string' ? text : String(text ?? '');
};
const friend = reactive({
  userId: "",
  avatar: "",
  remark: "",
});

watch(
  () => showChat.value,
  async (val) => {
    if (!val) return;
    if (isGroupChat.value) {
      // 群聊：加载群详情与消息
      try {
        if (currentGroupId.value) {
          const [detailRes, msgRes] = await Promise.all([
            reqGetGroupDetail(currentGroupId.value),
            reqGetGroupMessages(currentGroupId.value, { page: 1, pageSize: 20 })
          ]);
          if (detailRes?.success && detailRes.data) {
            groupDetail.groupId = detailRes.data.groupId;
            groupDetail.groupName = detailRes.data.groupName;
            groupDetail.avatar = detailRes.data.avatar || '';
            groupDetail.ownerId = detailRes.data.ownerId || '';
          } else {
            groupDetail.groupId = currentGroupId.value;
            groupDetail.groupName = '群聊';
            groupDetail.avatar = '';
            groupDetail.ownerId = '';
          }
          if (msgRes?.success && msgRes.data) {
            const records = Array.isArray(msgRes.data.records) ? msgRes.data.records : (Array.isArray(msgRes.data) ? msgRes.data : []);
            groupHistoryList.splice(0, groupHistoryList.length, ...records);
          } else {
            groupHistoryList.splice(0, groupHistoryList.length);
          }
        }
      } catch (e) {
        groupHistoryList.splice(0, groupHistoryList.length);
      }
      return; // 不执行单聊逻辑
    }
    // 单聊：保持原有逻辑
    let chat = chatList.value.find((chat) => chat.sessionId === val);
    if (chat) {
      friend.userId = chat.friendUserId;
      friend.avatar = chat.friendAvatar;
      friend.remark = chat.friendRemark ? chat.friendRemark : chat.friendNickName;
    }
  },
  { immediate: true }
);

const scrollbarRef = ref();
const chatBodyRef = ref();
const checkOnline = (userId) => {
  return onlineUsers.value.indexOf(userId) >= 0;
};
const getFilename = (filePath) => {
  let arr = filePath.split("/");
  let filename = arr[arr.length - 1];
  return filename.length > 20
    ? filename.substring(0, 14) +
        "..." +
        filename.substring(filename.lastIndexOf(".") - 3)
    : filename;
};

const inputRef = ref();
const inputValue = ref("");
const focusIndex = ref(0);
const setFocusIndex = (event) => {
  // 确保焦点索引在有效范围内
  const maxLength = inputValue.value ? inputValue.value.length : 0;
  focusIndex.value = Math.min(focusIndex.value, maxLength);
  
  // 设置光标位置
  if (event && event.target) {
    event.target.selectionStart = focusIndex.value;
    event.target.selectionEnd = focusIndex.value;
  }
};
const sendMessage = async () => {
  console.log("[Send] 开始发送消息...");
  const messageText = inputValue.value.trim();
  
  // 1. 基础检查
  if (!messageText || !friend.userId || !showChat.value) {
    return;
  }

  // 2. 构建消息对象
  const currentTime = formatDate(new Date(), "YYYY-MM-DD HH:mm:ss");
  const lastMessage = chatHistoryList.value.slice(-1)[0];
  const showTime = lastMessage && 
    computeMinuteDiff(lastMessage.createTime, currentTime) < 5 ? 0 : 1;

  const message = {
    senderId: user.userId,
    receiverId: friend.userId,
    sessionId: showChat.value,
    type: 0,  // 文本消息
    content: messageText,
    createTime: currentTime,
    hasRead: 0,
    showTime: showTime
  };

  // 3. 保存原始文本以备发送失败时恢复
  const originalText = inputValue.value;
  inputValue.value = '';  // 先清空输入框

  try {
    // 4. 通过 Vuex 发送消息
    const response = await store.dispatch('socket/sendMessage', { socket, message });
    
    if (response) {
      console.log('[Send] 发送成功，服务器返回:', response);
      
      // 5. 更新聊天记录
      chatHistoryList.value.push(response);
      
      // 6. 更新会话列表
      const chatIndex = chatList.value.findIndex(
        (chat) => chat.sessionId === response.sessionId
      );
      if (chatIndex !== -1) {
        console.log('[Send] 更新会话列表');
        chatList.value[chatIndex].createTime = response.createTime;
        chatList.value[chatIndex].latestChatHistory = response;
        const chat = chatList.value.splice(chatIndex, 1)[0];
        chatList.value.unshift(chat);
      }

      // 7. 滚动到底部
      nextTick(() => {
        requestAnimationFrame(() => {
          if (scrollbarRef.value) {
            scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
          }
        });
      });

      // 8. 获得输入框焦点
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus();
        }
      });
    }
  } catch (error) {
    console.error('[Send] 发送失败:', error);
    inputValue.value = originalText; // 恢复原始文本
    ElMessage.error(error.message || "发送失败，请重试");
  }
};

const addEmoticon = (emoticon) => {
  let inputContent = inputValue.value || "";
  inputValue.value =
    inputContent.slice(0, focusIndex.value) +
    emoticon +
    inputContent.slice(focusIndex.value);
  focusIndex.value += emoticon.length;
  // 使用nextTick确保DOM更新后再设置焦点
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
      // 手动触发一次输入事件，确保v-model更新
      const event = new Event("input", { bubbles: true });
      inputRef.value.$el.querySelector("textarea").dispatchEvent(event);
    }
  });
};

const imageInput = ref(null);
const fileInput = ref(null);
// 单聊触发器保持不变
const triggerImageUpload = () => {
  imageInput.value.click();
};
const triggerFileUpload = () => {
  fileInput.value.click();
};

// 在 <script setup> 中添加确认对话框相关的响应式变量
const showImagePreview = ref(false);
const showFilePreview = ref(false);
const selectedFile = ref(null);
const previewImageUrl = ref('');

// 修改图片上传处理函数
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    ElMessage.warning("上传的图片仅支持 JPG 或 PNG 格式！");
    return;
  }
  if (file.size / 1024 / 1024 > 2) {
    ElMessage.warning("上传的图片大小不能超过 2MB！");
    return;
  }

  // 显示预览对话框而不是立即上传
  selectedFile.value = file;
  previewImageUrl.value = URL.createObjectURL(file);
  showImagePreview.value = true;
  
  // 清空文件输入
  event.target.value = '';
};

// 修改文件上传处理函数
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size / 1024 / 1024 > 30) {
    ElMessage.warning("上传的文件大小不能超过 30MB！");
    return;
  }

  // 显示确认对话框而不是立即上传
  selectedFile.value = file;
  showFilePreview.value = true;
  
  // 清空文件输入
  event.target.value = '';
};

// 确认发送图片
const confirmSendImage = async () => {
  if (!selectedFile.value) return;
  
  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('senderId', user.userId);
  formData.append('receiverId', friend.userId);
  formData.append('sessionId', showChat.value);

  try {
    showImagePreview.value = false;
    ElMessage.info('正在上传图片...');
    
    const result = await reqSavePictureMsg(formData);
    if (result.success) {
      const message = {
        senderId: user.userId,
        receiverId: friend.userId,
        sessionId: showChat.value,
        type: 1,
        content: result.data,
        createTime: formatDate(new Date(), "YYYY-MM-DD HH:mm:ss"),
        hasRead: 0,
        showTime: 1,
      };
      
      const response = await store.dispatch('socket/sendMessage', { socket, message });
      if (response) {
        chatHistoryList.value.push(response);
        const chatIndex = chatList.value.findIndex(
          (chat) => chat.sessionId === response.sessionId
        );
        if (chatIndex !== -1) {
          chatList.value[chatIndex].createTime = response.createTime;
          chatList.value[chatIndex].latestChatHistory = response;
          const chat = chatList.value.splice(chatIndex, 1)[0];
          chatList.value.unshift(chat);
        }
        nextTick(() => {
          requestAnimationFrame(() => {
            if (scrollbarRef.value) {
              scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
            }
          });
        });
        ElMessage.success('图片发送成功');
      }
    } else {
      ElMessage.error(result.message || "图片上传失败");
    }
  } catch (error) {
    console.error('图片上传失败:', error);
    ElMessage.error("图片上传失败，请检查网络连接");
  } finally {
    selectedFile.value = null;
    previewImageUrl.value = '';
  }
};

// 确认发送文件
const confirmSendFile = async () => {
  if (!selectedFile.value) return;
  
  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('senderId', user.userId);
  formData.append('receiverId', friend.userId);
  formData.append('sessionId', showChat.value);

  try {
    showFilePreview.value = false;
    ElMessage.info('正在上传文件...');
    
    const result = await reqSaveFileMsg(formData);
    if (result.success) {
      const message = {
        senderId: user.userId,
        receiverId: friend.userId,
        sessionId: showChat.value,
        type: 2,
        content: result.data,
        createTime: formatDate(new Date(), "YYYY-MM-DD HH:mm:ss"),
        hasRead: 0,
        showTime: 1,
      };

      const response = await store.dispatch('socket/sendMessage', { socket, message });
      if (response) {
        chatHistoryList.value.push(response);
        const chatIndex = chatList.value.findIndex(
          (chat) => chat.sessionId === response.sessionId
        );
        if (chatIndex !== -1) {
          chatList.value[chatIndex].createTime = response.createTime;
          chatList.value[chatIndex].latestChatHistory = response;
          const chat = chatList.value.splice(chatIndex, 1)[0];
          chatList.value.unshift(chat);
        }
        nextTick(() => {
          requestAnimationFrame(() => {
            if (scrollbarRef.value) {
              scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
            }
          });
        });
        ElMessage.success('文件发送成功');
      }
    } else {
      ElMessage.error(result.message || "文件上传失败");
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    ElMessage.error("文件上传失败，请检查网络连接");
  } finally {
    selectedFile.value = null;
  }
};

// 取消发送
const cancelSend = () => {
  showImagePreview.value = false;
  showFilePreview.value = false;
  selectedFile.value = null;
  previewImageUrl.value = '';
};

// 群聊发送：文本
const sendGroupText = async () => {
  const text = (inputValue.value || '').trim();
  if (!text || !currentGroupId.value) return;
  const payload = { groupId: currentGroupId.value, content: text };
  try {
    const res = await reqSendGroupText(payload);
    // 不依赖返回体结构，直接本地追加一条发出的消息
    groupHistoryList.push({
      groupId: currentGroupId.value,
      senderId: user.userId,
      content: text,
      messageType: 0,
      sentAt: Date.now(),
      messageId: 'local-' + Date.now()
    });
    inputValue.value = '';
    nextTick(() => {
      requestAnimationFrame(() => {
        if (scrollbarRef.value) {
          scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
        }
      });
    });
  } catch (e) {
    ElMessage.error('发送失败');
  }
};

// 群聊发送：图片
const handleGroupImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    ElMessage.warning('仅支持 JPG/PNG');
    return;
  }
  if (file.size / 1024 / 1024 > 2) {
    ElMessage.warning('图片不能超过 2MB');
    return;
  }
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await reqSendGroupImage(currentGroupId.value, formData);
    // 假设 data 返回文件 URL 或 Key
    const url = res?.data || '';
    groupHistoryList.push({
      groupId: currentGroupId.value,
      senderId: user.userId,
      content: url,
      messageType: 1,
      sentAt: Date.now(),
      messageId: 'local-img-' + Date.now()
    });
    event.target.value = '';
    nextTick(() => {
      requestAnimationFrame(() => {
        if (scrollbarRef.value) {
          scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
        }
      });
    });
  } catch (e) {
    ElMessage.error('图片发送失败');
  }
};

// 群聊发送：文件
const handleGroupFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size / 1024 / 1024 > 30) {
    ElMessage.warning('文件不能超过 30MB');
    return;
  }
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await reqSendGroupFile(currentGroupId.value, formData);
    const url = res?.data || '';
    groupHistoryList.push({
      groupId: currentGroupId.value,
      senderId: user.userId,
      content: url,
      messageType: 2,
      sentAt: Date.now(),
      messageId: 'local-file-' + Date.now()
    });
    event.target.value = '';
    nextTick(() => {
      requestAnimationFrame(() => {
        if (scrollbarRef.value) {
          scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
        }
      });
    });
  } catch (e) {
    ElMessage.error('文件发送失败');
  }
};

// 监听群聊消息（如果后端广播有该事件名，则接入；没有则不影响）
try {
  socket.on('receiveGroupMsg', (msg) => {
    if (!msg || msg.groupId !== currentGroupId.value) return;
    groupHistoryList.push(msg);
    nextTick(() => {
      requestAnimationFrame(() => {
        if (scrollbarRef.value) {
          scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
        }
      });
    });
  });
} catch (e) {}

onMounted(() => {
  socket.on("receiveMsg", async (message) => {
    console.log('[Socket] 收到新消息:', message);
    
    // 检查消息格式
    if (!message || !message.senderId || !message.content) {
      console.error('[Socket] 消息格式无效:', message);
      return;
    }

    // 检查是否是当前聊天窗口的消息
    if (friend.userId === message.senderId) {
      chatHistoryList.value.push(message);
      
      // 更新会话列表中的最新消息
      const chatIndex = chatList.value.findIndex(
        (chat) => chat.sessionId === message.sessionId
      );
      if (chatIndex !== -1) {
        chatList.value[chatIndex].latestChatHistory = message;
        chatList.value[chatIndex].createTime = message.createTime;
        const updatedChat = chatList.value.splice(chatIndex, 1)[0];
        chatList.value.unshift(updatedChat);
      }

      // 滚动到底部
      nextTick(() => {
        requestAnimationFrame(() => {
          if (scrollbarRef.value) {
            scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
          }
        });
      });
      
      // 标记消息已读
      if (message.hasRead === 0) {
        socket.emit('markMessageRead', {
          sessionId: message.sessionId,
          messageId: message.id
        });
      }
    }
  });
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
  height: 65px;
}
.header-user figure {
  margin: 5px 15px 0 0;
}
.header-user p {
  font-size: 26px;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 0;
}
.header-user small {
  display: flex;
  align-items: center;
  font-size: 14px;
}
.header-user small.success {
  color: var(--color-success);
}
.header-user small.info {
  color: var(--color-info);
}
.header-user small span {
  margin-left: 4px;
  margin-bottom: 1px;
}
.chat-body {
  padding: 30px;
  padding-bottom: 10px;
  overflow: hidden;
  flex: 1;
}
.chat-body .messages {
  display: flex;
  flex-flow: column nowrap;
}
.chat-body .messages .message-item {
  display: flex;
  width: 100%;
  flex-flow: column nowrap;
  align-items: flex-start;
  margin-bottom: 20px;
}
.chat-body .messages .message-item.send {
  align-items: flex-end;
}
.chat-body .messages .message-item .divider {
  position: relative;
  width: 100%;
  margin-bottom: 10px;
}
.chat-body .messages .message-item .divider::before {
  content: attr(label);
  display: block;
  position: absolute;
  top: -8px;
  letter-spacing: 0.5px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  background-color: var(--color-info-light-8);
  color: var(--text-color-regular);
  left: 50%;
  transform: translateX(-50%);
}
.chat-body .messages .message-item .message {
  display: flex;
  max-width: 60%;
  flex-flow: column nowrap;
  align-items: flex-start;
}
.chat-body .messages .message-item.send .message {
  display: flex;
  max-width: 60%;
  flex-flow: column nowrap;
  align-items: flex-end;
}
.chat-body .messages .message-item .message .header {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}
.chat-body .messages .message-item .message .header div {
  display: flex;
  flex-flow: column nowrap;
  margin-left: 10px;
}
.chat-body .messages .message-item.send .message .header div {
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-end;
  margin-right: 10px;
}
.chat-body .messages .message-item .message .header div span {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary);
}
.chat-body .messages .message-item .message .header div small {
  font-style: italic;
  color: var(--text-color-secondary);
}
.chat-body .messages .message-item .message .content {
  white-space: pre-wrap;
  font-size: 15px;
  background-color: var(--color-info-light-8);
  border-radius: 7px;
  margin-left: 50px;
  padding: 10px 15px;
}
.chat-body .messages .message-item.send .message .content {
  background-color: var(--color-primary);
  color: var(--bg-color);
  margin-left: 0;
  margin-right: 50px;
}
.chat-body .messages .message-item .message .content-image {
  display: block;
  min-width: 120px;
  max-width: 30%;
  margin-left: 45px;
}
.chat-body .messages .message-item.send .message .content-image {
  justify-content: flex-end;
  margin-left: 0;
  margin-right: 45px;
}
.content-image .image {
  border-radius: 6px;
}
.chat-body .messages .message-item .message .content-file {
  display: block;
  height: 100px;
  width: 300px;
  background-color: var(--color-info-light-8);
  border-radius: 10px;
  margin-left: 45px;
}
.chat-body .messages .message-item.send .message .content-file {
  margin-left: 0;
  margin-right: 45px;
}
.content-file .file {
  display: flex;
  height: 100%;
  padding: 10px 15px;
}
.content-file .file .file-icon {
  display: flex;
  align-items: center;
  font-size: 60px;
}
.content-file .file .file-info {
  display: flex;
  flex-flow: column wrap;
  justify-content: space-around;
  margin-left: 5px;
}
.content-file .file .file-info .filename {
  color: var(--text-color-regular);
  font-size: 16px;
}
.content-file .file .file-info .options .download {
  color: var(--color-primary);
  font-size: 16px;
  text-decoration: none;
}
.content-file .file .file-info .options .download:hover {
  color: var(--color-primary-light);
}
.chat footer {
  position: relative;
  background-color: var(--bg-color);
  padding: 20px 30px;
  padding-bottom: 50px;
}
.chat footer .input-area {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  background-color: var(--bg-color);
}
.chat footer .input-area .buttons {
  display: flex;
  margin-left: 20px;
}
.chat footer .input-area .buttons .send {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 40px;
  margin-left: 20px;
  background-color: var(--el-color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}
.chat footer .input-area .buttons .send:hover:not(:disabled) {
  background-color: var(--el-color-primary-light-3);
}
.chat footer .input-area .buttons .send:disabled {
  background-color: var(--el-color-primary-light-5);
  cursor: not-allowed;
}
.emoticons {
  height: 100px;
  width: 200px;
  overflow: hidden;
}
.emoticon-item {
  margin: 0;
  padding: 5px;
}
.emoticon-item span {
  font-size: 20px;
}
.emoticon-btn {
  font-size: 26px;
  background: none;
  border: none;
  cursor: pointer;
}
.emoticon-popover {
  min-width: 200px;
  min-height: 40px;
  /* 其他样式 */
}

/* 添加连接状态样式 */
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
