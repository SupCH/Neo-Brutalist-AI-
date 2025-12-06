import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding posts for pagination...')

    // Get admin user
    const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } })
    if (!admin) {
        console.error('Admin user not found')
        return
    }

    const posts = []
    for (let i = 1; i <= 25; i++) {
        posts.push({
            title: `Pagination Test Post ${i}`,
            slug: `pagination-test-post-${i}-${Date.now()}`,
            content: `This is test post number ${i} content.`,
            excerpt: `Excerpt for post ${i}`,
            published: true,
            isPublic: true,
            authorId: admin.id
        })
    }

    for (const post of posts) {
        await prisma.post.create({ data: post })
    }

    console.log('✅ Created 25 test posts.')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
