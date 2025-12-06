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

    // 批量创建文章
    async batchCreatePosts(req: AuthRequest, res: Response) {
        try {
            const { posts } = req.body
            const authorId = req.userId!

            if (!posts || !Array.isArray(posts) || posts.length === 0) {
                return res.status(400).json({ error: '请提供要创建的文章列表' })
            }

            const createdPosts = []
            const errors = []

            for (const postData of posts) {
                try {
                    const post = await prisma.post.create({
                        data: {
                            title: postData.title,
                            slug: postData.slug,
                            content: postData.content,
                            excerpt: postData.excerpt || postData.content.substring(0, 200),
                            coverImage: postData.coverImage || null,
                            published: postData.published || false,
                            isPublic: postData.isPublic !== undefined ? postData.isPublic : true,
                            authorId,
                            tags: postData.tagIds ? {
                                connect: postData.tagIds.map((id: number) => ({ id }))
                            } : undefined
                        }
                    })
                    createdPosts.push(post)
                } catch (err: any) {
                    errors.push({
                        title: postData.title,
                        error: err.message || '创建失败'
                    })
                }
            }

            res.status(201).json({
                success: true,
                message: `成功创建 ${createdPosts.length} 篇文章`,
                created: createdPosts,
                errors: errors.length > 0 ? errors : undefined
            })
        } catch (error) {
            console.error('批量创建文章失败:', error)
            res.status(500).json({ error: '批量创建文章失败' })
        }
    },

    // 更新文章
    async updatePost(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id)
            const { title, slug, content, excerpt, coverImage, published, isPublic, tagIds, changeNote } = req.body
            const editorId = req.userId!

            // 获取当前版本用于保存历史
            const currentPost = await prisma.post.findUnique({
                where: { id }
            })

            if (!currentPost) {
                return res.status(404).json({ error: '文章不存在' })
            }

            // 检查内容是否有变化
            const hasChanges =
                currentPost.title !== title ||
                currentPost.content !== content ||
                currentPost.excerpt !== excerpt ||
                currentPost.coverImage !== coverImage ||
                currentPost.published !== published ||
                currentPost.isPublic !== isPublic

            // 如果有变化，保存当前版本到历史
            if (hasChanges) {
                const latestVersion = await prisma.postVersion.findFirst({
                    where: { postId: id },
                    orderBy: { version: 'desc' }
                })
                const newVersionNum = (latestVersion?.version || 0) + 1

                await prisma.postVersion.create({
                    data: {
                        postId: id,
                        version: newVersionNum,
                        title: currentPost.title,
                        content: currentPost.content,
                        excerpt: currentPost.excerpt,
                        coverImage: currentPost.coverImage,
                        published: currentPost.published,
                        isPublic: currentPost.isPublic,
                        changeNote: changeNote || null,
                        editorId
                    }
                })
            }

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

    // 获取文章版本历史
    async getPostVersions(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id)

            const versions = await prisma.postVersion.findMany({
                where: { postId: id },
                orderBy: { version: 'desc' },
                select: {
                    id: true,
                    version: true,
                    title: true,
                    changeNote: true,
                    createdAt: true,
                    editorId: true
                }
            })

            res.json(versions)
        } catch (error) {
            console.error('获取版本历史失败:', error)
            res.status(500).json({ error: '获取版本历史失败' })
        }
    },

    // 获取特定版本详情
    async getPostVersion(req: AuthRequest, res: Response) {
        try {
            const postId = parseInt(req.params.id)
            const versionId = parseInt(req.params.versionId)

            const version = await prisma.postVersion.findFirst({
                where: { id: versionId, postId }
            })

            if (!version) {
                return res.status(404).json({ error: '版本不存在' })
            }

            res.json(version)
        } catch (error) {
            console.error('获取版本详情失败:', error)
            res.status(500).json({ error: '获取版本详情失败' })
        }
    },

    // 回滚到指定版本
    async rollbackPostVersion(req: AuthRequest, res: Response) {
        try {
            const postId = parseInt(req.params.id)
            const versionId = parseInt(req.params.versionId)
            const editorId = req.userId!

            // 获取要回滚的版本
            const targetVersion = await prisma.postVersion.findFirst({
                where: { id: versionId, postId }
            })

            if (!targetVersion) {
                return res.status(404).json({ error: '版本不存在' })
            }

            // 获取当前文章
            const currentPost = await prisma.post.findUnique({
                where: { id: postId }
            })

            if (!currentPost) {
                return res.status(404).json({ error: '文章不存在' })
            }

            // 保存当前版本到历史（回滚前的备份）
            const latestVersion = await prisma.postVersion.findFirst({
                where: { postId },
                orderBy: { version: 'desc' }
            })
            const newVersionNum = (latestVersion?.version || 0) + 1

            await prisma.postVersion.create({
                data: {
                    postId,
                    version: newVersionNum,
                    title: currentPost.title,
                    content: currentPost.content,
                    excerpt: currentPost.excerpt,
                    coverImage: currentPost.coverImage,
                    published: currentPost.published,
                    isPublic: currentPost.isPublic,
                    changeNote: `回滚前备份 (将回滚到版本 ${targetVersion.version})`,
                    editorId
                }
            })

            // 更新文章为目标版本内容
            const updatedPost = await prisma.post.update({
                where: { id: postId },
                data: {
                    title: targetVersion.title,
                    content: targetVersion.content,
                    excerpt: targetVersion.excerpt,
                    coverImage: targetVersion.coverImage,
                    published: targetVersion.published,
                    isPublic: targetVersion.isPublic
                },
                include: { tags: true }
            })

            res.json({
                success: true,
                message: `已回滚到版本 ${targetVersion.version}`,
                post: updatedPost
            })
        } catch (error) {
            console.error('回滚版本失败:', error)
            res.status(500).json({ error: '回滚版本失败' })
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
