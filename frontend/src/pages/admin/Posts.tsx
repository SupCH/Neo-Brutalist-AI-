import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAdminPosts, deletePost, batchCreatePosts } from '../../services/api'
import Pagination from '../../components/Pagination'
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

interface UploadedFile {
    id: string
    fileName: string
    title: string
    slug: string
    content: string
    excerpt: string
    selected: boolean
    publish: boolean
}

function Posts() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [limit] = useState(10)
    const [searchParams, setSearchParams] = useSearchParams()
    const statusFilter = searchParams.get('status')

    // 批量上传相关状态
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchPosts(page)
    }, [page])

    const fetchPosts = async (currentPage: number) => {
        setLoading(true)
        try {
            const response = await getAdminPosts(currentPage, limit)
            // @ts-ignore - Handle PaginatedResponse
            setPosts(response.data)
            // @ts-ignore
            setTotalPages(response.meta.totalPages)
        } catch (error) {
            console.error('获取文章失败:', error)
        } finally {
            setLoading(false)
        }
    }

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

    // 生成 slug
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50) + '-' + Date.now().toString(36)
    }

    // 提取摘要
    const extractExcerpt = (content: string) => {
        // 移除 Markdown 语法并截取前200字符
        return content
            .replace(/^#.*$/gm, '')
            .replace(/\[.*?\]\(.*?\)/g, '')
            .replace(/[*_`~]/g, '')
            .replace(/\n+/g, ' ')
            .trim()
            .substring(0, 200)
    }

    // 从 Markdown 内容提取标题
    const extractTitle = (content: string, fileName: string) => {
        const match = content.match(/^#\s+(.+)$/m)
        if (match) return match[1].trim()
        // 如果没有 H1，使用文件名
        return fileName.replace(/\.md$/i, '')
    }

    // 处理文件上传
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newFiles: UploadedFile[] = []

        for (const file of Array.from(files)) {
            if (!file.name.endsWith('.md')) continue

            const content = await file.text()
            const title = extractTitle(content, file.name)

            newFiles.push({
                id: Math.random().toString(36).substring(7),
                fileName: file.name,
                title,
                slug: generateSlug(title),
                content,
                excerpt: extractExcerpt(content),
                selected: true,
                publish: false
            })
        }

        setUploadedFiles(prev => [...prev, ...newFiles])
        if (newFiles.length > 0) {
            setShowUploadModal(true)
        }

        // 重置 input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // 切换文件选择状态
    const toggleFileSelect = (id: string) => {
        setUploadedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, selected: !f.selected } : f
        ))
    }

    // 切换发布状态
    const togglePublish = (id: string) => {
        setUploadedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, publish: !f.publish } : f
        ))
    }

    // 全选/取消全选
    const toggleSelectAll = () => {
        const allSelected = uploadedFiles.every(f => f.selected)
        setUploadedFiles(prev => prev.map(f => ({ ...f, selected: !allSelected })))
    }

    // 一键发布所有
    const publishAll = () => {
        setUploadedFiles(prev => prev.map(f => ({ ...f, publish: true })))
    }

    // 一键存草稿
    const draftAll = () => {
        setUploadedFiles(prev => prev.map(f => ({ ...f, publish: false })))
    }

    // 移除文件
    const removeFile = (id: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== id))
    }

    // 提交上传
    const handleSubmitUpload = async () => {
        const selectedFiles = uploadedFiles.filter(f => f.selected)
        if (selectedFiles.length === 0) {
            alert('请选择至少一个文件')
            return
        }

        setUploading(true)
        try {
            const postsToCreate = selectedFiles.map(f => ({
                title: f.title,
                slug: f.slug,
                content: f.content,
                excerpt: f.excerpt,
                published: f.publish,
                isPublic: true
            }))

            const result = await batchCreatePosts(postsToCreate)

            alert(`成功创建 ${result.created?.length || 0} 篇文章！`)

            // 重置状态
            setUploadedFiles([])
            setShowUploadModal(false)
            // 刷新文章列表
            fetchPosts(page)
        } catch (error: any) {
            console.error('批量创建失败:', error)
            alert(error.message || '批量创建失败')
        } finally {
            setUploading(false)
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
                <div className="header-actions">
                    <label className="btn btn-secondary hover-trigger upload-btn">
                        ↑ 批量上传
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".md"
                            multiple
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </label>
                    <Link to="/admin/posts/new" className="btn btn-primary hover-trigger">
                        + 新建文章
                    </Link>
                </div>
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

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    loading={loading}
                />
            </div>


            {/* 批量上传弹窗 */}
            {
                showUploadModal && (
                    <div className="upload-modal-overlay" onClick={() => setShowUploadModal(false)}>
                        <div className="upload-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>&gt;_ 批量导入 Markdown</h2>
                                <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
                            </div>

                            <div className="modal-actions">
                                <button className="action-btn-sm" onClick={toggleSelectAll}>
                                    {uploadedFiles.every(f => f.selected) ? '取消全选' : '全选'}
                                </button>
                                <button className="action-btn-sm publish" onClick={publishAll}>
                                    全部发布
                                </button>
                                <button className="action-btn-sm draft" onClick={draftAll}>
                                    全部存草稿
                                </button>
                                <label className="action-btn-sm add-more">
                                    + 添加更多
                                    <input
                                        type="file"
                                        accept=".md"
                                        multiple
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>

                            <div className="upload-file-list">
                                {uploadedFiles.map(file => (
                                    <div key={file.id} className={`upload-file-item ${file.selected ? 'selected' : ''}`}>
                                        <label className="file-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={file.selected}
                                                onChange={() => toggleFileSelect(file.id)}
                                            />
                                            <span className="checkmark"></span>
                                        </label>
                                        <div className="file-info">
                                            <div className="file-title">{file.title}</div>
                                            <div className="file-meta">
                                                <span className="file-name">{file.fileName}</span>
                                                <span className="file-excerpt">{file.excerpt.substring(0, 60)}...</span>
                                            </div>
                                        </div>
                                        <div className="file-actions">
                                            <button
                                                className={`publish-toggle ${file.publish ? 'will-publish' : 'will-draft'}`}
                                                onClick={() => togglePublish(file.id)}
                                            >
                                                {file.publish ? '发布' : '草稿'}
                                            </button>
                                            <button className="remove-btn" onClick={() => removeFile(file.id)}>
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-footer">
                                <div className="upload-summary">
                                    已选择 <strong>{uploadedFiles.filter(f => f.selected).length}</strong> / {uploadedFiles.length} 个文件
                                    （<span className="publish-count">{uploadedFiles.filter(f => f.selected && f.publish).length} 发布</span>，
                                    <span className="draft-count">{uploadedFiles.filter(f => f.selected && !f.publish).length} 草稿</span>）
                                </div>
                                <div className="modal-buttons">
                                    <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                                        取消
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSubmitUpload}
                                        disabled={uploading || uploadedFiles.filter(f => f.selected).length === 0}
                                    >
                                        {uploading ? '正在导入...' : '确认导入'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}

export default Posts
