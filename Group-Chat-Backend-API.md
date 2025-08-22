# EasyChat 群聊功能后端 API 文档

本文档定义了实现群聊功能所需的后端接口和 WebSocket 事件。

---

## 1. 数据库模型

（详情请参考 `group_chat_schema.sql` 文件）

-   **`groups`**: 存储群组基本信息。
-   **`group_members`**: 存储群组与用户的关系。
-   **`group_messages`**: 存储群聊消息。

---

## 2. RESTful API

所有API均使用 `/api/chat` 作为前缀。

**认证要求**: 所有请求需要在请求头中包含 `Authorization: Bearer {token}`

### 2.1. 创建群聊

-   **URL**: `/api/chat/groups`
-   **Method**: `POST`
-   **Description**: 创建一个新的群聊。服务器会通过请求的认证信息自动将当前用户设置为群主。
-   **Content-Type**: `application/json`
-   **Request Body**:
    ```json
    {
      "groupName": "string",
      "initialMembers": ["userId1", "userId2"]
    }
    ```
-   **参数说明**:
    - `groupName`: 群聊名称，必填，长度2-50个字符
    - `initialMembers`: 初始成员用户ID数组，可选，最多100个成员
-   **Success Response (200)**:
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
-   **Error Response**:
    ```json
    {
      "success": false,
      "code": 400,
      "message": "参数错误",
      "data": null
    }
    ```

### 2.2. 获取用户的群聊列表

-   **URL**: `/api/chat/users/{userId}/groups`
-   **Method**: `GET`
-   **Description**: 获取指定用户加入的所有群聊列表。
-   **请求参数**: 无
-   **Success Response (200)**:
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

### 2.3. 获取群聊详细信息

-   **URL**: `/api/chat/groups/{groupId}`
-   **Method**: `GET`
-   **Description**: 获取特定群聊的详细信息，包括成员列表。
-   **请求参数**: 无
-   **Success Response (200)**:
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

### 2.4. 邀请用户加入群聊

-   **URL**: `/api/chat/groups/{groupId}/members`
-   **Method**: `POST`
-   **Description**: 邀请一个或多个用户加入群聊。
-   **Content-Type**: `application/json`
-   **Request Body**:
    ```json
    {
      "userIds": ["userId3", "userId4"]
    }
    ```
-   **参数说明**:
    - `userIds`: 要邀请的用户ID数组，必填，最多50个用户
-   **Success Response (200)**:
    ```json
    {
      "success": true,
      "code": 200,
      "message": "邀请成功",
      "data": null
    }
    ```
-   **权限要求**: 群主或管理员
-   **错误响应**:
    ```json
    {
      "success": false,
      "code": 403,
      "message": "没有权限邀请成员",
      "data": null
    }
    ```

### 2.5. 将用户移出群聊

-   **URL**: `/api/chat/groups/{groupId}/members/{memberId}`
-   **Method**: `DELETE`
-   **Description**: 将指定用户从群聊中移除（需要权限：群主或管理员）。
-   **参数说明**:
    - `groupId`: 群聊ID，必填
    - `memberId`: 要移除的成员用户ID，必填
-   **Success Response (200)**:
    ```json
    {
      "success": true,
      "code": 200,
      "message": "移除成功",
      "data": null
    }
    ```
-   **权限要求**: 群主或管理员
-   **错误响应**:
    ```json
    {
      "success": false,
      "code": 403,
      "message": "没有权限移除成员",
      "data": null
    }
    ```

### 2.6. 更新群信息

-   **URL**: `/api/chat/groups/{groupId}`
-   **Method**: `PUT`
-   **Description**: 更新群信息，如群名、公告（需要权限：群主或管理员）。
-   **Content-Type**: `application/json`
-   **Request Body**:
    ```json
    {
      "groupName": "string",
      "announcement": "string",
      "avatar": "string"
    }
    ```
-   **参数说明**:
    - `groupName`: 群聊名称，可选，长度2-50个字符
    - `announcement`: 群公告，可选，最大长度500个字符
    - `avatar`: 群头像URL，可选
-   **Success Response (200)**:
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
-   **权限要求**: 群主或管理员

---

## 3. WebSocket 事件

WebSocket 用于处理实时消息通信。前端连接配置请参考主文档。

### 3.1. 客户端发送消息

-   **事件名**: `send_group_message`
-   **描述**: 客户端向服务器发送一条群聊消息。
-   **发送数据**:
    ```json
    {
      "groupId": "string",
      "senderId": "string",
      "content": "string",
      "messageType": "text"
    }
    ```
-   **回调参数**:
    ```javascript
    // 成功回调
    (response, status) => {
      // response: 消息对象（包含消息ID等完整信息）
      // status: 状态，可能的值：
      //   - "": 成功
      //   - "not_member": 用户不在该群聊中
    }
    ```

### 3.2. 服务器广播消息

-   **事件名**: `receive_group_message`
-   **描述**: 服务器向群内所有在线成员广播一条新消息。
-   **接收数据**:
    ```json
    {
      "messageId": "string",
      "groupId": "string",
      "sender": {
        "userId": "string",
        "username": "string",
        "nickName": "string",
        "avatar": "string"
      },
      "content": "string",
      "messageType": "text",
      "sentAt": "2024-01-01 12:00:00"
    }
    ```

### 3.3. 额外WebSocket事件

#### 3.3.1 用户加入群聊
-   **事件名**: `group_member_joined`
-   **描述**: 通知群内成员有新用户加入
-   **数据**:
    ```json
    {
      "groupId": "string",
      "userId": "string",
      "username": "string",
      "nickName": "string",
      "avatar": "string",
      "role": "member",
      "joinedAt": "2024-01-01 12:00:00"
    }
    ```

#### 3.3.2 用户退出群聊
-   **事件名**: `group_member_left`
-   **描述**: 通知群内成员有用户退出
-   **数据**:
    ```json
    {
      "groupId": "string",
      "userId": "string",
      "username": "string",
      "nickName": "string"
    }
    ```

#### 3.3.3 群聊信息更新
-   **事件名**: `group_info_updated`
-   **描述**: 通知群内成员群聊信息已更新
-   **数据**:
    ```json
    {
      "groupId": "string",
      "groupName": "string",
      "announcement": "string",
      "avatar": "string",
      "updatedAt": "2024-01-01 12:00:00"
    }
    ```
