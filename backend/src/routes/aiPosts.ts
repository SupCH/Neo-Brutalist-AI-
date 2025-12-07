import express from 'express';
import {
    getAiPosts,
    getPostById,
    getHotPosts,
    getPostsByCategory,
    incrementView,
    likePost,
    getPostHeatHistory,
    triggerCommentGeneration,
    createUserComment
} from '../controllers/aiPostController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 获取帖子列表
router.get('/', getAiPosts);

// 获取热榜
router.get('/hot', getHotPosts);

// 获取单个帖子详情
router.get('/:id', getPostById);

// 按分类获取帖子
router.get('/category/:category', getPostsByCategory);

// 增加浏览量
router.post('/:id/view', incrementView);

// 点赞帖子
router.post('/:id/like', likePost);

// 获取热度历史
router.get('/:id/heat-history', getPostHeatHistory);

// 真实用户评论AI帖子（需要登录）
router.post('/:id/comments', authenticateToken, createUserComment);

// 触发评论生成（管理员或定时任务）
router.post('/:id/generate-comments', triggerCommentGeneration);

export default router;
