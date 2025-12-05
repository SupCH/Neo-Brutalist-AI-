# DEV.LOG 个人博客系统

一个 Neo-Brutalist 风格的全栈个人博客系统，使用 React + Express + SQLite 构建。

![Neo-Brutalist Style](https://img.shields.io/badge/Style-Neo--Brutalist-ccff00)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)

## ✨ 功能特性

- 📝 文章管理（发布、编辑、删除、Markdown 支持）
- 🏷️ 标签分类系统
- 💬 用户评论功能
- 🔐 JWT 认证 + 多角色权限
- 🛡️ 请求限流 + 输入验证
- 🎨 Neo-Brutalist 暗色/亮色主题
- 📱 完整的移动端响应式设计
- 🎲 随机文章漫游
- 🔍 全文搜索

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Vite |
| **后端** | Node.js + Express + TypeScript |
| **数据库** | SQLite + Prisma ORM |
| **样式** | Vanilla CSS + CSS Variables |
| **安全** | express-rate-limit + express-validator |

## 📁 项目结构

```
├── frontend/           # 前端项目
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   └── styles/        # CSS 样式
│   └── package.json
├── backend/            # 后端项目
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── routes/        # 路由
│   │   ├── middleware/    # 中间件（认证、限流、验证）
│   │   └── utils/         # 工具函数
│   ├── prisma/            # 数据库模型
│   └── package.json
└── docs/               # 文档
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 配置环境变量

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，设置 JWT_SECRET 等配置
```

### 初始化数据库

```bash
cd backend

# 生成 Prisma 客户端
npm run db:generate

# 创建数据库表
npm run db:push

# 初始化示例数据
npm run db:seed
```

### 启动开发服务器

```bash
# 后端（端口 5000）
cd backend
npm run dev

# 前端（端口 3000）
cd frontend
npm run dev
```

访问 http://localhost:3000 查看博客

## 👤 用户角色

| 角色 | 权限 |
|------|------|
| USER | 浏览、评论、个人资料管理 |
| ADMIN | + 文章管理、标签管理、文件上传 |
| SUPER_ADMIN | + 用户管理、角色分配 |

## 📚 文档

- [API 文档](docs/api.md)
- [部署指南](docs/deployment.md)
- [FRP 内网穿透](docs/frp-deployment.md)
- [Git 使用指南](docs/git-guide.md)

## 🔒 安全特性

- JWT Token 认证
- 请求频率限制（登录 5次/15分钟，API 100次/15分钟）
- 输入验证与 XSS 防护
- 密码 bcrypt 加密

## 📄 许可证

MIT License
