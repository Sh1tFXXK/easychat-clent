# EasyChat 在线状态 WebSocket API 文档

## 1. 概述

本文档描述了EasyChat应用中与用户在线状态相关的WebSocket API。这些API用于管理和通知用户的在线/离线状态，使得应用能够实时显示好友的在线状态。

## 2. 在线状态相关事件

### 2.1 用户上线

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

### 2.2 用户下线

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

### 2.3 在线用户列表更新

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

## 3. 在线状态在UI中的应用

### 3.1 好友列表中显示在线状态

```javascript
// 在好友列表组件中
const onlineUsers = computed(() => store.state.home.onlineUsers);

const checkOnline = (userId) => {
  return onlineUsers.value.indexOf(userId) >= 0;
};

// 在模板中使用
<div class="status" :class="{ online: checkOnline(friend.friendUserId) }"></div>
```

### 3.2 聊天列表中显示在线状态

```javascript
// 在聊天列表组件中
const onlineUsers = computed(() => store.state.home.onlineUsers);

const checkOnline = (userId) => {
  return onlineUsers.value.indexOf(userId) >= 0;
};

// 在模板中使用
<div class="status" :class="{ online: checkOnline(chat.friendUserId) }"></div>
```

### 3.3 消息发送时检查在线状态

```javascript
// 在发送消息时，服务器可能返回接收者的在线状态
socket.emit("sendMsg", message, (messageWithId, status) => {
  if (status === "offline") {
    // 处理对方离线的情况
    ElMessage.warning("对方当前不在线，消息将在对方上线后推送");
  }
  // 其他处理逻辑...
});
```

## 4. 后端实现建议

### 4.1 数据结构

```java
// 在线用户列表（内存中）
private Set<String> onlineUsers = new ConcurrentHashSet<>();
```

### 4.2 事件处理

```java
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

### 4.3 消息发送时的在线状态检查

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
```

## 5. 注意事项

1. **连接恢复**: 当用户重新连接时，应该自动发送`online`事件，更新在线状态。

2. **多设备登录**: 如果允许用户在多个设备上同时登录，需要考虑如何处理用户ID与多个客户端连接的关系。

3. **状态持久化**: 考虑是否需要将用户的在线状态持久化，以便在服务器重启后恢复。

4. **离线消息推送**: 当接收者离线时，可以考虑使用其他方式（如移动推送通知）来通知用户有新消息。

5. **状态防抖**: 在网络不稳定的情况下，可能需要添加防抖机制，避免用户状态频繁切换。