import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const user = await prisma.user.update({
        where: { id: 1 },
        data: { password: hashedPassword },
        select: { id: true, email: true, name: true }
    })

    console.log('✅ 密码已重置!')
    console.log('用户:', user.name)
    console.log('邮箱:', user.email)
    console.log('UID:', user.id)
    console.log('新密码: admin123')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
