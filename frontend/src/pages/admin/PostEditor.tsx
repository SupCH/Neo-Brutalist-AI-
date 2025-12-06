import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAdminPost, createPost, updatePost, getTags, createTag, getPostVersions, getPostVersion, rollbackPostVersion } from '../../services/api'
import './PostEditor.css'

interface Tag {
    id: number
    name: string
    slug: string
}

interface DraftData {
    title: string
    slug: string
    content: string
    excerpt: string
    coverImage: string
    isPublic: boolean
    selectedTags: number[]
    savedAt: number
}

interface VersionInfo {
    id: number
    version: number
    title: string
    changeNote: string | null
    createdAt: string
    editorId: number | null
}

const DRAFT_KEY = 'post_editor_draft'
const AUTO_SAVE_INTERVAL = 30000 // 30秒自动保存

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

    // 自动保存相关状态
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [showDraftPrompt, setShowDraftPrompt] = useState(false)
    const [draftData, setDraftData] = useState<DraftData | null>(null)

    // 版本历史相关状态
    const [showVersionHistory, setShowVersionHistory] = useState(false)
    const [versions, setVersions] = useState<VersionInfo[]>([])
    const [loadingVersions, setLoadingVersions] = useState(false)
    const [selectedVersion, setSelectedVersion] = useState<any>(null)
    const [showVersionPreview, setShowVersionPreview] = useState(false)

    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
    const isInitialLoad = useRef(true)

    // 生成草稿存储键
    const getDraftKey = useCallback(() => {
        return isEditing ? `${DRAFT_KEY}_${id}` : `${DRAFT_KEY}_new`
    }, [isEditing, id])

    // 保存草稿到本地存储
    const saveDraft = useCallback(() => {
        if (!title && !content) return

        const draft: DraftData = {
            title,
            slug,
            content,
            excerpt,
            coverImage,
            isPublic,
            selectedTags,
            savedAt: Date.now()
        }

        try {
            localStorage.setItem(getDraftKey(), JSON.stringify(draft))
            setLastSaved(new Date())
            setAutoSaveStatus('saved')
            setHasUnsavedChanges(false)

            // 3秒后恢复状态
            setTimeout(() => setAutoSaveStatus('idle'), 3000)
        } catch (error) {
            console.error('保存草稿失败:', error)
            setAutoSaveStatus('error')
        }
    }, [title, slug, content, excerpt, coverImage, isPublic, selectedTags, getDraftKey])

    // 加载草稿
    const loadDraft = useCallback(() => {
        try {
            const savedDraft = localStorage.getItem(getDraftKey())
            if (savedDraft) {
                const draft: DraftData = JSON.parse(savedDraft)
                setDraftData(draft)
                return draft
            }
        } catch (error) {
            console.error('加载草稿失败:', error)
        }
        return null
    }, [getDraftKey])

    // 应用草稿数据
    const applyDraft = useCallback((draft: DraftData) => {
        setTitle(draft.title)
        setSlug(draft.slug)
        setContent(draft.content)
        setExcerpt(draft.excerpt)
        setCoverImage(draft.coverImage)
        setIsPublic(draft.isPublic)
        setSelectedTags(draft.selectedTags)
        setShowDraftPrompt(false)
        setDraftData(null)
    }, [])

    // 清除草稿
    const clearDraft = useCallback(() => {
        localStorage.removeItem(getDraftKey())
        setShowDraftPrompt(false)
        setDraftData(null)
    }, [getDraftKey])

    // 初始化时检查是否有草稿
    useEffect(() => {
        if (!isEditing && isInitialLoad.current) {
            const draft = loadDraft()
            if (draft && draft.savedAt > Date.now() - 7 * 24 * 60 * 60 * 1000) { // 7天内的草稿
                setShowDraftPrompt(true)
            }
        }
    }, [isEditing, loadDraft])

    // 内容变化时标记未保存
    useEffect(() => {
        if (isInitialLoad.current) return
        setHasUnsavedChanges(true)
    }, [title, slug, content, excerpt, coverImage, isPublic, selectedTags])

    // 自动保存定时器
    useEffect(() => {
        if (isInitialLoad.current) {
            isInitialLoad.current = false
            return
        }

        // 清除之前的定时器
        if (autoSaveTimer.current) {
            clearTimeout(autoSaveTimer.current)
        }

        // 设置新的自动保存定时器
        if (hasUnsavedChanges && (title || content)) {
            autoSaveTimer.current = setTimeout(() => {
                setAutoSaveStatus('saving')
                saveDraft()
            }, AUTO_SAVE_INTERVAL)
        }

        return () => {
            if (autoSaveTimer.current) {
                clearTimeout(autoSaveTimer.current)
            }
        }
    }, [hasUnsavedChanges, title, content, saveDraft])

    // 页面离开前提示
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                saveDraft() // 离开前保存
                e.preventDefault()
                e.returnValue = ''
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasUnsavedChanges, saveDraft])

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
            isInitialLoad.current = false
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

    // 手动保存草稿
    const handleManualSave = () => {
        setAutoSaveStatus('saving')
        saveDraft()
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
            // 成功提交后清除草稿
            clearDraft()
            navigate('/admin/posts')
        } catch (error) {
            console.error('保存失败:', error)
        } finally {
            setSaving(false)
        }
    }

    // 版本历史相关函数
    const loadVersionHistory = async () => {
        if (!isEditing || !id) return

        setLoadingVersions(true)
        try {
            const data = await getPostVersions(parseInt(id))
            setVersions(data)
            setShowVersionHistory(true)
        } catch (error) {
            console.error('加载版本历史失败:', error)
        } finally {
            setLoadingVersions(false)
        }
    }

    const previewVersion = async (versionId: number) => {
        if (!id) return

        try {
            const version = await getPostVersion(parseInt(id), versionId)
            setSelectedVersion(version)
            setShowVersionPreview(true)
        } catch (error) {
            console.error('加载版本详情失败:', error)
        }
    }

    const handleRollback = async (versionId: number) => {
        if (!id) return
        if (!confirm('确定要回滚到此版本吗？当前内容将被保存为新版本。')) return

        try {
            const result = await rollbackPostVersion(parseInt(id), versionId)
            alert(result.message)
            // 重新加载文章
            fetchPost()
            setShowVersionHistory(false)
            setShowVersionPreview(false)
        } catch (error) {
            console.error('回滚失败:', error)
            alert('回滚失败')
        }
    }

    const applyVersionToEditor = () => {
        if (!selectedVersion) return

        setTitle(selectedVersion.title)
        setContent(selectedVersion.content)
        setExcerpt(selectedVersion.excerpt || '')
        setCoverImage(selectedVersion.coverImage || '')
        setPublished(selectedVersion.published)
        setIsPublic(selectedVersion.isPublic)
        setShowVersionPreview(false)
        setHasUnsavedChanges(true)
    }

    // 格式化保存时间
    const formatSaveTime = (date: Date) => {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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
            {/* 草稿恢复提示 */}
            {showDraftPrompt && draftData && (
                <div className="draft-prompt">
                    <div className="draft-prompt-content">
                        <p>
                            <strong>发现未保存的草稿</strong>
                            <span className="draft-time">
                                (保存于 {new Date(draftData.savedAt).toLocaleString('zh-CN')})
                            </span>
                        </p>
                        <div className="draft-actions">
                            <button className="btn btn-primary" onClick={() => applyDraft(draftData)}>
                                恢复草稿
                            </button>
                            <button className="btn btn-secondary" onClick={clearDraft}>
                                丢弃
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="editor-header">
                <h1 className="editor-title">
                    <span className="title-prefix">&gt;_</span> {isEditing ? '编辑文章' : '新建文章'}
                </h1>

                {/* 自动保存状态指示器 */}
                <div className="auto-save-status">
                    {autoSaveStatus === 'saving' && (
                        <span className="save-indicator saving">⟳ 正在保存...</span>
                    )}
                    {autoSaveStatus === 'saved' && (
                        <span className="save-indicator saved">✓ 已保存草稿</span>
                    )}
                    {autoSaveStatus === 'error' && (
                        <span className="save-indicator error">✕ 保存失败</span>
                    )}
                    {autoSaveStatus === 'idle' && hasUnsavedChanges && (
                        <span className="save-indicator unsaved">● 未保存</span>
                    )}
                    {lastSaved && autoSaveStatus === 'idle' && !hasUnsavedChanges && (
                        <span className="save-indicator idle">上次保存: {formatSaveTime(lastSaved)}</span>
                    )}
                    <button
                        type="button"
                        className="manual-save-btn"
                        onClick={handleManualSave}
                        disabled={!hasUnsavedChanges}
                        title="手动保存草稿"
                    >
                        💾
                    </button>
                </div>
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

                    {/* 版本历史卡片 - 仅编辑模式显示 */}
                    {isEditing && (
                        <div className="sidebar-card version-card">
                            <h3>版本历史</h3>
                            <button
                                type="button"
                                className="btn btn-secondary version-btn"
                                onClick={loadVersionHistory}
                                disabled={loadingVersions}
                            >
                                {loadingVersions ? '加载中...' : '📜 查看历史版本'}
                            </button>
                        </div>
                    )}

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

            {/* 版本历史弹窗 */}
            {showVersionHistory && (
                <div className="version-modal-overlay" onClick={() => setShowVersionHistory(false)}>
                    <div className="version-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📜 版本历史</h2>
                            <button className="modal-close" onClick={() => setShowVersionHistory(false)}>×</button>
                        </div>
                        <div className="version-list">
                            {versions.length === 0 ? (
                                <p className="no-versions">暂无历史版本</p>
                            ) : (
                                versions.map(v => (
                                    <div key={v.id} className="version-item">
                                        <div className="version-info">
                                            <span className="version-number">v{v.version}</span>
                                            <span className="version-title">{v.title}</span>
                                            <span className="version-date">
                                                {new Date(v.createdAt).toLocaleString('zh-CN')}
                                            </span>
                                            {v.changeNote && (
                                                <span className="version-note">{v.changeNote}</span>
                                            )}
                                        </div>
                                        <div className="version-actions">
                                            <button
                                                className="btn btn-sm"
                                                onClick={() => previewVersion(v.id)}
                                            >
                                                预览
                                            </button>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleRollback(v.id)}
                                            >
                                                回滚
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 版本预览弹窗 */}
            {showVersionPreview && selectedVersion && (
                <div className="version-modal-overlay" onClick={() => setShowVersionPreview(false)}>
                    <div className="version-modal version-preview" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>版本 {selectedVersion.version} 预览</h2>
                            <button className="modal-close" onClick={() => setShowVersionPreview(false)}>×</button>
                        </div>
                        <div className="preview-content">
                            <div className="preview-meta">
                                <p><strong>标题:</strong> {selectedVersion.title}</p>
                                <p><strong>状态:</strong> {selectedVersion.published ? '已发布' : '草稿'}</p>
                                <p><strong>保存时间:</strong> {new Date(selectedVersion.createdAt).toLocaleString('zh-CN')}</p>
                            </div>
                            <div className="preview-body">
                                <h4>内容预览:</h4>
                                <pre>{selectedVersion.content.substring(0, 500)}...</pre>
                            </div>
                        </div>
                        <div className="preview-actions">
                            <button className="btn btn-secondary" onClick={() => setShowVersionPreview(false)}>
                                关闭
                            </button>
                            <button className="btn btn-primary" onClick={applyVersionToEditor}>
                                应用到编辑器
                            </button>
                            <button className="btn btn-primary" onClick={() => handleRollback(selectedVersion.id)}>
                                回滚到此版本
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PostEditor
