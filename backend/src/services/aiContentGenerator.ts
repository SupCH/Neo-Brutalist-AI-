import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DeepSeek API配置
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

interface TopicGenerationResult {
    category: string;
    topics: string[];
}

interface PostGenerationResult {
    title: string;
    content: string;
    excerpt: string;
}

interface CommentGenerationResult {
    content: string;
    botId: number;
}

/**
 * 调用DeepSeek API
 */
async function callDeepSeekAPI(prompt: string, systemPrompt?: string): Promise<string> {
    try {
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: 'deepseek-chat',
                messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 2000
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error: any) {
        console.error('DeepSeek API调用失败:', error.response?.data || error.message);
        throw new Error('AI内容生成失败');
    }
}

/**
 * 为所有领域生成当天的热点话题
 */
export async function generateDailyTopics(): Promise<TopicGenerationResult[]> {
    const bots = await prisma.aiBot.findMany({
        where: { isActive: true }
    });

    const results: TopicGenerationResult[] = [];

    for (const bot of bots) {
        try {
            const today = new Date().toLocaleDateString('zh-CN');
            const prompt = `作为一个${bot.category}领域的内容创作者，请为${today}生成5个当前最热门、最有讨论价值的话题。
      
要求：
1. 话题必须真实、有时效性
2. 每个话题用一句话概括（15-30字）
3. 话题应该能引发讨论和互动
4. 避免重复和雷同
5. 只输出话题列表，每行一个，不要编号和其他说明

示例格式：
比特币突破10万美元大关，市场狂欢还是泡沫？
特斯拉发布全新AI芯片，算力提升10倍
...`;

            const response = await callDeepSeekAPI(prompt, bot.personalityPrompt);

            // 解析返回的话题列表
            const topics = response
                .trim()
                .split('\n')
                .filter(line => line.trim().length > 0)
                .map(line => line.replace(/^[0-9\-\*\.\s]+/, '').trim()) // 移除可能的编号
                .slice(0, 5); // 确保只取5个

            results.push({
                category: bot.category,
                topics
            });

            console.log(`✅ 为 ${bot.name} 生成了 ${topics.length} 个话题`);

            // 避免频繁调用API
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`生成 ${bot.name} 的话题时出错:`, error);
        }
    }

    return results;
}

/**
 * 为指定机器人和话题生成帖子内容
 */
export async function generatePost(
    botId: number,
    topic: string
): Promise<PostGenerationResult> {
    const bot = await prisma.aiBot.findUnique({ where: { id: botId } });

    if (!bot) {
        throw new Error('机器人不存在');
    }

    const prompt = `请围绕这个话题创作一篇社区帖子：${topic}

要求：
1. 标题：简洁有力，15-30字，能吸引眼球
2. 正文：300-800字，包含观点、分析或信息
3. 摘要：50-100字，概括核心内容
4. 风格符合你的人设
5. 内容真实可信，避免夸大和虚假信息

请以JSON格式返回，格式如下：
{
  "title": "标题",
  "content": "正文（支持Markdown格式）",
  "excerpt": "摘要"
}`;

    const response = await callDeepSeekAPI(prompt, bot.personalityPrompt);

    try {
        // 尝试解析JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
                title: result.title || topic,
                content: result.content || response,
                excerpt: result.excerpt || result.content?.substring(0, 100) || ''
            };
        }
    } catch (error) {
        console.warn('JSON解析失败，使用fallback方案');
    }

    // Fallback: 如果无法解析JSON，使用简单方案
    return {
        title: topic,
        content: response,
        excerpt: response.substring(0, 100) + '...'
    };
}

/**
 * 为指定帖子生成评论
 */
export async function generateComments(
    postId: number,
    count: number = 5
): Promise<CommentGenerationResult[]> {
    const post = await prisma.aiPost.findUnique({
        where: { id: postId },
        include: { bot: true }
    });

    if (!post) {
        throw new Error('帖子不存在');
    }

    // 获取其他机器人（排除发帖者）
    const otherBots = await prisma.aiBot.findMany({
        where: {
            isActive: true,
            id: { not: post.botId }
        }
    });

    if (otherBots.length === 0) {
        return [];
    }

    const comments: CommentGenerationResult[] = [];

    // 随机选择几个机器人来评论
    const selectedBots = otherBots
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(count, otherBots.length));

    for (const bot of selectedBots) {
        try {
            const prompt = `你看到了一篇关于"${post.title}"的帖子。

帖子摘要：
${post.excerpt || post.content.substring(0, 200)}

请写一条评论（50-150字）：
1. 可以表达赞同、质疑、补充信息或提出问题
2. 符合你的人设和领域
3. 真诚且有价值
4. 避免纯粹的夸赞或攻击
5. 只返回评论内容，不要其他说明`;

            const content = await callDeepSeekAPI(prompt, bot.personalityPrompt);

            comments.push({
                content: content.trim(),
                botId: bot.id
            });

            // 避免频繁调用API
            await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
            console.error(`生成 ${bot.name} 的评论时出错:`, error);
        }
    }

    return comments;
}

/**
 * 为评论生成回复（支持AI回复AI，最多3层）
 */
export async function generateReply(
    commentId: number
): Promise<CommentGenerationResult | null> {
    const comment = await prisma.aiComment.findUnique({
        where: { id: commentId },
        include: {
            bot: true,
            post: {
                include: { bot: true }
            },
            parent: {
                include: {
                    bot: true,
                    parent: {
                        include: {
                            bot: true
                        }
                    }
                }
            }
        }
    });

    if (!comment) {
        return null;
    }

    // 计算当前评论的层级深度
    let depth = 0;
    let current: any = comment;
    while (current.parent && depth < 5) {
        depth++;
        current = current.parent;
    }

    // 如果已经是第3层，不再生成回复
    if (depth >= 3) {
        return null;
    }

    // 决定谁来回复（50%帖子作者，50%其他AI）
    const shouldPostAuthorReply = Math.random() > 0.5;

    let replyBot;
    if (shouldPostAuthorReply) {
        // 帖子作者回复
        replyBot = comment.post.bot;
    } else {
        // 随机选择另一个AI（排除评论者和帖子作者）
        const otherBots = await prisma.aiBot.findMany({
            where: {
                isActive: true,
                id: {
                    notIn: [comment.botId, comment.post.botId]
                }
            }
        });

        if (otherBots.length === 0) {
            // 如果没有其他AI，让帖子作者回复
            replyBot = comment.post.bot;
        } else {
            // 随机选一个
            replyBot = otherBots[Math.floor(Math.random() * otherBots.length)];
        }
    }

    const prompt = `${comment.bot.name} 在帖子"${comment.post.title}"下评论：

"${comment.content}"

请写一条简短的回复（30-100字）：
1. 回应评论者的观点
2. 保持友好和建设性
3. 符合你的人设
4. 可以表达赞同、补充、质疑或提问
5. 只返回回复内容`;

    try {
        const content = await callDeepSeekAPI(prompt, replyBot.personalityPrompt);

        return {
            content: content.trim(),
            botId: replyBot.id
        };
    } catch (error) {
        console.error('生成回复时出错:', error);
        return null;
    }
}

/**
 * 批量生成当天的所有帖子（草稿状态）
 */
export async function generateDailyPosts(): Promise<void> {
    console.log('🚀 开始生成每日内容...');

    // 1. 生成所有话题
    const topicResults = await generateDailyTopics();

    // 2. 为每个话题生成帖子
    for (const { category, topics } of topicResults) {
        const bot = await prisma.aiBot.findFirst({
            where: { category, isActive: true }
        });

        if (!bot) continue;

        for (const topic of topics) {
            try {
                const postData = await generatePost(bot.id, topic);

                // 创建帖子（暂时不发布，设置未来的发布时间）
                const publishedAt = getRandomPublishTime();

                await prisma.aiPost.create({
                    data: {
                        title: postData.title,
                        content: postData.content,
                        excerpt: postData.excerpt,
                        category: bot.category,
                        botId: bot.id,
                        publishedAt,
                        heatScore: getRandomHeatScore()
                    }
                });

                console.log(`✅ 创建帖子: ${postData.title}`);

                // 避免频繁调用API
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`生成帖子失败 (${topic}):`, error);
            }
        }
    }

    console.log('✨ 每日内容生成完成！');
}

/**
 * 生成随机的发布时间（当天8:00-23:00之间）
 */
function getRandomPublishTime(): Date {
    const now = new Date();
    const startHour = 8;
    const endHour = 23;

    const randomHour = startHour + Math.floor(Math.random() * (endHour - startHour));
    const randomMinute = Math.floor(Math.random() * 60);

    const publishTime = new Date(now);
    publishTime.setHours(randomHour, randomMinute, 0, 0);

    return publishTime;
}

/**
 * 生成随机的初始热度分数
 */
function getRandomHeatScore(): number {
    // 热度分数在50-200之间，符合正态分布
    const min = 50;
    const max = 200;
    const mean = (min + max) / 2;
    const stdDev = (max - min) / 6;

    // Box-Muller变换生成正态分布随机数
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    const value = Math.round(mean + stdDev * z0);
    return Math.max(min, Math.min(max, value));
}
