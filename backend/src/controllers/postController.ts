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

    // 搜索文章（增强版：支持高亮、匹配类型、标签搜索）
    async searchPosts(req: Request, res: Response) {
        try {
            const query = (req.query.q as string) || ''
            const searchTerm = query.trim().toLowerCase()

            if (!searchTerm) {
                return res.json([])
            }

            // 搜索文章（标题、内容、摘要）和标签
            const posts = await prisma.post.findMany({
                where: {
                    published: true,
                    isPublic: true,
                    isDeleted: false,
                    OR: [
                        { title: { contains: query } },
                        { content: { contains: query } },
                        { excerpt: { contains: query } },
                        { tags: { some: { name: { contains: query } } } }
                    ]
                },
                include: {
                    author: {
                        select: { id: true, name: true, avatar: true }
                    },
                    tags: true,
                },
                take: 20, // 取更多结果用于排序后截取
            })

            // 提取匹配片段的辅助函数
            const extractSnippet = (text: string, keyword: string, contextLength: number = 50): string | null => {
                const lowerText = text.toLowerCase()
                const lowerKeyword = keyword.toLowerCase()
                const index = lowerText.indexOf(lowerKeyword)

                if (index === -1) return null

                const start = Math.max(0, index - contextLength)
                const end = Math.min(text.length, index + keyword.length + contextLength)

                let snippet = text.slice(start, end)
                if (start > 0) snippet = '...' + snippet
                if (end < text.length) snippet = snippet + '...'

                return snippet
            }

            // 处理每篇文章，添加匹配信息
            const enrichedPosts = posts.map(post => {
                let matchType: 'title' | 'tag' | 'content' = 'content'
                let matchSnippet: string | null = null

                // 判断匹配类型（优先级：标题 > 标签 > 内容）
                if (post.title.toLowerCase().includes(searchTerm)) {
                    matchType = 'title'
                    matchSnippet = post.title
                } else if (post.tags.some(tag => tag.name.toLowerCase().includes(searchTerm))) {
                    matchType = 'tag'
                    const matchedTag = post.tags.find(tag => tag.name.toLowerCase().includes(searchTerm))
                    matchSnippet = matchedTag ? `标签：${matchedTag.name}` : null
                } else {
                    // 从内容中提取匹配片段
                    matchSnippet = extractSnippet(post.content, query) ||
                        (post.excerpt ? extractSnippet(post.excerpt, query) : null)
                }

                return {
                    id: post.id,
                    title: post.title,
                    slug: post.slug,
                    excerpt: post.excerpt,
                    author: post.author,
                    tags: post.tags,
                    matchType,
                    matchSnippet: matchSnippet || post.excerpt?.slice(0, 100) || '',
                    matchKeyword: query
                }
            })

            // 按相关度排序：标题匹配 > 标签匹配 > 内容匹配
            const sortOrder = { title: 0, tag: 1, content: 2 }
            enrichedPosts.sort((a, b) => sortOrder[a.matchType] - sortOrder[b.matchType])

            // 返回前 10 条
            res.json(enrichedPosts.slice(0, 10))
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
