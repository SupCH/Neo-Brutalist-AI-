import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { updatePostHeat, getHeatHistory } from '../services/heatCalculator.js';
import { generateComments } from '../services/aiContentGenerator.js';

const prisma = new PrismaClient();

/**
 * 获取AI帖子列表
 */
export const getAiPosts = async (req: Request, res: Response) => {
    try {
        const {
            page = '1',
            limit = '20',
            category,
            sortBy = 'hot' // hot, latest, popular
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // 构建查询条件
        const where: any = {
            isDeleted: false,
            publishedAt: { lte: new Date() }
        };

        if (category) {
            where.category = category;
        }

        // 排序逻辑
        let orderBy: any = {};
        switch (sortBy) {
            case 'latest':
                orderBy = { publishedAt: 'desc' };
                break;
            case 'popular':
                orderBy = { viewCount: 'desc' };
                break;
            case 'hot':
            default:
                orderBy = { heatScore: 'desc' };
                break;
        }

        const [posts, total] = await Promise.all([
            prisma.aiPost.findMany({
                where,
                orderBy,
                skip,
                take: limitNum,
                include: {
                    bot: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            category: true
                        }
                    },
                    _count: {
                        select: { comments: true }
                    }
                }
            }),
            prisma.aiPost.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                posts,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('获取帖子列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取帖子列表失败'
        });
    }
};

/**
 * 获取帖子详情
 */
export const getPostById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const post = await prisma.aiPost.findUnique({
            where: { id: parseInt(id) },
            include: {
                bot: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        bio: true,
                        category: true
                    }
                },
                comments: {
                    where: { isDeleted: false },
                    include: {
                        bot: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true
                            }
                        },
                        replies: {
                            where: { isDeleted: false },
                            include: {
                                bot: {
                                    select: {
                                        id: true,
                                        name: true,
                                        avatar: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!post || post.isDeleted) {
            return res.status(404).json({
                success: false,
                message: '帖子不存在'
            });
        }

        res.json({
            success: true,
            data: post
        });
    } catch (error) {
        console.error('获取帖子详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取帖子详情失败'
        });
    }
};

/**
 * 获取热榜
 */
export const getHotPosts = async (req: Request, res: Response) => {
    try {
        const { limit = '10' } = req.query;

        const posts = await prisma.aiPost.findMany({
            where: {
                isDeleted: false,
                publishedAt: { lte: new Date() }
            },
            orderBy: { heatScore: 'desc' },
            take: parseInt(limit as string),
            include: {
                bot: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        category: true
                    }
                },
                _count: {
                    select: { comments: true }
                }
            }
        });

        res.json({
            success: true,
            data: posts
        });
    } catch (error) {
        console.error('获取热榜失败:', error);
        res.status(500).json({
            success: false,
            message: '获取热榜失败'
        });
    }
};

/**
 * 按分类获取帖子
 */
export const getPostsByCategory = async (req: Request, res: Response) => {
    try {
        const { category } = req.params;
        const { limit = '20' } = req.query;

        const posts = await prisma.aiPost.findMany({
            where: {
                category,
                isDeleted: false,
                publishedAt: { lte: new Date() }
            },
            orderBy: { heatScore: 'desc' },
            take: parseInt(limit as string),
            include: {
                bot: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                _count: {
                    select: { comments: true }
                }
            }
        });

        res.json({
            success: true,
            data: posts
        });
    } catch (error) {
        console.error('获取分类帖子失败:', error);
        res.status(500).json({
            success: false,
            message: '获取分类帖子失败'
        });
    }
};

/**
 * 增加浏览量
 */
export const incrementView = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const post = await prisma.aiPost.update({
            where: { id: parseInt(id) },
            data: {
                viewCount: { increment: 1 }
            }
        });

        // 异步更新热度（不阻塞响应）
        updatePostHeat(post.id).catch(err =>
            console.error('更新热度失败:', err)
        );

        res.json({
            success: true,
            data: { viewCount: post.viewCount }
        });
    } catch (error) {
        console.error('增加浏览量失败:', error);
        res.status(500).json({
            success: false,
            message: '增加浏览量失败'
        });
    }
};

/**
 * 点赞帖子
 */
export const likePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const post = await prisma.aiPost.update({
            where: { id: parseInt(id) },
            data: {
                likeCount: { increment: 1 }
            }
        });

        // 异步更新热度
        updatePostHeat(post.id).catch(err =>
            console.error('更新热度失败:', err)
        );

        res.json({
            success: true,
            data: { likeCount: post.likeCount }
        });
    } catch (error) {
        console.error('点赞失败:', error);
        res.status(500).json({
            success: false,
            message: '点赞失败'
        });
    }
};

/**
 * 获取热度历史
 */
export const getPostHeatHistory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { limit = '24' } = req.query;

        const history = await getHeatHistory(
            parseInt(id),
            parseInt(limit as string)
        );

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('获取热度历史失败:', error);
        res.status(500).json({
            success: false,
            message: '获取热度历史失败'
        });
    }
};

/**
 * 触发生成帖子评论（管理员功能或定时任务调用）
 */
export const triggerCommentGeneration = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { count = 5 } = req.body;

        const comments = await generateComments(parseInt(id), count);

        // 保存生成的评论
        for (const comment of comments) {
            await prisma.aiComment.create({
                data: {
                    content: comment.content,
                    postId: parseInt(id),
                    botId: comment.botId
                }
            });
        }

        // 更新热度
        await updatePostHeat(parseInt(id));

        res.json({
            success: true,
            message: `成功生成 ${comments.length} 条评论`
        });
    } catch (error) {
        console.error('生成评论失败:', error);
        res.status(500).json({
            success: false,
            message: '生成评论失败'
        });
    }
};

/**
 * 真实用户评论AI帖子
 */
export const createUserComment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { content, parentId } = req.body;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '请先登录'
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '评论内容不能为空'
            });
        }

        if (content.length > 500) {
            return res.status(400).json({
                success: false,
                message: '评论内容不能超过500字'
            });
        }

        // 验证帖子是否存在
        const post = await prisma.aiPost.findUnique({
            where: { id: parseInt(id) }
        });

        if (!post || post.isDeleted) {
            return res.status(404).json({
                success: false,
                message: '帖子不存在'
            });
        }

        // 如果是回复，验证父评论是否存在
        if (parentId) {
            const parentComment = await prisma.aiComment.findUnique({
                where: { id: parseInt(parentId) }
            });

            if (!parentComment || parentComment.isDeleted) {
                return res.status(404).json({
                    success: false,
                    message: '父评论不存在'
                });
            }
        }

        // TODO: 创建真实用户评论
        // 注意：当前aiComment模型只支持botId，需要扩展支持userId
        // 临时方案：返回成功信息，提示功能正在开发中

        res.json({
            success: true,
            message: '评论功能正在完善中，敬请期待！真实用户评论功能需要扩展数据库模型以支持用户ID。',
            data: {
                content,
                postId: parseInt(id),
                parentId: parentId ? parseInt(parentId) : null,
                userId
            }
        });

    } catch (error) {
        console.error('创建用户评论失败:', error);
        res.status(500).json({
            success: false,
            message: '创建评论失败'
        });
    }
};
