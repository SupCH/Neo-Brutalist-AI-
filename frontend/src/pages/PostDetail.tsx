import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { marked } from 'marked'
import { getPost, createComment, isAuthenticated } from '../services/api'
import NotFound from './NotFound'
import TableOfContents from '../components/TableOfContents'
import Skeleton from '../components/Skeleton'
import './PostDetail.css'

interface PostDetailData {
    id: number
    title: string
    slug: string
    content: string
    coverImage?: string
    createdAt: string
    updatedAt: string
    author: {
        id: number
        name: string
        avatar?: string
        bio?: string
    }
    tags: Array<{
        id: number
        name: string
        slug: string
    }>
    comments: Array<{
        id: number
        content: string
        createdAt: string
        author: {
            id: number
            name: string
            avatar?: string
        }
    }>
}

function PostDetail() {
    const { slug } = useParams<{ slug: string }>()
    const [post, setPost] = useState<PostDetailData | null>(null)
    const [loading, setLoading] = useState(true)
    const [commentContent, setCommentContent] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) return
            try {
                const data = await getPost(slug)
                setPost(data)
            } catch (error) {
                console.error('获取文章失败:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchPost()
    }, [slug])

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!post || !commentContent.trim()) return

        setSubmitting(true)
        try {
            await createComment(post.id, commentContent)
            setCommentContent('')
            const data = await getPost(post.slug)
            setPost(data)
        } catch (error) {
            console.error('评论失败:', error)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="post-page-layout">
                {/* 骨架屏不需要侧边栏，或者可以放一个空的占位 */}
                <div className="toc-sidebar-placeholder" />

                <article className="post-detail">
                    <div className="post-header">
                        <div className="post-tags" style={{ display: 'flex', gap: '10px' }}>
                            <Skeleton type="button" width={60} height={24} />
                            <Skeleton type="button" width={80} height={24} />
                        </div>
                        <Skeleton type="title" />
                        <div className="post-meta" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Skeleton type="text" width={100} />
                            <Skeleton type="text" width={100} />
                        </div>
                    </div>
                    <div className="post-content">
                        <Skeleton type="text" lines={3} />
                        <Skeleton type="image" height={300} />
                        <Skeleton type="text" lines={4} />
                        <Skeleton type="text" lines={2} />
                    </div>
                </article>
            </div>
        )
    }

    if (!post) {
        return <NotFound />
    }

    const formattedDate = new Date(post.createdAt).toLocaleDateString('en-CA')

    // 解析 Markdown 内容
    const parsedContent = useMemo(() => {
        return marked.parse(post.content) as string
    }, [post.content])

    return (
        <div className="post-page-layout">
            {/* Table of Contents - Floating Button */}
            <TableOfContents content={post.content} />

            <article className="post-detail">
                {/* Article Header */}
                <header className="post-header">
                    <div className="post-tags">
                        {post.tags.map(tag => (
                            <Link key={tag.id} to={`/tag/${tag.slug}`} className="post-tag hover-trigger">
                                {tag.name}
                            </Link>
                        ))}
                    </div>

                    <h1 className="post-title">{post.title}</h1>

                    <div className="post-meta">
                        {post.author ? (
                            <Link to={`/user/${post.author.id}`} className="post-author">
                                {post.author.name} <span className="uid-badge">UID:{post.author.id}</span>
                            </Link>
                        ) : (
                            <span className="post-author deleted-user">已删除用户</span>
                        )}
                        <span className="post-divider">/</span>
                        <time className="post-date">{formattedDate}</time>
                    </div>
                </header>

                {/* Article Content */}
                <div className="post-content" dangerouslySetInnerHTML={{ __html: parsedContent }} />

                {/* Tags Footer */}
                <div className="post-footer">
                    <span className="footer-label">标签:</span>
                    {post.tags.map(tag => (
                        <Link key={tag.id} to={`/tag/${tag.slug}`} className="footer-tag hover-trigger">
                            #{tag.name}
                        </Link>
                    ))}
                </div>

                {/* Comments Section */}
                <section className="comments-section">
                    <h3 className="comments-title">
                        <span className="title-bracket">[</span>
                        评论 ({post.comments.length})
                        <span className="title-bracket">]</span>
                    </h3>

                    {isAuthenticated() ? (
                        <form className="comment-form" onSubmit={handleSubmitComment}>
                            <div className="form-group">
                                <label className="form-label">留下你的想法</label>
                                <textarea
                                    className="comment-input"
                                    placeholder="Wake up, Neo..."
                                    rows={4}
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? '发送中...' : '发送数据包'}
                            </button>
                        </form>
                    ) : (
                        <div className="login-prompt">
                            <p>// 请先 <Link to="/login" className="login-link">登录</Link> 或 <Link to="/register" className="login-link">注册</Link> 后再评论</p>
                        </div>
                    )}

                    <div className="comments-list">
                        {post.comments.length === 0 ? (
                            <p className="no-comments">// 暂无评论，成为第一个发言者</p>
                        ) : (
                            post.comments.map(comment => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-header">
                                        {comment.author ? (
                                            <Link to={`/user/${comment.author.id}`} className="comment-author">
                                                {comment.author.name} <span className="uid-badge">UID:{comment.author.id}</span>
                                            </Link>
                                        ) : (
                                            <span className="comment-author deleted-user">已删除用户</span>
                                        )}
                                        <span className="comment-date">
                                            {new Date(comment.createdAt).toLocaleDateString('en-CA')}
                                        </span>
                                    </div>
                                    <p className="comment-content">{comment.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </article>
        </div>
    )
}

export default PostDetail
