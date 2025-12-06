import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAdminPost, createPost, updatePost, getTags, createTag, deleteTag, getPostVersions, getPostVersion, rollbackPostVersion, generateTags } from '../../services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
// import { marked } from 'marked'
// import katex from 'katex'
import 'katex/dist/katex.min.css'
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

interface VersionDetail {
    id: number
    version: number
    title: string
    content: string
    excerpt: string | null
    coverImage: string | null
    published: boolean
    isPublic: boolean
    changeNote: string | null
    createdAt: string
    editorId?: number | null // Optional as it might be missing in detail view
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
    const [generatingTags, setGeneratingTags] = useState(false)
    const [suggestedNewTags, setSuggestedNewTags] = useState<string[]>([])
    const [selectedVersion, setSelectedVersion] = useState<VersionDetail | null>(null)
    const [showVersionPreview, setShowVersionPreview] = useState(false)

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

    // 删除标签
    const handleDeleteTag = async (e: React.MouseEvent, tagId: number) => {
        e.stopPropagation() // 防止触发选择
        if (!confirm('确定要删除这个标签吗？这将影响所有使用该标签的文章！')) {
            return
        }

        try {
            await deleteTag(tagId)
            setAllTags(prev => prev.filter(t => t.id !== tagId))
            setSelectedTags(prev => prev.filter(id => id !== tagId))
        } catch (error) {
            console.error('删除标签失败:', error)
            alert('删除标签失败')
        }
    }

    const handleGenerateTags = async () => {
        if (!title && !content) {
            alert('请先填写文章标题或内容')
            return
        }

        setGeneratingTags(true)
        setSuggestedNewTags([])

        try {
            const result = await generateTags(title, content)

            // Debug Log
            console.log('AI Response:', result)

            // 自动选中已存在的标签
            const matchedTagIds = allTags
                .filter(tag => result.existingMatches.some(
                    name => name.toLowerCase() === tag.name.toLowerCase()
                ))
                .map(tag => tag.id)

            if (matchedTagIds.length > 0) {
                setSelectedTags(prev => {
                    const unique = new Set([...prev, ...matchedTagIds])
                    return Array.from(unique)
                })
            }

            // 处理新建议的标签
            if (result.newSuggestions && result.newSuggestions.length > 0) {
                setSuggestedNewTags(result.newSuggestions)
            }

            // Show summary message
            const newTagCount = result.newSuggestions?.length || 0
            const matchedCount = matchedTagIds.length

            let msg = 'AI 标签分析完成！'
            if (matchedCount > 0) {
                msg += `\n✅ 自动选中了 ${matchedCount} 个现有标签`
            }

            if (newTagCount > 0) {
                msg += `\n🆕 发现 ${newTagCount} 个新标签：${result.newSuggestions.join(', ')}\n(请在下方"建议新标签"区域点击添加)`
            } else if (matchedCount === 0) {
                msg += `\n(生成的标签可能不匹配现有标签库，请检查建议列表)`
            }
            alert(msg)

        } catch (error) {
            console.error('生成标签失败:', error)
            alert('生成标签失败：' + (error instanceof Error ? error.message : '未知错误'))
        } finally {
            setGeneratingTags(false)
        }
    }

    // 快速创建建议的新标签
    const handleCreateSuggestedTag = async (tagName: string) => {
        try {
            const newTag = await createTag(tagName)
            setAllTags(prev => [...prev, newTag])
            setSelectedTags(prev => [...prev, newTag.id])
            setSuggestedNewTags(prev => prev.filter(t => t !== tagName))
        } catch (error) {
            console.error('创建标签失败:', error)
        }
    }

    // Version Control Functions
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

    const applyVersionToEditor = () => {
        if (!selectedVersion) return

        setTitle(selectedVersion.title)
        setContent(selectedVersion.content)
        setExcerpt(selectedVersion.excerpt || '')
        setCoverImage(selectedVersion.coverImage || '')
        setPublished(false) // Restored version is draft by default
        setShowVersionPreview(false)
        setHasUnsavedChanges(true)
    }

    const handleRollback = async (versionId: number) => {
        if (!id) return
        if (!confirm('确定要回滚到此版本吗？当前内容将被保存为新版本。')) return

        try {
            const result = await rollbackPostVersion(parseInt(id), versionId)
            alert(result.message)
            fetchPost() // Reload post
            setShowVersionHistory(false)
            setShowVersionPreview(false)
        } catch (error) {
            console.error('回滚失败:', error)
            alert('回滚失败')
        }
    }

    // 手动保存草稿
    const handleManualSave = () => {
        setAutoSaveStatus('saving')
        saveDraft()
    }

    // 格式化保存时间
    const formatSaveTime = (date: Date) => {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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

    if (loading) {
        return (
            <div className="post-editor-container">
                <div className="loading-state">加载中...</div>
            </div>
        )
    }

    return (
        <div className="post-editor-container">
            <div className="editor-header">
                <h2 className="editor-title">
                    <span className="title-prefix">{isEditing ? '编辑' : '新建'}</span>
                    文章
                </h2>
            </div>

            {/* 草稿恢复提示 */}
            {showDraftPrompt && (
                <div className="draft-prompt">
                    <div className="draft-info">
                        <strong>发现未保存的草稿</strong>
                        <span className="draft-time">
                            保存时间: {draftData && formatSaveTime(new Date(draftData.savedAt))}
                        </span>
                    </div>
                    <div className="draft-actions">
                        <button
                            className="btn-primary btn-sm"
                            onClick={() => draftData && applyDraft(draftData)}
                        >
                            恢复草稿
                        </button>
                        <button
                            className="btn-secondary btn-sm"
                            onClick={clearDraft}
                        >
                            丢弃
                        </button>
                    </div>
                </div>
            )}

            {/* 版本历史模态框 */}
            {showVersionHistory && (
                <div className="modal-overlay" onClick={() => setShowVersionHistory(false)}>
                    <div className="modal-content version-history-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>版本历史</h3>
                            <button className="close-btn" onClick={() => setShowVersionHistory(false)}>×</button>
                        </div>
                        <div className="version-list">
                            {loadingVersions ? (
                                <div className="loading">加载中...</div>
                            ) : versions.length === 0 ? (
                                <div className="empty">暂无历史版本</div>
                            ) : (
                                versions.map(v => (
                                    <div key={v.id} className="version-item">
                                        <div className="version-info">
                                            <span className="version-number">v{v.version}</span>
                                            <span className="version-time">{new Date(v.createdAt).toLocaleString()}</span>
                                            {v.changeNote && <div className="version-note">{v.changeNote}</div>}
                                        </div>
                                        <div className="version-actions">
                                            <button
                                                className="btn-sm"
                                                onClick={() => previewVersion(v.version)}
                                            >
                                                预览
                                            </button>
                                            <button
                                                className="btn-sm btn-primary"
                                                onClick={() => handleRollback(v.version)}
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

            {/* 版本预览模态框 */}
            {showVersionPreview && selectedVersion && (
                <div className="modal-overlay" onClick={() => setShowVersionPreview(false)}>
                    <div className="modal-content version-preview-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>预览版本 v{selectedVersion.version}</h3>
                            <div className="preview-actions">
                                <button
                                    className="btn-primary"
                                    onClick={applyVersionToEditor}
                                >
                                    应用此版本
                                </button>
                                <button className="close-btn" onClick={() => setShowVersionPreview(false)}>×</button>
                            </div>
                        </div>
                        <div className="version-preview-content">
                            <h4>{selectedVersion.title}</h4>
                            <div className="markdown-preview">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                >
                                    {selectedVersion.content || ''}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="editor-form">
                <div className="editor-main">
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="文章标题"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className="title-input"
                        />
                    </div>

                    <div className="form-group">
                        <div className="slug-input-group">
                            <span className="slug-prefix">/posts/</span>
                            <input
                                type="text"
                                placeholder="url-slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="slug-input"
                            />
                        </div>
                    </div>

                    <div className="content-editor-container split">
                        <div className="editor-pane">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="开始写作... (支持 Markdown 和 LaTeX)"
                                className="content-textarea"
                            />
                        </div>
                        <div className="preview-pane">
                            <div className="markdown-preview">
                                {content ? (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {content}
                                    </ReactMarkdown>
                                ) : (
                                    <div className="preview-placeholder">预览区域</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="editor-sidebar">
                    <div className="sidebar-card">
                        <h3>发布设置</h3>
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={published}
                                    onChange={(e) => setPublished(e.target.checked)}
                                />
                                立即发布
                            </label>
                        </div>
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                />
                                公开可见
                            </label>
                        </div>
                    </div>

                    <div className="sidebar-card">
                        <h3>文章摘要</h3>
                        <textarea
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder="简短的摘要..."
                            rows={4}
                            className="sidebar-textarea"
                        />
                    </div>

                    <div className="sidebar-card">
                        <h3>封面图片</h3>
                        <div className="form-group">
                            <input
                                type="text"
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                        {coverImage && (
                            <div className="cover-preview">
                                <img src={coverImage} alt="Cover preview" />
                            </div>
                        )}
                    </div>

                    <div className="sidebar-card">
                        <h3>标签</h3>
                        <button
                            type="button"
                            className="ai-tag-btn"
                            onClick={handleGenerateTags}
                            disabled={generatingTags}
                        >
                            {generatingTags ? '✨ 分析中...' : '✨ AI 智能标签'}
                        </button>

                        <div className="tags-selector">
                            {allTags.map(tag => (
                                <div key={tag.id} className="tag-item-container">
                                    <button
                                        type="button"
                                        className={`tag-option hover-trigger ${selectedTags.includes(tag.id) ? 'tag-selected' : ''}`}
                                        onClick={() => handleTagToggle(tag.id)}
                                    >
                                        {tag.name}
                                    </button>
                                    <span
                                        className="tag-delete-badge"
                                        onClick={(e) => handleDeleteTag(e, tag.id)}
                                        title="删除标签"
                                    >
                                        ×
                                    </span>
                                </div>
                            ))}
                        </div>

                        {suggestedNewTags.length > 0 && (
                            <div className="suggested-tags-area">
                                <h4>建议新标签:</h4>
                                <div className="tags-selector">
                                    {suggestedNewTags.map(tagName => (
                                        <button
                                            key={tagName}
                                            type="button"
                                            className="tag-option tag-suggested"
                                            onClick={() => handleCreateSuggestedTag(tagName)}
                                            title="点击创建并选中"
                                        >
                                            + {tagName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="new-tag-input" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="新建标签"
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                            />
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCreateTag}
                                disabled={creatingTag || !newTagName.trim()}
                            >
                                {creatingTag ? '...' : '+'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="editor-footer">
                <div className="footer-status">
                    {autoSaveStatus === 'saving' && <span className="status saving">正在保存...</span>}
                    {autoSaveStatus === 'saved' && <span className="status saved">已保存 {lastSaved && formatSaveTime(lastSaved)}</span>}
                    {autoSaveStatus === 'error' && <span className="status error">保存失败</span>}
                </div>

                <div className="editor-actions">
                    <button type="button" className="btn-secondary btn-sm" onClick={handleManualSave}>
                        保存草稿
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={loadVersionHistory}
                        >
                            历史版本
                        </button>
                    )}

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => navigate('/admin/posts')}
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={saving}
                        onClick={handleSubmit}
                    >
                        {saving ? '保存中...' : (isEditing ? '更新文章' : '发布文章')}
                    </button>
                </div>
            </div>
        </div >
    )
}

export default PostEditor
