import express from 'express';
import { getAISettings, updateAISettings } from '../controllers/aiSettingsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/settings/ai', authenticateToken, getAISettings);
router.post('/settings/ai', authenticateToken, updateAISettings);

export default router; 