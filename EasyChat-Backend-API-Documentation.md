# EasyChat 后端 API 文档

## 1. 项目概述

### 1.1 项目简介

EasyChat 是一个基于 WebSocket 的实时聊天应用，支持一对一聊天、好友管理、群聊、图片和文件传输等功能。本文档详细描述了后端 API 接口规范，供前端开发人员参考。

### 1.2 技术栈

- **后端**：Spring Boot、Spring Security、JWT、WebSocket (Socket.IO)、MySQL、Redis、MinIO
- **前端**：Vue 3、Vuex、Socket.IO Client、Element Plus
- **通信**：RESTful API、WebSocket

### 1.3 基础 URL

- **HTTP API**: `http://localhost:8081/api`
- **WebSocket**: `http://localhost:8081` (Socket.IO 路径: `/socket.io`)

### 1.4 前端连接配置

```javascript
// Socket.IO 连接配置
const socket = io('http://localhost:8081', {
  path: "/socket.io",
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// 连接状态监听
socket.on('connect', () => {
  console.log('连接成功');
});

socket.on('connect_error', (error) => {
  console.error('连接错误:', error);
});

socket.on('disconnect', (reason) => {
  console.log('连接断开, 原因:', reason);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('尝试重连, 次数:', attemptNumber);
});
```

## 2. 数据模型

### 2.1 数据库表结构

#### users (用户表)
```sql
CREATE TABLE `users` (
  `id` varchar(20) NOT NULL COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(100) NOT NULL COMMENT '密码（加密存储）',
  `nick_name` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `gender` tinyint(1) DEFAULT '2' COMMENT '性别: 0-女, 1-男, 2-未知',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `status` tinyint(1) DEFAULT '0' COMMENT '在线状态: 0-离线, 1-在线',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

#### user_tags (用户标签表)
```sql
CREATE TABLE `user_tags` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `user_id` varchar(20) NOT NULL COMMENT '用户ID',
  `tag_name` varchar(50) NOT NULL COMMENT '标签名称',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户标签表';
```

#### user_friends (用户好友表)
```sql
CREATE TABLE `user_friends` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user_id` varchar(20) NOT NULL COMMENT '用户ID',
  `friend_user_id` varchar(20) NOT NULL COMMENT '好友用户ID',
  `friend_remark` varchar(50) DEFAULT NULL COMMENT '好友备注',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_friend` (`user_id`,`friend_user_id`),
  KEY `idx_friend_user_id` (`friend_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户好友表';
```

#### friend_verifies (好友验证表)
```sql
CREATE TABLE `friend_verifies` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '验证ID',
  `sender_id` varchar(20) NOT NULL COMMENT '发送者ID',
  `receiver_id` varchar(20) NOT NULL COMMENT '接收者ID',
  `apply_reason` varchar(255) DEFAULT NULL COMMENT '申请理由',
  `remark` varchar(50) DEFAULT NULL COMMENT '备注',
  `status` tinyint(1) DEFAULT '0' COMMENT '状态: 0-待处理, 1-已同意, 2-已拒绝, 3-已过期',
  `has_read` tinyint(1) DEFAULT '0' COMMENT '是否已读: 0-未读, 1-已读',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_receiver_id` (`receiver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='好友验证表';
```

#### chat_sessions (聊天会话表)
```sql
CREATE TABLE `chat_sessions` (
  `id` varchar(50) NOT NULL COMMENT '会话ID',
  `user_id` varchar(20) NOT NULL COMMENT '用户ID',
  `friend_user_id` varchar(20) NOT NULL COMMENT '好友用户ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_friend` (`user_id`,`friend_user_id`),
  KEY `idx_friend_user_id` (`friend_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天会话表';
```

#### chat_histories (聊天记录表)
```sql
CREATE TABLE `chat_histories` (
  `id` varchar(50) NOT NULL COMMENT '消息ID',
  `session_id` varchar(50) NOT NULL COMMENT '会话ID',
  `sender_id` varchar(20) NOT NULL COMMENT '发送者ID',
  `receiver_id` varchar(20) NOT NULL COMMENT '接收者ID',
  `content` text COMMENT '消息内容',
  `content_type` tinyint(1) DEFAULT '0' COMMENT '内容类型: 0-文本, 1-图片, 2-文件, 3-语音',
  `has_read` tinyint(1) DEFAULT '0' COMMENT '是否已读: 0-未读, 1-已读',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_receiver_id` (`receiver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天记录表';
```

#### verify_codes (验证码表)
```sql
CREATE TABLE `verify_codes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '验证码ID',
  `email` varchar(100) NOT NULL COMMENT '邮箱',
  `code` varchar(10) NOT NULL COMMENT '验证码',
  `expire_time` datetime NOT NULL COMMENT '过期时间',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='验证码表';
```

#### groups (群组表)
```sql
CREATE TABLE `groups` (
  `group_id` varchar(50) NOT NULL COMMENT '群组ID',
  `group_name` varchar(100) NOT NULL COMMENT '群组名称',
  `owner_id` varchar(20) NOT NULL COMMENT '群主用户ID',
  `avatar` varchar(255) DEFAULT NULL COMMENT '群组头像',
  `announcement` text COMMENT '群公告',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`group_id`),
  KEY `idx_owner_id` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='群组表';
```

#### group_members (群组成员表)
```sql
CREATE TABLE `group_members` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `group_id` varchar(50) NOT NULL COMMENT '群组ID',
  `user_id` varchar(20) NOT NULL COMMENT '用户ID',
  `role` varchar(20) DEFAULT 'member' COMMENT '角色: owner, admin, member',
  `joined_at` datetime DEFAULT NULL COMMENT '加入时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_group_user` (`group_id`,`user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='群组成员表';
```

#### group_messages (群组消息表)
```sql
CREATE TABLE `group_messages` (
  `message_id` varchar(50) NOT NULL COMMENT '消息ID',
  `group_id` varchar(50) NOT NULL COMMENT '群组ID',
  `sender_id` varchar(20) NOT NULL COMMENT '发送者ID',
  `content` text COMMENT '消息内容',
  `message_type` varchar(20) DEFAULT 'text' COMMENT '消息类型: text, image, file',
  `sent_at` datetime DEFAULT NULL COMMENT '发送时间',
  PRIMARY KEY (`message_id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_sender_id` (`sender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='群组消息表';
```

### 2.2 数据传输对象 (DTO/VO)

#### UserInfo (用户信息)
```java
public class UserInfo {
    private String id;           // 用户ID
    private String username;     // 用户名
    private String nickName;     // 昵称
    private String avatar;       // 头像URL
    private Integer gender;      // 性别: 0-女, 1-男, 2-未知
    private String email;        // 邮箱
    private Integer status;      // 在线状态: 0-隐身, 1-在线
    private List<String> tags;   // 标签列表
    private String createTime;   // 创建时间
}
```

#### UserSearchResult (用户搜索结果)
```java
public class UserSearchResult {
    private String id;           // 用户ID
    private String username;     // 用户名
    private String nickName;     // 昵称
    private String avatar;       // 头像URL
    private Integer gender;      // 性别
    private String createTime;   // 创建时间
}
```

#### FriendInfo (好友信息)
```java
public class FriendInfo {
    private String userId;           // 用户ID
    private String friendUserId;     // 好友用户ID
    private String friendRemark;     // 好友备注
    private String friendNickName;   // 好友昵称
    private String friendAvatar;     // 好友头像
    private Integer friendGender;    // 好友性别
    private String createTime;       // 创建时间
}
```

#### FriendVerify (好友验证)
```java
public class FriendVerify {
    private String senderId;         // 发送者ID
    private String senderNickName;   // 发送者昵称
    private String senderAvatar;     // 发送者头像
    private String receiverId;       // 接收者ID
    private String receiverNickName; // 接收者昵称
    private String receiverAvatar;   // 接收者头像
    private String applyReason;      // 申请理由
    private String remark;           // 备注
    private Integer status;          // 状态 0:待处理 1:已同意 2:已拒绝 3:已过期
    private Integer hasRead;         // 是否已读
    private String createTime;       // 创建时间
}
```

#### ChatSession (聊天会话)
```java
public class ChatSession {
    private String sessionId;        // 会话ID
    private String userId;           // 用户ID
    private String friendUserId;     // 好友用户ID
    private String friendRemark;     // 好友备注
    private String friendNickName;   // 好友昵称
    private String friendAvatar;     // 好友头像
    private String createTime;       // 创建时间
    private ChatHistory latestChatHistory; // 最新聊天记录
}
```

#### ChatHistory (聊天记录)
```java
public class ChatHistory {
    private String id;           // 消息ID
    private String senderId;     // 发送者ID
    private String receiverId;   // 接收者ID
    private String sessionId;    // 会话ID
    private Integer type;        // 消息类型: 0-文本, 1-图片, 2-文件, 3-语音
    private String content;      // 消息内容
    private Integer hasRead;     // 是否已读: 0-未读, 1-已读
    private Integer showTime;    // 是否显示时间: 0-不显示, 1-显示
    private String createTime;   // 创建时间
}
```

### 2.3 统一响应格式

#### ApiResponse (API响应)
```java
public class ApiResponse<T> {
    private boolean success;      // 是否成功
    private String message;      // 消息
    private Integer code;        // 状态码
    private T data;              // 数据
}
```

**成功响应示例**:
```json
{
  "success": true,
  "message": "操作成功",
  "code": 200,
  "data": { ... }
}
```

**错误响应示例**:
```json
{
  "success": false,
  "message": "用户名已存在",
  "code": 1002,
  "data": null
}
```

**分页响应示例**:
```json
{
  "success": true,
  "message": "操作成功",
  "code": 200,
  "data": {
    "records": [ ... ],
    "current": 1,
    "pageSize": 10,
    "total": 100
  }
}
```

## 3. 认证与授权

### 3.1 登录

**接口**: `POST /auth/login`
**描述**: 用户登录接口

**请求参数**:
```json
{
  "username": "user123",
  "password": "password123"
}
```

**参数说明**:
- `username`: 用户名，必填，长度3-20个字符
- `password`: 密码，必填，长度6-20个字符

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": "20000000001",
      "username": "user123",
      "nickName": "无敌",
      "avatar": "/images/avatar2.jpg",
      "gender": 1,
      "email": "user123@example.com",
      "status": 1,
      "tags": ["游戏", "音乐", "编程"],
      "createTime": "2024-01-01 12:00:00"
    }
  }
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqLogin = (data) => axios.post('/auth/login', data);

// 使用示例
const login = async () => {
  try {
    const result = await reqLogin({
      username: username.value,
      password: password.value
    });
    if (result.success) {
      // 存储用户信息和token
      localStorage.setItem('token', result.data.token);
      // 跳转到首页
      router.push('/home');
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('登录失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 验证用户名和密码
2. 生成JWT令牌
3. 返回用户信息和令牌

### 3.2 登出

**接口**: `POST /auth/logout`
**描述**: 用户登出接口

**请求头**:
- `Authorization`: Bearer {token}

**响应示例**:
```json
{
  "success": true,
  "message": "登出成功",
  "code": 200,
  "data": null
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqLogout = () => axios.post('/auth/logout');

// 使用示例
const logout = async () => {
  try {
    const result = await reqLogout();
    if (result.success) {
      // 清除本地存储的用户信息和token
      localStorage.removeItem('token');
      // 通知服务器用户下线
      socket.emit("offline", user.userId);
      // 跳转到登录页
      router.push('/login');
    }
  } catch (error) {
    console.error('登出失败:', error);
  }
};
```

**业务逻辑**:
1. 验证令牌
2. 将令牌加入黑名单
3. 返回成功响应

## 4. 用户管理

### 4.1 注册

**接口**: `POST /user/register`
**描述**: 用户注册接口

**请求参数**:
```json
{
  "username": "user123",
  "password": "password123",
  "nickName": "无敌",
  "email": "user123@example.com",
  "verifyCode": "123456"
}
```

**参数说明**:
- `username`: 用户名，必填，长度3-20个字符，只能包含字母、数字和下划线
- `password`: 密码，必填，长度6-20个字符
- `nickName`: 昵称，必填，长度2-20个字符
- `email`: 邮箱，必填，有效的邮箱格式
- `verifyCode`: 验证码，必填，6位数字

**响应示例**:
```json
{
  "success": true,
  "message": "注册成功",
  "code": 200,
  "data": {
    "id": "20000000001",
    "username": "user123",
    "nickName": "无敌",
    "avatar": "/images/default-avatar.jpg",
    "gender": 2,
    "email": "user123@example.com",
    "status": 1,
    "createTime": "2024-01-01 12:00:00"
  }
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqRegister = (data) => axios.post('/user/register', data);

// 使用示例
const register = async () => {
  try {
    const result = await reqRegister({
      username: username.value,
      password: password.value,
      nickName: nickName.value,
      email: email.value,
      verifyCode: verifyCode.value
    });
    if (result.success) {
      ElMessage.success('注册成功，请登录');
      router.push('/login');
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('注册失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 验证用户名是否已存在
2. 验证邮箱验证码
3. 创建用户记录
4. 返回用户信息

### 4.2 发送验证码

**接口**: `POST /user/verifyCode/send`
**描述**: 发送邮箱验证码

**请求参数**:
```json
{
  "email": "user123@example.com"
}
```

**参数说明**:
- `email`: 邮箱，必填，有效的邮箱格式

**响应示例**:
```json
{
  "success": true,
  "message": "验证码已发送",
  "code": 200,
  "data": null
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqSendCode = (data) => axios.post('/user/verifyCode/send', data);

// 使用示例
const sendCode = async () => {
  try {
    const result = await reqSendCode({ email: email.value });
    if (result.success) {
      ElMessage.success('验证码已发送，请查收邮件');
      // 开始倒计时
      startCountdown();
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('发送验证码失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 生成6位随机验证码
2. 发送验证码到指定邮箱
3. 保存验证码记录（有效期10分钟）

### 4.3 验证验证码

**接口**: `POST /user/verifyCode/validate`
**描述**: 验证邮箱验证码

**请求参数**:
```json
{
  "email": "user123@example.com",
  "code": "123456"
}
```

**参数说明**:
- `email`: 邮箱，必填，有效的邮箱格式
- `code`: 验证码，必填，6位数字

**响应示例**:
```json
{
  "success": true,
  "message": "验证码正确",
  "code": 200,
  "data": true
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqValidateCode = (data) => axios.post('/user/verifyCode/validate', data);

// 使用示例
const validateCode = async () => {
  try {
    const result = await reqValidateCode({
      email: email.value,
      code: verifyCode.value
    });
    if (result.success && result.data) {
      // 验证码正确，继续注册流程
      codeValidated.value = true;
    } else {
      ElMessage.error('验证码错误');
    }
  } catch (error) {
    console.error('验证码验证失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 查询验证码记录
2. 验证验证码是否正确且未过期
3. 返回验证结果

### 4.4 验证用户名

**接口**: `POST /user/username/validate`
**描述**: 验证用户名是否可用

**请求参数**:
```json
{
  "username": "user123"
}
```

**参数说明**:
- `username`: 用户名，必填，长度3-20个字符

**响应示例**:
```json
{
  "success": true,
  "message": "用户名可用",
  "code": 200,
  "data": true
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqValidateUsername = (data) => axios.post('/user/username/validate', data);

// 使用示例
const validateUsername = async () => {
  try {
    const result = await reqValidateUsername({ username: username.value });
    if (result.success && result.data) {
      // 用户名可用
      usernameValid.value = true;
    } else {
      ElMessage.error('用户名已存在');
      usernameValid.value = false;
    }
  } catch (error) {
    console.error('用户名验证失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 查询用户名是否已存在
2. 返回验证结果

### 4.5 验证密码

**接口**: `POST /user/password/validate`
**描述**: 验证用户密码是否正确

**请求参数**:
```json
{
  "id": "20000000001",
  "password": "password123"
}
```

**参数说明**:
- `id`: 用户ID，必填
- `password`: 密码，必填

**响应示例**:
```json
{
  "success": true,
  "message": "密码正确",
  "code": 200,
  "data": true
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqValidatePassword = (data) => axios.post('/user/password/validate', data);

// 使用示例
const validatePassword = async () => {
  try {
    const result = await reqValidatePassword({
      id: user.userId,
      password: oldPassword.value
    });
    if (result.success && result.data) {
      // 密码正确，继续修改密码流程
      passwordValidated.value = true;
    } else {
      ElMessage.error('原密码错误');
    }
  } catch (error) {
    console.error('密码验证失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 查询用户记录
2. 验证密码是否正确
3. 返回验证结果

### 4.6 搜索用户

**接口**: `GET /user/search`
**描述**: 搜索用户

**请求参数**: `?keyword=关键词`

**响应示例**:
```json
{
  "success": true,
  "message": "操作成功",
  "code": 200,
  "data": [
    {
      "id": "20000000002",
      "username": "zhangsan",
      "nickName": "张三",
      "avatar": "/images/avatar1.jpeg",
      "gender": 1,
      "createTime": "2024-01-01 12:00:00"
    }
  ]
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqSearchUsers = (params) => axios.get('/user/search', { params: params });

// 使用示例
const searchUser = async () => {
  try {
    const result = await reqSearchUsers({ keyword: username.value });
    if (result.success) {
      userList.value = result.data;
      showSearchResults.value = true;
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('搜索用户失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 根据关键词搜索用户名或昵称
2. 返回匹配的用户列表

### 4.7 获取用户信息

**接口**: `GET /user/user`
**描述**: 获取用户信息

**请求参数**: `?id=用户ID`

**响应示例**:
```json
{
  "success": true,
  "message": "操作成功",
  "code": 200,
  "data": {
    "id": "20000000001",
    "username": "user123",
    "nickName": "无敌",
    "avatar": "/images/avatar2.jpg",
    "gender": 1,
    "email": "user123@example.com",
    "status": 1,
    "tags": ["游戏", "音乐", "编程"],
    "createTime": "2024-01-01 12:00:00"
  }
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqGetUserInfo = (params) => axios.get('/user/user', { params: params });

// 使用示例
const getUserInfo = async () => {
  try {
    const result = await reqGetUserInfo({ id: user.userId });
    if (result.success) {
      // 更新用户信息
      user.avatar = result.data.avatar.startsWith('http') ? result.data.avatar : "https://wc-chat.oss-cn-beijing.aliyuncs.com" + result.data.avatar;
      user.nickName = result.data.nickName;
      // 设置用户在线状态
      socket.emit("online", user.userId, result.data.status);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};
```

**业务逻辑**:
1. 查询用户记录
2. 查询用户标签
3. 返回用户信息

### 4.8 编辑用户信息

**接口**: `POST /user/user/edit`
**描述**: 编辑用户信息

**请求参数**:
```json
{
  "id": "20000000001",
  "nickName": "新昵称",
  "gender": 1,
  "status": 1
}
```

**参数说明**:
- `id`: 用户ID，必填
- `nickName`: 昵称，可选，长度2-20个字符
- `gender`: 性别，可选，0-女, 1-男, 2-未知
- `status`: 在线状态，可选，0-隐身, 1-在线

**响应示例**:
```json
{
  "success": true,
  "message": "修改成功",
  "code": 200,
  "data": {
    "id": "20000000001",
    "username": "user123",
    "nickName": "新昵称",
    "avatar": "/images/avatar2.jpg",
    "gender": 1,
    "email": "user123@example.com",
    "status": 1,
    "tags": ["游戏", "音乐", "编程"],
    "createTime": "2024-01-01 12:00:00"
  }
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqEditUserInfo = (data) => axios.post('/user/user/edit', data);

// 使用示例
const editUserInfo = async () => {
  try {
    const result = await reqEditUserInfo({
      id: user.userId,
      nickName: nickName.value,
      gender: gender.value,
      status: status.value
    });
    if (result.success) {
      ElMessage.success('修改成功');
      // 更新用户信息
      user.nickName = result.data.nickName;
      // 如果修改了在线状态，通知服务器
      if (status.value !== originalStatus.value) {
        socket.emit("changeStatus", user.userId, status.value);
      }
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('编辑用户信息失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 验证用户ID
2. 更新用户信息
3. 返回更新后的用户信息

### 4.9 修改头像

**接口**: `POST /user/user/changeAvatar`
**描述**: 修改用户头像

**Content-Type**: `multipart/form-data`

**请求参数**:
- `id`: 用户ID
- `avatar`: 头像文件 (JPG/PNG格式，最大2MB)

**响应示例**:
```json
{
  "success": true,
  "message": "修改成功",
  "code": 200,
  "data": {
    "avatar": "/images/new-avatar.jpg"
  }
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqChangeAvatar = (data) => axios.post('/user/user/changeAvatar', data, { headers: { 'Content-Type': 'multipart/form-data' } });

// 使用示例
const changeAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append('id', user.userId);
    formData.append('avatar', file);
    
    const result = await reqChangeAvatar(formData);
    if (result.success) {
      ElMessage.success('头像修改成功');
      // 更新用户头像
      user.avatar = result.data.avatar.startsWith('http') ? result.data.avatar : "https://wc-chat.oss-cn-beijing.aliyuncs.com" + result.data.avatar;
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('修改头像失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 验证用户ID
2. 验证图片格式和大小
3. 上传图片到MinIO
4. 更新用户头像URL
5. 返回新头像URL

### 4.10 修改密码

**接口**: `POST /user/user/changePassword`
**描述**: 修改用户密码

**请求参数**:
```json
{
  "id": "20000000001",
  "oldPassword": "password123",
  "newPassword": "newpassword123"
}
```

**参数说明**:
- `id`: 用户ID，必填
- `oldPassword`: 旧密码，必填
- `newPassword`: 新密码，必填，长度6-20个字符

**响应示例**:
```json
{
  "success": true,
  "message": "密码修改成功",
  "code": 200,
  "data": null
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqChangePassword = (data) => axios.post('/user/user/changePassword', data);

// 使用示例
const changePassword = async () => {
  try {
    const result = await reqChangePassword({
      id: user.userId,
      oldPassword: oldPassword.value,
      newPassword: newPassword.value
    });
    if (result.success) {
      ElMessage.success('密码修改成功，请重新登录');
      // 退出登录
      logout();
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('修改密码失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 验证用户ID
2. 验证旧密码是否正确
3. 更新用户密码
4. 返回成功响应

### 4.11 添加标签

**接口**: `POST /user/user/addTag`
**描述**: 添加用户标签

**请求参数**:
```json
{
  "userId": "20000000001",
  "tagName": "编程"
}
```

**参数说明**:
- `userId`: 用户ID，必填
- `tagName`: 标签名称，必填，长度1-20个字符

**响应示例**:
```json
{
  "success": true,
  "message": "添加成功",
  "code": 200,
  "data": {
    "id": 1,
    "userId": "20000000001",
    "tagName": "编程",
    "createTime": "2024-01-01 12:00:00"
  }
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqAddTag = (data) => axios.post('/user/user/addTag', data);

// 使用示例
const addTag = async () => {
  try {
    const result = await reqAddTag({
      userId: user.userId,
      tagName: newTag.value
    });
    if (result.success) {
      ElMessage.success('标签添加成功');
      // 更新标签列表
      tags.value.push(result.data.tagName);
      newTag.value = '';
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('添加标签失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 验证用户ID
2. 验证标签是否已存在
3. 添加用户标签
4. 返回新标签信息

### 4.12 删除标签

**接口**: `POST /user/user/removeTag`
**描述**: 删除用户标签

**请求参数**:
```json
{
  "userId": "20000000001",
  "tagName": "编程"
}
```

**参数说明**:
- `userId`: 用户ID，必填
- `tagName`: 标签名称，必填

**响应示例**:
```json
{
  "success": true,
  "message": "删除成功",
  "code": 200,
  "data": null
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqRemoveTag = (data) => axios.post('/user/user/removeTag', data);

// 使用示例
const removeTag = async (tagName) => {
  try {
    const result = await reqRemoveTag({
      userId: user.userId,
      tagName: tagName
    });
    if (result.success) {//2. 验证标签是否已存在
        if (userMapper.getUserTags(userId).contains(tag)) {
            log.error("标签已存在");
        }
      ElMessage.success('标签删除成功');
      // 更新标签列表
      const index = tags.value.findIndex(tag => tag === tagName);
      if (index !== -1) {
        tags.value.splice(index, 1);
      }
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('删除标签失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 验证用户ID
2. 验证标签是否存在
3. 删除用户标签
4. 返回成功响应

## 5. 好友管理

### 5.1 获取好友列表

**接口**: `GET /user/friends`
**描述**: 获取用户的好友列表

**请求参数**: `?id=用户ID`

**响应示例**:
```json
{
  "success": true,
  "message": "操作成功",
  "code": 200,
  "data": [
    {
      "userId": "20000000001",
      "friendUserId": "20000000002",
      "friendRemark": "老张",
      "friendNickName": "张三",
      "friendAvatar": "/images/avatar1.jpeg",
      "friendGender": 1,
      "createTime": "2024-01-01 12:00:00"
    }
  ]
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqGetFriendList = (params) => axios.get('/user/friends', { params: params });

// 使用示例
const getFriendList = async () => {
  try {
    const result = await reqGetFriendList({ id: user.userId });
    if (result.success) {
      let friendList = Array.isArray(result.data) ? result.data : [result.data];
      // 按昵称排序
      store.commit("home/FRIENDLIST", [...friendList].sort((a, b) => (a.friendNickName || '').localeCompare(b.friendNickName || '')));
    }
  } catch (error) {
    console.error('获取好友列表失败:', error);
  }
};
```

**业务逻辑**:
1. 查询用户好友关系
2. 查询好友用户信息
3. 返回好友列表

### 5.2 获取好友验证列表

**接口**: `GET /user/friendVerify`
**描述**: 获取待验证的好友申请列表

**请求参数**: `?id=用户ID`

**响应示例**:
```json
{
  "success": true,
  "message": "操作成功",
  "code": 200,
  "data": [
    {
      "senderId": "20000000002",
      "senderNickName": "张三",
      "senderAvatar": "/images/avatar1.jpeg",
      "receiverId": "20000000001",
      "receiverNickName": "无敌",
      "receiverAvatar": "/images/avatar2.jpg",
      "applyReason": "加我加我加我",
      "remark": "老张",
      "status": 0,
      "hasRead": 0,
      "createTime": "2024-01-01 12:00:00"
    }
  ]
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqGetFriendVerify = (params) => axios.get('/user/friendVerify', { params: params });

// 使用示例
const getFriendVerify = async () => {
  try {
    const result = await reqGetFriendVerify({ id: user.userId });
    if (result.success) {
      // 按创建时间降序排序
      store.commit("home/FRIENDVERIFY", result.data.sort((a, b) => {
        if (a.createTime > b.createTime) return -1;
        if (a.createTime < b.createTime) return 1;
        return 0;
      }));
    }
  } catch (error) {
    console.error('获取好友验证列表失败:', error);
  }
};
```

**业务逻辑**:
1. 查询用户相关的好友验证记录
2. 查询发送者和接收者信息
3. 返回好友验证列表

### 5.3 发送好友申请

**接口**: `POST /user/friendVerify/apply`
**描述**: 发送好友申请

**请求参数**:
```json
{
  "senderId": "20000000001",
  "receiverId": "20000000002",
  "applyReason": "我是无敌，请加我好友",
  "remark": "老张"
}
```

**参数说明**:
- `senderId`: 发送者ID，必填
- `receiverId`: 接收者ID，必填
- `applyReason`: 申请理由，可选，最多100个字符
- `remark`: 备注，可选，最多20个字符

**响应示例**:
```json
{
  "success": true,
  "message": "申请已发送",
  "code": 200,
  "data": {
    "senderId": "20000000001",
    "senderNickName": "无敌",
    "senderAvatar": "/images/avatar2.jpg",
    "receiverId": "20000000002",
    "receiverNickName": "张三",
    "receiverAvatar": "/images/avatar1.jpeg",
    "applyReason": "我是无敌，请加我好友",
    "remark": "老张",
    "status": 0,
    "hasRead": 0,
    "createTime": "2024-01-01 12:00:00"
  }
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqApplyFriend = (data) => axios.post('/user/friendVerify/apply', data);

// 使用示例
const applyFriend = async () => {
  try {
    const result = await reqApplyFriend({
      senderId: user.userId,
      receiverId: searchUser.value.id,
      applyReason: applyReason.value,
      remark: remark.value
    });
    if (result.success) {
      ElMessage.success('好友申请已发送');
      // 关闭申请对话框
      dialogVisible.value = false;
      // 使用Socket.IO发送好友申请通知
      socket.emit("friendApply", result.data);
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('发送好友申请失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 验证发送者和接收者ID
2. 验证是否已经是好友
3. 验证是否已有待处理的申请
4. 创建好友验证记录
5. 返回完整的好友验证信息供WebSocket推送

### 5.4 处理好友申请

**接口**: `POST /user/friendVerify/handle`
**描述**: 处理好友申请

**请求参数**:
```json
{
  "id": 1,
  "status": 1
}
```

**参数说明**:
- `id`: 验证ID，必填
- `status`: 处理状态，必填，1-同意，2-拒绝

**响应示例**:
```json
{
  "success": true,
  "message": "已同意好友申请",
  "code": 200,
  "data": {
    "senderId": "20000000002",
    "senderNickName": "张三",
    "senderAvatar": "/images/avatar1.jpeg",
    "receiverId": "20000000001",
    "receiverNickName": "无敌",
    "receiverAvatar": "/images/avatar2.jpg",
    "applyReason": "加我加我加我",
    "remark": "老张",
    "status": 1,
    "hasRead": 1,
    "createTime": "2024-01-01 12:00:00"
  }
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqHandleFriendVerify = (data) => axios.post('/user/friendVerify/handle', data);

// 使用示例
const handleFriendVerify = async (id, status) => {
  try {
    const result = await reqHandleFriendVerify({ id, status });
    if (result.success) {
      // 更新好友验证列表
      const index = friendVerifyList.value.findIndex(item => item.id === id);
      if (index !== -1) {
        friendVerifyList.value[index].status = status;
        friendVerifyList.value[index].hasRead = 1;
      }
      
      // 如果同意，更新好友列表并创建聊天会话
      if (status === 1) {
        ElMessage.success('已同意好友申请');
        // 使用Socket.IO发送好友申请处理通知
        socket.emit("friendVerifyHandle", result.data);
        // 刷新好友列表
        getFriendList();
      } else {
        ElMessage.success('已拒绝好友申请');
      }
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('处理好友申请失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 验证验证ID
2. 验证处理状态
3. 更新好友验证记录
4. 如果同意，创建好友关系和聊天会话
5. 返回更新后的好友验证信息供WebSocket推送

### 5.5 标记好友验证已读

**接口**: `POST /user/friendVerify/read`
**描述**: 标记好友验证已读

**请求参数**:
```json
{
  "id": 1
}
```

**参数说明**:
- `id`: 验证ID，必填

**响应示例**:
```json
{
  "success": true,
  "message": "标记成功",
  "code": 200,
  "data": null
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqReadFriendVerify = (data) => axios.post('/user/friendVerify/read', data);

// 使用示例
const readFriendVerify = async (id) => {
  try {
    const result = await reqReadFriendVerify({ id });
    if (result.success) {
      // 更新好友验证列表
      const index = friendVerifyList.value.findIndex(item => item.id === id);
      if (index !== -1) {
        friendVerifyList.value[index].hasRead = 1;
      }
    }
  } catch (error) {
    console.error('标记好友验证已读失败:', error);
  }
};
```

**业务逻辑**:
1. 验证验证ID
2. 更新好友验证记录的已读状态
3. 返回成功响应

### 5.6 修改好友备注

**接口**: `POST /user/friends/remark`
**描述**: 修改好友备注

**请求参数**:
```json
{
  "userId": "20000000001",
  "friendUserId": "20000000002",
  "friendRemark": "老张头"
}
```

**参数说明**:
- `userId`: 用户ID，必填
- `friendUserId`: 好友用户ID，必填
- `friendRemark`: 好友备注，必填，长度1-20个字符

**响应示例**:
```json
{
  "success": true,
  "message": "修改成功",
  "code": 200,
  "data": {
    "userId": "20000000001",
    "friendUserId": "20000000002",
    "friendRemark": "老张头",
    "friendNickName": "张三",
    "friendAvatar": "/images/avatar1.jpeg",
    "friendGender": 1,
    "createTime": "2024-01-01 12:00:00"
  }
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqUpdateFriendRemark = (data) => axios.post('/user/friends/remark', data);

// 使用示例
const updateFriendRemark = async () => {
  try {
    const result = await reqUpdateFriendRemark({
      userId: user.userId,
      friendUserId: friend.userId,
      friendRemark: newRemark.value
    });
    if (result.success) {
      ElMessage.success('备注修改成功');
      // 更新好友列表
      const index = friendList.value.findIndex(item => item.friendUserId === friend.userId);
      if (index !== -1) {
        friendList.value[index].friendRemark = result.data.friendRemark;
      }
      // 更新聊天列表
      const chatIndex = chatList.value.findIndex(item => item.friendUserId === friend.userId);
      if (chatIndex !== -1) {
        chatList.value[chatIndex].friendRemark = result.data.friendRemark;
      }
      // 关闭对话框
      dialogVisible.value = false;
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('修改好友备注失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 验证用户ID和好友用户ID
2. 验证好友关系是否存在
3. 更新好友备注
4. 返回更新后的好友信息

### 5.7 删除好友

**接口**: `POST /user/friends/delete`
**描述**: 删除好友

**请求参数**:
```json
{
  "userId": "20000000001",
  "friendUserId": "20000000002"
}
```

**参数说明**:
- `userId`: 用户ID，必填
- `friendUserId`: 好友用户ID，必填

**响应示例**:
```json
{
  "success": true,
  "message": "删除成功",
  "code": 200,
  "data": null
}
```

**前端实现**:
```javascript
// API 调用
import axios from "./request";
export const reqDeleteFriend = (data) => axios.post('/user/friends/delete', data);

// 使用示例
const deleteFriend = async (friendUserId) => {
  try {
    const result = await reqDeleteFriend({
      userId: user.userId,
      friendUserId: friendUserId
    });
    if (result.success) {
      ElMessage.success('好友已删除');
      // 使用Socket.IO发送删除好友通知
      socket.emit("removeFriend", user.userId, friendUserId, (response) => {
        if (response) {
          // 从好友列表中移除
          const friendIndex = friendList.value.findIndex(item => item.friendUserId === friendUserId);
          if (friendIndex !== -1) {
            friendList.value.splice(friendIndex, 1);
          }
          // 从聊天列表中移除
          const chatIndex = chatList.value.findIndex(chat => chat.friendUserId === friendUserId);
          if (chatIndex !== -1) {
            chatList.value.splice(chatIndex, 1);
          }
        } else {
          ElMessage.error('网络异常');
        }
      });
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('删除好友失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  }
};
```

**业务逻辑**:
1. 验证用户ID和好友用户ID
2. 删除好友关系
3. 删除相关聊天会话和聊天记录
4. 返回成功响应

## 6. WebSocket API

### 6.1 连接配置

**连接地址**: `http://localhost:8081`
**路径**: `/socket.io`
**传输方式**: `websocket`

**前端连接示例**:
```javascript
// 初始化Socket.io连接
const socket = io('http://localhost:8081', {
  path: "/socket.io",
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// 连接状态监听
socket.on('connect', () => {
  console.log('[Socket] 连接成功');
});

socket.on('connect_error', (error) => {
  console.error('[Socket] 连接错误:', error);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] 连接断开, 原因:', reason);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('[Socket] 尝试重连, 次数:', attemptNumber);
});
```

### 6.2 消息相关事件

#### 6.2.1 发送消息

**事件名**: `sendMsg`

**发送数据**:
```javascript
{
  senderId: "20000000001",      // 发送者ID
  receiverId: "20000000002",    // 接收者ID
  sessionId: "session123",      // 会话ID
  type: 0,                      // 消息类型：0-文本，1-图片，2-文件
  content: "你好！",            // 消息内容
  createTime: "2024-01-01 12:00:00", // 创建时间
  hasRead: 0,                   // 是否已读：0-未读，1-已读
  showTime: 1                   // 是否显示时间：0-不显示，1-显示
}
```

**回调参数**:
```javascript
// 成功回调
(response, msg) => {
  // response: 消息对象（包含消息ID等完整信息）
  // msg: 状态信息，可能的值：
  //   - "offline": 对方不在线
  //   - "notFriend": 不是好友关系
}
```

**前端实现示例**:
```javascript
const sendMessage = () => {
  const messageText = inputValue.value.trim();
  if (messageText) {
    let message = {
      senderId: user.userId,
      receiverId: friend.userId,
      sessionId: sessionId,
      type: 0,
      content: messageText,
      createTime: formatDate(new Date(), "YYYY-MM-DD HH:mm:ss"),
      hasRead: 0,
      showTime: 1,
    };
    socket.emit("sendMsg", message, (response, msg) => {
      if (msg === "notFriend") {
        ElMessage.error("你还不是他（她）的好友");
        return;
      }
      if (response) {
        if (msg === "offline") {
          ElMessage.warning("对方不在线");
        }
        // 添加消息到聊天记录
        chatHistoryList.value.push(response);
        // 更新聊天列表
        updateChatList(response);
      } else {
        ElMessage.error("网络异常");
      }
    });
  }
};
```

#### 6.2.2 接收消息

**事件名**: `receiveMsg`

**接收数据**:
```javascript
{
  id: "msg123",                 // 消息ID
  senderId: "20000000002",      // 发送者ID
  receiverId: "20000000001",    // 接收者ID
  sessionId: "session123",      // 会话ID
  type: 0,                      // 消息类型：0-文本，1-图片，2-文件
  content: "你好！",            // 消息内容
  createTime: "2024-01-01 12:00:00", // 创建时间
  hasRead: 0,                   // 是否已读：0-未读，1-已读
  showTime: 1                   // 是否显示时间：0-不显示，1-显示
}
```

**前端实现示例**:
```javascript
socket.on("receiveMsg", (message) => {
  // 检查消息格式
  if (!message || !message.senderId || !message.content) {
    console.error('[Socket] 消息格式无效:', message);
    return;
  }

  // 检查是否是当前聊天窗口的消息
  if (friend.userId === message.senderId || friend.userId === message.receiverId) {
    // 处理图片消息
    if (message.type === 1) {
      console.log('[Socket] 处理图片消息:', message.content);
    }

    // 添加消息到聊天记录
    chatHistoryList.value.push(message);
    
    // 更新会话列表中的最新消息
    updateChatList(message);
    
    // 标记消息已读
    if (message.hasRead === 0) {
      socket.emit('markMessageRead', {
        sessionId: message.sessionId,
        messageId: message.id
      });
    }
  }
});
```

#### 6.2.3 标记消息已读

**事件名**: `markMessageRead`

**发送数据**:
```javascript
{
  sessionId: "session123",  // 会话ID
  messageId: "msg123"      // 消息ID
}
```

### 6.3 好友相关事件

#### 6.3.1 发送好友申请

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

#### 6.3.2 接收好友申请

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

#### 6.3.3 同意好友申请

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

#### 6.3.4 申请成功通知

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
  ElNotification.info({
    title: "你有一条好友验证消息",
    message: chatSession.friendNickName + " 已同意你的好友请求",
    duration: 5000,
  });
});
```

#### 6.3.5 拒绝好友申请

**事件名**: `rejectApply`

**发送数据**:
```javascript
// 参数1: 发送者ID
"20000000001"
// 参数2: 接收者ID
"20000000002"
```

**前端实现示例**:
```javascript
const rejectApply = (friendVerify, index) => {
  ElMessage.warning("已拒绝");
  friendVerifyList.value[index].status = 2;
  socket.emit(
    "rejectApply",
    friendVerify.senderId,
    friendVerify.receiverId
  );
};
```

#### 6.3.6 申请被拒绝通知

**事件名**: `applyFailed`

**接收数据**:
```javascript
// 参数1: 发送者ID
"20000000001"
// 参数2: 接收者ID
"20000000002"
```

**前端实现示例**:
```javascript
socket.on("applyFailed", (senderId, receiverId) => {
  let index = friendVerifyList.value.findIndex(
    (verify) =>
      verify.senderId === senderId && verify.receiverId === receiverId
  );
  if (index >= 0) {
    friendVerifyList.value[index].status = 2;
    
    // 显示通知
    ElNotification.info({
      title: "你有一条好友验证消息",
      message: friendVerifyList.value[index].receiverNickName + " 已拒绝你的好友请求",
      duration: 5000,
    });
  }
});
```

#### 6.3.7 删除好友

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

### 6.4 聊天会话相关事件

#### 6.4.1 创建聊天会话

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