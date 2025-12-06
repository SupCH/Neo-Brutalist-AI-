import { Request, Response } from 'express'
import prisma from '../utils/prisma.js'

export const postController = {
    // 获取文章列表（已发布）
    async getPosts(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 10
            const skip = (page - 1) * limit

            const [total, posts] = await Promise.all([
                prisma.post.count({ where: { published: true, isPublic: true } }),
                prisma.post.findMany({
                    where: { published: true, isPublic: true },
                    include: {
                        author: {
                            select: { id: true, name: true, avatar: true }
                        },
                        tags: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                })
            ])

            res.json({
                data: posts,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            })
        } catch (error) {
            console.error('获取文章列表失败:', error)
            res.status(500).json({ error: '获取文章列表失败' })
        }
    },

    // 搜索文章
    async searchPosts(req: Request, res: Response) {
        try {
            const query = (req.query.q as string) || ''

            if (!query.trim()) {
                return res.json([])
            }

            const posts = await prisma.post.findMany({
                where: {
                    published: true,
                    isPublic: true,
                    OR: [
                        { title: { contains: query } },
                        { content: { contains: query } },
                        { excerpt: { contains: query } }
                    ]
                },
                include: {
                    author: {
                        select: { id: true, name: true, avatar: true }
                    },
                    tags: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            })

            res.json(posts)
        } catch (error) {
            console.error('搜索文章失败:', error)
            res.status(500).json({ error: '搜索文章失败' })
        }
    },

    // 获取单篇文章（通过 slug）
    async getPost(req: Request, res: Response) {
        try {
            const { slug } = req.params

            const post = await prisma.post.findFirst({
                where: { slug, published: true, isPublic: true },
                include: {
                    author: {
                        select: { id: true, name: true, avatar: true, bio: true }
                    },
                    tags: true,
                    comments: {
                        include: {
                            author: {
                                select: { id: true, name: true, avatar: true }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
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

    // 获取随机文章
    async getRandomPost(req: Request, res: Response) {
        try {
            const count = await prisma.post.count({
                where: { published: true, isPublic: true }
            })

            if (count === 0) {
                return res.status(404).json({ error: '暂无文章' })
            }

            const skip = Math.floor(Math.random() * count)
            const post = await prisma.post.findFirst({
                where: { published: true, isPublic: true },
                skip: skip,
                select: { slug: true }
            })

            if (!post) {
                return res.status(404).json({ error: '获取随机文章失败' })
            }

            res.json(post)
        } catch (error) {
            console.error('获取随机文章失败:', error)
            res.status(500).json({ error: '获取随机文章失败' })
        }
    }
}
