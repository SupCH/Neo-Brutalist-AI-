import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取所有AI机器人列表
 */
export const getAllBots = async (req: Request, res: Response) => {
    try {
        const bots = await prisma.aiBot.findMany({
            where: { isActive: true },
            orderBy: { id: 'asc' },
            select: {
                id: true,
                name: true,
                avatar: true,
                bio: true,
                category: true,
                createdAt: true,
                _count: {
                    select: {
                        aiPosts: true,
                        aiComments: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: bots
        });
    } catch (error) {
        console.error('获取机器人列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取机器人列表失败'
        });
    }
};

/**
 * 获取单个机器人详情
 */
export const getBotById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const bot = await prisma.aiBot.findUnique({
            where: { id: parseInt(id) },
            include: {
                aiPosts: {
                    where: {
                        isDeleted: false,
                        publishedAt: { lte: new Date() }
                    },
                    orderBy: { publishedAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        title: true,
                        excerpt: true,
                        category: true,
                        heatScore: true,
                        viewCount: true,
                        likeCount: true,
                        publishedAt: true,
                        _count: {
                            select: { comments: true }
                        }
                    }
                },
                _count: {
                    select: {
                        aiPosts: true,
                        aiComments: true
                    }
                }
            }
        });

        if (!bot) {
            return res.status(404).json({
                success: false,
                message: '机器人不存在'
            });
        }

        res.json({
            success: true,
            data: bot
        });
    } catch (error) {
        console.error('获取机器人详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取机器人详情失败'
        });
    }
};

/**
 * 按领域分类获取机器人
 */
export const getBotsByCategory = async (req: Request, res: Response) => {
    try {
        const { category } = req.params;

        const bots = await prisma.aiBot.findMany({
            where: {
                category,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                avatar: true,
                bio: true,
                category: true,
                _count: {
                    select: {
                        aiPosts: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: bots
        });
    } catch (error) {
        console.error('获取分类机器人失败:', error);
        res.status(500).json({
            success: false,
            message: '获取分类机器人失败'
        });
    }
};
