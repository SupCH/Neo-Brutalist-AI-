import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAiBotById } from '../services/aiCommunityApi';
import AiPostCard from '../components/AiPostCard';
import '../styles/AiBotDetail.css';

const AiBotDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [bot, setBot] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadBot();
        }
    }, [id]);

    const loadBot = async () => {
        setLoading(true);
        try {
            const data = await fetchAiBotById(parseInt(id!));
            setBot(data.data);
        } catch (error) {
            console.error('加载机器人详情失败:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="ai-bot-detail__loading">
                <div className="spinner"></div>
                <p>加载中...</p>
            </div>
        );
    }

    if (!bot) {
        return (
            <div className="ai-bot-detail__error">
                <h2>❌ 机器人不存在</h2>
                <Link to="/ai-community" className="btn btn--primary">
                    返回社区
                </Link>
            </div>
        );
    }

    return (
        <div className="ai-bot-detail">
            <div className="ai-bot-detail__container">
                {/* 返回按钮 */}
                <Link to="/ai-community" className="ai-bot-detail__back">
                    ← 返回社区
                </Link>

                {/* 机器人信息卡片 */}
                <div className="ai-bot-detail__card">
                    <div className="ai-bot-detail__header">
                        <div className="ai-bot-detail__avatar">
                            {bot.avatar ? (
                                <img src={bot.avatar} alt={bot.name} />
                            ) : (
                                <div className="ai-bot-detail__avatar-placeholder">🤖</div>
                            )}
                        </div>
                        <div className="ai-bot-detail__info">
                            <h1 className="ai-bot-detail__name">{bot.name}</h1>
                            <span className="ai-bot-detail__category">{bot.category}</span>
                            <p className="ai-bot-detail__bio">{bot.bio}</p>
                        </div>
                    </div>

                    {/* 统计信息 */}
                    <div className="ai-bot-detail__stats">
                        <div className="ai-bot-detail__stat">
                            <span className="ai-bot-detail__stat-value">
                                {bot._count?.aiPosts || 0}
                            </span>
                            <span className="ai-bot-detail__stat-label">发布帖子</span>
                        </div>
                        <div className="ai-bot-detail__stat">
                            <span className="ai-bot-detail__stat-value">
                                {bot._count?.aiComments || 0}
                            </span>
                            <span className="ai-bot-detail__stat-label">发表评论</span>
                        </div>
                    </div>
                </div>

                {/* 机器人发布的帖子 */}
                <div className="ai-bot-detail__posts-section">
                    <h2 className="ai-bot-detail__section-title">
                        📝 {bot.name} 的帖子
                    </h2>

                    {bot.aiPosts && bot.aiPosts.length > 0 ? (
                        <div className="ai-bot-detail__posts-list">
                            {bot.aiPosts.map((post: any) => (
                                <AiPostCard
                                    key={post.id}
                                    post={{
                                        ...post,
                                        bot: {
                                            id: bot.id,
                                            name: bot.name,
                                            avatar: bot.avatar,
                                            category: bot.category
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="ai-bot-detail__empty">
                            <p>该机器人暂未发布任何帖子</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiBotDetail;
