# SupCH 风格个人博客 (Neo-Brutalist Blog) 项目深度汇总

## 1. 项目概览 (Project Overview)

**项目名称**: Neo-Brutalist-AI-Blog (SupCH 风格个人博客)
**当前版本**: v1.1.0 / v1.0.11 (Production Ready)
**核心理念**: 采用 **Neo-Brutalist (新野蛮主义)** 设计风格，结合现代化全栈技术，打造高视觉冲击力、高交互性且功能完备的个人博客系统。
**开发模式**: 前后端分离开发，单端口统一部署。

---

## 2. 技术栈架构 (Technology Stack)

### A. 前端 (Frontend)
位于 `/frontend` 目录。

*   **核心框架**:
    *   **React 18**: 用于构建用户界面的 UI 库。
    *   **TypeScript**: 提供静态类型检查，增强代码健壮性。
    *   **Vite 5**: 下一代前端构建工具，提供极速的开发服务器和打包构建。
*   **路由管理**:
    *   **React Router DOM v6**: 处理 SPA (单页应用) 的页面导航和路由跳转。
*   **样式与设计系统**:
    *   **Vanilla CSS (原生 CSS)**: 未使用 Tailwind 或 Bootstrap，而是通过 `frontend/src/styles/index.css` 手写了一套完整的 **Neo-Brutalist Design System**。
    *   **CSS Variables (CSS 变量)**: 定义了核心色板（Acid Green, Hot Pink, Cyan Pop, Neo Black）、硬阴影 (`--shadow-hard`)、粗边框 (`--border-thick`) 和字体。
    *   **响应式设计**: 通过 CSS Media Queries 适配移动端和桌面端。
*   **Markdown 内容渲染**:
    *   **marked**: 解析 Markdown 源码。
    *   **react-markdown**: React 组件化的 Markdown 渲染。
    *   **remark-gfm**: 支持 GitHub Flavored Markdown (表格、删除线等)。
    *   **remark-math / rehype-katex**: 支持数学公式渲染。
    *   **highlight.js**: 代码块语法高亮。
*   **测试 (Testing)**:
    *   **Vitest**: 单元测试和组件测试框架。
    *   **React Testing Library**: 测试 React 组件的交互。
    *   **JSDOM**: 模拟浏览器环境。

### B. 后端 (Backend)
位于 `/backend` 目录。

*   **运行环境**:
    *   **Node.js**: 服务端 JavaScript 运行环境。
*   **Web 框架**:
    *   **Express v4**: 轻量级 Web 应用框架，处理 API 请求和静态资源托管。
*   **语言**:
    *   **TypeScript**: 全栈类型统一种。
    *   **tsx**: 用于开发环境直接运行 TypeScript 文件。
*   **数据库与 ORM**:
    *   **SQLite**: 轻量级文件数据库 (生产环境易于备份和移动)。
    *   **Prisma ORM**: 现代化的 ORM，提供强类型的数据库操作 API 和 Schema 定义。
*   **身份认证与安全**:
    *   **JWT (JSON Web Token)**: 无状态身份验证。
    *   **bcryptjs**: 用户密码哈希加密。
    *   **Helmet**: 设置 HTTP 安全响应头 (HSTS, X-Frame-Options 等)。
    *   **Cors**: 跨域资源共享配置。
    *   **Express Rate Limit**: API 限流，防止暴力破解和攻击。
    *   **Express Validator**: 请求参数校验。
*   **文件处理**:
    *   **Multer**: 处理 `multipart/form-data` 类型的文件上传。
    *   **Sharp**: 高性能图片处理库，自动将上传的图片转换为 WebP 格式并压缩尺寸。
*   **测试 (Testing)**:
    *   **Jest**: 后端逻辑单元测试。
    *   **Supertest**: API 接口集成测试。

---

## 3. 设计风格详解 (Design System)

本项目采用了鲜明的 **Neo-Brutalist (新野蛮主义)** 风格，其特点在 `index.css` 中体现淋漓尽致：

1.  **高饱和度配色**:
    *   **Acid Green (`#ccff00`)**: 强调色，用于按钮、高亮和深色模式强调。
    *   **Hot Pink (`#ff00ff`)**: 强调色，用于选中态、Hover 效果。
    *   **Cyan Pop (`#00ffff`)**: 强调色，用于故障艺术 (Glitch) 效果。
    *   **Neo Black (`#1a1a1a`)** & **Neo White (`#f0f0f0`)**: 极简的高对比度黑白基调。
2.  **粗犷的几何边框**:
    *   主要组件均带有 **2px - 4px 的纯黑实线边框** (`--border-thick`)。
3.  **硬阴影 (Hard Shadows)**:
    *   抛弃柔和的模糊阴影，使用带偏移的纯色实块阴影 (`5px 5px 0px 0px`)，营造复古立体感。
4.  **复古排版**:
    *   **Sans Serif**: 使用 'DotGothic16', 'MS Gothic' 等点阵或哥特风格无衬线字体。
    *   **Monospace**: 代码和输入框使用 'VT323' 等复古终端字体。
5.  **微交互与动效**:
    *   **自定义光标**: 全局替换为几何图形光标 (`.cursor-dot`, `.cursor-outline`)，点击和 Hover 时有缩放动画。
    *   **故障效果 (Glitch)**: 文本和标题带有赛博朋克风格的故障抖动效果。
    *   **跑马灯**: 首页或特定区域内容的滚动播放。
6.  **深色模式 (Cyberpunk Mode)**:
    *   通过 CSS 变量重定义，深色模式不仅是变黑，更强调**荧光绿**和**霓虹粉**的黑客风格配色。

---

## 4. 核心功能模块 (Key Features)

### 4.1 用户与认证系统
*   **多角色权限**:
    *   **USER**: 普通用户，可评论、修改个人资料（头像/背景图）。
    *   **ADMIN**: 管理员，可发布文章、管理所有文章、批量导入 Markdown。
    *   **SUPER_ADMIN**: 超级管理员，管理用户、分配权限、删除任意评论、批量管理评论。
*   **账号安全**:
    *   注册/登录 (Email/Password)。
    *   **UID 机制**: 用户名全局唯一。
    *   **安全机制**: 修改邮箱需二次验证密码；修改密码后强制登出；错误时自动滚屏提示。

### 4.2 博客内容管理
*   **Markdown 文章**: 支持数学公式 (KaTeX)、代码高亮、GFM 语法。
*   **软删除 (Soft Delete)**: 文章和评论删除后保留数据库记录，前端显示"已被删除"，支持数据恢复（数据库层面）。
*   **版本历史**: 数据库模型 `PostVersion` 设计，支持文章内容的版本回溯（后端已预埋支持）。
*   **AI 赋能**:
    *   **智能摘要**: AI 自动生成文章摘要 (50-150字)。
    *   **智能标签**: AI 分析文章内容推荐 Tag，支持 API 和本地关键词双模。
*   **分类与检索**:
    *   **标签系统**: 多对多标签关联，支持新建和筛选。
    *   **全文搜索 (v1.1.0)**: 增强型搜索，支持标题、内容、标签匹配，**关键词高亮**显示，键盘导航结果。
    *   **分页系统**: 首页流式加载 (Load More)，后台管理标准数字分页。

### 4.3 互动系统
*   **评论系统**:
    *   支持无限层级嵌套回复。
    *   用户可删除自己评论。
    *   管理员批量管理评论 (Checkbox 选择)。
*   **实时通知 (v1.0.11)**:
    *   首页实时显示阅读动态 ("xxxx 刚刚阅读了...").

### 4.4 运维与统计
*   **访问统计**: 记录文章阅读量 (Views)，后台展示 7 天流量图表。
*   **网络支持**: 支持 **IPv6** 识别与显示。
*   **图片优化**: 集成 `sharp`，上传图片自动压缩转 WebP (90%+ 压缩率)。
*   **自动化脚本**: 
    *   `启动博客.bat`: 一键启动双端服务。
    *   `博客管理助手.bat`: Node.js 编写的可视化管理菜单，解决乱码问题。
    *   `停止所有服务.bat`: 强力清理端口占用。

---

## 5. 部署与运维指南 (Deployment & Operations)

### 5.1 快速启动
*   **Windows**: 双击根目录 `启动博客.bat`。
*   **手动**: 分别在 `backend` 和 `frontend` 目录运行 `npm run dev`。

### 5.2 生产环境部署
*   **端口**: 后端默认 **5000** 端口。
*   **静态托管**: 后端 Express 已配置托管前端构建产物 (`dist/`)，实现单端口访问全栈应用。
*   **FRP 映射**: 建议将域名直接映射到本地 5000 端口，解决 CORS 跨域问题。

### 5.3 常用维护命令
*   **数据库迁移**: `npm run db:migrate` (在 backend 目录)
*   **种子数据填充**: `npm run db:seed`
*   **清理端口**: 运行 `停止所有服务.bat`

---

## 6. 版本演进 (Version History Highlights)

*   **v1.1.0**: 全文搜索增强（高亮、键盘导航、智能排序）。
*   **v1.0.11**: 实时阅读通知，IPv6 支持，管理脚本重构。
*   **v1.0.9**: 分页系统重构，嵌套评论，API 文档更新。
*   **v1.0.8**: 自动化测试环境集成 (Jest/Vitest)，图片自动 WebP 优化。
*   **v1.0.6**: 安全增强 (Helmet, CSP)。
*   **v1.0.5**: AI 智能标签，编辑器布局优化。

---

## 7. 项目目录结构 (.files overview)

```text
/
├── backend/                # 后端项目根目录
│   ├── prisma/             # 数据库 Schema 和 Seed 脚本
│   ├── src/                # 后端源代码 (controllers, routes, middlewares)
│   ├── uploads/            # 图片上传存储目录
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # 前端项目根目录
│   ├── src/                # 前端源代码
│   │   ├── components/     # UI 组件
│   │   ├── pages/          # 路由页面
│   │   ├── styles/         # CSS 设计系统文件
│   │   └── services/       # API 请求封装
│   ├── index.html          # Vite 入口 HTML
│   ├── package.json
│   └── vite.config.ts
├── docs/                   # 项目文档 (API, Git 指南等)
├── 启动博客.bat            # Windows 一键启动脚本
├── 博客管理助手.bat        # 可视化管理入口
└── README.md               # 项目主说明文档
```
