import express from 'express';
import { getAISettings, updateAISettings } from '../controllers/aiSettingsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, getAISettings);
router.post('/', authenticateToken, updateAISettings);

export default router; 