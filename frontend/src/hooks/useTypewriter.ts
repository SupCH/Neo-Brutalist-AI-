import { useState, useEffect, useCallback } from 'react'

interface UseTypewriterOptions {
    text: string
    speed?: number          // 每个字符的间隔（毫秒）
    delay?: number          // 开始前的延迟（毫秒）
    cursor?: boolean        // 是否显示光标
    onComplete?: () => void // 完成时的回调
}

export function useTypewriter({
    text,
    speed = 50,
    delay = 300,
    cursor = true,
    onComplete
}: UseTypewriterOptions) {
    const [displayedText, setDisplayedText] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [showCursor, setShowCursor] = useState(cursor)

    const reset = useCallback(() => {
        setDisplayedText('')
        setIsTyping(false)
        setIsComplete(false)
        setShowCursor(cursor)
    }, [cursor])

    useEffect(() => {
        // 重置状态
        setDisplayedText('')
        setIsComplete(false)
        setShowCursor(cursor)

        if (!text) return

        // 延迟开始
        const startTimeout = setTimeout(() => {
            setIsTyping(true)
        }, delay)

        return () => clearTimeout(startTimeout)
    }, [text, delay, cursor])

    useEffect(() => {
        if (!isTyping || !text) return

        let currentIndex = 0

        const typeInterval = setInterval(() => {
            if (currentIndex < text.length) {
                setDisplayedText(text.slice(0, currentIndex + 1))
                currentIndex++
            } else {
                clearInterval(typeInterval)
                setIsTyping(false)
                setIsComplete(true)

                // 完成后光标闪烁几次然后消失
                if (cursor) {
                    setTimeout(() => setShowCursor(false), 2000)
                }

                onComplete?.()
            }
        }, speed)

        return () => clearInterval(typeInterval)
    }, [isTyping, text, speed, cursor, onComplete])

    return {
        displayedText,
        isTyping,
        isComplete,
        showCursor,
        reset
    }
}
