import { Outlet } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Header from './Header'
import Footer from './Footer'
import KonamiEffect from './KonamiEffect'
import ScrollProgressBar from './ScrollProgressBar'
import './Layout.css'

interface LayoutProps {
    isAdmin?: boolean
}

function Layout({ isAdmin = false }: LayoutProps) {
    const cursorDotRef = useRef<HTMLDivElement>(null)
    const cursorOutlineRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // 在触摸设备上禁用自定义光标
        const isTouchDevice = window.matchMedia("(pointer: coarse)").matches
        if (isTouchDevice) return

        const cursorDot = cursorDotRef.current
        const cursorOutline = cursorOutlineRef.current
        if (!cursorDot || !cursorOutline) return

        const handleMouseMove = (e: MouseEvent) => {
            const posX = e.clientX
            const posY = e.clientY

            // Dot follows immediately
            cursorDot.style.left = `${posX}px`
            cursorDot.style.top = `${posY}px`

            // Outline follows with animation
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" })
        }

        const handleMouseEnter = () => {
            cursorOutline?.classList.add('hovered')
        }

        const handleMouseLeave = () => {
            cursorOutline?.classList.remove('hovered')
        }

        window.addEventListener('mousemove', handleMouseMove)

        // Add hover effect to interactive elements
        const hoverTriggers = document.querySelectorAll('.hover-trigger, a, button')
        hoverTriggers.forEach(trigger => {
            trigger.addEventListener('mouseenter', handleMouseEnter)
            trigger.addEventListener('mouseleave', handleMouseLeave)
        })

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            hoverTriggers.forEach(trigger => {
                trigger.removeEventListener('mouseenter', handleMouseEnter)
                trigger.removeEventListener('mouseleave', handleMouseLeave)
            })
        }
    }, [])

    return (
        <div className={`layout ${isAdmin ? 'layout-admin' : ''}`}>
            {/* Custom Cursor */}
            <div className="cursor-dot" ref={cursorDotRef}></div>
            <div className="cursor-outline" ref={cursorOutlineRef}></div>

            {/* Konami Code Easter Egg */}
            <KonamiEffect />

            {/* Scroll Progress Bar */}
            <ScrollProgressBar />

            {/* Marquee Banner */}
            <div className="marquee-banner">
                <div className="marquee-container">
                    <div className="marquee-content">
                        // CODE IS POETRY // BREAK THE RULES // DESIGN WITH SOUL // WELCOME TO MY MIND PALACE // 保持饥渴 保持愚蠢 // SYSTEM READY //&nbsp;
                    // CODE IS POETRY // BREAK THE RULES // DESIGN WITH SOUL // WELCOME TO MY MIND PALACE // 保持饥渴 保持愚蠢 // SYSTEM READY //&nbsp;
                    </div>
                </div>
            </div>

            <Header isAdmin={isAdmin} />

            <main className="main-content">
                <div className="container">
                    <Outlet />
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Layout
