import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUserProfile, updateProfile, uploadAvatar, uploadProfileBg, getCurrentUser, changePassword, logout } from '../services/api'
import NotFound from './NotFound'
import './UserProfile.css'

interface PostTag {
    name: string
    slug: string
}

interface UserPost {
    id: number
    title: string
    slug: string
    excerpt?: string
    coverImage?: string
    createdAt: string
    tags: PostTag[]
}

interface UserProfileData {
    id: number
    name: string
    avatar?: string
    bio?: string
    profileBg?: string
    createdAt: string
    posts: UserPost[]
    comments: Array<{
        id: number
        content: string
        createdAt: string
        post: {
            id: number
            title: string
            slug: string
        }
    }>
    _count: {
        comments: number
        posts: number
    }
}

function UserProfile() {
    const { id } = useParams<{ id: string }>()
    const [user, setUser] = useState<UserProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [isOwner, setIsOwner] = useState(false)
    const [viewMode, setViewMode] = useState<'owner' | 'visitor'>('owner')
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState('')
    const [editBio, setEditBio] = useState('')
    const [saving, setSaving] = useState(false)

    // 密码修改状态
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [passwordSaving, setPasswordSaving] = useState(false)

    const avatarInputRef = useRef<HTMLInputElement>(null)
    const bgInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchUser = async () => {
            if (!id) return
            try {
                const data = await getUserProfile(parseInt(id))
                setUser(data)
                setEditName(data.name)
                setEditBio(data.bio || '')

                // 检查是否是主页所有者
                const currentUser = getCurrentUser()
                if (currentUser && currentUser.id === parseInt(id)) {
                    setIsOwner(true)
                }
            } catch (error) {
                console.error('获取用户信息失败:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [id])

    const handleSaveProfile = async () => {
        if (!editName.trim()) return
        setSaving(true)
        try {
            const result = await updateProfile({ name: editName, bio: editBio })
            setUser(prev => prev ? { ...prev, name: result.user.name, bio: result.user.bio } : null)
            setIsEditing(false)
        } catch (error) {
            console.error('保存失败:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const result = await uploadAvatar(file)
            setUser(prev => prev ? { ...prev, avatar: result.avatar } : null)
        } catch (error) {
            console.error('上传头像失败:', error)
        }
    }

    const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const result = await uploadProfileBg(file)
            setUser(prev => prev ? { ...prev, profileBg: result.profileBg } : null)
        } catch (error) {
            console.error('上传背景失败:', error)
        }
    }

    const handleChangePassword = async () => {
        setPasswordError('')

        if (!oldPassword || !newPassword || !confirmPassword) {
            setPasswordError('请填写所有密码字段')
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('两次输入的新密码不一致')
            return
        }

        if (newPassword.length < 6) {
            setPasswordError('新密码至少6个字符')
            return
        }

        if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
            setPasswordError('新密码必须包含字母和数字')
            return
        }

        setPasswordSaving(true)
        try {
            await changePassword(oldPassword, newPassword, confirmPassword)
            setShowPasswordModal(false)
            setOldPassword('')
            setNewPassword('')
            setConfirmPassword('')
            alert('密码修改成功！请重新登录')
            logout()
        } catch (error: any) {
            console.error('密码修改失败:', error)
            // 尝试获取后端返回的具体错误信息
            const errorMessage = error.response?.data?.details || error.response?.data?.message || error.message || '服务暂不可用'
            setPasswordError(errorMessage)
        } finally {
            setPasswordSaving(false)
        }
    }

    const showOwnerControls = isOwner && viewMode === 'owner'

    if (loading) {
        return (
            <div className="user-profile">
                <div className="skeleton-wrapper">
                    <div className="skeleton skeleton-avatar"></div>
                    <div className="skeleton skeleton-name"></div>
                    <div className="skeleton skeleton-bio"></div>
                </div>
            </div>
        )
    }

    if (!user) {
        return <NotFound />
    }

    const joinDate = new Date(user.createdAt).toLocaleDateString('en-CA')

    return (
        <div className="user-profile">
            {/* Owner Controls */}
            {isOwner && (
                <div className="owner-controls">
                    <button
                        className={`view-toggle ${viewMode === 'owner' ? 'active' : ''}`}
                        onClick={() => setViewMode('owner')}
                    >
                        本人视角
                    </button>
                    <button
                        className={`view-toggle ${viewMode === 'visitor' ? 'active' : ''}`}
                        onClick={() => setViewMode('visitor')}
                    >
                        访客视角
                    </button>
                </div>
            )}

            {/* User Header with Background */}
            <header
                className="profile-header"
                style={user.profileBg ? { backgroundImage: `url(${user.profileBg})` } : undefined}
            >
                {showOwnerControls && (
                    <button
                        className="change-bg-btn"
                        onClick={() => bgInputRef.current?.click()}
                    >
                        更换背景
                    </button>
                )}
                <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleBgUpload}
                />

                <div className="profile-avatar-wrapper">
                    <div className="profile-avatar">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                        ) : (
                            <span className="avatar-placeholder">{user.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    {showOwnerControls && (
                        <button
                            className="change-avatar-btn"
                            onClick={() => avatarInputRef.current?.click()}
                        >
                            更换
                        </button>
                    )}
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleAvatarUpload}
                    />
                </div>

                {isEditing ? (
                    <div className="edit-form">
                        <input
                            type="text"
                            className="edit-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="用户名"
                        />
                        <textarea
                            className="edit-textarea"
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            placeholder="个人简介"
                            rows={3}
                        />
                        <div className="edit-actions">
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveProfile}
                                disabled={saving}
                            >
                                {saving ? '保存中...' : '保存'}
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setIsEditing(false)
                                    setEditName(user.name)
                                    setEditBio(user.bio || '')
                                }}
                            >
                                取消
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h1 className="profile-name">
                            {user.name} <span className="uid-badge">UID:{user.id}</span>
                        </h1>
                        {user.bio && <p className="profile-bio">{user.bio}</p>}
                        {showOwnerControls && (
                            <div className="profile-actions">
                                <button
                                    className="edit-profile-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    编辑资料
                                </button>
                                <button
                                    className="change-password-btn"
                                    onClick={() => setShowPasswordModal(true)}
                                >
                                    修改密码
                                </button>
                            </div>
                        )}
                    </>
                )}

                <div className="profile-meta">
                    <span className="meta-item">
                        <span className="meta-label">加入于</span>
                        <span className="meta-value">{joinDate}</span>
                    </span>
                    <span className="meta-divider">//</span>
                    <span className="meta-item">
                        <span className="meta-label">文章</span>
                        <span className="meta-value">{user._count.posts}</span>
                    </span>
                    <span className="meta-divider">//</span>
                    <span className="meta-item">
                        <span className="meta-label">评论</span>
                        <span className="meta-value">{user._count.comments}</span>
                    </span>
                </div>
            </header>

            {/* Recent Articles */}
            <section className="profile-section">
                <h2 className="section-title">
                    <span className="title-bracket">[</span>
                    最近文章
                    <span className="title-bracket">]</span>
                </h2>

                {user.posts.length === 0 ? (
                    <p className="no-posts">// 暂无文章</p>
                ) : (
                    <div className="posts-grid">
                        {user.posts.map(post => (
                            <Link key={post.id} to={`/post/${post.slug}`} className="post-card">
                                {post.coverImage && (
                                    <div className="post-cover">
                                        <img src={post.coverImage} alt={post.title} />
                                    </div>
                                )}
                                <div className="post-content">
                                    <h3 className="post-title">{post.title}</h3>
                                    {post.excerpt && (
                                        <p className="post-excerpt">{post.excerpt}</p>
                                    )}
                                    <div className="post-meta">
                                        <span className="post-date">
                                            {new Date(post.createdAt).toLocaleDateString('en-CA')}
                                        </span>
                                        {post.tags.length > 0 && (
                                            <div className="post-tags">
                                                {post.tags.slice(0, 3).map(tag => (
                                                    <span key={tag.slug} className="post-tag">
                                                        #{tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Recent Comments */}
            <section className="profile-section comments-section">
                <h2 className="section-title">
                    <span className="title-bracket">[</span>
                    最近评论
                    <span className="title-bracket">]</span>
                </h2>

                {user.comments.length === 0 ? (
                    <p className="no-comments">// 暂无评论</p>
                ) : (
                    <div className="comments-list">
                        {user.comments.map(comment => (
                            <div key={comment.id} className="comment-card">
                                <Link to={`/post/${comment.post.slug}`} className="comment-post-title">
                                    {comment.post.title}
                                </Link>
                                <p className="comment-content">{comment.content}</p>
                                <span className="comment-date">
                                    {new Date(comment.createdAt).toLocaleDateString('en-CA')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="password-modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="password-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">
                            <span className="title-bracket">[</span>
                            修改密码
                            <span className="title-bracket">]</span>
                        </h3>

                        {passwordError && (
                            <div className="password-error">
                                // ERROR: {passwordError}
                            </div>
                        )}

                        <div className="password-form">
                            <div className="form-group">
                                <label className="form-label">原密码</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="请输入原密码"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">新密码</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="至少6位，包含字母和数字"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">确认新密码</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="再次输入新密码"
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleChangePassword}
                                    disabled={passwordSaving}
                                >
                                    {passwordSaving ? '修改中...' : '确认修改'}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowPasswordModal(false)
                                        setOldPassword('')
                                        setNewPassword('')
                                        setConfirmPassword('')
                                        setPasswordError('')
                                    }}
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserProfile
