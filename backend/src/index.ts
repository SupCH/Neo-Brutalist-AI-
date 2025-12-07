import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import routes from './routes/index.js'
import helmet from 'helmet'
import { startScheduler } from './utils/scheduler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// 信任代理（用于正确获取客户端 IP，解决 Vite 代理的 X-Forwarded-For 问题）
app.set('trust proxy', 1)

// Neo-Brutalist ASCII Art Banner
const BANNER = `
╔══════════════════════════════════════════════════════════╗
║  ██████╗ ███████╗██╗   ██╗   ██╗      ██████╗  ██████╗   ║
║  ██╔══██╗██╔════╝██║   ██║   ██║     ██╔═══██╗██╔════╝   ║
║  ██║  ██║█████╗  ██║   ██║   ██║     ██║   ██║██║  ███╗  ║
║  ██║  ██║██╔══╝  ╚██╗ ██╔╝   ██║     ██║   ██║██║   ██║  ║
║  ██████╔╝███████╗ ╚████╔╝    ███████╗╚██████╔╝╚██████╔╝  ║
║  ╚═════╝ ╚══════╝  ╚═══╝     ╚══════╝ ╚═════╝  ╚═════╝   ║
╠══════════════════════════════════════════════════════════╣
║  >> NEO-BRUTALIST BLOG API                               ║
║  >> STATUS: ONLINE                                       ║
║  >> STYLE: BREAK THE RULES                               ║
╚══════════════════════════════════════════════════════════╝
`

// 中间件
app.use(helmet({
    contentSecurityPolicy: false, // 暂时关闭 CSP 以免影响前端静态资源加载
    crossOriginResourcePolicy: { policy: "cross-origin" } // 允许跨域加载资源（图片等）
}))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务（上传的图片）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 生产环境：托管前端静态文件
// 检查 frontend/dist 是否存在
const frontendDist = path.join(__dirname, '../../frontend/dist')
app.use(express.static(frontendDist))

// API 路由
app.use('/api', routes)


// 健康检查 - Cyber Style
app.get('/health', (req, res) => {
    res.json({
        system: 'DEV.LOG API',
        status: 'OPERATIONAL',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        message: '// ALL SYSTEMS NOMINAL'
    })
})

// 错误处理中间件 - Brutalist Error Messages
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('// ERROR:', err)

    const status = err.status || 500
    const errorMessages: Record<number, string> = {
        400: '// BAD REQUEST: Invalid data packet',
        401: '// ACCESS DENIED: Authentication required',
        403: '// FORBIDDEN: Insufficient clearance level',
        404: '// NOT FOUND: Resource does not exist in database',
        500: '// SYSTEM ERROR: Internal malfunction detected'
    }

    res.status(status).json({
        error: true,
        code: status,
        message: errorMessages[status] || '// UNKNOWN ERROR',
        details: err.message || null,
        timestamp: new Date().toISOString()
    })
})

// SPA 路由回退处理（必须在 API 路由之后，错误处理之前）
// 任何未被 API 捕获的请求都返回 index.html
app.get('*', (req, res, next) => {
    // 如果请求的是 API 或 uploads 但没找到，应该进入错误处理，而不是返回 index.html
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next()
    }

    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
        if (err) {
            // 如果找不到 index.html（可能是开发环境或未构建），则返回 404 JSON
            next()
        }
    })
})

// 404 处理 (API)
app.use((req: express.Request, res: express.Response) => {
    res.status(404).json({
        error: true,
        code: 404,
        message: '// ENDPOINT NOT FOUND',
        path: req.path,
        suggestion: 'Check /api for available endpoints'
    })
})

// 启动服务器
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(BANNER)
        console.log(`  >> Server running at http://localhost:${PORT}`)
        console.log(`  >> API Docs: http://localhost:${PORT}/api`)
        console.log(`  >> Health Check: http://localhost:${PORT}/health`)
        console.log('')

        // 启动AI社区定时任务调度器
        startScheduler()
    })
}

export default app
