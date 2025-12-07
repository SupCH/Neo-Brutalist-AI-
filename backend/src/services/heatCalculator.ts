import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 计算帖子的热度分数
 * 
 * 热度算法：
 * - 基础分数：根据浏览量、评论数、点赞数计算
 * - 时间衰减：随时间推移降低热度
 * - 领域权重：不同领域有不同的基础权重
 */
export async function calculateHeatScore(postId: number): Promise<number> {
    const post = await prisma.aiPost.findUnique({
        where: { id: postId },
        include: {
            comments: {
                where: { isDeleted: false }
            }
        }
    });

    if (!post) {
        return 0;
    }

    // 1. 基础分数计算
    const viewScore = post.viewCount * 1;        // 每次浏览 +1分
    const likeScore = post.likeCount * 5;        // 每个点赞 +5分
    const commentScore = post.comments.length * 10; // 每条评论 +10分

    const baseScore = viewScore + likeScore + commentScore;

    // 2. 时间衰减
    const hoursOld = (Date.now() - post.publishedAt.getTime()) / (1000 * 60 * 60);
    const timeDecay = Math.exp(-hoursOld / 24); // 24小时半衰期

    // 3. 领域权重
    const categoryWeights: Record<string, number> = {
        '财经': 1.2,
        '科技': 1.2,
        '游戏': 1.0,
        '娱乐': 1.1,
        '体育': 1.1,
        '美食': 0.9,
        '旅游': 0.9,
        '读书': 0.8,
        '健康': 0.9,
        '艺术': 0.8
    };

    const categoryWeight = categoryWeights[post.category] || 1.0;

    // 4. 计算最终热度
    const finalScore = Math.round(baseScore * timeDecay * categoryWeight);

    return Math.max(1, finalScore); // 最小热度为1
}

/**
 * 更新单个帖子的热度分数并记录日志
 */
export async function updatePostHeat(postId: number): Promise<void> {
    const post = await prisma.aiPost.findUnique({
        where: { id: postId },
        include: {
            comments: {
                where: { isDeleted: false }
            }
        }
    });

    if (!post) {
        return;
    }

    const newHeatScore = await calculateHeatScore(postId);

    // 更新帖子热度
    await prisma.aiPost.update({
        where: { id: postId },
        data: { heatScore: newHeatScore }
    });

    // 记录热度日志
    await prisma.heatLog.create({
        data: {
            postId,
            heatScore: newHeatScore,
            viewCount: post.viewCount,
            likeCount: post.likeCount,
            commentCount: post.comments.length
        }
    });
}

/**
 * 批量更新所有帖子的热度分数
 */
export async function updateAllHeatScores(): Promise<void> {
    const posts = await prisma.aiPost.findMany({
        where: {
            isDeleted: false,
            publishedAt: {
                lte: new Date() // 只更新已发布的帖子
            }
        }
    });

    console.log(`🔥 开始更新 ${posts.length} 个帖子的热度...`);

    for (const post of posts) {
        try {
            await updatePostHeat(post.id);
        } catch (error) {
            console.error(`更新帖子 ${post.id} 热度失败:`, error);
        }
    }

    console.log('✅ 热度更新完成！');
}

/**
 * 应用时间衰减（定期调用，降低旧帖子的热度）
 */
export async function applyTimeDecay(): Promise<void> {
    const posts = await prisma.aiPost.findMany({
        where: {
            isDeleted: false,
            publishedAt: {
                lte: new Date()
            }
        }
    });

    for (const post of posts) {
        const hoursOld = (Date.now() - post.publishedAt.getTime()) / (1000 * 60 * 60);

        // 对于超过48小时的帖子，额外降低10%的热度
        if (hoursOld > 48) {
            const newScore = Math.round(post.heatScore * 0.9);
            await prisma.aiPost.update({
                where: { id: post.id },
                data: { heatScore: Math.max(1, newScore) }
            });
        }
    }

    console.log('✅ 时间衰减应用完成！');
}

/**
 * 获取指定帖子的热度变化历史
 */
export async function getHeatHistory(
    postId: number,
    limit: number = 24
): Promise<any[]> {
    const logs = await prisma.heatLog.findMany({
        where: { postId },
        orderBy: { timestamp: 'desc' },
        take: limit
    });

    return logs.reverse(); // 返回时间正序
}

/**
 * 模拟增加浏览量（用于测试和模拟真实社区）
 */
export async function simulateViews(): Promise<void> {
    const recentPosts = await prisma.aiPost.findMany({
        where: {
            isDeleted: false,
            publishedAt: {
                lte: new Date()
            }
        },
        take: 20,
        orderBy: { publishedAt: 'desc' }
    });

    for (const post of recentPosts) {
        // 随机增加0-10次浏览
        const viewIncrease = Math.floor(Math.random() * 11);

        if (viewIncrease > 0) {
            await prisma.aiPost.update({
                where: { id: post.id },
                data: {
                    viewCount: {
                        increment: viewIncrease
                    }
                }
            });
        }

        // 10%概率增加点赞
        if (Math.random() < 0.1) {
            const likeIncrease = Math.floor(Math.random() * 3) + 1;
            await prisma.aiPost.update({
                where: { id: post.id },
                data: {
                    likeCount: {
                        increment: likeIncrease
                    }
                }
            });
        }
    }

    console.log('✅ 模拟浏览数据完成！');
}
