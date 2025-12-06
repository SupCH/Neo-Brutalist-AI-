import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'

// HTML 转义函数 - 防止 XSS 攻击
function escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    }
    return text.replace(/[&<>"'`=/]/g, char => htmlEntities[char])
}

export const commentController = {
    // 创建评论（需要登录）
    async createComment(req: Request, res: Response) {
        try {
            const { postId, content } = req.body

            if (!postId || !content) {
                return res.status(400).json({ error: '请提供文章 ID 和评论内容' })
            }

            // XSS 过滤 - HTML 转义
            const sanitizedContent = escapeHtml(content.trim())

            // 检查转义后内容是否为空
            if (!sanitizedContent) {
                return res.status(400).json({ error: '评论内容不能为空' })
            }

            // 检查文章是否存在
            const post = await prisma.post.findUnique({
                where: { id: postId, published: true }
            })

            if (!post) {
                return res.status(404).json({ error: '文章不存在' })
            }

            // 必须登录才能评论
            const authHeader = req.headers.authorization
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: '请登录后再评论' })
            }

            let authorId: number
            try {
                const token = authHeader.substring(7)
                const secret = process.env.JWT_SECRET || 'default-secret'
                const decoded = jwt.verify(token, secret) as { userId: number }
                authorId = decoded.userId
            } catch {
                return res.status(401).json({ error: '登录已过期，请重新登录' })
            }

            const comment = await prisma.comment.create({
                data: {
                    content: sanitizedContent,  // 使用转义后的内容
                    postId,
                    authorId
                },
                include: {
                    author: {
                        select: { id: true, name: true, avatar: true }
                    }
                }
            })

            res.status(201).json(comment)
        } catch (error) {
            console.error('创建评论失败:', error)
            res.status(500).json({ error: '创建评论失败' })
        }
    },

    // 获取全部评论（管理用，需要 ADMIN+ 权限）
    async getComments(req: Request, res: Response) {
        try {
            const comments = await prisma.comment.findMany({
                include: {
                    author: {
                        select: { id: true, name: true, email: true }
                    },
                    post: {
                        select: { id: true, title: true, slug: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            res.json(comments)
        } catch (error) {
            console.error('获取评论失败:', error)
            res.status(500).json({ error: '获取评论失败' })
        }
    },

    // 删除评论（软删除，需要 ADMIN+ 权限）
    async deleteComment(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id)

            // 检查评论是否存在
            const comment = await prisma.comment.findUnique({
                where: { id }
            })

            if (!comment) {
                return res.status(404).json({ error: '评论不存在' })
            }

            await prisma.comment.update({
                where: { id },
                data: { isDeleted: true }
            })

            res.json({ success: true, message: '评论已删除' })
        } catch (error) {
            console.error('删除评论失败:', error)
            res.status(500).json({ error: '删除评论失败' })
        }
    },

    // 用户删除自己的评论（或超管删除任意评论）
    async deleteOwnComment(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id)

            // 从 token 获取用户信息
            const authHeader = req.headers.authorization
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: '请先登录' })
            }

            let userId: number
            let userRole: string
            try {
                const token = authHeader.substring(7)
                const secret = process.env.JWT_SECRET || 'default-secret'
                const decoded = jwt.verify(token, secret) as { userId: number; role: string }
                userId = decoded.userId
                userRole = decoded.role
            } catch {
                return res.status(401).json({ error: '登录已过期，请重新登录' })
            }

            // 检查评论是否存在
            const comment = await prisma.comment.findUnique({
                where: { id }
            })

            if (!comment) {
                return res.status(404).json({ error: '评论不存在' })
            }

            // 验证权限：只能删除自己的评论，或者是超管
            if (comment.authorId !== userId && userRole !== 'SUPER_ADMIN') {
                return res.status(403).json({ error: '只能删除自己的评论' })
            }

            await prisma.comment.update({
                where: { id },
                data: { isDeleted: true }
            })

            res.json({ success: true, message: '评论已删除' })
        } catch (error) {
            console.error('删除评论失败:', error)
            res.status(500).json({ error: '删除评论失败' })
        }
    }
}
