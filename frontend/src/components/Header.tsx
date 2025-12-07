import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isAuthenticated, getCurrentUser, logout } from '../services/api'
import SearchBox from './SearchBox'
import './Header.css'

interface HeaderProps {
    isAdmin?: boolean
}

function Header({ isAdmin = false }: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [location])

    useEffect(() => {
        // Check auth state
        if (isAuthenticated()) {
            setUser(getCurrentUser())
        } else {
            setUser(null)
        }
    }, [location])

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isMobileMenuOpen])

    const handleLogout = () => {
        logout()
        setUser(null)
        navigate('/')
    }

    // 管理后台导航链接
    const adminLinks = [
        { to: '/admin', label: '仪表盘' },
        { to: '/admin/posts', label: '文章管理' },
    ]

    // 超级管理员才能看到评论管理和用户管理
    if (user?.role === 'SUPER_ADMIN') {
        adminLinks.push({ to: '/admin/comments', label: '评论管理' })
        adminLinks.push({ to: '/admin/users', label: '用户管理' })
    }



    const navLinks = isAdmin
        ? adminLinks
        : [
            { to: '/', label: '主页' },
            { to: '/ai-community', label: 'AI社区' },
            { to: '/tags', label: '标签' },
            { to: '/about', label: '关于' },
        ]

    return (
        <>
            <header className="header">
                <div className="header-container">
                    {/* Logo */}
                    <div className="logo-group">
                        <Link to={isAdmin ? '/admin' : '/'} className="logo hover-trigger">
                            {isAdmin ? 'ADMIN.LOG' : 'DEV.LOG'}
                        </Link>
                        {isAdmin && (
                            <Link to="/" className="home-btn hover-trigger" title="返回主页">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </Link>
                        )}
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="nav-desktop">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`nav-link hover-trigger ${location.pathname === link.to ? 'nav-link-active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Search Box - 只在前台显示 */}
                        {!isAdmin && <SearchBox />}

                        {/* Auth Buttons */}
                        {!isAdmin && (
                            user ? (
                                <div className="auth-buttons">
                                    <Link to={`/user/${user.userId}`} className="nav-btn nav-btn-profile hover-trigger">
                                        我的主页
                                    </Link>
                                    <Link to="/admin" className="nav-btn nav-btn-admin hover-trigger">
                                        控制台
                                    </Link>
                                    <button onClick={handleLogout} className="nav-btn nav-btn-logout hover-trigger">
                                        登出
                                    </button>
                                </div>
                            ) : (
                                <div className="auth-buttons">
                                    <Link to="/login" className="nav-btn nav-btn-login hover-trigger">
                                        登录
                                    </Link>
                                    <Link to="/register" className="nav-btn nav-btn-register hover-trigger">
                                        注册
                                    </Link>
                                </div>
                            )
                        )}

                        {isAdmin && user && (
                            <button onClick={handleLogout} className="nav-btn nav-btn-logout hover-trigger">
                                登出
                            </button>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn hover-trigger"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="切换菜单"
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Mobile Full-screen Menu */}
            <div className={`mobile-menu ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
                <button
                    className="mobile-menu-close hover-trigger"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="关闭菜单"
                >
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                        <line x1="6" y1="6" x2="18" y2="18" />
                        <line x1="6" y1="18" x2="18" y2="6" />
                    </svg>
                </button>

                <nav className="mobile-nav">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="mobile-nav-link"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {/* Mobile Auth Links */}
                    {!isAdmin && (
                        user ? (
                            <>
                                <Link
                                    to={`/user/${user.id}`}
                                    className="mobile-nav-link mobile-nav-profile"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    我的主页
                                </Link>
                                <Link
                                    to="/admin"
                                    className="mobile-nav-link mobile-nav-admin"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    控制台
                                </Link>
                                <button
                                    className="mobile-nav-link mobile-nav-logout"
                                    onClick={() => {
                                        setIsMobileMenuOpen(false)
                                        handleLogout()
                                    }}
                                >
                                    登出
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="mobile-nav-link"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    登录
                                </Link>
                                <Link
                                    to="/register"
                                    className="mobile-nav-link mobile-nav-register"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    注册
                                </Link>
                            </>
                        )
                    )}

                    {isAdmin && user && (
                        <button
                            className="mobile-nav-link mobile-nav-logout"
                            onClick={() => {
                                setIsMobileMenuOpen(false)
                                handleLogout()
                            }}
                        >
                            登出
                        </button>
                    )}
                </nav>
            </div>
        </>
    )
}

export default Header
