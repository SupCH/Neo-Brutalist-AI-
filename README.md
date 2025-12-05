# SupCH 风格个人博客 (Neo-Brutalist Blog)

![Version](https://img.shields.io/badge/version-1.0.1-blue?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/SupCH/-AI-?style=flat-square)
![GitHub repo size](https://img.shields.io/github/repo-size/SupCH/-AI-?style=flat-square)

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)


这是一个基于 **React** 和 **Node.js** 全栈开发的个人博客系统，采用独特的 **Neo-Brutalist (新野蛮主义)** 设计风格。项目集成了完整的用户认证、内容管理、评论互动及后台管理功能，并针对生产环境部署进行了深度优化。

当前版本：`v1.0.1`

## ✨ 核心功能特性

### 🎨 视觉与体验
- **Neo-Brutalist 风格**：高饱和度配色、粗边框、复古排版与微交互动画，提供强烈的视觉冲击力。
- **响应式设计**：完美适配桌面端与移动端访问。
- **访客/博主视角切换**：在个人主页可一键切换视角，预览他人看到的页面效果。

### 👤 用户系统
- **账号体系**：支持邮箱或 UID 登录/注册。
- **个性化资料**：
  - 自定义头像与个人主页背景图（支持图片上传）。
  - 编辑昵称与个人简介。
- **安全机制**：
  - JWT 身份认证。
  - **修改密码**：修改成功后系统强制自动登出，保障账户安全。
  - 角色权限：区分普通用户、管理员与超级管理员。

### 📝 博客内容管理
- **文章系统**：
  - Markdown 文章撰写与渲染。
  - 文章封面、摘要自动生成。
  - **标签系统**：支持标签分类与聚合筛选 (`/tags`)。
- **评论互动**：支持文章评论与回复功能。
- **管理后台**：
  - 管理员可发布、编辑、删除文章。
  - 评论内容的审核与管理。

### 🛠️ 工程与运维优化
- **前后端一体化**：后端 (Express) 直接托管前端静态资源，**单端口 (5000)** 即可运行完整服务。
- **生产环境就绪**：
  - 修复了 SPA 路由在生产环境的 404 问题。
  - 生产级数据库连接管理。
  - 静态导入优化，防止打包后模块丢失 (修复了 `bcrypt` 500 错误)。
- **一键运维脚本**：
  - `启动博客.bat`：一键启动前后端服务。
  - `关闭端口.bat`：一键清理 3000/5000 端口占用，解决启动冲突。

---

## 🚀 技术栈

- **前端**：React, TypeScript, Vite, Vanilla CSS (Styled System)
- **后端**：Node.js, Express, TypeScript
- **数据库**：SQLite, Prisma ORM
- **工具**：npm, Git

---

## 📦 快速开始

### 1. 环境准备
确保已安装 `Node.js` (v18+) 和 `Git`。

### 2. 启动开发
```bash
# Windows 用户直接运行根目录下的脚本
启动博客.bat
```
或手动运行：
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

### 3. 正式部署/访问
在正式环境或内网穿透时，建议访问 **5000** 端口（后端端口）：
- 后端已配置静态文件托管，直接通过 `:5000` 即可访问前端页面。
- 优点：彻底解决了跨域 (CORS) 和 API 路径问题。

**FRP 配置建议：**
- 将域名直接映射到本地 `5000` 端口。

---

## 📄 更新日志

### v1.0.1 (2025-12-06)
- **功能增强**：修改密码后自动登出并跳转至首页。
- **Bug 修复**：
  - 修复生产环境无法连接数据库的问题。
  - 修复后端 `bcrypt` 依赖在构建后导致的 500 崩溃错误。
  - 修复登出后跳转错误的逻辑。
- **部署优化**：后端支持 SPA 路由回退，实现单端口全栈部署。
- **工具**：新增 `关闭端口.bat` 脚本。

---

## 🤝 贡献
欢迎提交 Issue 或 Pull Request。
