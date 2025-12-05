import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import PostDetail from './pages/PostDetail'
import Tags from './pages/Tags'
import TagPosts from './pages/TagPosts'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import UserProfile from './pages/UserProfile'
import NotFound from './pages/NotFound'
import AdminDashboard from './pages/admin/Dashboard'
import AdminPosts from './pages/admin/Posts'
import AdminPostEditor from './pages/admin/PostEditor'
import AdminUsers from './pages/admin/Users'
import AdminComments from './pages/admin/Comments'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="post/:slug" element={<PostDetail />} />
                <Route path="tags" element={<Tags />} />
                <Route path="tag/:slug" element={<TagPosts />} />
                <Route path="about" element={<About />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="user/:id" element={<UserProfile />} />
            </Route>
            <Route path="/admin" element={<Layout isAdmin />}>
                <Route index element={<AdminDashboard />} />
                <Route path="posts" element={<AdminPosts />} />
                <Route path="posts/new" element={<AdminPostEditor />} />
                <Route path="posts/:id/edit" element={<AdminPostEditor />} />
                <Route path="comments" element={<AdminComments />} />
                <Route path="users" element={<AdminUsers />} />
            </Route>
            {/* 404 页面 - 必须放在最后 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default App

