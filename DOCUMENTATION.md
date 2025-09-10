# EASYCHAT-CLIENT 项目文档

以下文档汇总当前前端项目（`easychat-client`）的结构、运行方式、代理配置、以及前端调用的接口清单（包含 OpenAPI 描述文件 `openapi.yaml`）。

## 概览
- 名称: easychat-web
- 类型: Vue 3 前端（vue-cli）
- 目的: 即时通讯演示客户端，包含聊天、好友、验证等功能；通过 dev-server 代理到后端 API

## 项目结构（重点目录）
- `src/` - 源代码
  - `api/` - 前端对后端的 API 封装（`index.js`, `request.js`, `mockAxios.js`）
  - `pages/` - 页面目录（聊天、侧边栏、登录等）
  - `mock/` - 本地 mock 数据（若存在）
- `vue.config.js` - dev-server 配置（代理、端口）
- `package.json` - npm 脚本与依赖

## 本地开发和运行

1. 安装依赖

```powershell
npm install
```

2. 启动 dev server（单实例）

```powershell
npm run serve
```

3. 在不修改脚本的前提下启动多个前端实例（共享同一 `vue.config.js` 中相同 proxy 配置）

在不同终端分别运行（PowerShell）：

```powershell
$env:PORT=8088; npm run serve
$env:PORT=8089; npm run serve
$env:PORT=8090; npm run serve
```

或者在后台新窗口启动（示例）：

```powershell
Start-Process -FilePath 'powershell' -ArgumentList '-NoExit','-Command','$env:PORT=8088; npm run serve' -WorkingDirectory '<项目路径>'
```

说明：`vue.config.js` 中现在使用 `process.env.PORT || 8088`，所以不同实例通过设定 `PORT` 环境变量即可绑定不同端口。

## dev-server 代理与 pathRewrite 说明

- `vue.config.js` 中的 proxy 配置：

```js
proxy: {
  '/api': {
    target: 'http://localhost:8081',
    changeOrigin: true,
    pathRewrite: { '^/api': '' }
  }
}
```

- 这意味着前端所有以 `/api` 开头的请求会被 dev-server 在服务器端转发到后端 `http://localhost:8081`，并且在转发时会把 `/api` 前缀去掉。浏览器看到的响应来源为 dev-server origin（例如 `http://localhost:8088`），从而避免浏览器 CORS 限制。

注意：如果后端实际监听端口不是 `8081`，请修改 `target` 为后端实际端口；或若后端期望保留 `/api` 前缀，请移除 `pathRewrite`。

## axios 配置要点（`src/api/request.js`）

- baseURL: `/api`（配合 dev-server proxy 使用）
- 超时: 60s
- 响应 transform: 使用 `json-bigint` 解析 JSON（处理大整数）
- 拦截器: request/response 统一日志与 nprogress 控制

## 前端调用的接口清单

以下列表基于 `src/api/index.js`（前端封装）整理，分为认证/用户相关、聊天/好友相关和 mock 接口：

认证/会话
- POST `/auth/login` — 登录
- POST `/auth/logout` — 注销

用户注册/验证
- POST `/user/register` — 注册
- POST `/user/verifyCode/send` — 发送验证码
- POST `/user/verifyCode/validate` — 验证验证码
- POST `/user/username/validate` — 验证用户名
- POST `/user/password/validate` — 验证密码

用户信息
- GET `/user/search` — 搜索用户（query params）
- GET `/user/user` — 获取用户信息（query params）
- POST `/user/user/edit` — 编辑用户信息（body JSON）
- POST `/user/user/changeAvatar` — 更换头像（multipart/form-data）
- POST `/user/user/changePassword` — 修改密码
- POST `/user/user/addTag` — 添加标签
- POST `/user/user/removeTag` — 删除标签

好友/聊天
- GET `/chat/chats` — 获取聊天列表（query params）
- GET `/user/friends` — 获取好友列表
- GET `/user/friendVerify` — 获取好友验证列表
- GET `/chat/chats/chatHistory` — 获取聊天历史（query params）
- POST `/chat/chats/savePictureMsg` — 保存图片消息
- POST `/chat/chats/saveFileMsg` — 保存文件消息

本地 mock 路径（若使用 mockAxios）
- GET `/user` — mockGetUserInfo
- GET `/chats` — mockGetChatList
- GET `/friends` — mockGetFriendList
- GET `/friends/verify` — mockGetFriendVerify
- GET `/chats/chat/history` — mockGetHistory

> 说明：前端调用的最终 URL 为 `http://<dev-server-host>:<port>/api/<path>`，dev-server 会将其转发到后端（并可能去掉 `/api`）。

## OpenAPI / Swagger

仓库同时包含一个基于上述接口的 `openapi.yaml`（OpenAPI v3）描述文件，可以用 Swagger UI / Swagger Editor / Redoc 或其他工具打开以生成接口文档与 mock。该文件位于项目根目录。

如何使用：

- 在浏览器打开 https://editor.swagger.io/ ，选择 `File -> Import File` 并上传 `openapi.yaml`。
- 或在本地运行 `swagger-ui` 或 `redoc` 进行展示。

## CORS 与生产部署注意事项

- 开发时：通过 dev-server proxy 可避免 CORS。若前端直接访问后端（不同端口或域），后端必须正确返回 `Access-Control-Allow-Origin` 等 CORS 头并处理预检请求（OPTIONS）。
- 后端若使用 Spring Boot + Spring Security：确保 CORS 配置在安全过滤器链之前生效，或在 Security 中启用 `http.cors()` 或注册全局 `CorsFilter`（并设置高优先级）。

## 生成/维护接口文档建议

- 若后端代码可访问，建议在后端使用自动生成工具（Springfox / springdoc-openapi 或 Swagger 注解）在后端生成 OpenAPI，然后把生成的 OpenAPI JSON 导入到前端仓库并保持同步。
- 当前仓库的 `openapi.yaml` 是从前端使用的接口手工整理而来，适用于快速查看和前端-后端对齐，但并不能替代后端真实实现的 contract。

## 联系与后续工作

- 如果你希望我把 `openapi.yaml` 转换成 HTML 文档（内置 swagger-ui），或把接口文档更精确地补充请求/返回 schema（需要后端返回样例或字段定义），我可以继续实现。

---

文档由自动扫描 `src/api/index.js` 及项目配置生成；如需深入字段级 schema，请提供后端字段定义或示例响应。
