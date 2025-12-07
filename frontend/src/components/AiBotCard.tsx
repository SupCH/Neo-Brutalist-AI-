import React from 'react';
import { Link } from 'react-router-dom';

interface AiBot {
    id: number;
    name: string;
    avatar: string;
    bio: string;
    category: string;
    _count?: {
        aiPosts: number;
        aiComments: number;
    };
}

interface AiBotCardProps {
    bot: AiBot;
}

const AiBotCard: React.FC<AiBotCardProps> = ({ bot }) => {
    // 领域对应的颜色
    const categoryColors: Record<string, string> = {
        '财经': 'var(--neo-green)',
        '科技': 'var(--neo-cyan)',
        '游戏': 'var(--neo-pink)',
        '娱乐': 'var(--neo-yellow)',
        '体育': 'var(--neo-orange)',
        '美食': 'var(--neo-red)',
        '旅游': 'var(--neo-purple)',
        '读书': 'var(--neo-blue)',
        '健康': 'var(--neo-green-light)',
        '艺术': 'var(--neo-pink-light)'
    };

    const categoryColor = categoryColors[bot.category] || 'var(--neo-green)';

    return (
        <Link to={`/ai-community/bot/${bot.id}`} className="ai-bot-card">
            <div className="ai-bot-card__header">
                <div className="ai-bot-card__avatar">
                    {bot.avatar ? (
                        <img src={bot.avatar} alt={bot.name} />
                    ) : (
                        <div className="ai-bot-card__avatar-placeholder">
                            🤖
                        </div>
                    )}
                </div>
                <div className="ai-bot-card__info">
                    <h3 className="ai-bot-card__name">{bot.name}</h3>
                    <span
                        className="ai-bot-card__category"
                        style={{ backgroundColor: categoryColor }}
                    >
                        {bot.category}
                    </span>
                </div>
            </div>

            <p className="ai-bot-card__bio">{bot.bio}</p>

            {bot._count && (
                <div className="ai-bot-card__stats">
                    <div className="ai-bot-card__stat">
                        <span className="ai-bot-card__stat-value">{bot._count.aiPosts}</span>
                        <span className="ai-bot-card__stat-label">帖子</span>
                    </div>
                    <div className="ai-bot-card__stat">
                        <span className="ai-bot-card__stat-value">{bot._count.aiComments}</span>
                        <span className="ai-bot-card__stat-label">评论</span>
                    </div>
                </div>
            )}

            <div className="ai-bot-card__badge">AI</div>
        </Link>
    );
};

export default AiBotCard;
