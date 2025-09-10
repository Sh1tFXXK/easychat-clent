打开本地 Swagger UI

1. 确保项目根目录下存在 `openapi.yaml`（本项目已创建）。
2. 在浏览器中直接打开 `docs/swagger/index.html`（某些浏览器对本地文件的 fetch 有跨域限制，会阻止加载 `openapi.yaml`）。
3. 推荐使用本地静态服务器：

```powershell
# 使用简单的 http-server（需要先安装 npm 包）
npm i -g http-server
cd docs/swagger
http-server -p 8081
# 然后在浏览器访问 http://localhost:8081
```

或使用 Python 内置服务器：

```powershell
cd docs/swagger
python -m http.server 8081
```

以此确保 `openapi.yaml` 能被成功加载并在 Swagger UI 中显示。
