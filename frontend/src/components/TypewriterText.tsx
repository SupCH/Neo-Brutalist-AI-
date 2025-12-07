import { useTypewriter } from '../hooks/useTypewriter'
import './TypewriterText.css'

interface TypewriterTextProps {
    text: string
    speed?: number
    delay?: number
    cursor?: boolean
    className?: string
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
    onComplete?: () => void
}

function TypewriterText({
    text,
    speed = 50,
    delay = 300,
    cursor = true,
    className = '',
    as: Tag = 'span',
    onComplete
}: TypewriterTextProps) {
    const { displayedText, isTyping, showCursor } = useTypewriter({
        text,
        speed,
        delay,
        cursor,
        onComplete
    })

    return (
        <Tag className={`typewriter-text ${className}`}>
            {displayedText}
            {showCursor && (
                <span className={`typewriter-cursor ${isTyping ? 'typing' : 'blinking'}`}>
                    |
                </span>
            )}
        </Tag>
    )
}

export default TypewriterText
