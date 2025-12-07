import { useEffect, useState, useCallback } from 'react'

// Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A
const KONAMI_CODE = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'KeyB',
    'KeyA'
]

export function useKonamiCode(callback?: () => void) {
    const [isActivated, setIsActivated] = useState(false)
    const [progress, setProgress] = useState(0)

    const reset = useCallback(() => {
        setIsActivated(false)
        setProgress(0)
    }, [])

    useEffect(() => {
        let inputSequence: string[] = []
        let timeout: ReturnType<typeof setTimeout>

        const handleKeyDown = (e: KeyboardEvent) => {
            // 忽略在输入框中的按键
            if (e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement) {
                return
            }

            // 清除之前的超时
            clearTimeout(timeout)

            // 添加按键到序列
            inputSequence.push(e.code)

            // 只保留最近的按键（和 Konami Code 长度一致）
            if (inputSequence.length > KONAMI_CODE.length) {
                inputSequence = inputSequence.slice(-KONAMI_CODE.length)
            }

            // 检查是否匹配 Konami Code
            let matchCount = 0
            for (let i = 0; i < inputSequence.length; i++) {
                if (inputSequence[i] === KONAMI_CODE[i]) {
                    matchCount++
                } else {
                    // 不匹配时重置
                    inputSequence = []
                    setProgress(0)
                    return
                }
            }

            // 更新进度
            setProgress(matchCount)

            // 完全匹配！
            if (matchCount === KONAMI_CODE.length) {
                setIsActivated(true)
                inputSequence = []
                callback?.()
            }

            // 3秒无输入则重置
            timeout = setTimeout(() => {
                inputSequence = []
                setProgress(0)
            }, 3000)
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            clearTimeout(timeout)
        }
    }, [callback])

    return { isActivated, progress, totalKeys: KONAMI_CODE.length, reset }
}
