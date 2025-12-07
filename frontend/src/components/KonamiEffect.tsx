import { useEffect, useState, useCallback } from 'react'
import { useKonamiCode } from '../hooks/useKonamiCode'
import './KonamiEffect.css'

interface Particle {
    id: number
    x: number
    y: number
    vx: number
    vy: number
    color: string
    size: number
    rotation: number
    rotationSpeed: number
    shape: 'square' | 'circle' | 'triangle' | 'star'
}

const COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3', '#a8d8ea']
const SHAPES: Particle['shape'][] = ['square', 'circle', 'triangle', 'star']

function KonamiEffect() {
    const [showEffect, setShowEffect] = useState(false)
    const [particles, setParticles] = useState<Particle[]>([])
    const [showMessage, setShowMessage] = useState(false)

    const triggerEffect = useCallback(() => {
        setShowEffect(true)
        setShowMessage(true)

        // 创建粒子
        const newParticles: Particle[] = []
        for (let i = 0; i < 150; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * window.innerWidth,
                y: -20 - Math.random() * 100,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * 3 + 2,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: Math.random() * 12 + 6,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                shape: SHAPES[Math.floor(Math.random() * SHAPES.length)]
            })
        }
        setParticles(newParticles)

        // 播放音效（可选）
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5
            oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.3) // C6

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.5)
        } catch (e) {
            // 音频可能被浏览器阻止
        }
    }, [])

    const { progress, totalKeys, reset } = useKonamiCode(triggerEffect)

    // 粒子动画
    useEffect(() => {
        if (!showEffect || particles.length === 0) return

        const interval = setInterval(() => {
            setParticles(prev => {
                const updated = prev.map(p => ({
                    ...p,
                    x: p.x + p.vx,
                    y: p.y + p.vy,
                    vy: p.vy + 0.15, // 重力
                    rotation: p.rotation + p.rotationSpeed
                })).filter(p => p.y < window.innerHeight + 50)

                if (updated.length === 0) {
                    setShowEffect(false)
                }
                return updated
            })
        }, 16)

        return () => clearInterval(interval)
    }, [showEffect, particles.length])

    // 隐藏消息
    useEffect(() => {
        if (showMessage) {
            const timer = setTimeout(() => {
                setShowMessage(false)
                reset()
            }, 4000)
            return () => clearTimeout(timer)
        }
    }, [showMessage, reset])

    const renderShape = (particle: Particle) => {
        const style: React.CSSProperties = {
            position: 'absolute',
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            transform: `rotate(${particle.rotation}deg)`,
            backgroundColor: particle.shape !== 'triangle' && particle.shape !== 'star' ? particle.color : 'transparent',
            borderRadius: particle.shape === 'circle' ? '50%' : '0',
            pointerEvents: 'none',
        }

        if (particle.shape === 'triangle') {
            return (
                <div
                    key={particle.id}
                    style={{
                        ...style,
                        width: 0,
                        height: 0,
                        backgroundColor: 'transparent',
                        borderLeft: `${particle.size / 2}px solid transparent`,
                        borderRight: `${particle.size / 2}px solid transparent`,
                        borderBottom: `${particle.size}px solid ${particle.color}`,
                    }}
                />
            )
        }

        if (particle.shape === 'star') {
            return (
                <div
                    key={particle.id}
                    className="konami-star"
                    style={{
                        ...style,
                        '--star-color': particle.color,
                    } as React.CSSProperties}
                />
            )
        }

        return <div key={particle.id} style={style} />
    }

    return (
        <>
            {/* 输入进度提示（可选） */}
            {progress > 0 && progress < totalKeys && (
                <div className="konami-progress">
                    <div className="konami-progress-bar">
                        <div
                            className="konami-progress-fill"
                            style={{ width: `${(progress / totalKeys) * 100}%` }}
                        />
                    </div>
                    <span className="konami-progress-text">🎮 {progress}/{totalKeys}</span>
                </div>
            )}

            {/* 特效层 */}
            {showEffect && (
                <div className="konami-overlay">
                    {particles.map(renderShape)}
                </div>
            )}

            {/* 成功消息 */}
            {showMessage && (
                <div className="konami-message">
                    <div className="konami-message-content">
                        <span className="konami-icon">🎮</span>
                        <span className="konami-title">KONAMI CODE ACTIVATED!</span>
                        <span className="konami-subtitle">+30 LIVES • DEVELOPER MODE UNLOCKED</span>
                    </div>
                </div>
            )}
        </>
    )
}

export default KonamiEffect
