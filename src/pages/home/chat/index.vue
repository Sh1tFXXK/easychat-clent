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
            :src="
              isGroupChat 
                ? (groupInfo.avatar || '')
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
          <p>{{ isGroupChat ? groupInfo.groupName : friend.remark }}</p>
          <small v-if="isGroupChat" class="info">
            <icon-mdi-account-group style="font-size: 12px" />
            <span>群聊 ({{ groupInfo.memberCount || 0 }} 人)</span>
          </small>
          <small v-else-if="checkOnline(friend.userId)" class="success">
            <icon-mdi-circle style="font-size: 12px" />
            <span>在 线</span>
          </small>
          <small v-else class="info">
            <icon-mdi-circle style="font-size: 12px" />
            <span>离 线</span>
          </small>
        </div>
      </div>
      <div class="header-action">
        <el-button 
          type="success" 
          size="large" 
          text 
          title="语音通话"
          @click="startVoiceCall"
          :disabled="isInCall"
        >
          <icon-ep-phone style="font-size: 26px" />
        </el-button>
        <el-button 
          type="warning" 
          size="large" 
          text 
          title="视频通话"
          @click="startVideoCall"
          :disabled="isInCall"
        >
          <icon-ep-video-camera style="font-size: 26px" />
        </el-button>
        <el-button
          type="danger"
          size="large"
          text
          title="关闭窗口"
          @click="closeChat"
        >
          <icon-ep-close style="font-size: 26px" />
        </el-button>
      </div>
    </header>
    <el-scrollbar ref="scrollbarRef">
      <div class="chat-body" ref="chatBodyRef">
        <div class="messages" v-if="currentHistoryList.length > 0">
          <div
            class="message-item"
            v-for="message in currentHistoryList"
            :key="message.id"
            :class="{ send: message.senderId === user.userId }"
          >
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
                    isGroupChat 
                      ? (message.senderAvatar || '')
                      : (friend.avatar
                          ? friend.avatar.startsWith('http') ? friend.avatar : 'https://wc-chat.oss-cn-beijing.aliyuncs.com' + friend.avatar
                          : '')
                  "
                  :size="45"
                  @error="() => true"
                >
                  <img
                    src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png"
                  />
                </el-avatar>
                <div>
                  <span>{{ isGroupChat ? (message.senderNickName || '群成员') : friend.remark }}</span>
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
              <div v-if="message.type === 3" class="content-voice">
                <div class="voice-message" @click="playVoice(message)">
                  <div class="voice-icon">
                    <icon-ep-microphone v-if="!message.isPlaying" />
                    <icon-ep-video-pause v-else />
                  </div>
                  <div class="voice-duration">{{ message.duration || 0 }}"</div>
                  <div class="voice-waveform">
                    <div class="wave-bar" v-for="i in 5" :key="i" :class="{ active: message.isPlaying }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
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
          <el-button 
            type="info" 
            size="large" 
            link 
            :title="isRecording ? '松开发送' : '按住录音'"
            @mousedown="startRecording"
            @mouseup="stopRecording"
            @mouseleave="stopRecording"
            @touchstart="startRecording"
            @touchend="stopRecording"
            :class="{ recording: isRecording }"
          >
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

    <!-- 语音通话界面 -->
    <el-dialog 
      v-model="showCallDialog" 
      :title="callDialogTitle"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      center
    >
      <div class="call-interface">
        <!-- 通话状态显示 -->
        <div class="call-status">
          <div class="call-avatar">
            <el-avatar 
              :src="callPartner.avatar" 
              :size="80"
              @error="() => true"
            >
              <img src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png" />
            </el-avatar>
          </div>
          <div class="call-info">
            <h3>{{ callPartner.name }}</h3>
            <p class="call-status-text">{{ callStatusText }}</p>
            <p v-if="callDuration > 0" class="call-duration">{{ formatCallDuration(callDuration) }}</p>
          </div>
        </div>

        <!-- 通话控制按钮 -->
        <div class="call-controls">
          <!-- 来电时显示接听/拒绝按钮 -->
          <template v-if="callState === 'incoming'">
            <el-button 
              type="danger" 
              circle 
              size="large"
              @click="rejectCall"
            >
              <icon-ep-phone style="font-size: 24px; transform: rotate(135deg);" />
            </el-button>
            <el-button 
              type="success" 
              circle 
              size="large"
              @click="answerCall"
            >
              <icon-ep-phone style="font-size: 24px;" />
            </el-button>
          </template>

          <!-- 通话中显示挂断按钮 -->
          <template v-else-if="callState === 'connected' || callState === 'calling'">
            <el-button 
              type="info" 
              circle 
              size="large"
              @click="toggleMute"
              :class="{ 'muted': isMuted }"
            >
              <icon-ep-microphone v-if="!isMuted" style="font-size: 24px;" />
              <icon-ep-mute v-else style="font-size: 24px;" />
            </el-button>
            <el-button 
              type="danger" 
              circle 
              size="large"
              @click="endCall"
            >
              <icon-ep-phone style="font-size: 24px; transform: rotate(135deg);" />
            </el-button>
          </template>
        </div>
      </div>
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
import { reqSavePictureMsg, reqSaveFileMsg, reqGetGroupMessages, reqUploadVoice } from "@/api";
import emoticons from "./emoticons.json";

const props = defineProps({
  showChat: String,
});

const emit = defineEmits(['update:showChat', 'showSidebar']);

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

// 判断是否为群聊
const isGroupChat = computed(() => typeof showChat.value === 'string' && showChat.value.startsWith('group:'));
const currentGroupId = computed(() => isGroupChat.value ? showChat.value.substring('group:'.length) : '');

const chatList = computed(() => store.state.home.chatList);
const chatHistoryList = computed(() => store.state.home.chatHistories);
const onlineUsers = computed(() => store.state.home.onlineUsers);

// 群聊消息历史
const groupHistoryList = ref([]);

// 当前显示的消息历史（根据聊天类型动态切换）
const currentHistoryList = computed(() => {
  if (isGroupChat.value) {
    return groupHistoryList.value;
  } else {
    return chatHistoryList.value;
  }
});

// 单聊好友信息
const friend = reactive({
  userId: "",
  avatar: "",
  remark: "",
});

// 群聊信息
const groupInfo = reactive({
  groupId: "",
  groupName: "",
  avatar: "",
  memberCount: 0
});

watch(
  () => showChat.value,
  (val) => {
    if (val) {
      if (isGroupChat.value) {
        // 处理群聊
        const groupId = currentGroupId.value;
        groupInfo.groupId = groupId;
        
        // 从store中获取群聊信息
        const groupList = store.state.home.groupList || [];
        const currentGroup = groupList.find(g => g.groupId === groupId);
        
        if (currentGroup) {
          groupInfo.groupName = currentGroup.groupName || `群聊 ${groupId}`;
          groupInfo.avatar = currentGroup.avatar || '';
          groupInfo.memberCount = currentGroup.memberCount || currentGroup.members?.length || 0;
          console.log('[Chat] 找到群聊信息:', {
            groupId,
            groupName: groupInfo.groupName,
            memberCount: groupInfo.memberCount,
            rawData: currentGroup
          });
        } else {
          // 如果store中没有群聊信息，尝试重新获取
          console.log('[Chat] store中未找到群聊信息，尝试重新获取:', groupId);
          groupInfo.groupName = `群聊 ${groupId}`;
          groupInfo.avatar = '';
          groupInfo.memberCount = 0;
          
          // 异步获取群聊详情
          store.dispatch('home/getGroupList', user.userId).then(() => {
            const updatedGroupList = store.state.home.groupList || [];
            const updatedGroup = updatedGroupList.find(g => g.groupId === groupId);
            if (updatedGroup) {
              groupInfo.groupName = updatedGroup.groupName || `群聊 ${groupId}`;
              groupInfo.avatar = updatedGroup.avatar || '';
              groupInfo.memberCount = updatedGroup.memberCount || updatedGroup.members?.length || 0;
              console.log('[Chat] 重新获取群聊信息成功:', {
                groupId,
                groupName: groupInfo.groupName,
                memberCount: groupInfo.memberCount
              });
            }
          }).catch(error => {
            console.error('[Chat] 重新获取群聊信息失败:', error);
          });
        }
        
        console.log('[Chat] 切换到群聊:', groupInfo.groupId, groupInfo.groupName);
        
        // 加载群聊消息历史
        loadGroupHistory(groupId);
      } else {
        // 处理单聊
        let chat = chatList.value.find((chat) => chat.sessionId === val);
        if (chat) {
          friend.userId = chat.friendUserId;
          friend.avatar = chat.friendAvatar;
          friend.remark = chat.friendRemark ? chat.friendRemark : chat.friendNickName;
          console.log('[Chat] 切换到单聊:', friend.userId);
        }
      }
    }
  },
  {
    immediate: true,
  }
);

// 加载群聊消息历史
const loadGroupHistory = async (groupId) => {
  console.log('[Chat] 加载群聊消息历史:', groupId);
  
  // 清空当前群聊消息
  groupHistoryList.value = [];
  
  try {
    // 调用后端API获取群聊历史消息
    const response = await reqGetGroupMessages(groupId, { page: 1, pageSize: 50 });
    
    console.log('[Chat] API响应数据:', response);
    
    if (response.success && response.data && response.data.records) {
      console.log('[Chat] 原始消息数据:', response.data.records);
      // 转换后端数据格式为前端需要的格式
      const messages = response.data.records.map((msg, index) => {
        // 处理消息类型
        let messageType = 0; // 默认文本消息
        if (msg.messageType === 'image') {
          messageType = 1;
        } else if (msg.messageType === 'file') {
          messageType = 2;
        } else if (msg.messageType === 'voice') {
          messageType = 3;
        } else if (msg.messageType === 'text') {
          messageType = 0;
        }
        
        const messageData = {
          id: msg.messageId || `group_msg_${Date.now()}_${index}`,
          senderId: msg.senderId,
          senderNickName: msg.senderUsername || msg.senderNickName || '群成员',
          senderAvatar: msg.senderAvatar || '',
          content: msg.content,
          type: messageType,
          createTime: msg.sentAt || msg.createTime,
          showTime: 1 // 暂时都显示时间，后续可以优化
        };
        
        // 如果是语音消息，添加语音特有属性
        if (messageType === 3) {
          messageData.duration = msg.duration || 0;
          messageData.isPlaying = false;
        }
        
        return messageData;
      });
      
      groupHistoryList.value = messages;
      console.log('[Chat] 成功加载群聊消息历史:', messages.length, '条');
    } else {
      console.log('[Chat] 群聊消息历史为空或加载失败');
    }
  } catch (error) {
    console.error('[Chat] 加载群聊消息历史失败:', error);
    ElMessage.error('加载群聊消息历史失败');
  }
  
  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
};

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
  if (!messageText || !showChat.value) {
    return;
  }
  
  // 检查是否为群聊或单聊
  if (!isGroupChat.value && !friend.userId) {
    return;
  }

  // 2. 保存原始文本以备发送失败时恢复
  const originalText = inputValue.value;
  inputValue.value = '';  // 先清空输入框

  try {
    if (isGroupChat.value) {
      // 群聊消息处理
      console.log('[Send] 发送群聊消息');
      
      // 直接通过Socket发送群聊消息
      const messageData = {
        groupId: currentGroupId.value,
        senderId: user.userId,
        senderNickName: user.nickName,
        content: messageText,
        messageType: 'text', // 后端期望字符串类型
        sentAt: null, // 后端会自动设置
        messageId: null // 后端会自动生成
      };
      
      console.log('[Send] 准备发送群聊消息数据:', messageData);
      
      // 先进行乐观更新，立即显示消息
      const optimisticMessage = {
        id: Date.now(),
        senderId: user.userId,
        senderNickName: user.nickName,
        senderAvatar: user.avatar || '',
        content: messageText,
        type: 0, // 文本消息
        createTime: new Date().toISOString(),
        showTime: 1
      };
      
      groupHistoryList.value.push(optimisticMessage);
      scrollToBottom();
      console.log('[Send] 乐观更新完成，消息已显示');
      
      socket.emit('sendGroupMsg', messageData, (response) => {
        console.log('[Send] 群聊消息发送回调:', response);
        
        // 如果发送失败，移除乐观更新的消息
        if (response !== 'success' && !(Array.isArray(response) && response[0] === 'success')) {
          console.error('[Send] 群聊消息发送失败，移除乐观更新:', response);
          const index = groupHistoryList.value.findIndex(msg => msg.id === optimisticMessage.id);
          if (index !== -1) {
            groupHistoryList.value.splice(index, 1);
          }
          ElMessage.error('群聊消息发送失败');
          // 恢复输入框内容
          inputValue.value = originalText;
        } else {
          console.log('[Send] 群聊消息发送成功确认');
        }
      });
      
      console.log('[Send] 群聊消息已发送到Socket');
    } else {
      // 单聊消息处理
      console.log('[Send] 发送单聊消息');
      
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

      // 通过 Vuex 发送单聊消息
      const response = await store.dispatch('socket/sendMessage', { socket, message });
      
      if (response) {
        console.log('[Send] 单聊发送成功，服务器返回:', response);
        
        // 更新聊天记录
        chatHistoryList.value.push(response);
        
        // 更新会话列表
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
      }
    }

    // 滚动到底部
    nextTick(() => {
      if (scrollbarRef.value) {
        scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
      }
    });

    // 获得输入框焦点
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus();
      }
    });
    
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

// 语音录制相关变量
const isRecording = ref(false);
const mediaRecorder = ref(null);
const audioChunks = ref([]);
const recordingStartTime = ref(0);
const recordingTimer = ref(null);
const recordingDuration = ref(0);

// 语音通话相关变量
const showCallDialog = ref(false);
const callState = ref(''); // 'calling', 'incoming', 'connected', 'ended'
const currentCallId = ref('');
const isInCall = ref(false);
const isMuted = ref(false);
const callDuration = ref(0);
const callTimer = ref(null);
const callStartTime = ref(0);

// WebRTC相关
const localStream = ref(null);
const remoteStream = ref(null);
const peerConnection = ref(null);
const iceCandidatesQueue = ref([]);

// 通话伙伴信息
const callPartner = reactive({
  id: '',
  name: '',
  avatar: ''
});

// 音效相关
const callAudio = ref(null);
const ringtoneAudio = ref(null);
const endCallAudio = ref(null);

// 通话状态文本
const callStatusText = computed(() => {
  switch (callState.value) {
    case 'calling':
      return '正在呼叫...';
    case 'incoming':
      return '来电';
    case 'connected':
      return '通话中';
    case 'ended':
      return '通话结束';
    default:
      return '';
  }
});

// 通话对话框标题
const callDialogTitle = computed(() => {
  return callState.value === 'incoming' ? '来电' : '语音通话';
});

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
          scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
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
          scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
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

// 语音录制相关方法
const startRecording = async () => {
  if (isRecording.value) return;
  
  try {
    console.log('[Voice] 开始录音...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    mediaRecorder.value = new MediaRecorder(stream);
    audioChunks.value = [];
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data);
      }
    };
    
    mediaRecorder.value.onstop = () => {
      console.log('[Voice] 录音结束，处理音频数据...');
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' });
      sendVoiceMessage(audioBlob);
      
      // 停止所有音频轨道
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.value.start();
    isRecording.value = true;
    recordingStartTime.value = Date.now();
    
    // 开始计时
    recordingTimer.value = setInterval(() => {
      recordingDuration.value = Math.floor((Date.now() - recordingStartTime.value) / 1000);
      
      // 最大录制60秒
      if (recordingDuration.value >= 60) {
        stopRecording();
      }
    }, 100);
    
    ElMessage.info('开始录音，松开发送');
    
  } catch (error) {
    console.error('[Voice] 录音失败:', error);
    ElMessage.error('无法访问麦克风，请检查权限设置');
  }
};

const stopRecording = () => {
  if (!isRecording.value || !mediaRecorder.value) return;
  
  console.log('[Voice] 停止录音...');
  
  // 检查录音时长
  const duration = Math.floor((Date.now() - recordingStartTime.value) / 1000);
  if (duration < 1) {
    ElMessage.warning('录音时间太短，请重新录制');
    cancelRecording();
    return;
  }
  
  isRecording.value = false;
  recordingDuration.value = duration;
  
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value);
    recordingTimer.value = null;
  }
  
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop();
  }
};

const cancelRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop();
  }
  
  isRecording.value = false;
  recordingDuration.value = 0;
  
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value);
    recordingTimer.value = null;
  }
  
  // 停止所有音频轨道
  if (mediaRecorder.value && mediaRecorder.value.stream) {
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop());
  }
};

const sendVoiceMessage = async (audioBlob) => {
  try {
    console.log('[Voice] 准备发送语音消息...');
    
    // 创建FormData上传音频文件
    const formData = new FormData();
    const fileName = `voice_${Date.now()}.wav`;
    formData.append('file', audioBlob, fileName);
    formData.append('senderId', user.userId);
    
    if (isGroupChat.value) {
      formData.append('receiverId', currentGroupId.value);
      formData.append('chatType', '1'); // 群聊
    } else {
      formData.append('receiverId', friend.userId);
      formData.append('chatType', '0'); // 私聊
    }
    
    // 上传音频文件到服务器
    ElMessage.info('正在上传语音...');
    
    const uploadResponse = await reqUploadVoice(formData);
    
    if (!uploadResponse.success) {
      throw new Error(uploadResponse.message || '语音上传失败');
    }
    
    const voiceUrl = uploadResponse.data;
    
    // 构建语音消息数据
    const voiceMessage = {
      senderId: user.userId,
      receiverId: isGroupChat.value ? currentGroupId.value : friend.userId,
      chatType: isGroupChat.value ? 1 : 0, // 1为群聊，0为私聊
      fileUrl: voiceUrl,
      fileName: fileName,
      fileSize: audioBlob.size,
      duration: recordingDuration.value,
      createTime: new Date()
    };
    
    console.log('[Voice] 发送语音消息数据:', voiceMessage);
    
    // 乐观更新 - 立即显示语音消息
    const optimisticMessage = {
      id: Date.now(),
      senderId: user.userId,
      senderNickName: user.nickName,
      senderAvatar: user.avatar || '',
      content: voiceUrl,
      type: 3, // 语音消息类型
      duration: recordingDuration.value,
      createTime: new Date().toISOString(),
      showTime: 1,
      isPlaying: false
    };
    
    if (isGroupChat.value) {
      groupHistoryList.value.push(optimisticMessage);
    } else {
      chatHistoryList.value.push(optimisticMessage);
    }
    
    scrollToBottom();
    
    // 通过Socket发送语音消息
    socket.emit('sendVoice', voiceMessage, (response) => {
      console.log('[Voice] 语音消息发送回调:', response);
      
      if (response && response.success) {
        console.log('[Voice] 语音消息发送成功');
        ElMessage.success('语音发送成功');
      } else {
        console.error('[Voice] 语音消息发送失败:', response);
        ElMessage.error('语音发送失败');
        
        // 移除乐观更新的消息
        const targetList = isGroupChat.value ? groupHistoryList.value : chatHistoryList.value;
        const index = targetList.findIndex(msg => msg.id === optimisticMessage.id);
        if (index !== -1) {
          targetList.splice(index, 1);
        }
      }
    });
    
  } catch (error) {
    console.error('[Voice] 发送语音消息失败:', error);
    ElMessage.error('语音发送失败');
  }
};

// 播放语音消息
const playVoice = (message) => {
  if (message.isPlaying) {
    // 如果正在播放，则停止
    stopVoicePlayback(message);
    return;
  }
  
  console.log('[Voice] 播放语音:', message.content);
  
  const audio = new Audio(message.content);
  message.isPlaying = true;
  
  audio.onended = () => {
    message.isPlaying = false;
  };
  
  audio.onerror = () => {
    message.isPlaying = false;
    ElMessage.error('语音播放失败');
  };
  
  audio.play().catch(error => {
    console.error('[Voice] 播放失败:', error);
    message.isPlaying = false;
    ElMessage.error('语音播放失败');
  });
};

const stopVoicePlayback = (message) => {
  message.isPlaying = false;
  // 这里可以添加停止音频播放的逻辑
};

// 滚动到底部函数
const scrollToBottom = () => {
  nextTick(() => {
    if (scrollbarRef.value && chatBodyRef.value) {
      scrollbarRef.value.setScrollTop(chatBodyRef.value.scrollHeight);
    }
  });
};

// 音效播放方法
const playCallSound = (type) => {
  try {
    // 创建音频上下文和振荡器来生成简单的音效
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case 'calling':
        // 拨号音 - 低频持续音
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
        break;
      case 'ringtone':
        // 来电铃声 - 高频间断音
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'end':
        // 挂断音 - 短促低音
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
    }
  } catch (error) {
    console.log('[Call] 音效播放失败:', error);
  }
};

// 语音通话相关方法
const startVoiceCall = async () => {
  if (isInCall.value) {
    ElMessage.warning('当前正在通话中');
    return;
  }

  // 检查用户ID是否有效
  if (!user.userId) {
    console.error('[Call] 用户ID无效，无法发起通话');
    ElMessage.error('用户信息无效，请重新登录');
    return;
  }

  // 检查接收者ID是否有效
  const receiverId = isGroupChat.value ? currentGroupId.value : friend.userId;
  if (!receiverId) {
    console.error('[Call] 接收者ID无效，无法发起通话');
    ElMessage.error('接收者信息无效');
    return;
  }

  try {
    console.log('[Call] 发起语音通话');
    
    // 播放拨号音
    playCallSound('calling');
    
    // 获取本地音频流
    localStream.value = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: false 
    });
    
    // 创建WebRTC连接
    await createPeerConnection();
    
    // 添加本地流到连接
    localStream.value.getTracks().forEach(track => {
      peerConnection.value.addTrack(track, localStream.value);
    });
    
    // 创建offer
    const offer = await peerConnection.value.createOffer();
    await peerConnection.value.setLocalDescription(offer);
    
    // 设置通话状态
    callState.value = 'calling';
    isInCall.value = true;
    showCallDialog.value = true;
    
    // 设置通话伙伴信息
    if (isGroupChat.value) {
      callPartner.id = currentGroupId.value;
      callPartner.name = groupInfo.groupName;
      callPartner.avatar = groupInfo.avatar;
    } else {
      callPartner.id = friend.userId;
      callPartner.name = friend.remark;
      callPartner.avatar = friend.avatar;
    }
    
    // 发送通话请求到服务器
    const callRequest = {
      callerId: user.userId,
      receiverId: isGroupChat.value ? currentGroupId.value : friend.userId,
      callType: 'audio',
      sdpOffer: offer
    };
    
    console.log('[Call] 发送通话请求:', callRequest);
    console.log('[Call] 当前用户ID:', user.userId);
    console.log('[Call] 用户对象:', user);
    console.log('[Call] 接收者ID:', isGroupChat.value ? currentGroupId.value : friend.userId);
    console.log('[Call] 好友对象:', friend);
    console.log('[Call] 是否群聊:', isGroupChat.value);
    console.log('[Call] Socket连接状态:', socket.connected);
    console.log('[Call] Socket ID:', socket.id);
    
    socket.emit('startVoiceCall', callRequest, (response, error) => {
      console.log('[Call] 通话请求响应:', response);
      console.log('[Call] 通话请求错误:', error);
      console.log('[Call] 响应类型:', typeof response);
      
      if (response && response.success) {
        currentCallId.value = response.callId;
        console.log('[Call] 通话请求发送成功, callId:', response.callId);
      } else {
        console.error('[Call] 通话请求失败:', response, error);
        endCall();
        
        // 处理不同的错误情况
        if (error === 'receiver_offline') {
          ElMessage.error('对方不在线，无法发起通话');
        } else if (error === 'receiver_busy') {
          ElMessage.error('对方正在通话中，请稍后再试');
        } else if (error === 'invalid_caller_id') {
          ElMessage.error('身份验证失败，请重新登录');
        } else if (response === null) {
          ElMessage.error('服务器无响应，请检查网络连接');
        } else {
          ElMessage.error('发起通话失败，请稍后再试');
        }
      }
    });
    
  } catch (error) {
    console.error('[Call] 发起通话失败:', error);
    ElMessage.error('无法访问麦克风，请检查权限设置');
    endCall();
  }
};

const startVideoCall = async () => {
  if (isInCall.value) {
    ElMessage.warning('当前正在通话中');
    return;
  }

  // 检查用户ID是否有效
  if (!user.userId) {
    console.error('[Call] 用户ID无效，无法发起视频通话');
    ElMessage.error('用户信息无效，请重新登录');
    return;
  }

  // 检查接收者ID是否有效
  const receiverId = isGroupChat.value ? currentGroupId.value : friend.userId;
  if (!receiverId) {
    console.error('[Call] 接收者ID无效，无法发起视频通话');
    ElMessage.error('接收者信息无效');
    return;
  }

  try {
    console.log('[Call] 发起视频通话');
    
    // 播放拨号音
    playCallSound('calling');
    
    // 获取本地音视频流
    localStream.value = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: true 
    });
    
    // 创建WebRTC连接
    await createPeerConnection();
    
    // 添加本地流到连接
    localStream.value.getTracks().forEach(track => {
      peerConnection.value.addTrack(track, localStream.value);
    });
    
    // 创建offer
    const offer = await peerConnection.value.createOffer();
    await peerConnection.value.setLocalDescription(offer);
    
    // 设置通话状态
    callState.value = 'calling';
    isInCall.value = true;
    showCallDialog.value = true;
    
    // 设置通话伙伴信息
    if (isGroupChat.value) {
      callPartner.id = currentGroupId.value;
      callPartner.name = groupInfo.groupName;
      callPartner.avatar = groupInfo.avatar;
    } else {
      callPartner.id = friend.userId;
      callPartner.name = friend.remark;
      callPartner.avatar = friend.avatar;
    }
    
    // 发送通话请求到服务器
    const callRequest = {
      callerId: user.userId,
      receiverId: isGroupChat.value ? currentGroupId.value : friend.userId,
      callType: 'video',
      sdpOffer: offer
    };
    
    console.log('[Call] 发送视频通话请求:', callRequest);
    console.log('[Call] 当前用户ID:', user.userId);
    console.log('[Call] 接收者ID:', isGroupChat.value ? currentGroupId.value : friend.userId);
    console.log('[Call] 是否群聊:', isGroupChat.value);
    
    socket.emit('startVoiceCall', callRequest, (response, error) => {
      console.log('[Call] 视频通话请求响应:', response);
      console.log('[Call] 视频通话请求错误:', error);
      console.log('[Call] 响应类型:', typeof response);
      
      if (response && response.success) {
        currentCallId.value = response.callId;
        console.log('[Call] 视频通话请求发送成功, callId:', response.callId);
      } else {
        console.error('[Call] 视频通话请求失败:', response, error);
        endCall();
        
        // 处理不同的错误情况
        if (error === 'receiver_offline') {
          ElMessage.error('对方不在线，无法发起视频通话');
        } else if (error === 'receiver_busy') {
          ElMessage.error('对方正在通话中，请稍后再试');
        } else if (error === 'invalid_caller_id') {
          ElMessage.error('身份验证失败，请重新登录');
        } else if (response === null) {
          ElMessage.error('服务器无响应，请检查网络连接');
        } else {
          ElMessage.error('发起通话失败');
        }
      }
    });
    
  } catch (error) {
    console.error('[Call] 发起视频通话失败:', error);
    ElMessage.error('无法访问摄像头和麦克风，请检查权限设置');
    endCall();
  }
};

const answerCall = async () => {
  try {
    console.log('[Call] 接听通话');
    
    // 获取本地音频流
    const constraints = callState.value === 'video' ? 
      { audio: true, video: true } : 
      { audio: true, video: false };
      
    localStream.value = await navigator.mediaDevices.getUserMedia(constraints);
    
    // 创建WebRTC连接
    await createPeerConnection();
    
    // 添加本地流到连接
    localStream.value.getTracks().forEach(track => {
      peerConnection.value.addTrack(track, localStream.value);
    });
    
    // 设置远程SDP offer（如果有的话）
    if (window.pendingSdpOffer && peerConnection.value) {
      console.log('[Call] 设置远程SDP offer');
      await peerConnection.value.setRemoteDescription(new RTCSessionDescription(window.pendingSdpOffer));
      window.pendingSdpOffer = null; // 清除暂存的offer
    }
    
    // 创建answer
    const answer = await peerConnection.value.createAnswer();
    await peerConnection.value.setLocalDescription(answer);
    
    // 发送answer到服务器
    if (currentCallId.value) {
      const answerRequest = {
        callId: currentCallId.value,
        sdpAnswer: answer
      };
      
      socket.emit('answerCall', answerRequest, (response) => {
        console.log('[Call] 接听响应:', response);
        
        if (response && response.success) {
          callState.value = 'connected';
          startCallTimer();
          console.log('[Call] 通话已接通');
        } else {
          console.error('[Call] 接听失败:', response);
          endCall();
          ElMessage.error('接听失败');
        }
      });
    } else {
      console.error('[Call] 接听通话时callId为空');
      ElMessage.error('接听失败：通话ID无效');
      endCall();
    }
    
  } catch (error) {
    console.error('[Call] 接听失败:', error);
    ElMessage.error('无法访问麦克风，请检查权限设置');
    endCall();
  }
};

const rejectCall = () => {
  console.log('[Call] 拒绝通话');
  
  if (currentCallId.value) {
    const rejectRequest = {
      callId: currentCallId.value,
      reason: 'rejected'
    };
    
    socket.emit('rejectCall', rejectRequest, (response) => {
      console.log('[Call] 拒绝响应:', response);
    });
  } else {
    console.warn('[Call] 拒绝通话时callId为空，跳过发送请求');
  }
  
  endCall();
};

const endCall = () => {
  console.log('[Call] 结束通话');
  
  // 播放挂断音
  playCallSound('end');
  
  // 发送结束通话请求
  if (currentCallId.value) {
    socket.emit('endCall', currentCallId.value, (response) => {
      console.log('[Call] 结束通话响应:', response);
    });
  } else {
    console.warn('[Call] 结束通话时callId为空，跳过发送请求');
  }
  
  // 清理资源
  cleanupCall();
};

const toggleMute = () => {
  if (localStream.value) {
    const audioTrack = localStream.value.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      isMuted.value = !audioTrack.enabled;
      console.log('[Call] 静音状态:', isMuted.value);
    }
  }
};

const createPeerConnection = async () => {
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };
  
  peerConnection.value = new RTCPeerConnection(configuration);
  
  // 处理ICE候选
  peerConnection.value.onicecandidate = (event) => {
    if (event.candidate && currentCallId.value) {
      console.log('[Call] 发送ICE候选:', event.candidate);
      
      const candidateRequest = {
        callId: currentCallId.value,
        candidate: event.candidate
      };
      
      socket.emit('iceCandidate', candidateRequest);
    } else if (event.candidate && !currentCallId.value) {
      console.warn('[Call] ICE候选生成但callId为空，跳过发送');
    }
  };
  
  // 处理远程流
  peerConnection.value.ontrack = (event) => {
    console.log('[Call] 收到远程流:', event.streams[0]);
    remoteStream.value = event.streams[0];
    
    // 播放远程音频
    const remoteAudio = new Audio();
    remoteAudio.srcObject = remoteStream.value;
    remoteAudio.play().catch(error => {
      console.error('[Call] 播放远程音频失败:', error);
    });
  };
  
  // 连接状态变化
  peerConnection.value.onconnectionstatechange = () => {
    console.log('[Call] 连接状态:', peerConnection.value.connectionState);
    
    if (peerConnection.value.connectionState === 'connected') {
      callState.value = 'connected';
      startCallTimer();
    } else if (peerConnection.value.connectionState === 'disconnected' || 
               peerConnection.value.connectionState === 'failed') {
      endCall();
    }
  };
};

const startCallTimer = () => {
  callStartTime.value = Date.now();
  callTimer.value = setInterval(() => {
    callDuration.value = Math.floor((Date.now() - callStartTime.value) / 1000);
  }, 1000);
};

const formatCallDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const cleanupCall = () => {
  // 停止计时器
  if (callTimer.value) {
    clearInterval(callTimer.value);
    callTimer.value = null;
  }
  
  // 关闭媒体流
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop());
    localStream.value = null;
  }
  
  if (remoteStream.value) {
    remoteStream.value.getTracks().forEach(track => track.stop());
    remoteStream.value = null;
  }
  
  // 关闭WebRTC连接
  if (peerConnection.value) {
    peerConnection.value.close();
    peerConnection.value = null;
  }
  
  // 重置状态
  callState.value = '';
  currentCallId.value = '';
  isInCall.value = false;
  isMuted.value = false;
  callDuration.value = 0;
  showCallDialog.value = false;
  
  // 清空通话伙伴信息
  callPartner.id = '';
  callPartner.name = '';
  callPartner.avatar = '';
  
  // 清空ICE候选队列
  iceCandidatesQueue.value = [];
  
  console.log('[Call] 通话资源已清理');
};

onMounted(() => {
  console.log('[Socket][UI] 注册群聊消息监听器');
  // 监听单聊消息
  socket.on("receiveMsg", async (message) => {
    console.log('[Socket] 收到单聊消息:', message);
    
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
      scrollToBottom();
      
      // 标记消息已读
      if (message.hasRead === 0) {
        socket.emit('markMessageRead', {
          sessionId: message.sessionId,
          messageId: message.id
        });
      }
    }
  });

  // 监听群聊消息
  socket.on("receiveGroupMsg", async (message) => {
    try {
      console.log('[Socket][UI] 收到群聊消息原始:', JSON.stringify(message));
      
      // 容错：字段校验
      if (!message || !message.groupId || !message.content) {
        console.error('[Socket][UI] 群聊消息缺关键字段:', message);
        return;
      }

      // 统一 groupId 类型
      const msgGroupId = String(message.groupId);
      const curGroupId = String(currentGroupId.value || '');
      
      console.log('[Socket][UI] 消息群ID:', msgGroupId, '当前群ID:', curGroupId, '是否群聊:', isGroupChat.value);

      // 非当前群也提示一次，证明"已收到"
      if (!isGroupChat.value || curGroupId !== msgGroupId) {
        console.log('[Socket][UI] 收到非当前群的消息, msgGroupId=', msgGroupId, 'curGroupId=', curGroupId, 'isGroupChat=', isGroupChat.value);
        // 可选：提示收到其他群的消息
        return;
      }

      // 跳过自己（乐观更新已显示）
      if (String(message.senderId) === String(user.userId)) {
        console.log('[Socket][UI] 自己的广播，已乐观显示，跳过');
        return;
      }

      const newMessage = {
        id: message.messageId || Date.now(),
        senderId: String(message.senderId || ''),
        senderNickName: message.senderUsername || message.senderNickName || '群成员',
        senderAvatar: message.senderAvatar || '',
        content: message.content,
        type: message.messageType === 'text' ? 0 : (message.messageType || 0),
        createTime: message.sentAt || message.createTime || new Date().toISOString(),
        showTime: 1
      };

      groupHistoryList.value.push(newMessage);
      console.log('[Socket][UI] 已追加到当前群历史，长度=', groupHistoryList.value.length);
      console.log('[Socket][UI] 新消息内容:', newMessage);
      
      // 滚动到底部
      scrollToBottom();
      
      console.log('[Socket][UI] 其他用户的群聊消息已添加到历史记录');
    } catch (err) {
      console.error('[Socket][UI] 处理群聊消息异常:', err);
    }
  });

  // 监听私聊语音消息
  socket.on("receiveVoice", (voiceData) => {
    try {
      console.log('[Socket][UI] 收到私聊语音消息:', voiceData);
      
      // 检查是否是当前聊天窗口的消息
      if (!isGroupChat.value && friend.userId === voiceData.senderId) {
        const newMessage = {
          id: voiceData.messageId || Date.now(),
          senderId: voiceData.senderId,
          senderNickName: voiceData.senderName || '用户',
          senderAvatar: '',
          content: voiceData.voiceUrl,
          type: 3, // 语音消息类型
          duration: voiceData.duration || 0,
          createTime: voiceData.createTime || new Date().toISOString(),
          showTime: 1,
          isPlaying: false
        };
        
        chatHistoryList.value.push(newMessage);
        scrollToBottom();
        console.log('[Socket][UI] 私聊语音消息已添加到历史记录');
      }
    } catch (err) {
      console.error('[Socket][UI] 处理私聊语音消息异常:', err);
    }
  });

  // 监听群聊语音消息
  socket.on("receiveGroupVoice", (voiceData) => {
    try {
      console.log('[Socket][UI] 收到群聊语音消息:', voiceData);
      
      // 检查是否是当前群聊的消息
      const msgGroupId = String(voiceData.receiverId);
      const curGroupId = String(currentGroupId.value || '');
      
      if (isGroupChat.value && curGroupId === msgGroupId) {
        // 跳过自己发送的消息（乐观更新已显示）
        if (String(voiceData.senderId) !== String(user.userId)) {
          const newMessage = {
            id: voiceData.messageId || Date.now(),
            senderId: voiceData.senderId,
            senderNickName: voiceData.senderName || '群成员',
            senderAvatar: '',
            content: voiceData.voiceUrl,
            type: 3, // 语音消息类型
            duration: voiceData.duration || 0,
            createTime: voiceData.createTime || new Date().toISOString(),
            showTime: 1,
            isPlaying: false
          };
          
          groupHistoryList.value.push(newMessage);
          scrollToBottom();
          console.log('[Socket][UI] 群聊语音消息已添加到历史记录');
        }
      }
    } catch (err) {
      console.error('[Socket][UI] 处理群聊语音消息异常:', err);
    }
  });

  // 监听来电
  socket.on("incomingCall", (callData) => {
    try {
      console.log('[Call] 收到来电事件:', callData);
      console.log('[Call] 当前Socket连接状态:', socket.connected);
      console.log('[Call] 当前Socket ID:', socket.id);
      console.log('[Call] 来电数据详情:', JSON.stringify(callData));
      
      if (isInCall.value) {
        console.log('[Call] 当前正在通话中，自动拒绝来电');
        // 如果正在通话中，自动拒绝
        socket.emit('rejectCall', {
          callId: callData.callId,
          reason: 'busy'
        });
        return;
      }
      
      // 验证来电数据
      if (!callData || !callData.callId || !callData.caller) {
        console.error('[Call] 来电数据无效:', callData);
        return;
      }
      
      // 设置来电状态
      currentCallId.value = callData.callId;
      callState.value = 'incoming';
      isInCall.value = true;
      showCallDialog.value = true;
      
      // 设置来电者信息
      callPartner.id = callData.caller.id || callData.caller.userId;
      callPartner.name = callData.callerName || callData.caller.nickName || '未知用户';
      callPartner.avatar = callData.callerAvatar || callData.caller.avatar || '';
      
      console.log('[Call] 来电者信息:', {
        id: callPartner.id,
        name: callPartner.name,
        avatar: callPartner.avatar
      });
      
      // 播放来电铃声
      playCallSound('ringtone');
      
      // 暂存SDP offer，在接听时再处理
      if (callData.sdpOffer) {
        console.log('[Call] 暂存SDP offer');
        // 将SDP offer存储到全局变量中，在接听时使用
        window.pendingSdpOffer = callData.sdpOffer;
      }
      
      console.log('[Call] 来电界面已显示，等待用户操作');
      
    } catch (err) {
      console.error('[Call] 处理来电异常:', err);
      ElMessage.error('处理来电时发生错误');
    }
  });

  // 监听群组来电
  socket.on("incomingGroupCall", (callData) => {
    try {
      console.log('[Call] 收到群组来电:', callData);
      
      if (isInCall.value) {
        // 如果正在通话中，自动拒绝
        socket.emit('rejectCall', {
          callId: callData.callId,
          reason: 'busy'
        });
        return;
      }
      
      // 设置来电状态
      currentCallId.value = callData.callId;
      callState.value = 'incoming';
      isInCall.value = true;
      showCallDialog.value = true;
      
      // 设置来电者信息
      callPartner.id = callData.caller.userId;
      callPartner.name = `${callData.callerName || callData.caller.nickName} (群通话)`;
      callPartner.avatar = callData.callerAvatar || callData.caller.avatar;
      
      // 播放来电铃声
      playCallSound('ringtone');
      
      console.log('[Call] 群组来电界面已显示');
      
    } catch (err) {
      console.error('[Call] 处理群组来电异常:', err);
    }
  });

  // 监听通话被接听
  socket.on("callAnswered", (answerData) => {
    try {
      console.log('[Call] 通话被接听:', answerData);
      
      if (peerConnection.value && answerData.sdpAnswer) {
        peerConnection.value.setRemoteDescription(new RTCSessionDescription(answerData.sdpAnswer));
        callState.value = 'connected';
        startCallTimer();
      }
      
    } catch (err) {
      console.error('[Call] 处理通话接听异常:', err);
    }
  });

  // 监听通话被拒绝
  socket.on("callRejected", (rejectData) => {
    try {
      console.log('[Call] 通话被拒绝:', rejectData);
      
      ElMessage.info('对方拒绝了通话');
      endCall();
      
    } catch (err) {
      console.error('[Call] 处理通话拒绝异常:', err);
    }
  });

  // 监听通话结束
  socket.on("callEnded", (endData) => {
    try {
      console.log('[Call] 通话结束:', endData);
      
      ElMessage.info('通话已结束');
      cleanupCall();
      
    } catch (err) {
      console.error('[Call] 处理通话结束异常:', err);
    }
  });

  // 监听ICE候选
  socket.on("iceCandidate", (candidateData) => {
    try {
      console.log('[Call] 收到ICE候选:', candidateData);
      
      if (peerConnection.value && candidateData.candidate) {
        peerConnection.value.addIceCandidate(new RTCIceCandidate(candidateData.candidate));
      }
      
    } catch (err) {
      console.error('[Call] 处理ICE候选异常:', err);
    }
  });
});

// 关闭聊天窗口的方法
const closeChat = () => {
  console.log('[Chat] 关闭聊天窗口');
  // 发送事件通知父组件恢复侧边栏（不指定具体菜单，让父组件决定恢复到哪个菜单）
  emit('showSidebar');
  // 清空当前聊天
  emit('update:showChat', '');
};

// 组件卸载时清理Socket监听器
onBeforeUnmount(() => {
  socket.off("receiveMsg");
  socket.off("receiveGroupMsg");
  socket.off("receiveVoice");
  socket.off("receiveGroupVoice");
  socket.off("incomingCall");
  socket.off("incomingGroupCall");
  socket.off("callAnswered");
  socket.off("callRejected");
  socket.off("callEnded");
  socket.off("iceCandidate");
  
  // 清理通话资源
  cleanupCall();
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

/* 语音消息样式 */
.chat-body .messages .message-item .message .content-voice {
  display: block;
  margin-left: 45px;
}
.chat-body .messages .message-item.send .message .content-voice {
  margin-left: 0;
  margin-right: 45px;
  display: flex;
  justify-content: flex-end;
}

.voice-message {
  display: flex;
  align-items: center;
  background-color: var(--color-info-light-8);
  border-radius: 20px;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.3s;
  max-width: 200px;
}

.voice-message:hover {
  background-color: var(--color-info-light-7);
}

.chat-body .messages .message-item.send .message .voice-message {
  background-color: var(--color-primary-light-8);
}

.chat-body .messages .message-item.send .message .voice-message:hover {
  background-color: var(--color-primary-light-7);
}

.voice-icon {
  display: flex;
  align-items: center;
  font-size: 18px;
  color: var(--color-primary);
  margin-right: 8px;
}

.voice-duration {
  font-size: 14px;
  color: var(--text-color-regular);
  margin-right: 10px;
  min-width: 20px;
}

.voice-waveform {
  display: flex;
  align-items: center;
  gap: 2px;
}

.wave-bar {
  width: 3px;
  height: 12px;
  background-color: var(--color-info-light-5);
  border-radius: 1px;
  transition: all 0.3s;
}

.wave-bar.active {
  background-color: var(--color-primary);
  animation: wave-animation 1s infinite;
}

.wave-bar:nth-child(1) { animation-delay: 0s; }
.wave-bar:nth-child(2) { animation-delay: 0.1s; }
.wave-bar:nth-child(3) { animation-delay: 0.2s; }
.wave-bar:nth-child(4) { animation-delay: 0.3s; }
.wave-bar:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave-animation {
  0%, 100% { height: 12px; }
  50% { height: 20px; }
}

/* 录音按钮样式 */
.recording {
  background-color: var(--color-danger-light-8) !important;
  color: var(--color-danger) !important;
  animation: recording-pulse 1s infinite;
}

@keyframes recording-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
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

/* 通话界面样式 */
.call-interface {
  text-align: center;
  padding: 20px;
}

.call-status {
  margin-bottom: 30px;
}

.call-avatar {
  margin-bottom: 15px;
}

.call-info h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: var(--text-color-primary);
}

.call-status-text {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: var(--text-color-regular);
}

.call-duration {
  margin: 0;
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 600;
}

.call-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.call-controls .el-button {
  width: 60px;
  height: 60px;
}

.call-controls .el-button.muted {
  background-color: var(--color-warning);
  border-color: var(--color-warning);
}

.call-controls .el-button.muted:hover {
  background-color: var(--color-warning-light-3);
  border-color: var(--color-warning-light-3);
}
</style>
