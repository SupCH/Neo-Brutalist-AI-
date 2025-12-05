import { useState, useEffect } from 'react'
import { getUsers, updateUserRole, deleteUser } from '../../services/api'
import './Users.css'

interface User {
    id: number
    email: string
    name: string
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    createdAt: string
    _count: {
        posts: number
        comments: number
    }
}

const ROLE_COLORS: Record<string, string> = {
    USER: 'role-user',
    ADMIN: 'role-admin',
    SUPER_ADMIN: 'role-super'
}

function Users() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const data = await getUsers()
            setUsers(data)
        } catch (error) {
            console.error('获取用户失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (userId: number, newRole: string) => {
        try {
            await updateUserRole(userId, newRole)
            setUsers(users.map(u =>
                u.id === userId ? { ...u, role: newRole as User['role'] } : u
            ))
        } catch (error) {
            console.error('更新角色失败:', error)
            alert('更新角色失败')
        }
    }

    const handleDelete = async (userId: number) => {
        if (!confirm('确定要删除这个用户吗？此操作不可撤销。')) return

        try {
            await deleteUser(userId)
            setUsers(users.filter(u => u.id !== userId))
        } catch (error) {
            console.error('删除用户失败:', error)
            alert('删除用户失败')
        }
    }

    return (
        <div className="admin-users">
            <header className="users-header">
                <h1 className="users-title">
                    <span className="title-prefix">&gt;_</span> 用户管理
                </h1>
                <span className="users-count">{users.length} 用户</span>
            </header>

            <div className="users-table-wrapper">
                {loading ? (
                    <div className="skeleton" style={{ height: '300px' }}></div>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>用户</th>
                                <th>角色</th>
                                <th>文章</th>
                                <th>评论</th>
                                <th>注册时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="user-info-cell">
                                        <div className="user-name">
                                            {user.name} <span className="uid-badge">UID:{user.id}</span>
                                        </div>
                                        <div className="user-email">{user.email}</div>
                                    </td>
                                    <td>
                                        {user.role === 'SUPER_ADMIN' ? (
                                            <span className={`role-badge ${ROLE_COLORS[user.role]}`}>超级管理员</span>
                                        ) : (
                                            <select
                                                className={`role-select ${ROLE_COLORS[user.role]}`}
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            >
                                                <option value="USER">普通用户</option>
                                                <option value="ADMIN">管理员</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="count-cell">{user._count.posts}</td>
                                    <td className="count-cell">{user._count.comments}</td>
                                    <td className="date-cell">
                                        {new Date(user.createdAt).toLocaleDateString('en-CA')}
                                    </td>
                                    <td>
                                        {user.role !== 'SUPER_ADMIN' && (
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                删除
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default Users
