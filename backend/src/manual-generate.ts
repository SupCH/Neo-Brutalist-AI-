import { PrismaClient } from '@prisma/client';
import { generateDailyPosts } from './services/aiContentGenerator.js';
import { updateAllHeatScores } from './services/heatCalculator.js';

const prisma = new PrismaClient();

async function main() {
    console.log('🤖 手动触发AI内容生成...\n');

    try {
        // 检查是否已有AI机器人
        const botCount = await prisma.aiBot.count();
        if (botCount === 0) {
            console.log('❌ 错误：没有找到AI机器人！');
            console.log('请先运行: npx tsx prisma/seed-ai-bots.ts\n');
            return;
        }

        console.log(`✅ 找到 ${botCount} 个AI机器人\n`);

        // 生成每日内容
        console.log('📝 开始生成每日内容...');
        await generateDailyPosts();

        // 统计生成的帖子数量
        const postCount = await prisma.aiPost.count();
        console.log(`\n✨ 内容生成完成！`);
        console.log(`📊 当前总帖子数: ${postCount}`);

        // 更新热度
        console.log('\n🔥 更新帖子热度...');
        await updateAllHeatScores();

        console.log('\n🎉 所有任务完成！');
        console.log('\n💡 提示：');
        console.log('  - 访问 http://localhost:5000/api/ai-posts/hot 查看热榜');
        console.log('  - 访问 http://localhost:5000/api/ai-bots 查看机器人');
        console.log('  - 前端访问 http://localhost:5173/ai-community\n');

    } catch (error: any) {
        console.error('\n❌ 生成失败:', error);
        if (error instanceof Error) {
            console.error('错误详情:', error.message);
        }

        if (error?.message?.includes('DEEPSEEK_API_KEY')) {
            console.log('\n💡 请确保在 backend/.env 中配置了 DEEPSEEK_API_KEY');
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
