import { body, param, query, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'

// 验证结果处理中间件
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: '输入验证失败',
            details: errors.array().map(err => ({
                field: (err as any).path || (err as any).param,
                message: err.msg
            }))
        })
    }
    next()
}

// ========== 认证验证规则 ==========

export const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('账号不能为空')
        .custom((value) => {
            // 支持 UID（纯数字）或邮箱格式
            const isUid = /^\d+$/.test(value)
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            if (!isUid && !isEmail) {
                throw new Error('请输入有效的邮箱地址或 UID')
            }
            return true
        }),
    body('password')
        .notEmpty().withMessage('密码不能为空')
        .isLength({ min: 6 }).withMessage('密码至少 6 个字符'),
    handleValidationErrors
]

export const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('用户名不能为空')
        .isLength({ min: 2, max: 30 }).withMessage('用户名长度应为 2-30 个字符')
        .matches(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/).withMessage('用户名只能包含中文、字母、数字和下划线'),
    body('email')
        .trim()
        .notEmpty().withMessage('邮箱不能为空')
        .isEmail().withMessage('请输入有效的邮箱地址')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('密码不能为空')
        .isLength({ min: 6, max: 100 }).withMessage('密码长度应为 6-100 个字符')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/).withMessage('密码必须包含字母和数字'),
    handleValidationErrors
]

// ========== 文章验证规则 ==========

export const createPostValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('标题不能为空')
        .isLength({ min: 1, max: 200 }).withMessage('标题长度应为 1-200 个字符'),
    body('content')
        .notEmpty().withMessage('内容不能为空')
        .isLength({ min: 10 }).withMessage('内容至少 10 个字符'),
    body('slug')
        .optional()
        .trim()
        .isSlug().withMessage('Slug 格式不正确，只能包含字母、数字和连字符'),
    body('excerpt')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('摘要最多 500 个字符'),
    body('published')
        .optional()
        .isBoolean().withMessage('published 必须是布尔值'),
    body('isPublic')
        .optional()
        .isBoolean().withMessage('isPublic 必须是布尔值'),
    body('tagIds')
        .optional()
        .isArray().withMessage('tagIds 必须是数组'),
    body('tagIds.*')
        .optional()
        .isInt({ min: 1 }).withMessage('tagId 必须是正整数'),
    handleValidationErrors
]

export const updatePostValidation = [
    param('id')
        .isInt({ min: 1 }).withMessage('无效的文章 ID'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 }).withMessage('标题长度应为 1-200 个字符'),
    body('content')
        .optional()
        .isLength({ min: 10 }).withMessage('内容至少 10 个字符'),
    body('slug')
        .optional()
        .trim()
        .isSlug().withMessage('Slug 格式不正确'),
    body('excerpt')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('摘要最多 500 个字符'),
    body('published')
        .optional()
        .isBoolean().withMessage('published 必须是布尔值'),
    body('isPublic')
        .optional()
        .isBoolean().withMessage('isPublic 必须是布尔值'),
    handleValidationErrors
]

// ========== 评论验证规则 ==========

export const createCommentValidation = [
    body('postId')
        .notEmpty().withMessage('文章 ID 不能为空')
        .isInt({ min: 1 }).withMessage('无效的文章 ID'),
    body('content')
        .trim()
        .notEmpty().withMessage('评论内容不能为空')
        .isLength({ min: 1, max: 1000 }).withMessage('评论长度应为 1-1000 个字符')
        .escape(), // 防止 XSS
    handleValidationErrors
]

// ========== 用户资料验证规则 ==========

export const updateProfileValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 30 }).withMessage('用户名长度应为 2-30 个字符')
        .matches(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/).withMessage('用户名只能包含中文、字母、数字和下划线'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('个人简介最多 500 个字符'),
    handleValidationErrors
]

// ========== 用户角色验证规则 ==========

export const updateRoleValidation = [
    param('id')
        .isInt({ min: 1 }).withMessage('无效的用户 ID'),
    body('role')
        .notEmpty().withMessage('角色不能为空')
        .isIn(['USER', 'ADMIN', 'SUPER_ADMIN']).withMessage('无效的角色类型'),
    handleValidationErrors
]

// ========== 通用 ID 参数验证 ==========

export const idParamValidation = [
    param('id')
        .isInt({ min: 1 }).withMessage('无效的 ID'),
    handleValidationErrors
]

export const slugParamValidation = [
    param('slug')
        .trim()
        .notEmpty().withMessage('Slug 不能为空')
        .isLength({ max: 200 }).withMessage('Slug 长度不能超过 200 个字符'),
    handleValidationErrors
]

// ========== 搜索验证规则 ==========

export const searchValidation = [
    query('q')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('搜索关键词最多 100 个字符')
        .escape(),
    handleValidationErrors
]

// ========== 分页验证规则 ==========

export const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1, max: 1000 }).withMessage('页码必须是 1-1000 之间的整数'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('每页数量必须是 1-100 之间的整数'),
    handleValidationErrors
]

// ========== 密码修改验证规则 ==========

export const changePasswordValidation = [
    body('oldPassword')
        .notEmpty().withMessage('原密码不能为空')
        .isLength({ min: 6 }).withMessage('原密码至少 6 个字符'),
    body('newPassword')
        .notEmpty().withMessage('新密码不能为空')
        .isLength({ min: 6, max: 100 }).withMessage('新密码长度应为 6-100 个字符')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/).withMessage('新密码必须包含字母和数字'),
    body('confirmPassword')
        .notEmpty().withMessage('确认密码不能为空')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('两次输入的密码不一致')
            }
            return true
        }),
    handleValidationErrors
]
