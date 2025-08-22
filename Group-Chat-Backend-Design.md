# 群聊功能后端设计文档

本文档旨在详细说明群聊功能所需的后端API和WebSocket事件,以指导前后端开发。

## 1. 数据模型 (Data Models)

根据提供的数据库表结构,定义核心数据模型。

### Group (群组)

```json
{
  "groupId": "1001",
  "groupName": "技术交流群",
  "ownerId": "user_123",
  "avatar": "https://example.com/avatar.png",
  "announcement": "欢迎大家加入本群！",
  "createdAt": "2023-10-27T10:00:00Z"
}
```

### GroupMember (群成员)

```json
{
  "id": 1,
  "groupId": "1001",
  "userId": "user_123",
  "role": "owner", // 'owner', 'admin', 'member'
  "joinedAt": "2023-10-27T10:00:00Z"
}
```

### GroupMessage (群消息)

```json
{
  "messageId": "msg_5001",
  "groupId": "1001",
  "senderId": "user_123",
  "content": "大家好，我是群主",
  "messageType": "text", // 'text', 'image', 'file'
  "sentAt": "2023-10-27T10:05:00Z",
  // 附加前端可能需要的发送者信息
  "senderInfo": {
    "nickName": "张三",
    "avatar": "https://example.com/user_123.png"
  }
}
```

## 2. RESTful API Endpoints

所有API均使用 `/api/chat` 作为前缀。

**认证要求**: 所有请求需要在请求头中包含 `Authorization: Bearer {token}`

### 2.1. 获取用户加入的所有群组

- **Endpoint**: `GET /api/chat/users/{userId}/groups`
- **Method**: `GET`
- **Description**: 获取指定用户加入的所有群聊列表。
- **Auth**: 需要用户认证，且必须是该用户本人。
- **URL Params**:
  - `userId` (string, required): 用户ID。
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "操作成功",
    "data": [
      {
        "groupId": "string",
        "groupName": "string",
        "avatar": "string",
        "lastMessage": "string",
        "lastMessageTime": "2024-01-01 12:00:00",
        "unreadCount": 0
      }
    ]
  }
  ```

### 2.2. 获取特定群组的详细信息

- **Endpoint**: `GET /api/chat/groups/{groupId}`
- **Method**: `GET`
- **Description**: 获取单个群组的详细信息，包括群成员列表。
- **Auth**: 需要用户认证，且用户必须是该群成员。
- **URL Params**:
  - `groupId` (string, required): 群组ID。
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "操作成功",
    "data": {
      "groupId": "string",
      "groupName": "string",
      "ownerId": "string",
      "avatar": "string",
      "announcement": "string",
      "createdAt": "2024-01-01 12:00:00",
      "members": [
        {
          "userId": "string",
          "username": "string",
          "nickName": "string",
          "avatar": "string",
          "role": "owner"
        }
      ]
    }
  }
  ```

### 2.3. 获取群聊历史消息 (分页)

- **Endpoint**: `GET /api/chat/groups/{groupId}/messages`
- **Method**: `GET`
- **Description**: 分页获取指定群组的聊天记录。
- **Auth**: 需要用户认证，且用户必须是该群成员。
- **URL Params**:
  - `groupId` (string, required): 群组ID。
- **Query Params**:
  - `pageNum` (number, optional, default: 1): 页码。
  - `pageSize` (number, optional, default: 20): 每页数量。
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "操作成功",
    "data": {
      "total": 100,
      "list": [
        {
          "messageId": "string",
          "groupId": "string",
          "senderId": "string",
          "content": "string",
          "messageType": "text",
          "sentAt": "2024-01-01 12:00:00",
          "senderInfo": {
            "nickName": "string",
            "avatar": "string"
          }
        }
      ],
      "pageNum": 1,
      "pageSize": 20
    }
  }
  ```

### 2.4. 创建群聊

- **Endpoint**: `POST /api/chat/groups`
- **Method**: `POST`
- **Description**: 创建一个新的群聊。服务器会通过请求的认证信息自动将当前用户设置为群主。
- **Auth**: 需要用户认证。
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "groupName": "string",
    "initialMembers": ["userId1", "userId2"]
  }
  ```
- **参数说明**:
  - `groupName`: 群聊名称，必填，长度2-50个字符
  - `initialMembers`: 初始成员用户ID数组，可选，最多100个成员
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "创建成功",
    "data": {
      "groupId": "string",
      "groupName": "string",
      "ownerId": "string",
      "avatar": "string",
      "announcement": "string",
      "createdAt": "2024-01-01 12:00:00"
    }
  }
  ```

### 2.5. 邀请用户加入群聊

- **Endpoint**: `POST /api/chat/groups/{groupId}/members`
- **Method**: `POST`
- **Description**: 邀请一个或多个用户加入群聊。
- **Auth**: 需要用户认证，且用户必须是群主或管理员。
- **Content-Type**: `application/json`
- **URL Params**:
  - `groupId` (string, required): 群组ID。
- **Request Body**:
  ```json
  {
    "userIds": ["userId3", "userId4"]
  }
  ```
- **参数说明**:
  - `userIds`: 要邀请的用户ID数组，必填，最多50个用户
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "邀请成功",
    "data": null
  }
  ```

### 2.6. 将用户移出群聊

- **Endpoint**: `DELETE /api/chat/groups/{groupId}/members/{memberId}`
- **Method**: `DELETE`
- **Description**: 将指定用户从群聊中移除（需要权限：群主或管理员）。
- **Auth**: 需要用户认证，且用户必须是群主或管理员。
- **URL Params**:
  - `groupId` (string, required): 群聊ID。
  - `memberId` (string, required): 要移除的成员用户ID。
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "移除成功",
    "data": null
  }
  ```

### 2.7. 更新群信息

- **Endpoint**: `PUT /api/chat/groups/{groupId}`
- **Method**: `PUT`
- **Description**: 更新群信息，如群名、公告（需要权限：群主或管理员）。
- **Auth**: 需要用户认证，且用户必须是群主或管理员。
- **Content-Type**: `application/json`
- **URL Params**:
  - `groupId` (string, required): 群聊ID。
- **Request Body**:
  ```json
  {
    "groupName": "string",
    "announcement": "string",
    "avatar": "string"
  }
  ```
- **参数说明**:
  - `groupName`: 群聊名称，可选，长度2-50个字符
  - `announcement`: 群公告，可选，最大长度500个字符
  - `avatar`: 群头像URL，可选
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "更新成功",
    "data": {
      "groupId": "string",
      "groupName": "string",
      "announcement": "string",
      "avatar": "string",
      "updatedAt": "2024-01-01 12:00:00"
    }
  }
  ```

### 2.8. 用户退出群聊

- **Endpoint**: `POST /api/chat/groups/{groupId}/leave`
- **Method**: `POST`
- **Description**: 用户主动退出群聊（群主不能退出，只能解散）。
- **Auth**: 需要用户认证。
- **URL Params**:
  - `groupId` (string, required): 群聊ID。
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "已退出群聊",
    "data": null
  }
  ```

### 2.9. 解散群聊

- **Endpoint**: `DELETE /api/chat/groups/{groupId}`
- **Method**: `DELETE`
- **Description**: 解散群聊（仅群主可操作）。
- **Auth**: 需要用户认证，且用户必须是群主。
- **URL Params**:
  - `groupId` (string, required): 群聊ID。
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "群聊已解散",
    "data": null
  }
  ```

## 3. WebSocket 事件

使用Socket.IO进行实时通讯。

### 3.1. 客户端加入群聊房间

- **Event Name**: `join_group`
- **Description**: 当用户打开一个群聊窗口时,客户端应发送此事件以加入对应的 "房间",从而能接收该群的消息。
- **Payload**:
  ```json
  {
    "groupId": "1001"
  }
  ```

### 3.2. 客户端发送群聊消息

- **Event Name**: `send_group_message`
- **Description**: 客户端向服务器发送一条群聊消息。
- **Payload**:
  ```json
  {
    "groupId": "1001",
    "senderId": "user_123", // 由后端根据token验证
    "content": "这是一条测试消息",
    "messageType": "text" // 'text', 'image', 'file'
  }
  ```

### 3.3. 服务器广播群聊消息

- **Event Name**: `receive_group_message`
- **Description**: 服务器在收到 `send_group_message` 事件后,向该群聊房间内的所有客户端广播此消息。
- **Payload**: `GroupMessage` 对象 (见 1.3)
  ```json
  {
    "messageId": "msg_5002",
    "groupId": "1001",
    "senderId": "user_123",
    "content": "这是一条测试消息",
    "messageType": "text",
    "sentAt": "2023-10-27T12:35:00Z",
    "senderInfo": {
      "nickName": "张三",
      "avatar": "https://example.com/user_123.png"
    }
  }
  ```

### 3.4. 服务器发送群组通知

- **Event Name**: `group_notification`
- **Description**: 当群组发生变化时(如新成员加入、成员退出),服务器向群内所有成员发送通知。
- **Payload**:
  ```json
  {
    "groupId": "1001",
    "type": "member_join", // 'member_join', 'member_leave', 'group_dissolved'
    "content": "用户 '李四' 已加入群聊",
    "timestamp": "2023-10-27T13:00:00Z"
  }
