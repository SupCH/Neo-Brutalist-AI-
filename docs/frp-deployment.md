# Windows Server + FRP 内网穿透部署指�?

本指南详细介绍如何使�?frp 将运行在 Windows 本地服务器上的博客发布到公网�?

## 📋 前提条件

| 需要准�?| 说明 |
|---------|------|
| **公网服务�?* | 需要一台有公网 IP 的云服务器（阿里�?腾讯�?搬瓦工等），作为 frp 服务�?|
| **Windows Server** | 你的本地服务器，运行博客 |
| **域名（可选）** | 如果想用域名访问，需要购买域名并解析到公网服务器 |

## 🌐 架构�?

```
用户访问 �?公网服务�?frps):80 �?frp隧道 �?Windows本地(frpc):3000 �?博客
```

---

## 第一部分：配置公网服务器（frps 服务端）

### 1.1 下载 frp

SSH 登录到你的公网服务器（假设是 Linux）：

```bash
# 下载 frp（检查最新版本：https://github.com/fatedier/frp/releases�?
cd /opt
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz

# 解压
tar -zxvf frp_0.52.3_linux_amd64.tar.gz
mv frp_0.52.3_linux_amd64 frp
cd frp
```

### 1.2 配置 frps.toml

```bash
nano frps.toml
```

写入以下内容�?

```toml
# frps.toml - 服务端配�?

# 基础配置
bindPort = 7000              # frp 服务端口（客户端连接用）
vhostHTTPPort = 80           # HTTP 代理端口（用户访问用�?
vhostHTTPSPort = 443         # HTTPS 代理端口（可选）

# 认证配置（重要！防止他人恶意使用�?
auth.method = "token"
auth.token = "YourSuperSecretToken123"   # 改成你自己的密钥�?

# Dashboard（可选，方便查看连接状态）
webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "admin"
webServer.password = "admin123"          # 改成你自己的密码�?

# 日志
log.to = "/var/log/frps.log"
log.level = "info"
log.maxDays = 7
```

### 1.3 开放防火墙端口

```bash
# Ubuntu/Debian
sudo ufw allow 7000/tcp    # frp 服务端口
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 7500/tcp    # Dashboard（可选）

# CentOS
sudo firewall-cmd --permanent --add-port=7000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=7500/tcp
sudo firewall-cmd --reload
```

**重要**：同时在云服务器的安全组/防火墙策略中放行这些端口�?

### 1.4 启动 frps

```bash
# 测试运行
./frps -c frps.toml

# 如果没问题，�?systemd 管理（推荐）
sudo nano /etc/systemd/system/frps.service
```

写入�?

```ini
[Unit]
Description=frp Server
After=network.target

[Service]
Type=simple
ExecStart=/opt/frp/frps -c /opt/frp/frps.toml
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

启动服务�?

```bash
sudo systemctl daemon-reload
sudo systemctl enable frps
sudo systemctl start frps
sudo systemctl status frps
```

---

## 第二部分：配�?Windows 本地服务器（frpc 客户端）

### 2.1 下载 frp

1. 访问 https://github.com/fatedier/frp/releases
2. 下载 `frp_0.52.3_windows_amd64.zip`
3. 解压�?`C:\frp\`

### 2.2 配置 frpc.toml

�?`C:\frp\` 目录下创�?`frpc.toml` 文件�?

```toml
# frpc.toml - 客户端配�?

# 连接服务�?
serverAddr = "你的公网服务器IP"    # 例如 "123.45.67.89"
serverPort = 7000

# 认证（必须与服务端一致）
auth.method = "token"
auth.token = "YourSuperSecretToken123"

# 日志
log.to = "C:/frp/frpc.log"
log.level = "info"

# ========================================
# 代理配置：博客网�?
# ========================================

# 方式一：使用子域名访问（推荐，需要配置域名）
[[proxies]]
name = "blog-web"
type = "http"
localIP = "127.0.0.1"
localPort = 3000                     # 你的前端端口
customDomains = ["blog.yourdomain.com"]  # 你的域名

[[proxies]]
name = "blog-api"
type = "http"
localIP = "127.0.0.1"
localPort = 5000                     # 你的后端端口
customDomains = ["api.yourdomain.com"]   # API 域名

# 方式二：使用 IP + 端口访问（无域名时使用）
# [[proxies]]
# name = "blog-tcp"
# type = "tcp"
# localIP = "127.0.0.1"
# localPort = 3000
# remotePort = 8080                  # 公网服务器的 8080 端口
```

### 2.3 启动 frpc（命令行测试�?

打开 PowerShell（管理员）：

```powershell
cd C:\frp
.\frpc.exe -c frpc.toml
```

看到类似以下输出表示成功�?
```
[I] [control.go:XXX] [blog-web] start proxy success
[I] [control.go:XXX] [blog-api] start proxy success
```

### 2.4 �?frpc 注册�?Windows 服务（开机自启）

使用 NSSM 工具�?

1. 下载 NSSM：https://nssm.cc/download
2. 解压，将 `nssm.exe` 复制�?`C:\frp\`
3. 打开 PowerShell（管理员）：

```powershell
cd C:\frp

# 安装服务
.\nssm.exe install frpc

# 在弹出的窗口中设置：
# Path: C:\frp\frpc.exe
# Startup directory: C:\frp
# Arguments: -c frpc.toml

# 或者直接命令行安装
.\nssm.exe install frpc "C:\frp\frpc.exe" "-c C:\frp\frpc.toml"
.\nssm.exe set frpc AppDirectory "C:\frp"
.\nssm.exe start frpc
```

---

## 第三部分：配置博客在 Windows 上运�?

### 3.1 修改前端 API 地址

由于使用�?frp 代理，前端需要知�?API 的正确地址�?

编辑 `frontend/src/services/api.ts`�?

```typescript
// 生产环境使用相对路径或独�?API 域名
const API_BASE = import.meta.env.PROD 
    ? 'https://api.yourdomain.com/api'   // 使用独立 API 域名
    : '/api'                              // 开发环�?
```

或者使用同域代理（推荐）：

```typescript
const API_BASE = '/api'  // 始终使用相对路径
```

### 3.2 构建前端

```powershell
cd E:\风格个人博客\frontend
npm run build
```

### 3.3 使用静态服务器托管前端

安装 `serve`�?

```powershell
npm install -g serve
```

运行（端�?3000）：

```powershell
cd E:\风格个人博客\frontend
serve -s dist -l 3000
```

### 3.4 启动后端

```powershell
cd E:\风格个人博客\backend
npm run start
```

### 3.5 使用 PM2 管理进程（推荐）

```powershell
# 安装 PM2
npm install -g pm2

# 启动后端
cd E:\风格个人博客\backend
pm2 start npm --name "blog-api" -- start

# 启动前端
cd E:\风格个人博客\frontend
pm2 start serve --name "blog-web" -- -s dist -l 3000

# 保存进程列表
pm2 save

# 设置开机启�?
pm2-startup install
```

---

## 第四部分：域名配置（可选但推荐�?

### 4.1 购买域名

推荐：阿里云、腾讯云、Cloudflare、Namecheap

### 4.2 DNS 解析

将以下记录指向你�?*公网服务�?IP**�?

| 主机记录 | 记录类型 | 记录�?|
|---------|---------|--------|
| `blog` | A | 123.45.67.89（你的公网服务器IP�?|
| `api` | A | 123.45.67.89 |
| `@` | A | 123.45.67.89（如果用主域名） |

### 4.3 单域名方案（使用 Nginx 反代�?

如果只想用一个域名，�?*公网服务�?*上配�?Nginx�?

```nginx
server {
    listen 80;
    server_name blog.yourdomain.com;

    # 前端
    location / {
        proxy_pass http://127.0.0.1:80;  # frp vhostHTTPPort
        proxy_set_header Host blog.yourdomain.com;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API 反代
    location /api {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host api.yourdomain.com;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 第五部分：完整配置示�?

### 公网服务�?frps.toml

```toml
bindPort = 7000
vhostHTTPPort = 80
auth.method = "token"
auth.token = "MySecureToken2024"
```

### Windows本地 frpc.toml

```toml
serverAddr = "123.45.67.89"
serverPort = 7000
auth.method = "token"
auth.token = "MySecureToken2024"

[[proxies]]
name = "blog"
type = "http"
localIP = "127.0.0.1"
localPort = 3000
customDomains = ["blog.example.com"]
```

---

## 🔧 故障排查

### 问题：连接服务端失败

```
检查清单：
1. 公网服务�?frps 是否运行�?�?systemctl status frps
2. 防火墙是否开�?7000 端口�?�?本地 + 云平台安全组
3. token 是否一致？
4. serverAddr 是否正确�?
```

### 问题：网页打不开

```
检查清单：
1. frpc 显示 proxy success 了吗�?
2. 本地博客能访问吗？→ http://localhost:3000
3. 域名 DNS 解析正确吗？�?ping blog.example.com
4. 公网 80 端口开放了吗？
```

### 问题：API 请求失败

```
检查清单：
1. 后端是否运行？→ http://localhost:5000/api
2. 前端 API_BASE 地址对吗�?
3. CORS 配置正确吗？
```

### 查看日志

```powershell
# Windows 客户端日�?
type C:\frp\frpc.log

# Linux 服务端日�?
tail -f /var/log/frps.log
```

---

## 📊 Dashboard 监控

访问 `http://你的公网IP:7500`，使用配置的用户名密码登录，可以看到�?
- 当前连接的客户端
- 代理状�?
- 流量统计

---

## ⚠️ 安全建议

1. **修改默认 token** - 使用强密�?
2. **限制 Dashboard 访问** - 可以改用内网端口或加 IP 白名�?
3. **使用 HTTPS** - 保护数据传输
4. **定期更新 frp** - 获取安全补丁
5. **监控流量** - 防止被滥�?

---

## 🎯 快速命令总结

```powershell
# Windows 本地启动全部服务
pm2 start blog-api blog-web
.\frpc.exe -c frpc.toml

# 检查状�?
pm2 status

# 查看日志
pm2 logs
```

现在访问 `http://blog.yourdomain.com` 就能看到你的博客了！
