import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAdminPosts, deletePost } from '../../services/api'
import './Posts.css'

interface Post {
    id: number
    title: string
    slug: string
    published: boolean
    isPublic: boolean
    createdAt: string
    _count: {
        comments: number
    }
}

function Posts() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [searchParams, setSearchParams] = useSearchParams()
    const statusFilter = searchParams.get('status') // 'published', 'draft', or null

    useEffect(() => {
        fetchPosts()
    }, [])

    const fetchPosts = async () => {
        try {
            const data = await getAdminPosts()
            setPosts(data)
        } catch (error) {
            console.error('获取文章失败:', error)
        } finally {
            setLoading(false)
        }
    }

    // 根据 URL 参数筛选文章
    const filteredPosts = posts.filter(post => {
        if (statusFilter === 'published') return post.published
        if (statusFilter === 'draft') return !post.published
        return true
    })

    const handleFilterChange = (status: string | null) => {
        if (status) {
            setSearchParams({ status })
        } else {
            setSearchParams({})
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('确定要删除这篇文章吗？')) return

        try {
            await deletePost(id)
            setPosts(posts.filter(p => p.id !== id))
        } catch (error) {
            console.error('删除失败:', error)
        }
    }

    return (
        <div className="admin-posts">
            <header className="posts-header">
                <h1 className="posts-title">
                    <span className="title-prefix">&gt;_</span> 文章管理
                    {statusFilter && (
                        <span className="filter-badge">
                            {statusFilter === 'published' ? '已发布' : '草稿'}
                        </span>
                    )}
                </h1>
                <Link to="/admin/posts/new" className="btn btn-primary hover-trigger">
                    + 新建文章
                </Link>
            </header>

            {/* 筛选按钮 */}
            <div className="filter-bar">
                <button
                    className={`filter-btn ${!statusFilter ? 'active' : ''}`}
                    onClick={() => handleFilterChange(null)}
                >
                    全部
                </button>
                <button
                    className={`filter-btn ${statusFilter === 'published' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('published')}
                >
                    已发布
                </button>
                <button
                    className={`filter-btn ${statusFilter === 'draft' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('draft')}
                >
                    草稿
                </button>
            </div>

            <div className="posts-table-wrapper">
                {loading ? (
                    <div className="skeleton" style={{ height: '300px' }}></div>
                ) : (
                    <table className="posts-table">
                        <thead>
                            <tr>
                                <th>标题</th>
                                <th>状态</th>
                                <th>可见性</th>
                                <th>评论</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPosts.length > 0 ? (
                                filteredPosts.map(post => (
                                    <tr key={post.id}>
                                        <td className="post-title-cell">
                                            <Link to={`/post/${post.slug}`} target="_blank" className="hover-trigger">
                                                {post.title}
                                            </Link>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${post.published ? 'status-published' : 'status-draft'}`}>
                                                {post.published ? '已发布' : '草稿'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${post.isPublic ? 'status-public' : 'status-private'}`}>
                                                {post.isPublic ? '公开' : '私密'}
                                            </span>
                                        </td>
                                        <td className="count-cell">{post._count.comments}</td>
                                        <td className="date-cell">
                                            {new Date(post.createdAt).toLocaleDateString('en-CA')}
                                        </td>
                                        <td className="actions-cell">
                                            <Link to={`/admin/posts/${post.id}/edit`} className="action-btn edit hover-trigger">
                                                编辑
                                            </Link>
                                            <button onClick={() => handleDelete(post.id)} className="action-btn delete hover-trigger">
                                                删除
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="empty-cell">// 暂无文章数据</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default Posts
