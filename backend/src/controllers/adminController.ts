import { Request, Response } from 'express'
import prisma from '../utils/prisma.js'

interface AuthRequest extends Request {
    userId?: number
}

export const adminController = {
    // 获取仪表盘统计数据
    async getStats(req: AuthRequest, res: Response) {
        try {
            const [totalPosts, publishedPosts, draftPosts, totalTags, totalComments, recentPosts] = await Promise.all([
                prisma.post.count(),
                prisma.post.count({ where: { published: true } }),
                prisma.post.count({ where: { published: false } }),
                prisma.tag.count(),
                prisma.comment.count(),
                prisma.post.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, title: true, slug: true, createdAt: true }
                })
            ])

            res.json({
                totalPosts,
                publishedPosts,
                draftPosts,
                totalTags,
                totalComments,
                recentPosts
            })
        } catch (error) {
            console.error('获取统计数据失败:', error)
            res.status(500).json({ error: '获取统计数据失败' })
        }
    },

    // 获取所有文章（管理用）
    async getPosts(req: AuthRequest, res: Response) {
        try {
            const posts = await prisma.post.findMany({
                include: {
                    _count: {
                        select: { comments: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            res.json(posts)
        } catch (error) {
            console.error('获取文章列表失败:', error)
            res.status(500).json({ error: '获取文章列表失败' })
        }
    },

    // 获取单篇文章（管理用）
    async getPost(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id)

            const post = await prisma.post.findUnique({
                where: { id },
                include: {
                    tags: true
                }
            })

            if (!post) {
                return res.status(404).json({ error: '文章不存在' })
            }

            res.json(post)
        } catch (error) {
            console.error('获取文章失败:', error)
            res.status(500).json({ error: '获取文章失败' })
        }
    },

    // 创建文章
    async createPost(req: AuthRequest, res: Response) {
        try {
            const { title, slug, content, excerpt, coverImage, published, isPublic, tagIds } = req.body
            const authorId = req.userId!

            const post = await prisma.post.create({
                data: {
                    title,
                    slug,
                    content,
                    excerpt,
                    coverImage,
                    published: published || false,
                    isPublic: isPublic !== undefined ? isPublic : true,
                    authorId,
                    tags: tagIds ? {
                        connect: tagIds.map((id: number) => ({ id }))
                    } : undefined
                },
                include: {
                    tags: true
                }
            })

            res.status(201).json(post)
        } catch (error) {
            console.error('创建文章失败:', error)
            res.status(500).json({ error: '创建文章失败' })
        }
    },

    // 更新文章
    async updatePost(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id)
            const { title, slug, content, excerpt, coverImage, published, isPublic, tagIds } = req.body

            // 先断开所有标签关联
            await prisma.post.update({
                where: { id },
                data: {
                    tags: { set: [] }
                }
            })

            const post = await prisma.post.update({
                where: { id },
                data: {
                    title,
                    slug,
                    content,
                    excerpt,
                    coverImage,
                    published,
                    isPublic,
                    tags: tagIds ? {
                        connect: tagIds.map((tid: number) => ({ id: tid }))
                    } : undefined
                },
                include: {
                    tags: true
                }
            })

            res.json(post)
        } catch (error) {
            console.error('更新文章失败:', error)
            res.status(500).json({ error: '更新文章失败' })
        }
    },

    // 删除文章（软删除）
    async deletePost(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id)

            await prisma.post.update({
                where: { id },
                data: { isDeleted: true }
            })

            res.json({ success: true, message: '文章已删除' })
        } catch (error) {
            console.error('删除文章失败:', error)
            res.status(500).json({ error: '删除文章失败' })
        }
    },

    // 上传文件
    async uploadFile(req: AuthRequest, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: '请上传文件' })
            }

            const url = `/uploads/${req.file.filename}`
            res.json({ url })
        } catch (error) {
            console.error('上传文件失败:', error)
            res.status(500).json({ error: '上传文件失败' })
        }
    }
}
