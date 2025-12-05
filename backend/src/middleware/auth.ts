import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'

// 角色类型
type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

export interface AuthRequest extends Request {
    userId?: number
    userRole?: Role
}

// 基础认证中间件
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: '// ACCESS DENIED: 未授权访问' })
        }

        const token = authHeader.substring(7)
        const secret = process.env.JWT_SECRET || 'default-secret'

        const decoded = jwt.verify(token, secret) as { userId: number }

        // 获取用户信息和角色
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true }
        })

        if (!user) {
            return res.status(401).json({ error: '// USER NOT FOUND: 用户不存在' })
        }

        req.userId = user.id
        req.userRole = user.role as Role

        next()
    } catch (error) {
        return res.status(401).json({ error: '// TOKEN INVALID: Token 无效或已过期' })
    }
}

// 角色验证中间件工厂函数
export const requireRole = (...allowedRoles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.userRole) {
            return res.status(401).json({ error: '// ACCESS DENIED: 未认证' })
        }

        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({
                error: '// FORBIDDEN: 权限不足',
                required: allowedRoles,
                current: req.userRole
            })
        }

        next()
    }
}

// 快捷中间件
export const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN')
export const requireSuperAdmin = requireRole('SUPER_ADMIN')
