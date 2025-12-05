import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, verifyEmail } from '../services/api'
import './Login.css'

function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Forgot Password State
    const [showForgotModal, setShowForgotModal] = useState(false)
    const [forgotEmail, setForgotEmail] = useState('')
    const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')
    const [verifyMessage, setVerifyMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await login(email, password)
            localStorage.setItem('token', result.token)
            localStorage.setItem('user', JSON.stringify(result.user))
            navigate('/admin')
        } catch (err) {
            setError('// ACCESS DENIED: 身份验证失败')
            window.scrollTo(0, 0)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        setVerifyStatus('verifying')
        setVerifyMessage('')

        try {
            await verifyEmail(forgotEmail)
            setVerifyStatus('success')
            setVerifyMessage('// EMAIL VERIFIED: 邮箱存在')
        } catch (err) {
            setVerifyStatus('error')
            setVerifyMessage('// USER NOT FOUND: 邮箱不存在')
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                {/* Terminal Header */}
                <div className="terminal-header">
                    <div className="terminal-dots">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                    </div>
                    <span className="terminal-title">access_control.exe</span>
                </div>

                <div className="login-content">
                    <h1 className="login-title">
                        <span className="title-prefix">&gt;_</span> 系统登录
                    </h1>
                    <p className="login-desc">请输入您的访问凭证</p>

                    {error && <div className="login-error">{error}</div>}

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">UID 或 邮箱</label>
                            <input
                                type="text"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">访问密钥</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '隐藏' : '显示'}
                                </button>
                            </div>
                        </div>

                        <div className="form-footer">
                            <button
                                type="button"
                                className="forgot-password-link"
                                onClick={() => setShowForgotModal(true)}
                            >
                                忘记密码？
                            </button>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? '验证中...' : '请求访问'}
                        </button>
                    </form>

                    <div className="auth-switch">
                        没有账户？ <Link to="/register" className="auth-link hover-trigger">立即注册</Link>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="terminal-header">
                            <span className="terminal-title">password_recovery.exe</span>
                            <button className="close-btn" onClick={() => setShowForgotModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <h2>找回密码</h2>
                            <p>请输入注册邮箱进行验证</p>

                            <form onSubmit={handleVerifyEmail}>
                                <div className="form-group">
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Enter email address..."
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                {verifyMessage && (
                                    <div className={`verify-message ${verifyStatus}`}>
                                        {verifyMessage}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    className="login-btn"
                                    disabled={verifyStatus === 'verifying'}
                                >
                                    {verifyStatus === 'verifying' ? '验证中...' : '验证邮箱'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Login
