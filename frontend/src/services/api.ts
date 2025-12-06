const API_BASE = '/api'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token')

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    }

    if (token) {
        ; (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    })

    const responseText = await response.text()

    let data
    try {
        data = JSON.parse(responseText)
    } catch (e) {
        console.error('JSON Parse Error:', e)
        console.error('Raw Response:', responseText)
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}...`)
    }

    if (!response.ok) {
        // Construct error object similar to what axios/fetch would expect if we want to keep consistency
        // or just throw the data if it has error info
        const error: any = new Error(data.message || `HTTP error! status: ${response.status}`)
        error.response = {
            status: response.status,
            data: data
        }
        throw error
    }

    return data
}

// 获取当前登录用户信息
export function getCurrentUser(): { userId: number; role: string } | null {
    const token = localStorage.getItem('token')
    if (!token) return null

    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return { userId: payload.userId, role: payload.role }
    } catch {
        return null
    }
}

// Public API
export async function getPosts(page = 1, limit = 10) {
    return request<any[]>(`/posts?page=${page}&limit=${limit}`)
}

export async function getPost(slug: string) {
    return request<any>(`/posts/${slug}`)
}

export async function getRandomPost() {
    return request<{ slug: string }>('/posts/random')
}

export async function getTags() {
    return request<any[]>('/tags')
}

export async function getTagPosts(slug: string) {
    return request<any>(`/tags/${slug}/posts`)
}

export async function createTag(name: string) {
    return request<any>('/tags', {
        method: 'POST',
        body: JSON.stringify({ name }),
    })
}

export async function createComment(postId: number, content: string) {
    return request<any>('/comments', {
        method: 'POST',
        body: JSON.stringify({ postId, content }),
    })
}

export async function deleteOwnComment(commentId: number) {
    return request<any>(`/comments/${commentId}`, {
        method: 'DELETE',
    })
}

export async function getUserProfile(userId: number) {
    return request<any>(`/users/${userId}`)
}

export async function updateProfile(data: { name: string; bio?: string }) {
    return request<any>('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('token')
    const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    })

    if (!response.ok) {
        throw new Error('Upload failed')
    }

    return response.json()
}

export async function uploadProfileBg(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('token')
    const response = await fetch('/api/user/background', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    })

    if (!response.ok) {
        throw new Error('Upload failed')
    }

    return response.json()
}

// Auth API
export async function login(email: string, password: string) {
    return request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })
}

export async function register(name: string, email: string, password: string) {
    return request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    })
}

export async function verifyEmail(email: string) {
    return request<{ success: boolean; message: string }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
    })
}

export function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
}

export async function changePassword(oldPassword: string, newPassword: string, confirmPassword: string) {
    return request<{ success: boolean; message: string; details: string }>('/user/password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
    })
}

export async function changeEmail(email: string, password: string) {
    return request<{ success: boolean; message: string; email: string }>('/user/email', {
        method: 'PUT',
        body: JSON.stringify({ email, password }),
    })
}

export function isAuthenticated() {
    return !!localStorage.getItem('token')
}

// Admin API
export async function getAdminPosts() {
    return request<any[]>('/admin/posts')
}

export async function getAdminPost(id: number) {
    return request<any>(`/admin/posts/${id}`)
}

export async function createPost(data: any) {
    return request<any>('/admin/posts', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function updatePost(id: number, data: any) {
    return request<any>(`/admin/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deletePost(id: number) {
    return request<any>(`/admin/posts/${id}`, {
        method: 'DELETE',
    })
}

// 批量创建文章
export async function batchCreatePosts(posts: Array<{
    title: string
    slug: string
    content: string
    excerpt?: string
    published: boolean
    isPublic?: boolean
    tagIds?: number[]
}>) {
    return request<{
        success: boolean
        message: string
        created: any[]
        errors?: Array<{ title: string; error: string }>
    }>('/admin/posts/batch', {
        method: 'POST',
        body: JSON.stringify({ posts }),
    })
}

// 文章版本历史
export async function getPostVersions(postId: number) {
    return request<Array<{
        id: number
        version: number
        title: string
        changeNote: string | null
        createdAt: string
        editorId: number | null
    }>>(`/admin/posts/${postId}/versions`)
}

export async function getPostVersion(postId: number, versionId: number) {
    return request<{
        id: number
        version: number
        title: string
        content: string
        excerpt: string | null
        coverImage: string | null
        published: boolean
        isPublic: boolean
        changeNote: string | null
        createdAt: string
    }>(`/admin/posts/${postId}/versions/${versionId}`)
}

export async function rollbackPostVersion(postId: number, versionId: number) {
    return request<{
        success: boolean
        message: string
        post: any
    }>(`/admin/posts/${postId}/versions/${versionId}/rollback`, {
        method: 'POST'
    })
}

export async function uploadImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    })

    if (!response.ok) {
        throw new Error('Upload failed')
    }

    return response.json()
}

// Dashboard stats
export async function getDashboardStats() {
    return request<any>('/admin/stats')
}

// User management (SUPER_ADMIN only)
export async function getUsers() {
    return request<any[]>('/admin/users')
}

export async function updateUserRole(userId: number, role: string) {
    return request<any>(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
    })
}

export async function deleteUser(userId: number) {
    return request<any>(`/admin/users/${userId}`, {
        method: 'DELETE',
    })
}

// Comment management (ADMIN+)
export async function getAdminComments() {
    return request<any[]>('/admin/comments')
}

export async function deleteComment(commentId: number) {
    return request<any>(`/admin/comments/${commentId}`, {
        method: 'DELETE',
    })
}
