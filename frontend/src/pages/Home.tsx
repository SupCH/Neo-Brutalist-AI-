import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PostCard, { Post } from '../components/PostCard'
import { getPosts, getRandomPost } from '../services/api'
import './Home.css'

// 多国语言的"你好"
const greetings = [
    { text: 'HELLO, WORLD.', size: 'normal' },       // 英语
    { text: '你好，世界。', size: 'normal' },          // 中文
    { text: 'こんにちは、世界。', size: 'small' },      // 日语（较长，需要缩小）
    { text: '안녕하세요, 세계.', size: 'small' },      // 韩语
    { text: 'BONJOUR, LE MONDE.', size: 'small' },   // 法语
    { text: 'HOLA, MUNDO.', size: 'normal' },        // 西班牙语
    { text: 'HALLO, WELT.', size: 'normal' },        // 德语
    { text: 'CIAO, MONDO.', size: 'normal' },        // 意大利语
    { text: 'ПРИВЕТ, МИР.', size: 'small' },        // 俄语
    { text: 'OLÁ, MUNDO.', size: 'normal' },         // 葡萄牙语
]

// 页面加载时随机选择一个
const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]

function Home() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [greeting] = useState(randomGreeting)
    const [randomLoading, setRandomLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await getPosts(1)
                setPosts(response.data)
                setHasMore(response.meta.page < response.meta.totalPages)
            } catch (error) {
                console.error('获取文章失败:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchPosts()
    }, [])

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return
        setLoadingMore(true)
        try {
            const nextPage = page + 1
            const response = await getPosts(nextPage)
            setPosts(prev => [...prev, ...response.data])
            setPage(nextPage)
            setHasMore(response.meta.page < response.meta.totalPages)
        } catch (error) {
            console.error('加载更多文章失败:', error)
        } finally {
            setLoadingMore(false)
        }
    }

    const handleRandomPost = async () => {
        setRandomLoading(true)
        try {
            const { slug } = await getRandomPost()
            navigate(`/post/${slug}`)
        } catch (error) {
            console.error('随机漫游失败:', error)
            // 如果失败（比如没有文章），跳转到404页面体验一下
            navigate('/404-random-error')
        } finally {
            setRandomLoading(false)
        }
    }

    const currentGreeting = greeting.text
    const greetingClass = greeting.size === 'small' ? 'greeting-small' : ''

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-main">
                    {/* Developer Badge */}
                    <div className="hero-badge">
                        # FULLSTACK DEVELOPER
                    </div>

                    {/* Glitch Title */}
                    <h1 className={`hero-title glitch-wrapper ${greetingClass}`}>
                        <span className="glitch-text" data-text={currentGreeting}>{currentGreeting}</span>
                        <span className="hero-subtitle-name">
                            我是 <span className="hero-name">极客阿宅</span>
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="hero-desc">
                        这里没有极简主义。<br />
                        这里只有代码、混乱的想法和<span className="highlight">绝对的真实</span>。
                    </p>

                    {/* CTA Buttons */}
                    <div className="hero-buttons">
                        <button
                            onClick={handleRandomPost}
                            className="btn btn-primary hover-trigger"
                            disabled={randomLoading}
                        >
                            {randomLoading ? (
                                '传送中...'
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                                        <path d="M2 12h20M2 12l4-4m-4 4l4 4" />
                                        <path d="M22 4v16" />
                                    </svg>
                                    随机漫游
                                </>
                            )}
                        </button>
                        <a href="https://github.com/SupCH/Neo-Brutalist-AI-" target="_blank" rel="noopener noreferrer" className="btn btn-secondary hover-trigger">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                            </svg>
                            GITHUB
                        </a>
                    </div>
                </div>

                {/* Avatar */}
                <div className="hero-avatar">
                    <div className="avatar-bg"></div>
                    <div className="avatar-frame">
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="avatar-svg">
                            <rect width="100%" height="100%" fill="#f0f0f0" />
                            {/* Pixel face */}
                            <rect x="50" y="50" width="100" height="100" fill="#ffcc00" stroke="#1a1a1a" strokeWidth="4" />
                            {/* Sunglasses */}
                            <rect x="40" y="80" width="120" height="30" fill="#1a1a1a" />
                            <rect x="50" y="85" width="20" height="10" fill="#ff00ff" />
                            <rect x="130" y="85" width="20" height="10" fill="#00ffff" />
                            {/* Smile */}
                            <path d="M 70 120 Q 100 140 130 120" stroke="#1a1a1a" strokeWidth="4" fill="none" />
                            {/* Decorations */}
                            <circle cx="160" cy="40" r="10" fill="#ff3333" stroke="#1a1a1a" strokeWidth="3" />
                            <path d="M 20 160 L 40 180 M 20 180 L 40 160" stroke="#1a1a1a" strokeWidth="4" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <hr className="section-divider" />

            {/* Articles Section */}
            <section className="articles-section">
                <div className="section-header">
                    <h2 className="section-title">最近想法</h2>
                    <Link to="/tags" className="section-link hover-trigger">查看归档 →</Link>
                </div>

                {loading ? (
                    <div className="posts-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="post-skeleton">
                                <div className="skeleton skeleton-header"></div>
                                <div className="skeleton skeleton-title"></div>
                                <div className="skeleton skeleton-text"></div>
                                <div className="skeleton skeleton-text short"></div>
                            </div>
                        ))}
                    </div>
                ) : posts.length > 0 ? (
                    <>
                        <div className="posts-grid">
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="load-more-container" style={{ textAlign: 'center', marginTop: '2rem' }}>
                                <button
                                    className="btn btn-secondary hover-trigger"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    style={{ width: '100%', maxWidth: '300px', padding: '1rem', border: '3px solid black', fontWeight: 'bold' }}
                                >
                                    {loadingMore ? '加载数据包...' : 'LOAD MORE DATA'}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <p>// 暂无数据，敬请期待...</p>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Home
