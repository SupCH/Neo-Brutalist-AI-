import { Request, Response } from 'express'
import prisma from '../utils/prisma.js'

interface AuthRequest extends Request {
    userId?: number
    userRole?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
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
            const userId = req.userId!
            const isAdmin = req.userRole === 'ADMIN' || req.userRole === 'SUPER_ADMIN'
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 10
            const skip = (page - 1) * limit

            // 管理员可以看到所有文章，普通用户只能看到自己的
            const whereClause = isAdmin ? {} : { authorId: userId }

            const [total, posts] = await Promise.all([
                prisma.post.count({ where: whereClause }),
                prisma.post.findMany({
                    where: whereClause,
                    include: {
                        _count: {
                            select: { comments: true }
                        },
                        author: {
                            select: { id: true, name: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
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

    // 获取单篇文章（管理用）
    async getPost(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id)
            const userId = req.userId!
            const isAdmin = req.userRole === 'ADMIN' || req.userRole === 'SUPER_ADMIN'

            const post = await prisma.post.findUnique({
                where: { id },
                include: {
                    tags: true
                }
            })

            if (!post) {
                return res.status(404).json({ error: '文章不存在' })
            }

            // 权限检查：普通用户只能查看自己的文章
            if (!isAdmin && post.authorId !== userId) {
                return res.status(403).json({ error: '// FORBIDDEN: 您没有权限查看这篇文章' })
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

            // 如果没有提供 slug，则根据标题生成一个简单的 slug
            const generatedSlug = slug || (title ? `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-6)}` : `post-${Date.now()}`)

            const post = await prisma.post.create({
                data: {
                    title,
                    slug: generatedSlug,
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

            // 权限检查：只有作者本人或管理员可以编辑
            const isOwner = currentPost.authorId === editorId
            const isAdmin = req.userRole === 'ADMIN' || req.userRole === 'SUPER_ADMIN'
            if (!isOwner && !isAdmin) {
                return res.status(403).json({ error: '// FORBIDDEN: 您没有权限编辑这篇文章' })
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
            const userId = req.userId!

            // 获取文章信息
            const post = await prisma.post.findUnique({
                where: { id }
            })

            if (!post) {
                return res.status(404).json({ error: '文章不存在' })
            }

            // 权限检查：只有作者本人或管理员可以删除
            const isOwner = post.authorId === userId
            const isAdmin = req.userRole === 'ADMIN' || req.userRole === 'SUPER_ADMIN'
            if (!isOwner && !isAdmin) {
                return res.status(403).json({ error: '// FORBIDDEN: 您没有权限删除这篇文章' })
            }

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

            // 如果是图片，进行优化
            if (req.file.mimetype.startsWith('image/')) {
                try {
                    const { optimizeImage } = await import('../utils/imageOptimizer.js')
                    const fs = await import('fs/promises')
                    const path = await import('path')

                    // 读取原始文件
                    const originalPath = req.file.path
                    const buffer = await fs.readFile(originalPath)

                    // 优化图片
                    const optimizedBuffer = await optimizeImage(buffer)

                    // 生成新的文件名 (.webp)
                    const dir = path.dirname(originalPath)
                    const name = path.parse(originalPath).name
                    const newFilename = `${name}.webp`
                    const newPath = path.join(dir, newFilename)

                    // 写入优化后的文件
                    await fs.writeFile(newPath, optimizedBuffer)

                    // 删除原始文件 (如果文件名不同)
                    if (originalPath !== newPath) {
                        await fs.unlink(originalPath).catch(err => console.error('删除原图失败:', err))
                    }

                    // 更新 req.file 信息以便返回正确的 URL
                    req.file.filename = newFilename
                    req.file.path = newPath
                } catch (err) {
                    console.error('图片优化失败，将使用原图:', err)
                    // 失败时不做处理，直接返回原图
                }
            }

            const url = `/uploads/${req.file.filename}`
            res.json({ url })
        } catch (error) {
            console.error('上传文件失败:', error)
            res.status(500).json({ error: '上传文件失败' })
        }
    },

    // AI 自动生成标签
    async generateTags(req: Request, res: Response) {
        try {
            const { title, content } = req.body

            if (!title && !content) {
                return res.status(400).json({ error: '请提供文章标题或内容' })
            }

            // 获取现有标签列表
            const existingTags = await prisma.tag.findMany({
                select: { name: true }
            })
            const tagNames = existingTags.map(t => t.name)

            let suggestedTags: string[] = []

            const apiUrl = process.env.AI_API_URL
            const apiKey = process.env.AI_API_KEY
            const model = process.env.AI_MODEL || 'deepseek-chat'

            // 尝试使用 AI API
            if (apiKey) {
                try {
                    const prompt = `你是一个博客标签生成助手。根据以下文章内容，生成2-3个最合适的标签。

文章标题: ${title || '无'}

文章内容(前500字):
${(content || '').substring(0, 500)}

现有标签库: ${tagNames.length > 0 ? tagNames.join(', ') : '暂无标签'}

要求:
1. 优先使用现有标签库中的标签
2. 如果现有标签不合适，可以建议新标签
3. 标签应该简短、准确、有意义
4. 只返回标签名称，用逗号分隔，不要有任何解释

请返回2-3个标签:`

                    const response = await fetch(apiUrl || 'https://api.gptapi.us/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: [
                                { role: 'user', content: prompt }
                            ],
                            max_tokens: 100,
                            temperature: 0.7
                        })
                    })

                    if (response.ok) {
                        const data = await response.json() as {
                            choices: Array<{ message: { content: string } }>
                        }
                        const aiResponse = data.choices[0]?.message?.content?.trim() || ''
                        suggestedTags = aiResponse
                            .split(/[,，、]/)
                            .map(tag => tag.trim())
                            .filter(tag => tag.length > 0 && tag.length < 20)
                            .slice(0, 3)
                    } else {
                        console.warn('AI API 调用失败, 转为本地生成')
                    }
                } catch (e) {
                    console.error('AI API 异常:', e)
                }
            }

            // 如果 AI 生成失败或未配置 Key，使用本地关键词提取算法
            if (suggestedTags.length === 0) {
                const text = `${title || ''} ${content || ''}`
                // 简单的分词和频率统计
                // 1. 移除特殊字符和标点
                const cleanText = text.replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
                // 2. 分词 (按空格或单个汉字，这里简单按空格分，对于中文可能不够精确但可用)
                // 更好的方式是使用 nodejieba 但为了不增加依赖，我们做简单的两字词提取

                const words: string[] = []

                // 简单的英文分词
                words.push(...cleanText.split(/\s+/).filter(w => w.length > 3))

                // 简单的中文二字/三字词提取 (滑动窗口)
                const cnText = text.replace(/[^\u4e00-\u9fa5]/g, '')
                for (let i = 0; i < cnText.length - 1; i++) {
                    if (i < cnText.length - 1) words.push(cnText.substr(i, 2))
                    if (i < cnText.length - 2) words.push(cnText.substr(i, 3))
                }

                // 词频统计
                const freq: Record<string, number> = {}
                words.forEach(w => {
                    freq[w] = (freq[w] || 0) + 1
                })

                // 排序并取前3
                suggestedTags = Object.entries(freq)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([w]) => w)

                // 如果实在提取不出，使用默认
                if (suggestedTags.length === 0) {
                    suggestedTags = ['生活', '随笔']
                }
            }

            // 区分现有标签和建议的新标签
            const existingMatches = suggestedTags.filter(t =>
                tagNames.some(name => name.toLowerCase() === t.toLowerCase())
            )
            const newSuggestions = suggestedTags.filter(t =>
                !tagNames.some(name => name.toLowerCase() === t.toLowerCase())
            )

            res.json({
                suggestedTags,
                existingMatches,
                newSuggestions
            })
        } catch (error) {
            console.error('生成标签失败:', error)
            res.status(500).json({ error: '生成标签失败' })
        }
    },

    // AI 自动生成摘要
    async generateExcerpt(req: Request, res: Response) {
        try {
            const { title, content } = req.body

            if (!content) {
                return res.status(400).json({ error: '请提供文章内容' })
            }

            let excerpt = ''

            const apiUrl = process.env.AI_API_URL
            const apiKey = process.env.AI_API_KEY
            const model = process.env.AI_MODEL || 'deepseek-chat'

            // 尝试使用 AI API
            if (apiKey) {
                try {
                    const prompt = `你是一个博客文章摘要生成助手。根据以下文章内容，生成一段简洁有吸引力的摘要。

文章标题: ${title || '无'}

文章内容(前1000字):
${(content || '').substring(0, 1000)}

要求:
1. 摘要应该在50-150字之间
2. 摘要应该概括文章的核心内容
3. 摘要应该有吸引力，让读者想要点击阅读全文
4. 只返回摘要文本，不要有任何解释或前缀

请返回摘要:`

                    const response = await fetch(apiUrl || 'https://api.gptapi.us/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: [
                                { role: 'user', content: prompt }
                            ],
                            max_tokens: 200,
                            temperature: 0.7
                        })
                    })

                    if (response.ok) {
                        const data = await response.json() as {
                            choices: Array<{ message: { content: string } }>
                        }
                        excerpt = data.choices[0]?.message?.content?.trim() || ''
                    } else {
                        console.warn('AI API 调用失败, 转为本地生成')
                    }
                } catch (e) {
                    console.error('AI API 异常:', e)
                }
            }

            // 如果 AI 生成失败或未配置，使用本地提取
            if (!excerpt) {
                // 移除 Markdown 语法
                const cleanContent = content
                    .replace(/```[\s\S]*?```/g, '') // 代码块
                    .replace(/!\[.*?\]\(.*?\)/g, '') // 图片
                    .replace(/\[.*?\]\(.*?\)/g, '$1') // 链接
                    .replace(/[#*`>_~]/g, '') // Markdown 符号
                    .replace(/\n+/g, ' ') // 换行
                    .trim()

                // 取前150字
                excerpt = cleanContent.substring(0, 150)
                if (cleanContent.length > 150) {
                    excerpt += '...'
                }
            }

            res.json({ excerpt })
        } catch (error) {
            console.error('生成摘要失败:', error)
            res.status(500).json({ error: '生成摘要失败' })
        }
    },

    // Debug AI Config
    async debugAi(req: Request, res: Response) {
        const apiKey = process.env.AI_API_KEY
        res.json({
            hasKey: !!apiKey,
            keyLength: apiKey ? apiKey.length : 0,
            model: process.env.AI_MODEL || 'deepseek-chat (default)',
            url: process.env.AI_API_URL || 'https://api.gptapi.us/v1/chat/completions',
            envFile: process.env.DOTENV_CONFIG_PATH || 'default'
        })
    }
}
