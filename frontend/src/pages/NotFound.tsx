import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import BreakoutGame from '../components/BreakoutGame'
import './NotFound.css'

function NotFound() {
    const [glitchText, setGlitchText] = useState('404')
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const cursorDotRef = useRef<HTMLDivElement>(null)
    const cursorOutlineRef = useRef<HTMLDivElement>(null)

    // 随机glitch效果
    useEffect(() => {
        const chars = '!@#$%^&*()_+{}|:<>?404ERR0R'
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const glitched = '404'.split('').map(char =>
                    Math.random() > 0.5 ? chars[Math.floor(Math.random() * chars.length)] : char
                ).join('')
                setGlitchText(glitched)
                setTimeout(() => setGlitchText('404'), 100)
            }
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    // 鼠标跟踪 + 自定义光标
    useEffect(() => {
        const isTouchDevice = window.matchMedia("(pointer: coarse)").matches
        if (isTouchDevice) return

        const cursorDot = cursorDotRef.current
        const cursorOutline = cursorOutlineRef.current

        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY })

            if (cursorDot && cursorOutline) {
                cursorDot.style.left = `${e.clientX}px`
                cursorDot.style.top = `${e.clientY}px`
                cursorOutline.animate({
                    left: `${e.clientX}px`,
                    top: `${e.clientY}px`
                }, { duration: 500, fill: "forwards" })
            }
        }

        const handleMouseEnter = () => cursorOutline?.classList.add('hovered')
        const handleMouseLeave = () => cursorOutline?.classList.remove('hovered')

        window.addEventListener('mousemove', handleMouseMove)

        const hoverTriggers = document.querySelectorAll('.hover-trigger, a, button')
        hoverTriggers.forEach(trigger => {
            trigger.addEventListener('mouseenter', handleMouseEnter)
            trigger.addEventListener('mouseleave', handleMouseLeave)
        })

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            const hoverTriggers = document.querySelectorAll('.hover-trigger, a, button')
            hoverTriggers.forEach(trigger => {
                trigger.removeEventListener('mouseenter', handleMouseEnter)
                trigger.removeEventListener('mouseleave', handleMouseLeave)
            })
        }
    }, [])

    const eyeStyle = (offsetX: number) => {
        const eyeX = (mousePos.x / window.innerWidth - 0.5) * 10 + offsetX
        const eyeY = (mousePos.y / window.innerHeight - 0.5) * 10
        return { transform: `translate(${eyeX}px, ${eyeY}px)` }
    }

    return (
        <div className="not-found-page">
            {/* Custom Cursor */}
            <div className="cursor-dot" ref={cursorDotRef}></div>
            <div className="cursor-outline" ref={cursorOutlineRef}></div>

            {/* 背景装饰 */}
            <div className="bg-text">ERROR</div>
            <div className="bg-text bg-text-2">LOST</div>

            {/* 主要内容 */}
            <div className="error-container">
                {/* 大眼睛404 */}
                <div className="error-face">
                    <div className="error-code">
                        <span className="digit">4</span>
                        <div className="eye-socket">
                            <div className="eye">
                                <div className="pupil" style={eyeStyle(0)}></div>
                            </div>
                        </div>
                        <span className="digit">4</span>
                    </div>
                </div>

                {/* 错误信息 */}
                <div className="error-message">
                    <h1 className="glitch-title" data-text={glitchText}>
                        {glitchText}
                    </h1>
                    <p className="error-desc">
                        // <span className="highlight">页面未找到</span><br />
                        // 你迷失在数字丛林中了<br />
                        // 这里什么都没有，除了虚空
                    </p>
                </div>

                {/* 终端风格信息 */}
                <div className="terminal-box">
                    <div className="terminal-header">
                        <span className="terminal-dot red"></span>
                        <span className="terminal-dot yellow"></span>
                        <span className="terminal-dot green"></span>
                        <span className="terminal-title">system_error.log</span>
                    </div>
                    <div className="terminal-content">
                        <p><span className="prompt">$</span> locate requested_page</p>
                        <p className="error-line">ERROR: Resource not found in /dev/null</p>
                        <p><span className="prompt">$</span> cat /var/log/excuses</p>
                        <p className="info-line">"Maybe the page is on vacation ¯\_(ツ)_/¯"</p>
                        <p><span className="prompt">$</span> <span className="cursor-blink">_</span></p>
                    </div>
                </div>

                {/* 返回按钮 */}
                <div className="action-buttons">
                    <Link to="/" className="btn btn-primary hover-trigger">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        返回主页
                    </Link>
                    <button
                        className="btn btn-secondary hover-trigger"
                        onClick={() => window.history.back()}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        返回上页
                    </button>
                </div>

                {/* Breakout Game Easter Egg */}
                <BreakoutGame />

                {/* 彩蛋提示 */}
                <p className="easter-egg">
                    // 提示：尝试点击眼睛看看会发生什么 👀
                </p>
            </div>

            {/* 浮动装饰 */}
            <div className="floating-elements">
                <span className="float-item">?</span>
                <span className="float-item">!</span>
                <span className="float-item">404</span>
                <span className="float-item">NULL</span>
                <span className="float-item">???</span>
            </div>
        </div>
    )
}

export default NotFound
