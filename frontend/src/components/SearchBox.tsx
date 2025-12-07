import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './SearchBox.css'

interface SearchResult {
    id: number
    title: string
    slug: string
    excerpt: string | null
    tags: { id: number; name: string; slug: string }[]
    matchType: 'title' | 'tag' | 'content'
    matchSnippet: string
    matchKeyword: string
}

// 高亮关键词工具函数
function highlightKeyword(text: string, keyword: string): React.ReactNode {
    if (!keyword.trim() || !text) return text

    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
        regex.test(part) ? (
            <mark key={index} className="highlight-keyword">{part}</mark>
        ) : (
            part
        )
    )
}

// 匹配类型标签文案
const matchTypeLabels: Record<string, string> = {
    title: '标题',
    tag: '标签',
    content: '内容'
}

function SearchBox() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const searchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const resultsRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    // 搜索防抖
    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            setSelectedIndex(-1)
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`)
                const data = await res.json()
                setResults(data)
                setSelectedIndex(-1)
            } catch (error) {
                console.error('搜索失败:', error)
            }
            setLoading(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // 滚动选中项到可视区域
    const scrollToSelected = useCallback((index: number) => {
        if (resultsRef.current && index >= 0) {
            const items = resultsRef.current.querySelectorAll('.search-result-item')
            if (items[index]) {
                items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            }
        }
    }, [])

    // 键盘快捷键
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + K 打开搜索
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(true)
                inputRef.current?.focus()
            }
            // ESC 关闭
            if (e.key === 'Escape') {
                setIsOpen(false)
                setQuery('')
                setSelectedIndex(-1)
            }

            // 搜索框打开时的导航快捷键
            if (isOpen && results.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    const newIndex = selectedIndex < results.length - 1 ? selectedIndex + 1 : 0
                    setSelectedIndex(newIndex)
                    scrollToSelected(newIndex)
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : results.length - 1
                    setSelectedIndex(newIndex)
                    scrollToSelected(newIndex)
                }
                if (e.key === 'Enter' && selectedIndex >= 0) {
                    e.preventDefault()
                    handleResultClick(results[selectedIndex].slug)
                }
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, results, selectedIndex, scrollToSelected])

    const handleResultClick = (slug: string) => {
        setIsOpen(false)
        setQuery('')
        setSelectedIndex(-1)
        navigate(`/post/${slug}`)
    }

    return (
        <div className="search-box" ref={searchRef}>
            <button
                className="search-trigger hover-trigger"
                onClick={() => {
                    setIsOpen(true)
                    setTimeout(() => inputRef.current?.focus(), 100)
                }}
            >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="search-shortcut">Ctrl+K</span>
            </button>

            {isOpen && (
                <div className="search-modal">
                    <div className="search-input-wrapper">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            className="search-input"
                            placeholder="搜索文章..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button className="search-close" onClick={() => setIsOpen(false)}>
                            ESC
                        </button>
                    </div>

                    <div className="search-results" ref={resultsRef}>
                        {loading && (
                            <div className="search-loading">// 搜索中...</div>
                        )}

                        {!loading && query && results.length === 0 && (
                            <div className="search-empty">// 未找到相关文章</div>
                        )}

                        {!loading && results.map((result, index) => (
                            <div
                                key={result.id}
                                className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                                onClick={() => handleResultClick(result.slug)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="result-header">
                                    <span className={`match-type-badge match-type-${result.matchType}`}>
                                        {matchTypeLabels[result.matchType]}
                                    </span>
                                </div>
                                <h4 className="result-title">
                                    {highlightKeyword(result.title, result.matchKeyword)}
                                </h4>
                                {result.matchSnippet && (
                                    <p className="result-excerpt">
                                        {highlightKeyword(result.matchSnippet.slice(0, 120), result.matchKeyword)}
                                    </p>
                                )}
                                {result.tags.length > 0 && (
                                    <div className="result-tags">
                                        {result.tags.slice(0, 3).map(tag => (
                                            <span key={tag.id} className="result-tag">
                                                #{highlightKeyword(tag.name, result.matchKeyword)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {!query && (
                            <div className="search-hint">
                                <p>// 输入关键词搜索文章</p>
                                <p className="hint-tip">提示：支持搜索标题、内容和标签</p>
                                <div className="hint-shortcuts">
                                    <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
                                    <span><kbd>Enter</kbd> 跳转</span>
                                    <span><kbd>ESC</kbd> 关闭</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SearchBox

