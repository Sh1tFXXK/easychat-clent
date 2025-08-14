# EasyChat 后端 API 文档

## 1. 项目概述

EasyChat 是一个基于 Spring Boot 和 Vue.js 的实时聊天应用，提供一对一聊天、好友管理等功能。

## 2. 技术栈

- 后端：Spring Boot 2.7.x, Spring Security, JWT, WebSocket (Socket.IO), MySQL, Redis
- 前端：Vue 3, Vuex, Socket.IO Client, Element Plus

## 3. 基础 URL

- API 基础 URL: `http://localhost:8081/api`
- WebSocket URL: `http://localhost:8081`

## 4. WebSocket 连接配置

前端 Socket.IO 连接配置：

```javascript
const socket = io('http://localhost:8081', {
  path: "/socket.io",
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
})

// 添加 socket 连接状态监听
socket.on('connect', () => {
  console.log('[Socket] 连接成功')
})

socket.on('connect_error', (error) => {
  console.error('[Socket] 连接错误:', error)
})

socket.on('disconnect', (reason) => {
  console.log('[Socket] 连接断开, 原因:', reason)
})

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('[Socket] 尝试重连, 次数:', attemptNumber)
})
```

## 5. 数据库表结构

### 5.1 用户表 (users)

| 字段名      | 类型         | 描述                   |
|------------|--------------|----------------------|
| user_id    | VARCHAR(20)  | 主键，用户ID           |
| username   | VARCHAR(50)  | 用户名                 |
| password   | VARCHAR(100) | 密码（加密存储）        |
| nick_name  | VARCHAR(50)  | 昵称                   |
| avatar     | VARCHAR(255) | 头像URL                |
| email      | VARCHAR(100) | 邮箱                   |
| status     | TINYINT      | 状态：0-离线，1-在线     |
| create_time| DATETIME     | 创建时间                |
| update_time| DATETIME     | 更新时间                |

### 5.2 用户标签表 (user_tags)

| 字段名      | 类型         | 描述                   |
|------------|--------------|----------------------|
| tag_id     | BIGINT       | 主键，标签ID           |
| user_id    | VARCHAR(20)  | 用户ID                 |
| tag_name   | VARCHAR(50)  | 标签名称               |
| create_time| DATETIME     | 创建时间                |

### 5.3 用户好友表 (user_friends)

| 字段名         | 类型         | 描述                   |
|---------------|--------------|----------------------|
| id            | BIGINT       | 主键                   |
| user_id       | VARCHAR(20)  | 用户ID                 |
| friend_user_id| VARCHAR(20)  | 好友用户ID             |
| friend_remark | VARCHAR(50)  | 好友备注               |
| create_time   | DATETIME     | 创建时间                |

### 5.4 好友验证表 (friend_verifies)

| 字段名       | 类型         | 描述                                      |
|-------------|--------------|------------------------------------------|
| id          | BIGINT       | 主键                                      |
| sender_id   | VARCHAR(20)  | 发送者ID                                  |
| receiver_id | VARCHAR(20)  | 接收者ID                                  |
| apply_reason| VARCHAR(255) | 申请理由                                  |
| remark      | VARCHAR(50)  | 备注                                      |
| status      | TINYINT      | 状态：0-待处理，1-已同意，2-已拒绝          |
| has_read    | TINYINT      | 是否已读：0-未读，1-已读                   |
| create_time | DATETIME     | 创建时间                                  |

### 5.5 聊天会话表 (chat_sessions)

| 字段名          | 类型         | 描述                   |
|----------------|--------------|----------------------|
| session_id     | VARCHAR(50)  | 主键，会话ID           |
| user_id        | VARCHAR(20)  | 用户ID                 |
| friend_user_id | VARCHAR(20)  | 好友用户ID             |
| create_time    | DATETIME     | 创建时间                |

### 5.6 聊天历史表 (chat_histories)

| 字段名       | 类型         | 描述                                      |
|-------------|--------------|------------------------------------------|
| id          | VARCHAR(50)  | 主键，消息ID                              |
| session_id  | VARCHAR(50)  | 会话ID                                    |
| sender_id   | VARCHAR(20)  | 发送者ID                                  |
| receiver_id | VARCHAR(20)  | 接收者ID                                  |
| content     | TEXT         | 消息内容                                  |
| content_type| TINYINT      | 内容类型：0-文本，1-图片，2-文件            |
| has_read    | TINYINT      | 是否已读：0-未读，1-已读                   |
| create_time | DATETIME     | 创建时间                                  |

### 5.7 验证码表 (verify_codes)

| 字段名       | 类型         | 描述                                      |
|-------------|--------------|------------------------------------------|
| id          | BIGINT       | 主键                                      |
| email       | VARCHAR(100) | 邮箱                                      |
| code        | VARCHAR(10)  | 验证码                                    |
| expire_time | DATETIME     | 过期时间                                  |
| create_time | DATETIME     | 创建时间                                  |

## 6. 数据传输对象 (DTO)

### 6.1 用户信息 (UserInfo)

```json
{
  "userId": "20000000001",
  "username": "zhangsan",
  "nickName": "张三",
  "avatar": "/images/avatar1.jpeg",
  "email": "zhangsan@example.com",
  "status": 1,
  "createTime": "2024-01-01 12:00:00"
}
```

### 6.2 用户搜索结果 (UserSearchResult)

```json
{
  "userId": "20000000001",
  "username": "zhangsan",
  "nickName": "张三",
  "avatar": "/images/avatar1.jpeg",
  "isFriend": false
}
```

### 6.3 好友信息 (FriendInfo)

```json
{
  "userId": "20000000002",
  "friendUserId": "20000000001",
  "friendUsername": "zhangsan",
  "friendNickName": "张三",
  "friendRemark": "老张",
  "friendAvatar": "/images/avatar1.jpeg",
  "createTime": "2024-01-01 12:00:00"
}
```

### 6.4 好友验证 (FriendVerify)

```json
{
  "senderId": "20000000001",
  "senderUsername": "zhangsan",
  "senderNickName": "张三",
  "senderAvatar": "/images/avatar1.jpeg",
  "receiverId": "20000000002",
  "receiverUsername": "lisi",
  "receiverNickName": "李四",
  "receiverAvatar": "/images/avatar2.jpg",
  "applyReason": "我是张三，请加我好友",
  "remark": "老李",
  "status": 0,
  "hasRead": 0,
  "createTime": "2024-01-01 12:00:00"
}
```

### 6.5 聊天会话 (ChatSession)

```json
{
  "sessionId": "session123",
  "userId": "20000000001",
  "friendUserId": "20000000002",
  "friendUsername": "lisi",
  "friendNickName": "李四",
  "friendRemark": "老李",
  "friendAvatar": "/images/avatar2.jpg",
  "createTime": "2024-01-01 12:00:00",
  "latestChatHistory": {
    "id": "msg123",
    "content": "你好啊",
    "contentType": 0,
    "senderId": "20000000001",
    "hasRead": 1,
    "createTime": "2024-01-01 12:05:00"
  }
}
```

### 6.6 聊天历史 (ChatHistory)

```json
{
  "id": "msg123",
  "sessionId": "session123",
  "senderId": "20000000001",
  "receiverId": "20000000002",
  "content": "你好啊",
  "contentType": 0,
  "hasRead": 0,
  "createTime": "2024-01-01 12:05:00"
}
```

## 7. 统一响应格式 (ApiResponse)

### 7.1 成功响应

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 7.2 错误响应

```json
{
  "success": false,
  "code": 400,
  "message": "参数错误",
  "data": null
}
```

### 7.3 分页响应

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {
    "total": 100,
    "list": [],
    "pageNum": 1,
    "pageSize": 10
  }
}
```

## 8. API 文档

### 8.1 用户认证

#### 8.1.1 登录

**请求**:

- 方法: `POST`
- 路径: `/auth/login`
- 内容类型: `application/json`

**请求参数**:

```json
{
  "username": "zhangsan",
  "password": "password123"
}
```

**响应**:

```json
{
  "success": true,
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "20000000001",
      "username": "zhangsan",
      "nickName": "张三",
      "avatar": "/images/avatar1.jpeg",
      "email": "zhangsan@example.com",
      "status": 1,
      "createTime": "2024-01-01 12:00:00"
    }
  }
}
```

**前端实现示例**:

```javascript
// 登录方法
const login = async (formEl) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        let result = await reqLogin({
          username: loginForm.username,
          password: loginForm.password,
        });
        if (result.success) {
          // 存储用户信息和token
          setCookie("uid", result.data.user.userId, 7);
          localStorage.setItem("token", result.data.token);
          localStorage.setItem("user", JSON.stringify(result.data.user));
          
          // 跳转到首页
          router.push({ name: "home" });
          ElMessage.success("登录成功");
        } else {
          ElMessage.error(result.message);
        }
      } catch (error) {
        ElMessage.error("网络异常，请稍后重试");
      } finally {
        loading.value = false;
      }
    }
  });
};
```

#### 8.1.2 登出

**请求**:

- 方法: `POST`
- 路径: `/auth/logout`
- 头部: `Authorization: Bearer {token}`

**响应**:

```json
{
  "success": true,
  "code": 200,
  "message": "登出成功",
  "data": null
}
```

**前端实现示例**:

```javascript
const logout = () => {
  ElMessageBox.confirm("您确定退出吗？", "", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    beforeClose: async (action, instance, done) => {
      if (action === "confirm") {
        instance.confirmButtonLoading = true;
        instance.confirmButtonText = "正在退出...";
        instance.confirmButtonDisabled = true;
        let result = await reqLogout();
        if (!result.success) {
          setCookie("uid", "", 0);
        }
        socket.emit("offline", user.userId);
        done();
      } else {
        done();
      }
    },
  })
    .then(() => {
      router.push({ name: "login" });
      ElMessage.success("已退出");
    })
    .catch(() => {});
};
```

### 8.2 用户管理

#### 8.2.1 注册

**请求**:

- 方法: `POST`
- 路径: `/user/register`
- 内容类型: `application/json`

**请求参数**:

```json
{
  "username": "zhangsan",
  "password": "password123",
  "nickName": "张三",
  "email": "zhangsan@example.com",
  "verifyCode": "123456"
}
```

**响应**:

```json
{
  "success": true,
  "code": 200,
  "message": "注册成功",
  "data": {
    "userId": "20000000001",
    "username": "zhangsan",
    "nickName": "张三",
    "avatar": "/images/default-avatar.png",
    "email": "zhangsan@example.com",
    "status": 0,
    "createTime": "2024-01-01 12:00:00"
  }
}
```

**前端实现示例**:

```javascript
const register = async (formEl) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        let result = await reqRegister({
          username: registerForm.username,
          password: registerForm.password,
          nickName: registerForm.nickName,
          email: registerForm.email,
          verifyCode: registerForm.verifyCode,
        });
        if (result.success) {
          ElMessage.success("注册成功，请登录");
          router.push({ name: "login" });
        } else {
          ElMessage.error(result.message);
        }
      } catch (error) {
        ElMessage.error("网络异常，请稍后重试");
      } finally {
        loading.value = false;
      }
    }
  });
};
```

#### 8.2.2 发送邮箱验证码

**请求**:

- 方法: `POST`
- 路径: `/user/verifyCode/send`
- 内容类型: `application/json`

**请求参数**:

```json
{
  "email": "zhangsan@example.com"
}
```

**响应**:

```json
{
  "success": true,
  "code": 200,
  "message": "验证码已发送",
  "data": null
}
```

**前端实现示例**:

```javascript
const sendCode = async () => {
  if (!registerForm.email) {
    ElMessage.warning("请输入邮箱");
    return;
  }
  if (countdown.value > 0) return;
  
  try {
    let result = await reqSendCode({ email: registerForm.email });
    if (result.success) {
      ElMessage.success("验证码已发送");
      countdown.value = 60;
      const timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    ElMessage.error("网络异常，请稍后重试");
  }
};
```

#### 8.2.3 验证邮箱验证码

**请求**:

- 方法: `POST`
- 路径: `/user/verifyCode/validate`
- 内容类型: `application/json`

**请求参数**:

```json
{
  "email": "zhangsan@example.com",
  "code": "123456"
}
```

**响应**:

```json
{
  "success": true,
  "code": 200,
  "message": "验证码正确",
  "data": true
}
```

**前端实现示例**:

```javascript
const validateCode = async (rule, value, callback) => {
  if (!value) {
    callback(new Error("请输入验证码"));
    return;
  }
  try {
    let result = await reqValidateCode({
      email: registerForm.email,
      code: value,
    });
    if (result.success && result.data) {
      callback();
    } else {
      callback(new Error("验证码错误"));
    }
  } catch (error) {
    callback(new Error("验证失败，请稍后重试"));
  }
};
```

## 9. WebSocket API

### 9.1 消息相关事件

#### 9.1.1 发送消息

**事件名**: `sendMsg`

**发送数据**:
```javascript
{
  sessionId: "session123",      // 会话ID
  senderId: "20000000001",     // 发送者ID
  receiverId: "20000000002",   // 接收者ID
  content: "你好啊",           // 消息内容
  contentType: 0,              // 内容类型：0-文本，1-图片，2-文件
  createTime: "2024-01-01 12:05:00" // 创建时间
}
```

**回调参数**:
```javascript
// 成功回调
(messageWithId, status) => {
  // messageWithId: 带有ID的消息对象
  // status: 状态，可能的值：
  //   - "": 成功且接收者在线
  //   - "offline": 成功但接收者离线
  //   - "notFriend": 失败，不是好友关系
}
```

**前端实现示例**:
```javascript
const sendMessage = () => {
  if (!messageContent.value.trim()) return;
  
  const message = {
    sessionId: currentSession.value,
    senderId: user.userId,
    receiverId: friend.userId,
    content: messageContent.value,
    contentType: 0,
    createTime: formatDate(new Date(), "YYYY-MM-DD HH:mm:ss")
  };
  
  socket.emit("sendMsg", message, (messageWithId, status) => {
    if (status === "notFriend") {
      ElMessage.error("对方不是您的好友");
      return;
    }
    
    if (status === "offline") {
      ElMessage.warning("对方当前不在线，消息将在对方上线后推送");
    }
    
    // 添加到聊天历史
    chatHistories.value.push(messageWithId);
    
    // 更新聊天列表中的最新消息
    let chatIndex = chatList.value.findIndex(
      chat => chat.sessionId === currentSession.value
    );
    if (chatIndex >= 0) {
      chatList.value[chatIndex].latestChatHistory = {
        id: messageWithId.id,
        content: messageWithId.content,
        contentType: messageWithId.contentType,
        senderId: messageWithId.senderId,
        hasRead: 0,
        createTime: messageWithId.createTime
      };
    }
    
    // 清空输入框
    messageContent.value = "";
    
    // 滚动到底部
    scrollToBottom();
  });
};
```

#### 9.1.2 接收消息

**事件名**: `receiveMsg`

**接收数据**:
```javascript
{
  id: "msg123",                // 消息ID
  sessionId: "session123",      // 会话ID
  senderId: "20000000001",     // 发送者ID
  receiverId: "20000000002",   // 接收者ID
  content: "你好啊",           // 消息内容
  contentType: 0,              // 内容类型：0-文本，1-图片，2-文件
  hasRead: 0,                  // 是否已读：0-未读，1-已读
  createTime: "2024-01-01 12:05:00" // 创建时间
}
```

**前端实现示例**:
```javascript
socket.on("receiveMsg", async (message) => {
  console.log('[Socket] 收到新消息:', message);
  
  // 检查消息格式
  if (!message || !message.senderId || !message.content) {
    console.error('[Socket] 消息格式无效:', message);
    return;
  }

  // 如果是图片消息，预加载图片
  if (message.contentType === 1) {
    const img = new Image();
    img.src = message.content;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
      setTimeout(resolve, 3000); // 超时处理
    });
  }

  // 检查是否是当前聊天窗口的消息
  if (currentSession.value === message.sessionId) {
    // 添加到聊天历史
    chatHistories.value.push(message);
    
    // 标记为已读
    socket.emit("markMessageRead", {
      sessionId: message.sessionId,
      messageId: message.id
    });
    
    // 滚动到底部
    scrollToBottom();
  }
  
  // 更新聊天列表中的最新消息
  let chatIndex = chatList.value.findIndex(
    chat => chat.sessionId === message.sessionId
  );
  if (chatIndex >= 0) {
    chatList.value[chatIndex].latestChatHistory = {
      id: message.id,
      content: message.content,
      contentType: message.contentType,
      senderId: message.senderId,
      hasRead: currentSession.value === message.sessionId ? 1 : 0,
      createTime: message.createTime
    };
    
    // 如果不是当前会话，将该会话移到顶部
    if (currentSession.value !== message.sessionId) {
      const chat = chatList.value.splice(chatIndex, 1)[0];
      chatList.value.unshift(chat);
    }
  }
  
  // 如果不是当前聊天窗口，显示通知
  if (currentSession.value !== message.sessionId) {
    // 查找发送者信息
    const sender = chatList.value.find(
      chat => chat.sessionId === message.sessionId
    );
    
    if (sender) {
      ElNotification({
        title: sender.friendRemark || sender.friendNickName,
        message: message.contentType === 0 ? message.content : '[图片]',
        type: 'info',
        duration: 3000,
        onClick: () => {
          // 点击通知切换到对应会话
          emit("update:showChat", message.sessionId);
        }
      });
    }
  }
});
```

#### 9.1.3 标记消息已读

**事件名**: `markMessageRead`

**发送数据**:
```javascript
{
  sessionId: "session123",  // 会话ID
  messageId: "msg123"      // 消息ID
}
```

### 9.2 好友相关事件

#### 9.2.1 发送好友申请

**事件名**: `sendVerify`

**发送数据**:
```javascript
{
  senderId: "20000000001",      // 发送者ID
  receiverId: "20000000002",    // 接收者ID
  applyReason: "我是无敌，请加我好友", // 申请理由
  remark: "老张",               // 备注
  status: 0,                    // 状态：0-待处理
  hasRead: 0,                   // 是否已读：0-未读
  createTime: "2024-01-01 12:00:00" // 创建时间
}
```

**回调参数**:
```javascript
// 成功回调
(response) => {
  // response: 好友验证对象（包含完整信息）
}
```

**前端实现示例**:
```javascript
const applyFriend = async (formEl) => {
  if (!formEl) return;
  await formEl.validate((valid) => {
    if (valid) {
      let friendVerify = {
        senderId: user.userId,
        receiverId: friend.userId,
        applyReason: friend.applyReason,
        remark: friend.remark,
        status: 0,
        hasRead: 0,
        createTime: formatDate(new Date(), "YYYY-MM-DD HH:mm:ss"),
      };
      socket.emit("sendVerify", friendVerify, (response) => {
        if (response) {
          ElMessage.success("已发送请求");
          friendVerifyList.value.splice(0, 0, response);
        } else {
          ElMessage.error("网络异常");
        }
      });
    }
  });
};
```

#### 9.2.2 接收好友申请

**事件名**: `receiveVerify`

**接收数据**:
```javascript
{
  senderId: "20000000001",      // 发送者ID
  senderNickName: "无敌",       // 发送者昵称
  senderAvatar: "/images/avatar2.jpg", // 发送者头像
  receiverId: "20000000002",    // 接收者ID
  receiverNickName: "张三",     // 接收者昵称
  receiverAvatar: "/images/avatar1.jpeg", // 接收者头像
  applyReason: "我是无敌，请加我好友", // 申请理由
  remark: "老张",               // 备注
  status: 0,                    // 状态：0-待处理
  hasRead: 0,                   // 是否已读：0-未读
  createTime: "2024-01-01 12:00:00" // 创建时间
}
```

**前端实现示例**:
```javascript
socket.on("receiveVerify", (friendVerify, callback) => {
  callback(); // 确认接收
  friendVerifyList.value.splice(0, 0, friendVerify);
  hideBadge.value = false;
  
  // 显示通知
  ElNotification.info({
    title: "你有一条好友验证消息",
    message: friendVerify.senderNickName + " 请求添加你为好友",
    duration: 5000,
  });
});
```

#### 9.2.3 同意好友申请

**事件名**: `agreeApply`

**发送数据**:
```javascript
{
  userId: "20000000002",        // 用户ID（接收者）
  friendUserId: "20000000001",  // 好友用户ID（发送者）
  friendRemark: "老张",         // 好友备注
  createTime: "2024-01-01 12:00:00" // 创建时间
}
```

**回调参数**:
```javascript
// 成功回调
(response) => {
  // response: 聊天会话对象
}
```

**前端实现示例**:
```javascript
const addFriend = async (formEl) => {
  if (!formEl) return;
  await formEl.validate((valid) => {
    if (valid) {
      let friendInfo = {
        userId: user.userId,
        friendUserId: friend.userId,
        friendRemark: friend.remark,
        createTime: formatDate(new Date(), "YYYY-MM-DD HH:mm:ss"),
      };
      socket.emit("agreeApply", friendInfo, (response) => {
        if (response) {
          ElMessage.success("已同意");
          // 更新好友验证列表状态
          let index = friendVerifyList.value.findIndex(
            (verify) =>
              verify.senderId === friend.userId &&
              verify.receiverId === user.userId
          );
          if (index >= 0) {
            friendVerifyList.value[index].status = 1;
          }
          // 刷新好友列表
          store.dispatch("home/getFriendList", user.userId);
          // 添加聊天会话
          emit("addChat", response);
        } else {
          ElMessage.error("网络异常");
        }
      });
    }
  });
};
```

#### 9.2.4 申请成功通知

**事件名**: `applySucceed`

**接收数据**:
```javascript
// 聊天会话对象
{
  sessionId: "session123",      // 会话ID
  userId: "20000000001",        // 用户ID
  friendUserId: "20000000002",  // 好友用户ID
  friendNickName: "张三",       // 好友昵称
  friendAvatar: "/images/avatar1.jpeg", // 好友头像
  createTime: "2024-01-01 12:00:00" // 创建时间
}
```

**前端实现示例**:
```javascript
socket.on("applySucceed", (chatSession) => {
  // 刷新好友列表
  store.dispatch("home/getFriendList", user.userId);
  
  // 更新好友验证列表状态
  let index = friendVerifyList.value.findIndex(
    (verify) =>
      verify.senderId === user.userId &&
      verify.receiverId === chatSession.friendUserId
  );
  if (index >= 0) {
    friendVerifyList.value[index].status = 1;
  }
  
  // 添加聊天会话
  chatList.value.splice(0, 0, chatSession);
  
  // 显示通知
  ElNotification.success({
    title: "好友申请已通过",
    message: chatSession.friendNickName + " 已同意你的好友申请",
    duration: 5000,
  });
});
```

#### 9.2.5 拒绝好友申请

**事件名**: `rejectApply`

**发送数据**:
```javascript
{
  senderId: "20000000001",      // 发送者ID
  receiverId: "20000000002",    // 接收者ID
}
```

**前端实现示例**:
```javascript
const rejectFriend = () => {
  socket.emit("rejectApply", {
    senderId: friend.userId,
    receiverId: user.userId,
  });
  
  // 更新好友验证列表状态
  let index = friendVerifyList.value.findIndex(
    (verify) =>
      verify.senderId === friend.userId &&
      verify.receiverId === user.userId
  );
  if (index >= 0) {
    friendVerifyList.value[index].status = 2;
  }
  
  ElMessage.warning("已拒绝");
};
```

#### 9.2.6 申请被拒绝通知

**事件名**: `applyFailed`

**接收数据**:
```javascript
{
  senderId: "20000000001",      // 发送者ID
  receiverId: "20000000002",    // 接收者ID
  receiverNickName: "张三",     // 接收者昵称
}
```

**前端实现示例**:
```javascript
socket.on("applyFailed", (data) => {
  // 更新好友验证列表状态
  let index = friendVerifyList.value.findIndex(
    (verify) =>
      verify.senderId === user.userId &&
      verify.receiverId === data.receiverId
  );
  if (index >= 0) {
    friendVerifyList.value[index].status = 2;
  }
  
  // 显示通知
  ElNotification.warning({
    title: "好友申请被拒绝",
    message: data.receiverNickName + " 拒绝了你的好友申请",
    duration: 5000,
  });
});
```

#### 9.2.7 删除好友

**事件名**: `removeFriend`

**发送数据**:
```javascript
// 参数1: 用户ID
"20000000001"
// 参数2: 好友用户ID
"20000000002"
```

**回调参数**:
```javascript
// 成功回调
(response) => {
  // response: 布尔值，表示是否成功
}
```

**前端实现示例**:
```javascript
const removeFriend = (friend) => {
  ElMessageBox.confirm("您确定删除该好友吗？", "", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    beforeClose: async (action, instance, done) => {
      if (action === "confirm") {
        socket.emit(
          "removeFriend",
          user.userId,
          friend.friendUserId,
          (response) => {
            if (response) {
              // 从好友列表中移除
              let friendIndex = friendList.value.findIndex(
                (item) => item.friendUserId === friend.friendUserId
              );
              friendList.value.splice(friendIndex, 1);
              
              // 从聊天列表中移除
              let chatIndex = chatList.value.findIndex(
                (chat) => chat.friendUserId === friend.friendUserId
              );
              if (chatIndex >= 0) {
                if (showChat.value === chatList.value[chatIndex].sessionId) {
                  emit("update:showChat", "");
                }
                chatList.value.splice(chatIndex, 1);
              }
            } else {
              ElMessage.error("网络异常");
            }
          }
        );
        done();
      } else {
        done();
      }
    },
  });
};
```

### 9.3 聊天会话相关事件

#### 9.3.1 创建聊天会话

**事件名**: `addSession`

**发送数据**:
```javascript
// 参数1: 用户ID
"20000000001"
// 参数2: 好友用户ID
"20000000002"
```

**回调参数**:
```javascript
// 成功回调
(response) => {
  // response: 聊天会话对象
}
```

**前端实现示例**:
```javascript
const toChat = (friend) => {
  let chatSession = chatList.value.find(
    (chat) => chat.friendUserId === friend.friendUserId
  );
  if (!chatSession) {
    socket.emit(
      "addSession",
      user.userId,
      friend.friendUserId,
      (response) => {
        if (response) {
          chatList.value.splice(0, 0, response);
          chatSession = response;
        } else {
          ElMessage.error("网络异常");
        }
        emit("update:showChat", chatSession.sessionId);
      }
    );
  } else {
    emit("update:showChat", chatSession.sessionId);
  }
};
```

### 9.4 在线状态相关事件

#### 9.4.1 用户上线

**事件名**: `online`

**发送数据**:
```javascript
// 参数1: 用户ID
"20000000001"
// 参数2: 用户状态（可选）
"online"
```

**后端业务逻辑**:
1. 将用户ID添加到在线用户列表中
2. 广播更新后的在线用户列表给所有连接的客户端

**前端实现示例**:
```javascript
// 在用户登录成功后或应用启动时发送
onMounted(async () => {
  let result = await reqGetUserInfo({ id: user.userId.toString() });
  if (result.success) {
    user.avatar = result.data.avatar.startsWith('http') ? result.data.avatar : "https://wc-chat.oss-cn-beijing.aliyuncs.com" + result.data.avatar;
    user.nickName = result.data.nickName;
    socket.emit("online", user.userId, result.data.status);
  }
  
  // 监听在线用户列表更新
  socket.on("onlineUsers", (onlineUsers) => {
    store.commit("home/ONLINEUSERS", onlineUsers);
  });
});
```

#### 9.4.2 用户下线

**事件名**: `offline`

**发送数据**:
```javascript
// 参数1: 用户ID
"20000000001"
```

**后端业务逻辑**:
1. 从在线用户列表中移除用户ID
2. 广播更新后的在线用户列表给所有连接的客户端

**前端实现示例**:
```javascript
// 在用户登出时发送
const logout = () => {
  ElMessageBox.confirm("您确定退出吗？", "", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    beforeClose: async (action, instance, done) => {
      if (action === "confirm") {
        instance.confirmButtonLoading = true;
        instance.confirmButtonText = "正在退出...";
        instance.confirmButtonDisabled = true;
        let result = await reqLogout();
        if (!result.success) {
          setCookie("uid", "", 0);
        }
        socket.emit("offline", user.userId);
        done();
      } else {
        done();
      }
    },
  })
    .then(() => {
      router.push({ name: "login" });
      ElMessage.success("已退出");
    })
    .catch(() => {});
};
```

#### 9.4.3 在线用户列表更新

**事件名**: `onlineUsers`

**接收数据**:
```javascript
// 在线用户ID数组
["20000000001", "20000000002", "20000000003"]
```

**前端业务逻辑**:
1. 更新Vuex存储中的在线用户列表
2. 根据列表更新UI中的在线状态显示

**前端实现示例**:
```javascript
// 监听在线用户列表更新
socket.on("onlineUsers", (onlineUsers) => {
  store.commit("home/ONLINEUSERS", onlineUsers);
});

// 在组件中检查用户是否在线
const checkOnline = (userId) => {
  return onlineUsers.value.indexOf(userId) >= 0;
};
```

**后端实现建议**:
```java
// 在线用户列表（内存中）
private Set<String> onlineUsers = new ConcurrentHashSet<>();

// 处理用户上线事件
@OnEvent("online")
public void handleUserOnline(SocketIOClient client, String userId, String status) {
    // 将用户添加到在线列表
    onlineUsers.add(userId);
    
    // 将客户端与用户ID关联
    client.set("userId", userId);
    
    // 广播在线用户列表
    server.getBroadcastOperations().sendEvent("onlineUsers", onlineUsers);
}

// 处理用户下线事件
@OnEvent("offline")
public void handleUserOffline(SocketIOClient client, String userId) {
    // 从在线列表移除用户
    onlineUsers.remove(userId);
    
    // 广播在线用户列表
    server.getBroadcastOperations().sendEvent("onlineUsers", onlineUsers);
}

// 处理客户端断开连接
@OnDisconnect
public void onDisconnect(SocketIOClient client) {
    // 获取断开连接的用户ID
    String userId = client.get("userId");
    if (userId != null) {
        // 从在线列表移除用户
        onlineUsers.remove(userId);
        
        // 广播在线用户列表
        server.getBroadcastOperations().sendEvent("onlineUsers", onlineUsers);
    }
}
```

**消息发送时的在线状态检查**:
```java
@OnEvent("sendMsg")
public void handleSendMessage(SocketIOClient client, Message message, AckRequest ackRequest) {
    // 保存消息到数据库
    Message savedMessage = messageService.saveMessage(message);
    
    // 检查接收者是否在线
    boolean isReceiverOnline = onlineUsers.contains(message.getReceiverId());
    
    // 如果接收者在线，推送消息
    if (isReceiverOnline) {
        // 查找接收者的客户端连接
        for (SocketIOClient receiverClient : server.getAllClients()) {
            String clientUserId = receiverClient.get("userId");
            if (message.getReceiverId().equals(clientUserId)) {
                receiverClient.sendEvent("receiveMsg", savedMessage);
                break;
            }
        }
        
        // 回复发送者，消息已发送，接收者在线
        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(savedMessage, "");
        }
    } else {
        // 回复发送者，消息已保存，但接收者离线
        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(savedMessage, "offline");
        }
    }
}
/**
 * 保存图片消息 - 上传图片到服务器并获取URL
 * @param {FormData} data FormData对象，必须包含：
 *   - file: 图片文件 (File对象，支持jpg/png/jpeg格式，最大2MB)
 *   - senderId: 发送者ID
 *   - receiverId: 接收者ID
 *   - sessionId: 会话ID
 * @returns {Promise<{success: boolean, message: string, data: {url: string}}>} 
 *   返回Promise，成功时data包含:
 *   - url: 图片的URL地址，以"/"开头的相对路径或完整的http(s)地址
 * @example
 * const formData = new FormData();
 * formData.append('file', imgFile);
 * formData.append('senderId', userId);
 * formData.append('receiverId', friendId);
 * formData.append('sessionId', sessionId);
 * const result = await reqSavePictureMsg(formData);
 * if(result.success) {
 *   // 使用result.data.url通过socket发送图片消息
 * }
 */
export const reqSavePictureMsg = (data) => axios.post('/chat/chats/savePictureMsg', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

/**
 * 保存文件消息 - 上传文件到服务器并获取URL
 * @param {FormData} data FormData对象，必须包含：
 *   - file: 文件对象 (File对象，支持常见文档格式，最大10MB)
 *   - senderId: 发送者ID
 *   - receiverId: 接收者ID
 *   - sessionId: 会话ID
 * @returns {Promise<{success: boolean, message: string, data: {url: string}}>}
 *   返回Promise，成功时data包含:
 *   - url: 文件的URL地址，以"/"开头的相对路径或完整的http(s)地址
 * @example
 * const formData = new FormData();
 * formData.append('file', fileObj);
 * formData.append('senderId', userId);
 * formData.append('receiverId', friendId);
 * formData.append('sessionId', sessionId);
 * const result = await reqSaveFileMsg(formData);
 * if(result.success) {
 *   // 使用result.data.url通过socket发送文件消息
 * }
 */
export const reqSaveFileMsg = (data) => axios.post('/chat/chats/saveFileMsg', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

```