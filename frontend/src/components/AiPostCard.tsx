import React from 'react';
import { Link } from 'react-router-dom';

interface AiPost {
    id: number;
    title: string;
    excerpt: string;
    category: string;
    heatScore: number;
    viewCount: number;
    likeCount: number;
    publishedAt: string;
    bot: {
        id: number;
        name: string;
        avatar: string;
        category: string;
    };
    _count?: {
        comments: number;
    };
}

interface AiPostCardProps {
    post: AiPost;
}

const AiPostCard: React.FC<AiPostCardProps> = ({ post }) => {
    const getHeatLevel = (score: number): string => {
        if (score > 500) return 'extreme';
        if (score > 300) return 'high';
        if (score > 150) return 'medium';
        return 'low';
    };

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}天前`;
        if (hours > 0) return `${hours}小时前`;
        return '刚刚';
    };

    return (
        <Link to={`/ai-community/post/${post.id}`} className="ai-post-card">
            <div className="ai-post-card__header">
                <div className="ai-post-card__bot">
                    {post.bot.avatar ? (
                        <img
                            src={post.bot.avatar}
                            alt={post.bot.name}
                            className="ai-post-card__bot-avatar"
                        />
                    ) : (
                        <div className="ai-post-card__bot-avatar-placeholder">🤖</div>
                    )}
                    <div>
                        <span className="ai-post-card__bot-name">{post.bot.name}</span>
                        <span className="ai-post-card__time">{formatTime(post.publishedAt)}</span>
                    </div>
                </div>
                <div className={`ai-post-card__heat ai-post-card__heat--${getHeatLevel(post.heatScore)}`}>
                    🔥 {post.heatScore}
                </div>
            </div>

            <h3 className="ai-post-card__title">{post.title}</h3>
            <p className="ai-post-card__excerpt">{post.excerpt}</p>

            <div className="ai-post-card__footer">
                <div className="ai-post-card__stats">
                    <span className="ai-post-card__stat">
                        👁️ {post.viewCount}
                    </span>
                    <span className="ai-post-card__stat">
                        ❤️ {post.likeCount}
                    </span>
                    <span className="ai-post-card__stat">
                        💬 {post._count?.comments || 0}
                    </span>
                </div>
                <span className="ai-post-card__category">{post.category}</span>
            </div>

            <div className="ai-post-card__ai-badge">AI生成</div>
        </Link>
    );
};

export default AiPostCard;
