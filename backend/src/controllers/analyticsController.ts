import { Request, Response } from 'express'
import prisma from '../utils/prisma.js'

// 内存中存储最近阅读记录 (最多 20 条)
interface ViewEvent {
    title: string;
    timestamp: string;
    id: number;
}
const recentViews: ViewEvent[] = [];

export const analyticsController = {
    // 记录访问量
    async recordView(req: Request, res: Response) {
        try {
            const { id } = req.body
            const isNewVisitor = req.body.isNewVisitor === true
            const postId = parseInt(id)

            if (!postId || isNaN(postId)) {
                return res.status(400).json({ error: '无效的文章ID' })
            }

            // 1. 更新文章阅读量
            // 同时获取文章标题用于显示
            const post = await prisma.post.update({
                where: { id: postId },
                data: { views: { increment: 1 } },
                select: { id: true, title: true }
            })

            // 记录到内存队列
            if (post) {
                const newView: ViewEvent = {
                    title: post.title,
                    timestamp: new Date().toISOString(),
                    id: post.id
                }

                // 添加到开头
                recentViews.unshift(newView)

                // 保持最大长度
                if (recentViews.length > 20) {
                    recentViews.pop()
                }
            }

            // 2. 更新每日统计
            const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

            await prisma.dailyStat.upsert({
                where: { date: today },
                update: {
                    views: { increment: 1 },
                    visitors: isNewVisitor ? { increment: 1 } : undefined
                },
                create: {
                    date: today,
                    views: 1,
                    visitors: isNewVisitor ? 1 : 0
                }
            })

            res.json({ success: true })
        } catch (error) {
            console.error('记录访问量失败:', error)
            // 不返回500，以免影响前端页面加载，只记录日志
            res.json({ success: false })
        }
    },

    // 获取最近阅读记录
    async getRecentViews(req: Request, res: Response) {
        try {
            res.json(recentViews)
        } catch (error) {
            console.error('获取最近阅读记录失败:', error)
            res.status(500).json({ error: '获取记录失败' })
        }
    },

    // 获取统计数据 (Admin)
    async getStats(req: Request, res: Response) {
        try {
            // 获取最近 7 天的数据
            const stats = await prisma.dailyStat.findMany({
                take: 7,
                orderBy: { date: 'desc' }
            })

            // 按日期升序排列以便前端绘图
            res.json(stats.reverse())
        } catch (error) {
            console.error('获取流量统计失败:', error)
            res.status(500).json({ error: '获取流量统计失败' })
        }
    }
}
