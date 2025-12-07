import { useEffect, useRef, useState, useCallback } from 'react'
import './BreakoutGame.css'

interface Ball {
    x: number
    y: number
    dx: number
    dy: number
    radius: number
}

interface Paddle {
    x: number
    width: number
    height: number
}

interface Brick {
    x: number
    y: number
    width: number
    height: number
    visible: boolean
    color: string
}

const COLORS = ['#ff6b6b', '#ffe66d', '#4ecdc4', '#a8d8ea', '#ff6b6b', '#aa96da']

function BreakoutGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle')
    const [score, setScore] = useState(0)
    const animationRef = useRef<number>()

    // 游戏状态引用，避免闭包问题
    const ballRef = useRef<Ball>({ x: 0, y: 0, dx: 4, dy: -4, radius: 8 })
    const paddleRef = useRef<Paddle>({ x: 0, width: 80, height: 12 })
    const bricksRef = useRef<Brick[]>([])
    const scoreRef = useRef(0)

    const initGame = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const width = canvas.width
        const height = canvas.height

        // 初始化球
        ballRef.current = {
            x: width / 2,
            y: height - 50,
            dx: 4 * (Math.random() > 0.5 ? 1 : -1),
            dy: -4,
            radius: 8
        }

        // 初始化挡板
        paddleRef.current = {
            x: width / 2 - 40,
            width: 80,
            height: 12
        }

        // 初始化砖块
        const brickRows = 4
        const brickCols = 8
        const brickWidth = (width - 40) / brickCols
        const brickHeight = 20
        const bricks: Brick[] = []

        for (let row = 0; row < brickRows; row++) {
            for (let col = 0; col < brickCols; col++) {
                bricks.push({
                    x: 20 + col * brickWidth,
                    y: 30 + row * (brickHeight + 5),
                    width: brickWidth - 4,
                    height: brickHeight,
                    visible: true,
                    color: COLORS[row % COLORS.length]
                })
            }
        }
        bricksRef.current = bricks
        scoreRef.current = 0
        setScore(0)
    }, [])

    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height
        const ball = ballRef.current
        const paddle = paddleRef.current
        const bricks = bricksRef.current

        // 清空画布
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, width, height)

        // 绘制边框
        ctx.strokeStyle = '#4ecdc4'
        ctx.lineWidth = 3
        ctx.strokeRect(2, 2, width - 4, height - 4)

        // 更新球位置
        ball.x += ball.dx
        ball.y += ball.dy

        // 墙壁碰撞
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= width) {
            ball.dx = -ball.dx
        }
        if (ball.y - ball.radius <= 0) {
            ball.dy = -ball.dy
        }

        // 挡板碰撞
        if (
            ball.y + ball.radius >= height - paddle.height - 10 &&
            ball.x >= paddle.x &&
            ball.x <= paddle.x + paddle.width
        ) {
            ball.dy = -Math.abs(ball.dy)
            // 根据击中位置调整角度
            const hitPos = (ball.x - paddle.x) / paddle.width
            ball.dx = (hitPos - 0.5) * 8
        }

        // 砖块碰撞
        bricks.forEach(brick => {
            if (!brick.visible) return

            if (
                ball.x + ball.radius > brick.x &&
                ball.x - ball.radius < brick.x + brick.width &&
                ball.y + ball.radius > brick.y &&
                ball.y - ball.radius < brick.y + brick.height
            ) {
                brick.visible = false
                ball.dy = -ball.dy
                scoreRef.current += 10
                setScore(scoreRef.current)
            }
        })

        // 检查胜利
        const remainingBricks = bricks.filter(b => b.visible).length
        if (remainingBricks === 0) {
            setGameState('won')
            return
        }

        // 检查失败
        if (ball.y + ball.radius >= height) {
            setGameState('lost')
            return
        }

        // 绘制砖块
        bricks.forEach(brick => {
            if (!brick.visible) return
            ctx.fillStyle = brick.color
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
            ctx.strokeStyle = '#000'
            ctx.lineWidth = 2
            ctx.strokeRect(brick.x, brick.y, brick.width, brick.height)
        })

        // 绘制挡板
        ctx.fillStyle = '#fff'
        ctx.fillRect(paddle.x, height - paddle.height - 10, paddle.width, paddle.height)
        ctx.strokeStyle = '#4ecdc4'
        ctx.lineWidth = 2
        ctx.strokeRect(paddle.x, height - paddle.height - 10, paddle.width, paddle.height)

        // 绘制球
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
        ctx.fillStyle = '#ff6b6b'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()

        animationRef.current = requestAnimationFrame(gameLoop)
    }, [])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        paddleRef.current.x = Math.max(0, Math.min(canvas.width - paddleRef.current.width, x - paddleRef.current.width / 2))
    }, [])

    const handleTouchMove = useCallback((e: TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas || !e.touches[0]) return

        const rect = canvas.getBoundingClientRect()
        const x = e.touches[0].clientX - rect.left
        paddleRef.current.x = Math.max(0, Math.min(canvas.width - paddleRef.current.width, x - paddleRef.current.width / 2))
    }, [])

    const startGame = useCallback(() => {
        initGame()
        setGameState('playing')
    }, [initGame])

    useEffect(() => {
        if (gameState === 'playing') {
            animationRef.current = requestAnimationFrame(gameLoop)
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('touchmove', handleTouchMove)
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('touchmove', handleTouchMove)
        }
    }, [gameState, gameLoop, handleMouseMove, handleTouchMove])

    return (
        <div className="breakout-game">
            <div className="game-header">
                <span className="game-title">🎮 BREAKOUT 404</span>
                <span className="game-score">SCORE: {score}</span>
            </div>

            <div className="game-canvas-container">
                <canvas
                    ref={canvasRef}
                    width={360}
                    height={280}
                    className="game-canvas"
                />

                {gameState === 'idle' && (
                    <div className="game-overlay">
                        <p>无聊吗？来玩打砖块吧！</p>
                        <button className="game-btn" onClick={startGame}>
                            开始游戏
                        </button>
                    </div>
                )}

                {gameState === 'won' && (
                    <div className="game-overlay won">
                        <p>🎉 你赢了！</p>
                        <p className="final-score">得分: {score}</p>
                        <button className="game-btn" onClick={startGame}>
                            再来一局
                        </button>
                    </div>
                )}

                {gameState === 'lost' && (
                    <div className="game-overlay lost">
                        <p>💀 游戏结束</p>
                        <p className="final-score">得分: {score}</p>
                        <button className="game-btn" onClick={startGame}>
                            重新开始
                        </button>
                    </div>
                )}
            </div>

            <p className="game-hint">// 用鼠标或触屏控制挡板</p>
        </div>
    )
}

export default BreakoutGame
