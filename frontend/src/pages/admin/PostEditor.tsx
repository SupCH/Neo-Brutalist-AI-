import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAdminPost, createPost, updatePost, getTags, createTag } from '../../services/api'
import './PostEditor.css'

interface Tag {
    id: number
    name: string
    slug: string
}

function PostEditor() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const isEditing = !!id

    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [content, setContent] = useState('')
    const [excerpt, setExcerpt] = useState('')
    const [coverImage, setCoverImage] = useState('')
    const [published, setPublished] = useState(false)
    const [isPublic, setIsPublic] = useState(true)
    const [selectedTags, setSelectedTags] = useState<number[]>([])
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [newTagName, setNewTagName] = useState('')
    const [creatingTag, setCreatingTag] = useState(false)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchTags()
        if (isEditing) {
            fetchPost()
        }
    }, [id])

    const fetchTags = async () => {
        try {
            const data = await getTags()
            setAllTags(data)
        } catch (error) {
            console.error('获取标签失败:', error)
        }
    }

    const fetchPost = async () => {
        if (!id) return
        setLoading(true)
        try {
            const post = await getAdminPost(parseInt(id))
            setTitle(post.title)
            setSlug(post.slug)
            setContent(post.content)
            setExcerpt(post.excerpt || '')
            setCoverImage(post.coverImage || '')
            setPublished(post.published)
            setIsPublic(post.isPublic !== undefined ? post.isPublic : true)
            setSelectedTags(post.tags.map((t: Tag) => t.id))
        } catch (error) {
            console.error('获取文章失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    const handleTitleChange = (value: string) => {
        setTitle(value)
        if (!isEditing && !slug) {
            setSlug(generateSlug(value))
        }
    }

    const handleTagToggle = (tagId: number) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        )
    }

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return

        setCreatingTag(true)
        try {
            const newTag = await createTag(newTagName.trim())
            setAllTags(prev => [...prev, newTag])
            setSelectedTags(prev => [...prev, newTag.id])
            setNewTagName('')
        } catch (error: any) {
            // 如果标签已存在，尝试从返回数据中获取并选中
            if (error.response?.data?.tag) {
                const existingTag = error.response.data.tag
                if (!selectedTags.includes(existingTag.id)) {
                    setSelectedTags(prev => [...prev, existingTag.id])
                }
            }
            console.error('创建标签失败:', error)
        } finally {
            setCreatingTag(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const postData = {
            title,
            slug,
            content,
            excerpt,
            coverImage,
            published,
            isPublic,
            tagIds: selectedTags,
        }

        try {
            if (isEditing) {
                await updatePost(parseInt(id!), postData)
            } else {
                await createPost(postData)
            }
            navigate('/admin/posts')
        } catch (error) {
            console.error('保存失败:', error)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="post-editor">
                <div className="skeleton" style={{ height: '600px' }}></div>
            </div>
        )
    }

    return (
        <div className="post-editor">
            <header className="editor-header">
                <h1 className="editor-title">
                    <span className="title-prefix">&gt;_</span> {isEditing ? '编辑文章' : '新建文章'}
                </h1>
            </header>

            <form className="editor-form" onSubmit={handleSubmit}>
                <div className="editor-main">
                    <div className="form-group">
                        <label htmlFor="title">标题</label>
                        <input
                            type="text"
                            id="title"
                            className="form-input"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="文章标题"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="slug">URL 别名</label>
                        <input
                            type="text"
                            id="slug"
                            className="form-input"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="url-slug"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="content">内容 (支持 HTML)</label>
                        <textarea
                            id="content"
                            className="form-input content-textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="在此输入文章内容..."
                            rows={20}
                            required
                        />
                    </div>
                </div>

                <div className="editor-sidebar">
                    <div className="sidebar-card">
                        <h3>发布设置</h3>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={published}
                                    onChange={(e) => setPublished(e.target.checked)}
                                />
                                <span className="checkbox-text">发布文章</span>
                            </label>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                />
                                <span className="checkbox-text">公开文章</span>
                                <span className="checkbox-hint">（关闭则只有你能看到）</span>
                            </label>
                        </div>

                        <div className="form-group">
                            <label htmlFor="excerpt">摘要</label>
                            <textarea
                                id="excerpt"
                                className="form-input"
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                placeholder="文章摘要..."
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="coverImage">封面图片 URL</label>
                            <input
                                type="url"
                                id="coverImage"
                                className="form-input"
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="sidebar-card">
                        <h3>标签</h3>
                        <div className="tags-selector">
                            {allTags.map(tag => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    className={`tag-option hover-trigger ${selectedTags.includes(tag.id) ? 'tag-selected' : ''}`}
                                    onClick={() => handleTagToggle(tag.id)}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                        <div className="new-tag-input" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="输入新标签名..."
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                className="btn btn-secondary hover-trigger"
                                onClick={handleCreateTag}
                                disabled={creatingTag || !newTagName.trim()}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                {creatingTag ? '创建中...' : '+ 新建'}
                            </button>
                        </div>
                    </div>

                    <div className="editor-actions">
                        <button type="button" className="btn btn-secondary hover-trigger" onClick={() => navigate('/admin/posts')}>
                            取消
                        </button>
                        <button type="submit" className="btn btn-primary hover-trigger" disabled={saving}>
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default PostEditor
