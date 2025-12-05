import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'

export const authController = {
    // 用户登录 - Neo-Brutalist Style
    // 支持使用邮箱或UID登录
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body
            console.log('Login attempt:', { email, passwordReceived: !!password })

            if (!email || !password) {
                console.log('Missing credentials')
                return res.status(400).json({
                    error: true,
                    message: '// 凭证缺失',
                    details: '必须提供邮箱/UID和密码'
                })
            }

            // 判断是UID还是邮箱登录
            // Modify regex to handle potential string inputs for ID better or debug it
            const isUid = /^\d+$/.test(email)
            console.log('isUid:', isUid)
            let user

            if (isUid) {
                // 使用UID登录
                const uid = parseInt(email)
                console.log('Searching by UID:', uid)
                user = await prisma.user.findUnique({
                    where: { id: uid }
                })
            } else {
                // 使用邮箱登录
                console.log('Searching by Email:', email)
                user = await prisma.user.findUnique({
                    where: { email }
                })
            }

            console.log('User found:', user ? { id: user.id, email: user.email } : 'Not found')

            if (!user) {
                return res.status(401).json({
                    error: true,
                    message: '// 访问拒绝',
                    details: '认证失败 - 用户不存在'
                })
            }

            const isValidPassword = await bcrypt.compare(password, user.password)
            console.log('Password valid:', isValidPassword)

            if (!isValidPassword) {
                return res.status(401).json({
                    error: true,
                    message: '// 访问拒绝',
                    details: '认证失败 - 密码错误'
                })
            }

            const secret = process.env.JWT_SECRET || 'default-secret'
            const token = jwt.sign(
                { userId: user.id },
                secret,
                { expiresIn: '7d' }
            )

            res.json({
                success: true,
                message: '// 验证通过',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar: user.avatar,
                    role: user.role
                },
                expiresIn: '7 days'
            })
        } catch (error) {
            console.error('// LOGIN ERROR:', error)
            res.status(500).json({
                error: true,
                message: '// 系统故障',
                details: '认证服务暂时不可用'
            })
        }
    },

    // 用户注册
    async register(req: Request, res: Response) {
        try {
            const { name, email, password } = req.body

            if (!name || !email || !password) {
                return res.status(400).json({
                    error: true,
                    message: '// 数据缺失',
                    details: '昵称、邮箱和密码为必填项'
                })
            }

            if (password.length < 6) {
                return res.status(400).json({
                    error: true,
                    message: '// 密码太弱',
                    details: '密码长度至少需6位'
                })
            }

            // 检查邮箱是否已存在
            const existingUser = await prisma.user.findUnique({
                where: { email }
            })

            if (existingUser) {
                return res.status(400).json({
                    error: true,
                    message: '// 用户已存在',
                    details: '该邮箱已被注册'
                })
            }

            // 检查用户名是否已存在
            const existingName = await prisma.user.findUnique({
                where: { name }
            })

            if (existingName) {
                return res.status(400).json({
                    error: true,
                    message: '// 昵称已存在',
                    details: '该昵称已被占用，请换一个'
                })
            }

            // 加密密码
            const hashedPassword = await bcrypt.hash(password, 10)

            // 创建用户
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword
                }
            })

            // 生成 token
            const secret = process.env.JWT_SECRET || 'default-secret'
            const token = jwt.sign(
                { userId: user.id },
                secret,
                { expiresIn: '7d' }
            )

            res.status(201).json({
                success: true,
                message: '// 用户已创建',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar: user.avatar
                }
            })
        } catch (error) {
            console.error('// REGISTER ERROR DETAILS:', error)
            if (error instanceof Error) {
                console.error('Error message:', error.message)
                console.error('Error stack:', error.stack)
            }
            res.status(500).json({
                error: true,
                message: '// 系统故障',
                details: error instanceof Error ? error.message : '未知的注册错误'
            })
        }
    },

    // 验证邮箱是否存在
    async verifyEmail(req: Request, res: Response) {
        try {
            const { email } = req.body

            if (!email) {
                return res.status(400).json({
                    error: true,
                    message: '// 邮箱缺失',
                    details: '必须提供邮箱地址'
                })
            }

            const user = await prisma.user.findUnique({
                where: { email }
            })

            if (!user) {
                return res.status(404).json({
                    error: true,
                    message: '// 用户未找到',
                    details: '该邮箱尚未注册'
                })
            }

            res.json({
                success: true,
                message: '// 邮箱已验证',
                details: '该邮箱已存在于系统中'
            })
        } catch (error) {
            console.error('// VERIFY ERROR:', error)
            res.status(500).json({
                error: true,
                message: '// 系统故障',
                details: '验证服务暂时不可用'
            })
        }
    },

    async debugAuth(req: Request, res: Response) {
        try {
            const email = 'admin@example.com';
            const password = 'admin123';

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res.json({ result: 'User not found in DB', attempting: email });
            }

            const isValid = await bcrypt.compare(password, user.password);

            res.json({
                result: isValid ? 'SUCCESS' : 'FAILURE',
                user: { id: user.id, email: user.email, hashPrefix: user.password.substring(0, 10) },
                attempting: { email, password }
            });
        } catch (e: any) {
            res.json({ error: e.message });
        }
    }
}
