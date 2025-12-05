import { Request, Response } from 'express'
import prisma from '../utils/prisma.js'
import { AuthRequest } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'

export const userController = {
    // 获取用户公开主页信息 (公开 API)
    async getUserProfile(req: Request, res: Response) {
        try {
            const { id } = req.params

            const user = await prisma.user.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                    bio: true,
                    profileBg: true,
                    createdAt: true,
                    posts: {
                        where: { published: true },
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            excerpt: true,
                            coverImage: true,
                            createdAt: true,
                            tags: { select: { name: true, slug: true } }
                        }
                    },
                    comments: {
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            post: {
                                select: { id: true, title: true, slug: true }
                            }
                        }
                    },
                    _count: {
                        select: { comments: true, posts: true }
                    }
                }
            })

            if (!user) {
                return res.status(404).json({ error: '用户不存在' })
            }

            res.json(user)
        } catch (error) {
            console.error('获取用户主页失败:', error)
            res.status(500).json({ error: '获取用户主页失败' })
        }
    },

    // 获取所有用户 (SUPER_ADMIN only)
    async getUsers(req: AuthRequest, res: Response) {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    name: true,
                    avatar: true,
                    role: true,
                    createdAt: true,
                    _count: {
                        select: {
                            posts: true,
                            comments: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            res.json(users)
        } catch (error) {
            console.error('// GET USERS ERROR:', error)
            res.status(500).json({ error: '// SYSTEM ERROR: 获取用户列表失败' })
        }
    },

    // 更新用户角色 (SUPER_ADMIN only)
    async updateRole(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params
            const { role } = req.body as { role: string }

            // 验证角色值
            if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
                return res.status(400).json({ error: '// INVALID ROLE: 无效的角色值' })
            }

            // 不能更改自己的角色
            if (parseInt(id) === req.userId) {
                return res.status(400).json({ error: '// FORBIDDEN: 不能更改自己的角色' })
            }

            const user = await prisma.user.update({
                where: { id: parseInt(id) },
                data: { role },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true
                }
            })

            res.json({
                success: true,
                message: `// ROLE UPDATED: 用户角色已更改为 ${role}`,
                user
            })
        } catch (error) {
            console.error('// UPDATE ROLE ERROR:', error)
            res.status(500).json({ error: '// SYSTEM ERROR: 更新角色失败' })
        }
    },

    // 删除用户 (SUPER_ADMIN only)
    async deleteUser(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params
            const userId = parseInt(id)

            // 不能删除自己
            if (userId === req.userId) {
                return res.status(400).json({ error: '// FORBIDDEN: 不能删除自己' })
            }

            // 删除用户，文章和评论的authorId会自动设为null
            await prisma.user.delete({
                where: { id: userId }
            })

            res.json({
                success: true,
                message: '// USER DELETED: 用户已删除，其文章和评论已标记为已删除用户'
            })
        } catch (error) {
            console.error('// DELETE USER ERROR:', error)
            res.status(500).json({ error: '// SYSTEM ERROR: 删除用户失败' })
        }
    },

    // 更新个人资料 (需登录，只能更新自己)
    async updateProfile(req: AuthRequest, res: Response) {
        try {
            const { name, bio } = req.body

            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: '用户名不能为空' })
            }

            const user = await prisma.user.update({
                where: { id: req.userId },
                data: {
                    name: name.trim(),
                    bio: bio?.trim() || null
                },
                select: {
                    id: true,
                    name: true,
                    bio: true,
                    avatar: true,
                    profileBg: true
                }
            })

            res.json({
                success: true,
                message: '资料更新成功',
                user
            })
        } catch (error) {
            console.error('更新资料失败:', error)
            res.status(500).json({ error: '更新资料失败' })
        }
    },

    // 上传头像 (需登录)
    async uploadAvatar(req: AuthRequest, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: '请选择要上传的图片' })
            }

            const avatarUrl = `/uploads/${req.file.filename}`

            const user = await prisma.user.update({
                where: { id: req.userId },
                data: { avatar: avatarUrl },
                select: {
                    id: true,
                    avatar: true
                }
            })

            res.json({
                success: true,
                message: '头像更新成功',
                avatar: user.avatar
            })
        } catch (error) {
            console.error('上传头像失败:', error)
            res.status(500).json({ error: '上传头像失败' })
        }
    },

    // 上传背景图 (需登录)
    async uploadProfileBg(req: AuthRequest, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: '请选择要上传的图片' })
            }

            const bgUrl = `/uploads/${req.file.filename}`

            const user = await prisma.user.update({
                where: { id: req.userId },
                data: { profileBg: bgUrl },
                select: {
                    id: true,
                    profileBg: true
                }
            })

            res.json({
                success: true,
                message: '背景更新成功',
                profileBg: user.profileBg
            })
        } catch (error) {
            console.error('上传背景失败:', error)
            res.status(500).json({ error: '上传背景失败' })
        }
    },

    // 修改密码 (需登录，只能修改自己)
    async changePassword(req: AuthRequest, res: Response) {
        try {
            const { oldPassword, newPassword, confirmPassword } = req.body

            // 验证新密码一致性
            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    error: true,
                    message: '// PASSWORD MISMATCH',
                    details: '两次输入的新密码不一致'
                })
            }

            // 获取当前用户
            const user = await prisma.user.findUnique({
                where: { id: req.userId }
            })

            if (!user) {
                return res.status(404).json({
                    error: true,
                    message: '// USER NOT FOUND',
                    details: '用户不存在'
                })
            }

            // 验证原密码
            // const bcrypt = await import('bcryptjs') // Removed dynamic import
            const isValidPassword = await bcrypt.compare(oldPassword, user.password)

            if (!isValidPassword) {
                return res.status(401).json({
                    error: true,
                    message: '// ACCESS DENIED',
                    details: '原密码错误'
                })
            }

            // 加密新密码并更新
            const hashedPassword = await bcrypt.hash(newPassword, 10)

            await prisma.user.update({
                where: { id: req.userId },
                data: { password: hashedPassword }
            })

            res.json({
                success: true,
                message: '// PASSWORD UPDATED',
                details: '密码修改成功'
            })
        } catch (error) {
            console.error('// CHANGE PASSWORD ERROR:', error)
            res.status(500).json({
                error: true,
                message: '// SYSTEM MALFUNCTION',
                details: '密码修改服务暂不可用'
            })
        }
    }
}

