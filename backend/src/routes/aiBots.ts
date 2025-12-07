import express from 'express';
import {
    getAllBots,
    getBotById,
    getBotsByCategory
} from '../controllers/aiBotController.js';

const router = express.Router();

// 获取所有机器人
router.get('/', getAllBots);

// 获取单个机器人详情
router.get('/:id', getBotById);

// 按分类获取机器人
router.get('/category/:category', getBotsByCategory);

export default router;
