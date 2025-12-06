import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { getPost, createComment, isAuthenticated, deleteOwnComment, getCurrentUser, recordView } from '../services/api'
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
    views: number
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
        parentId?: number | null
        isDeleted?: boolean
        createdAt: string
        author: {
            id: number
            name: string
            avatar?: string
        } | null
    }>
}

function PostDetail() {
    const { slug } = useParams<{ slug: string }>()
    const [post, setPost] = useState<PostDetailData | null>(null)
    const [loading, setLoading] = useState(true)
    const [commentContent, setCommentContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    const [replyTo, setReplyTo] = useState<number | null>(null)

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) return
            try {
                const data = await getPost(slug)
                setPost(data)

                // 记录访问 (不阻塞渲染)
                const today = new Date().toISOString().split('T')[0]
                const visitedKey = `visited_site_${today}`
                const isNewVisitor = !localStorage.getItem(visitedKey)

                recordView(data.id, isNewVisitor).then(() => {
                    if (isNewVisitor) {
                        localStorage.setItem(visitedKey, 'true')
                    }
                }).catch(console.error)
            } catch (error) {
                console.error('获取文章失败:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchPost()
    }, [slug])

    // 复制代码函数
    const copyCode = useCallback((code: string, button: HTMLButtonElement) => {
        navigator.clipboard.writeText(code).then(() => {
            const originalText = button.textContent
            button.textContent = '已复制!'
            button.classList.add('copied')
            setTimeout(() => {
                button.textContent = originalText
                button.classList.remove('copied')
            }, 2000)
        }).catch(err => {
            console.error('复制失败:', err)
            button.textContent = '复制失败'
        })
    }, [])

    // 代码高亮和添加复制按钮
    useEffect(() => {
        if (!contentRef.current || !post) return

        const codeBlocks = contentRef.current.querySelectorAll('pre code')

        codeBlocks.forEach((block) => {
            // 应用语法高亮
            hljs.highlightElement(block as HTMLElement)

            // 检查是否已经添加了复制按钮
            const pre = block.parentElement
            if (!pre || pre.querySelector('.code-copy-btn')) return

            // 创建代码块头部
            const header = document.createElement('div')
            header.className = 'code-header'

            // 获取语言
            const langClass = block.className.match(/language-(\w+)/)
            const lang = langClass ? langClass[1] : 'code'

            // 语言标签
            const langLabel = document.createElement('span')
            langLabel.className = 'code-lang'
            langLabel.textContent = lang.toUpperCase()

            // 复制按钮
            const copyBtn = document.createElement('button')
            copyBtn.className = 'code-copy-btn'
            copyBtn.textContent = '复制'
            copyBtn.onclick = () => copyCode(block.textContent || '', copyBtn)

            header.appendChild(langLabel)
            header.appendChild(copyBtn)

            // 包装代码块
            const wrapper = document.createElement('div')
            wrapper.className = 'code-block-wrapper'
            pre.parentNode?.insertBefore(wrapper, pre)
            wrapper.appendChild(header)
            wrapper.appendChild(pre)
        })
    }, [post, copyCode])

    // 图片懒加载
    useEffect(() => {
        if (!contentRef.current || !post) return

        const images = contentRef.current.querySelectorAll('img')

        // 使用 Intersection Observer 实现懒加载
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement
                    const src = img.dataset.src

                    if (src) {
                        img.src = src
                        img.removeAttribute('data-src')
                        img.classList.add('loaded')
                    }

                    observer.unobserve(img)
                }
            })
        }, {
            rootMargin: '100px 0px', // 提前100px开始加载
            threshold: 0.1
        })

        images.forEach(img => {
            const imgElement = img as HTMLImageElement

            // 如果图片有 src，转换为懒加载模式
            if (imgElement.src && !imgElement.dataset.src) {
                imgElement.dataset.src = imgElement.src
                imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23888" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="Arial"%3E加载中...%3C/text%3E%3C/svg%3E'
                imgElement.classList.add('lazy-image')
            }

            imageObserver.observe(imgElement)
        })

        return () => {
            imageObserver.disconnect()
        }
    }, [post])

    // LaTeX 公式渲染
    useEffect(() => {
        if (!contentRef.current || !post) return

        const content = contentRef.current

        // 渲染块级公式 $$...$$
        const blockMathRegex = /\$\$([\s\S]*?)\$\$/g
        content.innerHTML = content.innerHTML.replace(blockMathRegex, (_match, formula) => {
            try {
                return `<div class="math-block">${katex.renderToString(formula.trim(), {
                    displayMode: true,
                    throwOnError: false
                })}</div>`
            } catch {
                return `<div class="math-error">LaTeX Error: ${formula}</div>`
            }
        })

        // 渲染行内公式 $...$（需要避免匹配已经渲染的块级公式）
        const inlineMathRegex = /\$([^$\n]+?)\$/g
        content.innerHTML = content.innerHTML.replace(inlineMathRegex, (_match, formula) => {
            try {
                return katex.renderToString(formula.trim(), {
                    displayMode: false,
                    throwOnError: false
                })
            } catch {
                return `<span class="math-error">${formula}</span>`
            }
        })
    }, [post])

    const handleSubmitComment = async (e: React.FormEvent, parentId?: number) => {
        e.preventDefault()
        if (!post) return

        const content = parentId ? commentContent : commentContent
        if (!content.trim()) return

        setSubmitting(true)
        try {
            await createComment(post.id, content, parentId)
            setCommentContent('')
            if (parentId) setReplyTo(null)
            const data = await getPost(post.slug)
            setPost(data)
        } catch (error) {
            console.error('评论失败:', error)
        } finally {
            setSubmitting(false)
        }
    }

    // 解析 Markdown 内容 - 必须在所有条件返回之前调用 Hook
    const parsedContent = useMemo(() => {
        if (!post) return ''
        return marked.parse(post.content) as string
    }, [post])

    // 构建评论树
    const commentTree = useMemo(() => {
        if (!post?.comments) return []

        const map = new Map<number, any>()
        const roots: any[] = []

        // 初始化 Map
        post.comments.forEach(comment => {
            map.set(comment.id, { ...comment, replies: [] })
        })

        // 构建树
        post.comments.forEach(comment => {
            const node = map.get(comment.id)
            if (comment.parentId) {
                const parent = map.get(comment.parentId)
                if (parent) {
                    parent.replies.push(node)
                } else {
                    // 如果父评论找不到（可能被硬删除），作为根评论或忽略
                    // 这里选择作为根评论显示，避免数据丢失
                    roots.push(node)
                }
            } else {
                roots.push(node)
            }
        })

        return roots
    }, [post?.comments])

    // 递归渲染评论组件
    const CommentNode = ({ comment }: { comment: any }) => {
        const isReplying = replyTo === comment.id

        return (
            <div className={`comment-item ${comment.isDeleted ? 'deleted' : ''}`}>
                {comment.isDeleted ? (
                    <p className="deleted-message">此评论已被删除</p>
                ) : (
                    <>
                        <div className="comment-header">
                            {comment.author ? (
                                <Link to={`/user/${comment.author.id}`} className="comment-author">
                                    {comment.author.name} <span className="uid-badge">UID:{comment.author.id}</span>
                                </Link>
                            ) : (
                                <span className="comment-author deleted-user">已注销用户</span>
                            )}
                            <span className="comment-date">
                                {new Date(comment.createdAt).toLocaleDateString('en-CA')}
                            </span>

                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                                {isAuthenticated() && !comment.isDeleted && (
                                    <button
                                        className="comment-reply-btn"
                                        onClick={() => setReplyTo(isReplying ? null : comment.id)}
                                    >
                                        回复
                                    </button>
                                )}

                                {isAuthenticated() && (() => {
                                    const currentUser = getCurrentUser()
                                    const canDelete = currentUser && (
                                        comment.author?.id === currentUser.userId ||
                                        currentUser.role === 'SUPER_ADMIN'
                                    )
                                    return canDelete ? (
                                        <button
                                            className="comment-delete-btn"
                                            onClick={async () => {
                                                if (!confirm('确定要删除这条评论吗？')) return
                                                try {
                                                    await deleteOwnComment(comment.id)
                                                    const data = await getPost(post!.slug)
                                                    setPost(data)
                                                } catch (error) {
                                                    console.error('删除评论失败:', error)
                                                    alert('删除评论失败')
                                                }
                                            }}
                                        >
                                            删除
                                        </button>
                                    ) : null
                                })()}
                            </div>
                        </div>
                        <p className="comment-content">{comment.content}</p>

                        {/* 回复框 */}
                        {isReplying && (
                            <div className="reply-form-container">
                                <div className="reply-form-header">
                                    <span>回复 @{comment.author?.name || '用户'}</span>
                                    <button className="cancel-reply-btn" onClick={() => setReplyTo(null)}>取消</button>
                                </div>
                                <form onSubmit={(e) => handleSubmitComment(e, comment.id)}>
                                    <textarea
                                        className="comment-input"
                                        placeholder="请输入回复内容..."
                                        rows={3}
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        required
                                        autoFocus
                                        style={{ marginBottom: '10px' }}
                                    />
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? '回复中...' : '提交回复'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                )}

                {/* 递归渲染子评论 */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="comment-replies">
                        {comment.replies.map((reply: any) => (
                            <CommentNode key={reply.id} comment={reply} />
                        ))}
                    </div>
                )}
            </div>
        )
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
                        <span className="post-divider">/</span>
                        <time className="post-date">{formattedDate}</time>
                        <span className="post-divider">/</span>
                        <span className="post-views">
                            {post.views} 阅读
                        </span>
                    </div>
                </header>

                {/* Article Content */}
                <div ref={contentRef} className="post-content" dangerouslySetInnerHTML={{ __html: parsedContent }} />

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
                        <form className="comment-form" onSubmit={(e) => handleSubmitComment(e)}>
                            <div className="form-group">
                                <label className="form-label">留下你的想法</label>
                                <textarea
                                    className="comment-input"
                                    placeholder="Wake up, Neo..."
                                    rows={4}
                                    value={replyTo === null ? commentContent : ''} // 如果正在回复具体某条评论，清除主输入框
                                    onChange={(e) => {
                                        setReplyTo(null) // 输入主框时取消回复模式
                                        setCommentContent(e.target.value)
                                    }}
                                    required={replyTo === null}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={submitting || replyTo !== null}>
                                {submitting ? '发送中...' : '发送数据包'}
                            </button>
                        </form>
                    ) : (
                        <div className="login-prompt">
                            <p>// 请先 <Link to="/login" className="login-link">登录</Link> 或 <Link to="/register" className="login-link">注册</Link> 后再评论</p>
                        </div>
                    )}

                    <div className="comments-list">
                        {commentTree.length === 0 ? (
                            <p className="no-comments">// 暂无评论，成为第一个发言者</p>
                        ) : (
                            commentTree.map((comment: any) => (
                                <CommentNode key={comment.id} comment={comment} />
                            ))
                        )}
                    </div>
                </section>
            </article>
        </div>
    )
}

export default PostDetail
