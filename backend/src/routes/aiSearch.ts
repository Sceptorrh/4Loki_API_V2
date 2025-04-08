import express from 'express';
import { handleAISearch } from '../controllers/aiSearchController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/ai-search', authenticateToken, handleAISearch);

export default router; 