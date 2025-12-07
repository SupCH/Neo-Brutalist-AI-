import { useScrollProgress } from '../hooks/useScrollProgress'
import './ScrollProgressBar.css'

function ScrollProgressBar() {
    const progress = useScrollProgress()

    // 只在有滚动内容时显示
    if (progress === 0 && window.scrollY === 0) {
        // 检查页面是否可滚动
        const isScrollable = document.documentElement.scrollHeight > window.innerHeight
        if (!isScrollable) return null
    }

    return (
        <>
            {/* 顶部进度条 */}
            <div className="scroll-progress-container">
                <div
                    className="scroll-progress-bar"
                    style={{
                        transform: `scaleX(${progress})`,
                    }}
                />
                <div
                    className="scroll-progress-glow"
                    style={{
                        left: `${progress * 100}%`,
                        opacity: progress > 0 ? 1 : 0
                    }}
                />
            </div>

            {/* 右侧边缘发光效果 */}
            <div className="scroll-edge-glow">
                <div
                    className="scroll-edge-indicator"
                    style={{
                        top: `${progress * 100}%`,
                    }}
                />
                <div
                    className="scroll-edge-trail"
                    style={{
                        height: `${progress * 100}%`,
                    }}
                />
            </div>

            {/* 进度百分比（可选显示） */}
            {progress > 0.05 && (
                <div className="scroll-progress-percent">
                    {Math.round(progress * 100)}%
                </div>
            )}
        </>
    )
}

export default ScrollProgressBar
