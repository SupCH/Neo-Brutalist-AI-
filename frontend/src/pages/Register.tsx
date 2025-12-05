import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/api'
import './Login.css'

function Register() {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError('// ERROR: 两次输入的密码不一致')
            window.scrollTo(0, 0)
            return
        }

        // 前端预校验密码规则
        if (password.length < 6) {
            setError('// ERROR: 密码至少需要 6 个字符')
            window.scrollTo(0, 0)
            return
        }

        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
            setError('// ERROR: 密码必须同时包含字母和数字（如 abc123）')
            window.scrollTo(0, 0)
            return
        }

        // 前端预校验用户名
        if (name.length < 2 || name.length > 30) {
            setError('// ERROR: 用户名长度应为 2-30 个字符')
            window.scrollTo(0, 0)
            return
        }

        if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(name)) {
            setError('// ERROR: 用户名只能包含中文、字母、数字和下划线')
            window.scrollTo(0, 0)
            return
        }

        setLoading(true)
        setError('')

        try {
            const result = await register(name, email, password)
            localStorage.setItem('token', result.token)
            localStorage.setItem('user', JSON.stringify(result.user))
            navigate('/admin')
        } catch (err: any) {
            console.error('Registration error full object:', err)

            let errorMessage = '// REGISTRATION FAILED: 注册失败'

            if (err.response) {
                // Backend returned an error response
                const status = err.response.status
                const data = err.response.data

                console.log('Error response status:', status)
                console.log('Error response data:', data)

                if (data?.details) {
                    // Handle both array details and string details
                    errorMessage = `// ERROR (${status}): ${Array.isArray(data.details) ? data.details.map((d: any) => d.message).join('; ') : data.details}`
                } else if (data?.message) {
                    errorMessage = `// ERROR (${status}): ${data.message}`
                } else {
                    errorMessage = `// ERROR (${status}): Server returned error without details`
                }
            } else if (err.request) {
                // Request was made but no response received
                errorMessage = '// NETWORK ERROR: 无法连接到服务器'
            } else {
                // Something happened in setting up the request
                errorMessage = `// CLIENT ERROR: ${err.message}`
            }

            setError(errorMessage)
            window.scrollTo(0, 0)
        } finally {
            setLoading(false)
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
                    <span className="terminal-title">new_user.exe</span>
                </div>

                <div className="login-content">
                    <h1 className="login-title">
                        <span className="title-prefix">&gt;_</span> 创建账户
                    </h1>
                    <p className="login-desc">加入 DEV.LOG 社区</p>

                    {error && <div className="login-error">{error}</div>}

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">用户名称</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Neo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">电子邮件</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="neo@matrix.com"
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
                                    placeholder="••••••••"
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

                        <div className="form-group">
                            <label className="form-label">确认密钥</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? '隐藏' : '显示'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? '创建中...' : '创建账户'}
                        </button>
                    </form>

                    <div className="auth-switch">
                        已有账户？ <Link to="/login" className="auth-link hover-trigger">立即登录</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register
