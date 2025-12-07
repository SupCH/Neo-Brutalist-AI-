import { Router } from 'express'
import { postController } from '../controllers/postController.js'
import { authController } from '../controllers/authController.js'
import { tagController } from '../controllers/tagController.js'
import { commentController } from '../controllers/commentController.js'
import { adminController } from '../controllers/adminController.js'
import { userController } from '../controllers/userController.js'
import { analyticsController } from '../controllers/analyticsController.js'
import { authMiddleware, requireAdmin, requireSuperAdmin } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { apiLimiter, authLimiter } from '../middleware/rateLimiter.js'
import {
    loginValidation,
    registerValidation,
    createPostValidation,
    updatePostValidation,
    createCommentValidation,
    updateProfileValidation,
    updateRoleValidation,
    idParamValidation,
    slugParamValidation,
    searchValidation,
    paginationValidation,
    changePasswordValidation
} from '../middleware/validator.js'

const router = Router()

// API 信息 - Neo-Brutalist Style
router.get('/', (req, res) => {
    res.json({
        _: '// BREAK THE RULES // DESIGN WITH SOUL //',
        system: 'DEV.LOG API',
        version: 'v2.2.0-brutalist',
        status: 'ONLINE',
        timestamp: new Date().toISOString(),
        style: 'NEO-BRUTALIST',
        features: ['Rate Limiting', 'Input Validation', 'JWT Auth'],
        endpoints: {
            public: {
                posts: 'GET /api/posts',
                post: 'GET /api/posts/:slug',
                tags: 'GET /api/tags',
                tag_posts: 'GET /api/tags/:slug/posts',
                comments: 'POST /api/comments'
            },
            auth: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register'
            },
            admin: {
                stats: 'GET /api/admin/stats [ADMIN+]',
                posts: 'CRUD /api/admin/posts [ADMIN+]',
                upload: 'POST /api/admin/upload [ADMIN+]',
                users: 'GET /api/admin/users [SUPER_ADMIN]',
                user_role: 'PUT /api/admin/users/:id/role [SUPER_ADMIN]'
            }
        },
        roles: {
            USER: '普通用户：浏览、评论',
            ADMIN: '管理员：管理文章、标签',
            SUPER_ADMIN: '超级管理员：完全控制'
        }
    })
})

// 公开接口
router.get('/posts', apiLimiter, paginationValidation, postController.getPosts)
router.get('/posts/search', apiLimiter, searchValidation, postController.searchPosts)
router.get('/posts/random', apiLimiter, postController.getRandomPost)
router.get('/posts/:slug', apiLimiter, slugParamValidation, postController.getPost)
router.get('/tags', apiLimiter, tagController.getTags)
router.post('/tags', authMiddleware, requireAdmin, tagController.createTag)
router.get('/tags/:slug/posts', apiLimiter, slugParamValidation, tagController.getTagPosts)
router.get('/users/:id', apiLimiter, idParamValidation, userController.getUserProfile)
router.post('/comments', apiLimiter, createCommentValidation, commentController.createComment)
router.delete('/comments/:id', authMiddleware, commentController.deleteOwnComment)
router.post('/analytics/view', apiLimiter, analyticsController.recordView)
router.get('/analytics/recent-views', apiLimiter, analyticsController.getRecentViews)

// IP 检测接口
router.get('/ip', apiLimiter, async (req, res) => {
    try {
        // 获取用户真实IP（考虑代理情况）
        const forwarded = req.headers['x-forwarded-for']
        const realIp = req.headers['x-real-ip']
        let clientIp: string = forwarded
            ? (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0])
            : (typeof realIp === 'string' ? realIp : req.socket.remoteAddress || '')

        // 去除 IPv6 前缀
        if (clientIp && clientIp.startsWith('::ffff:')) {
            clientIp = clientIp.substring(7)
        }

        // 本地开发环境处理
        // 本地开发环境处理
        // 包含: IPv4 localhost, IPv6 localhost (::1), Link-local IPv6 (fe80::)
        const isLocal =
            clientIp === '127.0.0.1' ||
            clientIp === 'localhost' ||
            clientIp === '::1' ||
            clientIp?.toLowerCase().startsWith('fe80::')

        if (isLocal) {
            return res.json({
                ip: clientIp || '127.0.0.1',
                location: clientIp?.includes(':') ? '本地开发环境 (IPv6)' : '本地开发环境 (IPv4)'
            })
        }

        // 调用 ip-api.com 获取地理位置
        const response = await fetch(`http://ip-api.com/json/${clientIp}?lang=zh-CN&fields=query,country,regionName,city,status`)
        const data = await response.json() as { status: string; query: string; country: string; regionName: string; city: string }

        if (data.status === 'success') {
            const locationParts = [data.country, data.regionName, data.city].filter(Boolean)
            res.json({
                ip: data.query,
                location: locationParts.join(' ') || '未知位置'
            })
        } else {
            res.json({
                ip: clientIp,
                location: '位置获取失败'
            })
        }
    } catch (error) {
        console.error('IP检测失败:', error)
        res.status(500).json({
            ip: '获取失败',
            location: '服务异常'
        })
    }
})

// 认证接口
router.post('/auth/login', authLimiter, loginValidation, authController.login)
router.post('/auth/register', authLimiter, registerValidation, authController.register)
router.post('/auth/verify-email', authLimiter, authController.verifyEmail)
router.get('/auth/debug', authController.debugAuth)

// 用户个人资料接口（需登录）
router.put('/user/profile', authMiddleware, updateProfileValidation, userController.updateProfile)
router.post('/user/avatar', authMiddleware, upload.single('file'), userController.uploadAvatar)
router.post('/user/background', authMiddleware, upload.single('file'), userController.uploadProfileBg)
router.put('/user/password', authMiddleware, changePasswordValidation, userController.changePassword)
router.put('/user/email', authMiddleware, userController.changeEmail)

// 管理接口（需要 ADMIN 或 SUPER_ADMIN）
router.get('/admin/stats', authMiddleware, requireAdmin, adminController.getStats)
router.get('/admin/analytics', authMiddleware, requireAdmin, analyticsController.getStats)
// 文章管理 - 所有已登录用户可访问（权限检查在 Controller 中进行）
router.get('/admin/posts', authMiddleware, paginationValidation, adminController.getPosts)
router.get('/admin/posts/:id', authMiddleware, idParamValidation, adminController.getPost)
router.post('/admin/posts', authMiddleware, createPostValidation, adminController.createPost)
router.post('/admin/posts/batch', authMiddleware, requireAdmin, adminController.batchCreatePosts)
router.put('/admin/posts/:id', authMiddleware, updatePostValidation, adminController.updatePost)
router.delete('/admin/posts/:id', authMiddleware, idParamValidation, adminController.deletePost)
router.get('/admin/posts/:id/versions', authMiddleware, idParamValidation, adminController.getPostVersions)
router.get('/admin/posts/:id/versions/:versionId', authMiddleware, requireAdmin, adminController.getPostVersion)
router.post('/admin/posts/:id/versions/:versionId/rollback', authMiddleware, requireAdmin, adminController.rollbackPostVersion)
router.get('/admin/comments', authMiddleware, requireSuperAdmin, commentController.getComments)
router.delete('/admin/comments/:id', authMiddleware, requireSuperAdmin, idParamValidation, commentController.deleteComment)
router.post('/admin/upload', authMiddleware, requireAdmin, upload.single('file'), adminController.uploadFile)
router.post('/admin/generate-tags', authMiddleware, adminController.generateTags)
router.post('/admin/generate-excerpt', authMiddleware, adminController.generateExcerpt)
router.delete('/admin/tags/:id', authMiddleware, requireAdmin, tagController.deleteTag)
router.get('/debug-ai', adminController.debugAi)

// 用户管理接口（仅 SUPER_ADMIN）
router.get('/admin/users', authMiddleware, requireSuperAdmin, paginationValidation, userController.getUsers)
router.put('/admin/users/:id/role', authMiddleware, requireSuperAdmin, updateRoleValidation, userController.updateRole)
router.delete('/admin/users/:id', authMiddleware, requireSuperAdmin, idParamValidation, userController.deleteUser)

export default router
