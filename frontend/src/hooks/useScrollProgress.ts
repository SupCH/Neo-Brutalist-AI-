import { useEffect, useState } from 'react'

export function useScrollProgress() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY
            const docHeight = document.documentElement.scrollHeight - window.innerHeight

            if (docHeight <= 0) {
                setProgress(0)
                return
            }

            const scrollProgress = Math.min(scrollTop / docHeight, 1)
            setProgress(scrollProgress)
        }

        // 初始化
        handleScroll()

        window.addEventListener('scroll', handleScroll, { passive: true })
        window.addEventListener('resize', handleScroll, { passive: true })

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', handleScroll)
        }
    }, [])

    return progress
}
