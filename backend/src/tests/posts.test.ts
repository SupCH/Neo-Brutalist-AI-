import request from 'supertest'
import app from '../index.js'
import { resetDb } from './utils.js'

describe('Post API', () => {
    beforeAll(async () => {
        await resetDb()
    })

    afterAll(async () => {
        await resetDb()
    })

    it('should return posts list', async () => {
        const res = await request(app).get('/api/posts')
        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body.data)).toBe(true)
        expect(res.body.meta).toBeDefined()
    })

    it('should create a new post via admin endpoint', async () => {
        // Register
        const regRes = await request(app).post('/api/auth/register').send({
            name: 'PostAuthor',
            email: 'postauthor@example.com',
            password: 'password123'
        })
        expect(regRes.statusCode).toBe(201)
        const token = regRes.body.token

        // Create post
        const res = await request(app)
            .post('/api/admin/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Test Post',
                content: 'This is the content of the test post.',
                published: true,
                isPublic: true
            })

        expect(res.statusCode).toBe(201)
        expect(res.body.title).toBe('Test Post')
    })

    it('should require auth to create post', async () => {
        const res = await request(app)
            .post('/api/admin/posts')
            .send({
                title: 'No Auth',
                content: 'Content'
            })
        expect(res.statusCode).toBe(401)
    })

    it('should return 404 for non-existent slug', async () => {
        const res = await request(app).get('/api/posts/non-existent-slug-12345')
        expect(res.statusCode).toBe(404)
    })
})
