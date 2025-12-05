import { Router } from 'express'
import { postController } from '../controllers/postController.js'
import { authController } from '../controllers/authController.js'
import { tagController } from '../controllers/tagController.js'
import { commentController } from '../controllers/commentController.js'
import { adminController } from '../controllers/adminController.js'
import { userController } from '../controllers/userController.js'
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
router.get('/admin/posts', authMiddleware, requireAdmin, paginationValidation, adminController.getPosts)
router.get('/admin/posts/:id', authMiddleware, requireAdmin, idParamValidation, adminController.getPost)
router.post('/admin/posts', authMiddleware, requireAdmin, createPostValidation, adminController.createPost)
router.put('/admin/posts/:id', authMiddleware, requireAdmin, updatePostValidation, adminController.updatePost)
router.delete('/admin/posts/:id', authMiddleware, requireAdmin, idParamValidation, adminController.deletePost)
router.get('/admin/comments', authMiddleware, requireAdmin, commentController.getComments)
router.delete('/admin/comments/:id', authMiddleware, requireAdmin, idParamValidation, commentController.deleteComment)
router.post('/admin/upload', authMiddleware, requireAdmin, upload.single('file'), adminController.uploadFile)

// 用户管理接口（仅 SUPER_ADMIN）
router.get('/admin/users', authMiddleware, requireSuperAdmin, paginationValidation, userController.getUsers)
router.put('/admin/users/:id/role', authMiddleware, requireSuperAdmin, updateRoleValidation, userController.updateRole)
router.delete('/admin/users/:id', authMiddleware, requireSuperAdmin, idParamValidation, userController.deleteUser)

export default router
