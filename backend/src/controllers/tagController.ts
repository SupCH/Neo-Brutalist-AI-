import { Request, Response } from 'express'
import prisma from '../utils/prisma.js'
import jwt from 'jsonwebtoken'

// 辅助函数：从请求中获取当前用户ID（可选）
const getUserIdFromRequest = (req: Request): number | null => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null
        }
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any
        return decoded.userId
    } catch {
        return null
    }
}

export const tagController = {
    // 获取标签（如果登录则只显示自己文章的标签，未登录显示所有公开文章的标签）
    async getTags(req: Request, res: Response) {
        try {
            const userId = getUserIdFromRequest(req)
            console.log('getTags - userId:', userId) // 调试日志

            if (userId) {
                // 已登录：只获取当前用户文章使用的标签
                // 先查询用户有哪些文章
                const userPosts = await prisma.post.findMany({
                    where: { authorId: userId },
                    include: { tags: true }
                })

                // 统计每个标签的使用次数
                const tagCountMap = new Map<number, { tag: any; count: number }>()

                for (const post of userPosts) {
                    for (const tag of post.tags) {
                        if (tagCountMap.has(tag.id)) {
                            tagCountMap.get(tag.id)!.count++
                        } else {
                            tagCountMap.set(tag.id, { tag, count: 1 })
                        }
                    }
                }

                // 转换为数组格式
                const tags = Array.from(tagCountMap.values()).map(({ tag, count }) => ({
                    id: tag.id,
                    name: tag.name,
                    slug: tag.slug,
                    _count: { posts: count }
                }))

                // 按名称排序
                tags.sort((a, b) => a.name.localeCompare(b.name))

                console.log('getTags - user tags count:', tags.length) // 调试日志
                res.json(tags)
            } else {
                // 未登录：显示所有已发布文章的标签
                const allTags = await prisma.tag.findMany({
                    include: {
                        posts: {
                            where: { published: true },
                            select: { id: true }
                        }
                    },
                    orderBy: { name: 'asc' }
                })

                // 过滤掉没有已发布文章的标签，并计算数量
                const tags = allTags
                    .filter(tag => tag.posts.length > 0)
                    .map(tag => ({
                        id: tag.id,
                        name: tag.name,
                        slug: tag.slug,
                        _count: { posts: tag.posts.length }
                    }))

                res.json(tags)
            }
        } catch (error) {
            console.error('获取标签失败:', error)
            res.status(500).json({ error: '获取标签失败' })
        }
    },

    // 获取标签下的文章（登录则只显示自己的，未登录显示所有已发布的）
    async getTagPosts(req: Request, res: Response) {
        try {
            const { slug } = req.params
            const userId = getUserIdFromRequest(req)

            const whereCondition = userId
                ? { authorId: userId }  // 登录：只显示自己的文章
                : { published: true }   // 未登录：只显示已发布的

            const tag = await prisma.tag.findUnique({
                where: { slug },
                include: {
                    posts: {
                        where: whereCondition,
                        include: {
                            author: {
                                select: { id: true, name: true, avatar: true }
                            },
                            tags: true
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            })

            if (!tag) {
                return res.status(404).json({ error: '标签不存在' })
            }

            res.json({
                tagName: tag.name,
                posts: tag.posts
            })
        } catch (error) {
            console.error('获取标签文章失败:', error)
            res.status(500).json({ error: '获取标签文章失败' })
        }
    },

    // 创建新标签（需要管理员权限）
    async createTag(req: Request, res: Response) {
        try {
            const { name } = req.body

            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: '标签名称不能为空' })
            }

            const trimmedName = name.trim()
            const slug = trimmedName
                .toLowerCase()
                .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
                .replace(/^-+|-+$/g, '')

            // 检查标签是否已存在
            const existingTag = await prisma.tag.findUnique({
                where: { slug }
            })

            if (existingTag) {
                return res.status(400).json({ error: '该标签已存在', tag: existingTag })
            }

            const tag = await prisma.tag.create({
                data: {
                    name: trimmedName,
                    slug
                }
            })

            res.status(201).json(tag)
        } catch (error) {
            console.error('创建标签失败:', error)
            res.status(500).json({ error: '创建标签失败' })
        }
    }
}
