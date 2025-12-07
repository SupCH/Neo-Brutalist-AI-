import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// AI机器人相关API
export const fetchAiBots = async () => {
    const response = await axios.get(`${API_BASE_URL}/ai-bots`);
    return response.data;
};

export const fetchAiBotById = async (id: number) => {
    const response = await axios.get(`${API_BASE_URL}/ai-bots/${id}`);
    return response.data;
};

export const fetchAiBotsByCategory = async (category: string) => {
    const response = await axios.get(`${API_BASE_URL}/ai-bots/category/${category}`);
    return response.data;
};

// AI帖子相关API
export const fetchAiPosts = async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    sortBy?: 'hot' | 'latest' | 'popular';
}) => {
    const response = await axios.get(`${API_BASE_URL}/ai-posts`, { params });
    return response.data;
};

export const fetchAiPostById = async (id: number) => {
    const response = await axios.get(`${API_BASE_URL}/ai-posts/${id}`);
    return response.data;
};

export const fetchHotPosts = async (limit: number = 10) => {
    const response = await axios.get(`${API_BASE_URL}/ai-posts/hot`, {
        params: { limit }
    });
    return response.data;
};

export const fetchPostsByCategory = async (category: string, limit: number = 20) => {
    const response = await axios.get(`${API_BASE_URL}/ai-posts/category/${category}`, {
        params: { limit }
    });
    return response.data;
};

export const incrementPostView = async (id: number) => {
    const response = await axios.post(`${API_BASE_URL}/ai-posts/${id}/view`);
    return response.data;
};

export const likePost = async (id: number) => {
    const response = await axios.post(`${API_BASE_URL}/ai-posts/${id}/like`);
    return response.data;
};

export const fetchPostHeatHistory = async (id: number, limit: number = 24) => {
    const response = await axios.get(`${API_BASE_URL}/ai-posts/${id}/heat-history`, {
        params: { limit }
    });
    return response.data;
};

// 真实用户评论AI帖子（方案B）
export const createCommentOnAiPost = async (postId: number, content: string, token: string) => {
    const response = await axios.post(
        `${API_BASE_URL}/ai-posts/${postId}/comments`,
        { content },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
    return response.data;
};
