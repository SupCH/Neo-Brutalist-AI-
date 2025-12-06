import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getAdminComments, deleteComment } from '../../services/api'
import Pagination from '../../components/Pagination'
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
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [limit] = useState(20)
    const [sortField, setSortField] = useState<SortField>('time')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    useEffect(() => {
        fetchComments(page)
    }, [page])

    const fetchComments = async (currentPage: number) => {
        setLoading(true)
        try {
            const response = await getAdminComments(currentPage, limit)
            setComments(response.data)
            setTotalPages(response.meta.totalPages)
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

    const [selectedIds, setSelectedIds] = useState<number[]>([])

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(comments.map(c => c.id))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(prevId => prevId !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    const handleBatchDelete = async () => {
        if (!confirm(`确定要删除选中的 ${selectedIds.length} 条评论吗？`)) return

        try {
            // Using logic to delete one by one since batch API might not exist yet
            // optimizing to run in parallel
            await Promise.all(selectedIds.map(id => deleteComment(id)))

            setComments(comments.filter(c => !selectedIds.includes(c.id)))
            setSelectedIds([])
        } catch (error) {
            console.error('批量删除失败:', error)
            alert('批量删除部分或全部失败')
        }
    }

    return (
        <div className="admin-comments">
            <header className="comments-header">
                <h1 className="comments-title">
                    <span className="title-prefix">&gt;_</span> 评论管理
                </h1>
                <div className="header-actions">
                    <span className="comments-count">{comments.length} 评论</span>
                    {selectedIds.length > 0 && (
                        <button className="action-btn delete batch-delete-btn" onClick={handleBatchDelete}>
                            批量删除 ({selectedIds.length})
                        </button>
                    )}
                </div>
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
                                <th className="checkbox-cell">
                                    <input
                                        type="checkbox"
                                        checked={comments.length > 0 && selectedIds.length === comments.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>内容</th>
                                <th>用户</th>
                                <th>文章</th>
                                <th>时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedComments.map(comment => (
                                <tr key={comment.id} className={selectedIds.includes(comment.id) ? 'selected-row' : ''}>
                                    <td className="checkbox-cell">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(comment.id)}
                                            onChange={() => handleSelectOne(comment.id)}
                                        />
                                    </td>
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
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    loading={loading}
                />
            </div>
        </div>
    )
}

export default Comments
