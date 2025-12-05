import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getAdminComments, deleteComment } from '../../services/api'
import './Comments.css'

interface Comment {
    id: number
    content: string
    createdAt: string
    author: {
        id: number
        name: string
        email: string
    } | null
    post: {
        id: number
        title: string
        slug: string
    }
}

type SortField = 'time' | 'user'
type SortOrder = 'asc' | 'desc'

function Comments() {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [sortField, setSortField] = useState<SortField>('time')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    useEffect(() => {
        fetchComments()
    }, [])

    const fetchComments = async () => {
        try {
            const data = await getAdminComments()
            setComments(data)
        } catch (error) {
            console.error('获取评论失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const sortedComments = useMemo(() => {
        const sorted = [...comments].sort((a, b) => {
            if (sortField === 'time') {
                const timeA = new Date(a.createdAt).getTime()
                const timeB = new Date(b.createdAt).getTime()
                return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
            } else {
                const nameA = a.author?.name || ''
                const nameB = b.author?.name || ''
                const compare = nameA.localeCompare(nameB)
                return sortOrder === 'asc' ? compare : -compare
            }
        })
        return sorted
    }, [comments, sortField, sortOrder])

    const handleDelete = async (commentId: number) => {
        if (!confirm('确定要删除这条评论吗？')) return

        try {
            await deleteComment(commentId)
            setComments(comments.filter(c => c.id !== commentId))
        } catch (error) {
            console.error('删除评论失败:', error)
            alert('删除评论失败')
        }
    }

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    return (
        <div className="admin-comments">
            <header className="comments-header">
                <h1 className="comments-title">
                    <span className="title-prefix">&gt;_</span> 评论管理
                </h1>
                <span className="comments-count">{comments.length} 评论</span>
            </header>

            <div className="sort-controls">
                <span className="sort-label">排序：</span>
                <button
                    className={`sort-btn ${sortField === 'time' ? 'active' : ''}`}
                    onClick={() => toggleSort('time')}
                >
                    时间 {sortField === 'time' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                    className={`sort-btn ${sortField === 'user' ? 'active' : ''}`}
                    onClick={() => toggleSort('user')}
                >
                    用户 {sortField === 'user' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
            </div>

            <div className="comments-table-wrapper">
                {loading ? (
                    <div className="skeleton" style={{ height: '300px' }}></div>
                ) : (
                    <table className="comments-table">
                        <thead>
                            <tr>
                                <th>内容</th>
                                <th>用户</th>
                                <th>文章</th>
                                <th>时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedComments.map(comment => (
                                <tr key={comment.id}>
                                    <td className="content-cell">
                                        <div className="comment-content-preview">
                                            {comment.content.length > 100
                                                ? comment.content.slice(0, 100) + '...'
                                                : comment.content}
                                        </div>
                                    </td>
                                    <td className="user-cell">
                                        {comment.author ? (
                                            <Link to={`/user/${comment.author.id}`} className="user-link">
                                                {comment.author.name}
                                                <span className="uid-badge">UID:{comment.author.id}</span>
                                            </Link>
                                        ) : (
                                            <span className="deleted-user">已删除用户</span>
                                        )}
                                    </td>
                                    <td className="post-cell">
                                        <Link to={`/posts/${comment.post.slug}`} className="post-link">
                                            {comment.post.title.length > 20
                                                ? comment.post.title.slice(0, 20) + '...'
                                                : comment.post.title}
                                        </Link>
                                    </td>
                                    <td className="date-cell">
                                        {new Date(comment.createdAt).toLocaleDateString('en-CA')}
                                    </td>
                                    <td>
                                        <button
                                            className="action-btn delete"
                                            onClick={() => handleDelete(comment.id)}
                                        >
                                            删除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default Comments
