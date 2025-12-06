# 开发规范

## 代码风格

### TypeScript

- 使用 TypeScript 严格模式
- 明确定义类型，避免使用 `any`
- 使用 `interface` 定义对象类型
- 使用 `type` 定义联合类型或复杂类型

```typescript
// ✅ 好的写法
interface User {
  id: number
  name: string
  email: string
}

// ❌ 避免
const user: any = {}
```

### React 组件

- 使用函数式组件 + Hooks
- 组件文件使用 `.tsx` 扩展名
- 每个组件对应一个 CSS 文件
- 使用 CSS Modules 或命名约定避免样式冲突

```tsx
// 组件结构
import { useState, useEffect } from 'react'
import './ComponentName.css'

interface Props {
  title: string
}

function ComponentName({ title }: Props) {
  const [state, setState] = useState('')
  
  return <div className="component-name">{title}</div>
}

export default ComponentName
```

### CSS

- 使用 CSS Variables 定义主题变量
- 使用 BEM 或组件名作为类名前缀
- 响应式设计使用移动优先
- 颜色、间距等使用变量

```css
/* ✅ 使用变量 */
.post-card {
  padding: var(--spacing-lg);
  background: var(--glass-bg);
  border-radius: var(--border-radius);
}

/* ❌ 避免硬编码 */
.post-card {
  padding: 24px;
  background: rgba(30, 41, 59, 0.7);
}
```

---

## 权限模型

### 用户角色

| 角色 | 权限说明 |
|------|----------|
| `USER` | 普通用户：管理自己的文章、评论 |
| `ADMIN` | 管理员：管理所有文章、标签 |
| `SUPER_ADMIN` | 超级管理员：评论管理、用户管理 |

### API 权限约定

```typescript
// 路由中间件使用约定
authMiddleware         // 仅需登录
requireAdmin           // 需要 ADMIN 或 SUPER_ADMIN
requireSuperAdmin      // 仅 SUPER_ADMIN

// 资源所有权验证在 Controller 中进行
const isOwner = post.authorId === userId
const isAdmin = req.userRole === 'ADMIN' || req.userRole === 'SUPER_ADMIN'
if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: '权限不足' })
}
```

### 文章权限矩阵

| 操作 | USER (非作者) | USER (作者) | ADMIN |
|------|--------------|-------------|-------|
| 查看列表 | ✅ 仅自己 | ✅ 仅自己 | ✅ 全部 |
| 创建 | ✅ | ✅ | ✅ |
| 编辑 | ❌ | ✅ | ✅ |
| 删除 | ❌ | ✅ | ✅ |

---

## 项目约定

### 文件命名

| 类型 | 命名规范 | 示例 |
|------|----------|------|
| React 组件 | PascalCase | `PostCard.tsx` |
| 样式文件 | 与组件同名 | `PostCard.css` |
| 工具函数 | camelCase | `formatDate.ts` |
| 常量文件 | camelCase | `constants.ts` |
| Controller | camelCase + Controller | `postController.ts` |

### 目录结构

```
frontend/src/
├── components/     # 可复用组件
├── pages/          # 页面组件
│   └── admin/      # 后台管理页面
├── hooks/          # 自定义 Hooks
├── services/       # API 服务
├── styles/         # 全局样式
└── utils/          # 工具函数

backend/src/
├── controllers/    # 请求处理器
├── middleware/     # 中间件 (认证、验证)
├── routes/         # 路由定义
├── utils/          # 工具函数 (Prisma 客户端等)
└── index.ts        # Express 入口

backend/prisma/
├── schema.prisma   # 数据库模型
├── migrations/     # 迁移文件
├── seed.ts         # 生产种子数据
└── seed-demo.ts    # 测试数据生成
```

---

## API 开发规范

### 新增接口流程

1. **定义 Controller** (`backend/src/controllers/xxxController.ts`)
2. **注册路由** (`backend/src/routes/index.ts`)
3. **添加验证** (使用 express-validator)
4. **更新前端 API** (`frontend/src/services/api.ts`)
5. **更新文档** (`docs/api.md`)

### 响应格式

```typescript
// 成功
res.json({ success: true, data: {...} })

// 错误 (使用 Neo-Brutalist 风格注释前缀)
res.status(403).json({ error: '// FORBIDDEN: 权限不足' })
res.status(404).json({ error: '文章不存在' })
```

### AI 功能降级模式

AI 相关接口 (标签生成、摘要生成) 需实现降级：
```typescript
// 1. 优先使用 AI API
if (apiKey) {
    // 调用 AI
}
// 2. 降级为本地算法
if (!result) {
    // 本地关键词提取/文本截取
}
```

---

## Git 提交规范

使用语义化提交信息：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
test: 添加测试
chore: 构建/配置变更
```

示例：
```
feat: 添加文章评论功能
fix: 修复登录页面样式问题
docs: 更新 API 文档
```

---

## 开发流程

1. 创建功能分支：`git checkout -b feature/xxx`
2. 开发并测试
3. 提交代码
4. 创建 Pull Request
5. 代码审查
6. 合并到主分支

---

## 数据库变更

### 新增字段/模型

1. 修改 `prisma/schema.prisma`
2. 运行 `npx prisma migrate dev --name <migration_name>`
3. 更新 seed 脚本（如需要）
4. 重启后端（Prisma Client 会自动重新生成）

### 注意事项

- 生产环境使用 `npx prisma migrate deploy`
- 避免在迁移后手动修改数据库
