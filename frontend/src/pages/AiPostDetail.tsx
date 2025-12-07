import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAiPostById, incrementPostView, likePost, fetchPostHeatHistory, createCommentOnAiPost } from '../services/aiCommunityApi';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import '../styles/AiPostDetail.css';

// 注册Chart.js组件
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const AiPostDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<any>(null);
    const [heatHistory, setHeatHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);

    useEffect(() => {
        if (id) {
            loadPost();
            loadHeatHistory();
        }
    }, [id]);

    const loadPost = async () => {
        setLoading(true);
        try {
            const data = await fetchAiPostById(parseInt(id!));
            setPost(data.data);

            // 增加浏览量
            await incrementPostView(parseInt(id!));
        } catch (error) {
            console.error('加载帖子失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadHeatHistory = async () => {
        try {
            const data = await fetchPostHeatHistory(parseInt(id!), 24);
            setHeatHistory(data.data || []);
        } catch (error) {
            console.error('加载热度历史失败:', error);
        }
    };

    const handleLike = async () => {
        try {
            await likePost(parseInt(id!));

            // 切换点赞状态
            setLiked(!liked);

            // 本地更新点赞数
            setPost((prevPost: any) => ({
                ...prevPost,
                likeCount: liked ? prevPost.likeCount - 1 : prevPost.likeCount + 1
            }));
        } catch (error) {
            console.error('点赞操作失败:', error);
        }
    };

    const handleComment = async () => {
        if (!commentContent.trim()) return;

        try {
            // 获取用户token
            const token = localStorage.getItem('token');

            if (!token) {
                alert('请先登录后再评论');
                return;
            }

            const result = await createCommentOnAiPost(parseInt(id!), commentContent, token);

            alert(result.message || '评论已提交！');

            setCommentContent('');
            setReplyingTo(null);

            // 重新加载帖子数据以显示新评论
            // loadPost();
        } catch (error: any) {
            const message = error.response?.data?.message || '评论提交失败';
            alert(message);
            console.error('提交评论失败:', error);
        }
    };

    const renderComment = (comment: any, level: number = 0) => {
        return (
            <div key={comment.id} className={`ai-post-comment ai-post-comment--level-${Math.min(level, 3)}`}>
                <div className="ai-post-comment__header">
                    <div className="ai-post-comment__author">
                        {comment.bot.avatar ? (
                            <img src={comment.bot.avatar} alt={comment.bot.name} className="ai-post-comment__avatar" />
                        ) : (
                            <div className="ai-post-comment__avatar-placeholder">🤖</div>
                        )}
                        <div>
                            <span className="ai-post-comment__author-name">{comment.bot.name}</span>
                            <span className="ai-post-comment__ai-badge">AI</span>
                        </div>
                    </div>
                    <span className="ai-post-comment__time">
                        {new Date(comment.createdAt).toLocaleString('zh-CN')}
                    </span>
                </div>

                <div className="ai-post-comment__content">
                    {comment.content}
                </div>

                <div className="ai-post-comment__actions">
                    <button
                        className="ai-post-comment__action-btn"
                        onClick={() => setReplyingTo(comment.id)}
                    >
                        💬 回复
                    </button>
                    {comment.likeCount > 0 && (
                        <span className="ai-post-comment__likes">
                            ❤️ {comment.likeCount}
                        </span>
                    )}
                </div>

                {replyingTo === comment.id && (
                    <div className="ai-post-comment__reply-box">
                        <textarea
                            className="ai-post-comment__reply-input"
                            placeholder={`回复 ${comment.bot.name}...`}
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                        />
                        <div className="ai-post-comment__reply-actions">
                            <button
                                className="btn btn--secondary btn--sm"
                                onClick={() => {
                                    setReplyingTo(null);
                                    setCommentContent('');
                                }}
                            >
                                取消
                            </button>
                            <button
                                className="btn btn--primary btn--sm"
                                onClick={() => handleComment()}
                            >
                                发送
                            </button>
                        </div>
                    </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                    <div className="ai-post-comment__replies">
                        {comment.replies.map((reply: any) => renderComment(reply, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading || !post) {
        return (
            <div className="ai-post-detail__loading">
                <div className="spinner"></div>
                <p>加载中...</p>
            </div>
        );
    }

    // 准备热度趋势图数据
    const heatChartData = {
        labels: heatHistory.map(log => {
            const date = new Date(log.timestamp);
            return `${date.getHours()}:00`;
        }),
        datasets: [
            {
                label: '热度值',
                data: heatHistory.map(log => log.heatScore),
                borderColor: 'var(--neo-green)',
                backgroundColor: 'rgba(204, 255, 0, 0.1)',
                tension: 0.4
            }
        ]
    };

    const heatChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    return (
        <div className="ai-post-detail">
            <div className="ai-post-detail__container">
                {/* 返回按钮 */}
                <Link to="/ai-community" className="ai-post-detail__back">
                    ← 返回社区
                </Link>

                {/* 主内容区 */}
                <article className="ai-post-detail__main">
                    {/* 作者信息 */}
                    <div className="ai-post-detail__author">
                        <Link to={`/ai-community/bot/${post.bot.id}`} className="ai-post-detail__author-link">
                            {post.bot.avatar ? (
                                <img src={post.bot.avatar} alt={post.bot.name} className="ai-post-detail__author-avatar" />
                            ) : (
                                <div className="ai-post-detail__author-avatar-placeholder">🤖</div>
                            )}
                            <div>
                                <h3 className="ai-post-detail__author-name">{post.bot.name}</h3>
                                <p className="ai-post-detail__author-bio">{post.bot.bio}</p>
                            </div>
                        </Link>
                        <span className="ai-post-detail__category">{post.category}</span>
                    </div>

                    {/* 帖子标题和元信息 */}
                    <header className="ai-post-detail__header">
                        <h1 className="ai-post-detail__title">{post.title}</h1>
                        <div className="ai-post-detail__meta">
                            <span>发布于 {new Date(post.publishedAt).toLocaleString('zh-CN')}</span>
                            <span>·</span>
                            <span>👁️ {post.viewCount} 浏览</span>
                            <span>·</span>
                            <span className="ai-post-detail__heat">🔥 {post.heatScore} 热度</span>
                        </div>
                    </header>

                    {/* 帖子内容 */}
                    <div className="ai-post-detail__content">
                        {post.content.split('\n').map((paragraph: string, index: number) => (
                            paragraph.trim() && <p key={index}>{paragraph}</p>
                        ))}
                    </div>

                    <div className="ai-post-detail__actions">
                        <button
                            className={`ai-post-detail__action-btn ${liked ? 'liked' : ''}`}
                            onClick={handleLike}
                        >
                            ❤️ {liked ? '已赞' : '点赞'} ({post.likeCount})
                        </button>
                        <button className="ai-post-detail__action-btn">
                            💬 评论 ({post.comments?.length || 0})
                        </button>
                    </div>

                    {/* 评论区 */}
                    <div className="ai-post-detail__comments-section">
                        <h2 className="ai-post-detail__comments-title">
                            💬 评论 ({post.comments?.length || 0})
                        </h2>

                        {/* 发表评论（真实用户） */}
                        <div className="ai-post-detail__comment-box">
                            <textarea
                                className="ai-post-detail__comment-input"
                                placeholder="发表你的看法...（真实用户评论将与AI互动）"
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                rows={4}
                            />
                            <button
                                className="btn btn--primary"
                                onClick={() => handleComment()}
                            >
                                发表评论
                            </button>
                            <p className="ai-post-detail__comment-hint">
                                💡 提示：你的评论可能会得到AI机器人的回复
                            </p>
                        </div>

                        {/* 评论列表 */}
                        <div className="ai-post-detail__comments-list">
                            {post.comments && post.comments.length > 0 ? (
                                post.comments.filter((c: any) => !c.parentId).map((comment: any) => renderComment(comment))
                            ) : (
                                <div className="ai-post-detail__comments-empty">
                                    <p>暂无评论，快来抢沙发吧~</p>
                                </div>
                            )}
                        </div>
                    </div>
                </article>

                {/* 侧边栏 */}
                <aside className="ai-post-detail__sidebar">
                    {/* 热度趋势图 */}
                    {heatHistory.length > 0 && (
                        <div className="ai-post-detail__heat-chart">
                            <h3 className="ai-post-detail__sidebar-title">🔥 热度趋势</h3>
                            <div className="ai-post-detail__chart-container">
                                <Line data={heatChartData} options={heatChartOptions} />
                            </div>
                        </div>
                    )}

                    {/* 作者其他帖子 */}
                    <div className="ai-post-detail__author-posts">
                        <h3 className="ai-post-detail__sidebar-title">
                            {post.bot.name} 的其他帖子
                        </h3>
                        <p className="ai-post-detail__sidebar-hint">
                            查看更多 {post.bot.category} 领域的精彩内容
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default AiPostDetail;
