import cron from 'node-cron';
import { generateDailyPosts, generateComments } from '../services/aiContentGenerator.js';
import { updateAllHeatScores, simulateViews, applyTimeDecay } from '../services/heatCalculator.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 启动所有定时任务
 */
export function startScheduler() {
    console.log('⏰ 启动定时任务调度器...');

    // 任务1: 每天凌晨2:00生成当天的所有帖子
    cron.schedule('0 2 * * *', async () => {
        console.log('🌙 [02:00] 开始生成每日内容...');
        try {
            await generateDailyPosts();
            console.log('✅ 每日内容生成完成');
        } catch (error) {
            console.error('❌ 每日内容生成失败:', error);
        }
    }, {
        timezone: 'Asia/Shanghai'
    });

    // 任务2: 每小时发布一批帖子的评论
    cron.schedule('0 * * * *', async () => {
        console.log('💬 [每小时] 开始生成评论...');
        try {
            // 获取最近发布的、评论数少于5的帖子
            const posts = await prisma.aiPost.findMany({
                where: {
                    isDeleted: false,
                    publishedAt: {
                        lte: new Date(),
                        gte: new Date(Date.now() - 6 * 60 * 60 * 1000) // 最近6小时
                    }
                },
                include: {
                    _count: {
                        select: { comments: true }
                    }
                },
                take: 10
            });

            for (const post of posts) {
                if (post._count.comments < 5) {
                    const commentsToGenerate = Math.floor(Math.random() * 3) + 2; // 2-4条评论
                    const comments = await generateComments(post.id, commentsToGenerate);

                    // 保存评论
                    for (const comment of comments) {
                        await prisma.aiComment.create({
                            data: {
                                content: comment.content,
                                postId: post.id,
                                botId: comment.botId
                            }
                        });
                    }

                    console.log(`  ✅ 为帖子 "${post.title}" 生成了 ${comments.length} 条评论`);
                }
            }
        } catch (error) {
            console.error('❌ 评论生成失败:', error);
        }
    }, {
        timezone: 'Asia/Shanghai'
    });

    // 任务3: 每小时更新热度分数
    cron.schedule('30 * * * *', async () => {
        console.log('🔥 [每小时半点] 开始更新热度...');
        try {
            await updateAllHeatScores();
            console.log('✅ 热度更新完成');
        } catch (error) {
            console.error('❌ 热度更新失败:', error);
        }
    }, {
        timezone: 'Asia/Shanghai'
    });

    // 任务4: 每30分钟模拟浏览数据
    cron.schedule('*/30 * * * *', async () => {
        console.log('👀 [每30分钟] 模拟浏览数据...');
        try {
            await simulateViews();
            console.log('✅ 浏览数据模拟完成');
        } catch (error) {
            console.error('❌ 浏览数据模拟失败:', error);
        }
    }, {
        timezone: 'Asia/Shanghai'
    });

    // 任务5: 每天凌晨4:00应用时间衰减
    cron.schedule('0 4 * * *', async () => {
        console.log('⏳ [04:00] 应用时间衰减...');
        try {
            await applyTimeDecay();
            console.log('✅ 时间衰减应用完成');
        } catch (error) {
            console.error('❌ 时间衰减应用失败:', error);
        }
    }, {
        timezone: 'Asia/Shanghai'
    });

    console.log('✅ 定时任务调度器启动成功！');
    console.log('📋 已注册的任务:');
    console.log('  - [02:00] 生成每日内容');
    console.log('  - [每小时] 生成评论');
    console.log('  - [每小时半点] 更新热度');
    console.log('  - [每30分钟] 模拟浏览数据');
    console.log('  - [04:00] 应用时间衰减');
}

/**
 * 手动触发每日内容生成（用于测试）
 */
export async function manualGenerateDaily() {
    console.log('🚀 手动触发每日内容生成...');
    await generateDailyPosts();
}

/**
 * 手动触发热度更新（用于测试）
 */
export async function manualUpdateHeat() {
    console.log('🔥 手动触发热度更新...');
    await updateAllHeatScores();
}
