# Neo-Brutalist Blog API 文档

> **基础URL**: `http://localhost:5000/api`
> **版本**: v2.2.0-brutalist
> **风格**: NEO-BRUTALIST

---

## 目录

- [通用说明](#通用说明)
- [公开接口](#公开接口)
  - [文章](#文章)
  - [标签](#标签)
  - [评论](#评论)
  - [用户主页](#用户主页)
- [认证接口](#认证接口)
- [用户个人资料接口](#用户个人资料接口)
- [管理接口](#管理接口)
- [用户管理接口](#用户管理接口)
- [系统接口](#系统接口)

---

## 通用说明

### 认证方式
使用 JWT Token 认证，在请求头中添加：
```
Authorization: Bearer <token>
```

### 用户角色
| 角色 | 权限说明 |
|------|----------|
| `USER` | 普通用户：浏览、评论 |
| `ADMIN` | 管理员：管理文章、标签 |
| `SUPER_ADMIN` | 超级管理员：完全控制 |

### 速率限制
- 普通 API: 受 `apiLimiter` 限制
- 认证 API: 受 `authLimiter` 限制（更严格）

### 通用响应格式

**成功响应**:
```json
{
  "success": true,
  "message": "// 操作描述",
  "data": { ... }
}
```

**错误响应**:
```json
{
  "error": true,
  "code": 400,
  "message": "// 错误类型",
  "details": "详细说明"
}
```

---

## 公开接口

### 文章

#### 获取文章列表
```
GET /api/posts
```

**查询参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| limit | int | 10 | 每页数量 |

**响应示例**:
```json
[
  {
    "id": 1,
    "title": "文章标题",
    "slug": "article-slug",
    "excerpt": "摘要",
    "coverImage": "/uploads/cover.jpg",
    "published": true,
    "isPublic": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "author": {
      "id": 1,
      "name": "作者名",
      "avatar": "/uploads/avatar.jpg"
    },
    "tags": [
      { "id": 1, "name": "标签名", "slug": "tag-slug" }
    ]
  }
]
```

---

#### 获取单篇文章
```
GET /api/posts/:slug
```

**路径参数**:
| 参数 | 说明 |
|------|------|
| slug | 文章的 URL 标识 |

**响应**: 返回文章详情，包含作者信息、标签和评论列表

---

#### 搜索文章
```
GET /api/posts/search
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| q | string | 搜索关键词（搜索标题、内容、摘要） |

**响应**: 返回匹配的文章列表（最多10条）

---

#### 获取随机文章
```
GET /api/posts/random
```

**响应**:
```json
{
  "slug": "random-article-slug"
}
```

---

### 标签

#### 获取标签列表
```
GET /api/tags
```

**说明**: 
- 未登录：返回所有公开已发布文章的标签
- 已登录：返回当前用户文章使用的标签

**响应示例**:
```json
[
  {
    "id": 1,
    "name": "JavaScript",
    "slug": "javascript",
    "_count": { "posts": 5 }
  }
]
```

---

#### 获取标签下的文章
```
GET /api/tags/:slug/posts
```

**路径参数**:
| 参数 | 说明 |
|------|------|
| slug | 标签的 URL 标识 |

**响应**:
```json
{
  "tagName": "标签名",
  "posts": [ ... ]
}
```

---

#### 创建标签
```
POST /api/tags
```
> 🔐 需要认证 | 需要 ADMIN+ 权限

**请求体**:
```json
{
  "name": "新标签名"
}
```

---

### 评论

#### 创建评论
```
POST /api/comments
```
> 🔐 需要认证

**请求体**:
```json
{
  "postId": 1,
  "content": "评论内容"
}
```

**响应**: 返回创建的评论，包含作者信息

---

#### 删除自己的评论
```
DELETE /api/comments/:id
```
> 🔐 需要认证

**说明**: 只能删除自己的评论，SUPER_ADMIN 可删除任意评论

---

### 用户主页

#### 获取用户公开主页
```
GET /api/users/:id
```

**路径参数**:
| 参数 | 说明 |
|------|------|
| id | 用户 UID |

**响应**:
```json
{
  "id": 1,
  "name": "用户名",
  "avatar": "/uploads/avatar.jpg",
  "bio": "个人简介",
  "profileBg": "/uploads/bg.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "posts": [ ... ],
  "comments": [ ... ],
  "_count": { "comments": 10, "posts": 5 }
}
```

---

## 认证接口

#### 用户登录
```
POST /api/auth/login
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**说明**: `email` 字段支持邮箱或 UID 登录

**响应**:
```json
{
  "success": true,
  "message": "// 验证通过",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "用户名",
    "avatar": "/uploads/avatar.jpg",
    "role": "USER"
  },
  "expiresIn": "7 days"
}
```

---

#### 用户注册
```
POST /api/auth/register
```

**请求体**:
```json
{
  "name": "用户名",
  "email": "user@example.com",
  "password": "password123"
}
```

**验证规则**:
- 密码长度至少 6 位
- 邮箱和用户名必须唯一

---

#### 验证邮箱是否存在
```
POST /api/auth/verify-email
```

**请求体**:
```json
{
  "email": "user@example.com"
}
```

---

## 用户个人资料接口

> 🔐 以下接口均需要认证

#### 更新个人资料
```
PUT /api/user/profile
```

**请求体**:
```json
{
  "name": "新用户名",
  "bio": "个人简介"
}
```

---

#### 上传头像
```
POST /api/user/avatar
```

**请求类型**: `multipart/form-data`

**字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| file | File | 图片文件 |

---

#### 上传个人主页背景
```
POST /api/user/background
```

**请求类型**: `multipart/form-data`

**字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| file | File | 图片文件 |

---

#### 修改密码
```
PUT /api/user/password
```

**请求体**:
```json
{
  "oldPassword": "原密码",
  "newPassword": "新密码",
  "confirmPassword": "确认新密码"
}
```

---

#### 修改邮箱
```
PUT /api/user/email
```

**请求体**:
```json
{
  "email": "new@example.com",
  "password": "当前密码"
}
```

---

## 管理接口

> 🔐 以下接口需要 ADMIN 或 SUPER_ADMIN 权限

#### 获取仪表盘统计
```
GET /api/admin/stats
```

**响应**:
```json
{
  "totalPosts": 100,
  "publishedPosts": 80,
  "draftPosts": 20,
  "totalTags": 15,
  "totalComments": 500,
  "recentPosts": [ ... ]
}
```

---

#### 获取所有文章（管理用）
```
GET /api/admin/posts
```

**响应**: 返回所有文章列表（包括未发布的），带评论计数

---

#### 获取单篇文章（管理用）
```
GET /api/admin/posts/:id
```

---

#### 创建文章
```
POST /api/admin/posts
```

**请求体**:
```json
{
  "title": "文章标题",
  "slug": "article-slug",
  "content": "Markdown 内容",
  "excerpt": "摘要",
  "coverImage": "/uploads/cover.jpg",
  "published": true,
  "isPublic": true,
  "tagIds": [1, 2, 3]
}
```

---

#### 更新文章
```
PUT /api/admin/posts/:id
```

**请求体**: 同创建文章

---

#### 删除文章
```
DELETE /api/admin/posts/:id
```

**说明**: 软删除，设置 `isDeleted: true`

---

#### 上传文件
```
POST /api/admin/upload
```

**请求类型**: `multipart/form-data`

**响应**:
```json
{
  "url": "/uploads/filename.jpg"
}
```

---

#### 获取所有评论（管理用）
```
GET /api/admin/comments
```
> 🔐 需要 SUPER_ADMIN 权限

---

#### 删除评论（管理用）
```
DELETE /api/admin/comments/:id
```
> 🔐 需要 SUPER_ADMIN 权限

---

## 用户管理接口

> 🔐 以下接口仅 SUPER_ADMIN 可访问

#### 获取所有用户
```
GET /api/admin/users
```

**响应**:
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "name": "用户名",
    "avatar": "/uploads/avatar.jpg",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "_count": { "posts": 5, "comments": 10 }
  }
]
```

---

#### 更新用户角色
```
PUT /api/admin/users/:id/role
```

**请求体**:
```json
{
  "role": "ADMIN"
}
```

**限制**:
- 不能设置为 `SUPER_ADMIN`
- 不能更改自己的角色

---

#### 删除用户
```
DELETE /api/admin/users/:id
```

**限制**: 不能删除自己

**说明**: 删除用户后，其文章和评论会被标记为已删除用户

---

## 系统接口

#### API 信息
```
GET /api
```

**响应**: 返回 API 版本信息、可用端点等

---

#### 健康检查
```
GET /health
```

**响应**:
```json
{
  "system": "DEV.LOG API",
  "status": "OPERATIONAL",
  "uptime": 12345.678,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "// ALL SYSTEMS NOMINAL"
}
```

---

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 静态资源

上传的文件可通过以下地址访问：
```
GET /uploads/{filename}
```

---

*// BREAK THE RULES // DESIGN WITH SOUL //*
