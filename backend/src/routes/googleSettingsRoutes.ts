import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Helper function to get the Google configuration file path
const getGoogleConfigPath = () => {
  return path.join(process.cwd(), '..', 'configuration', 'google.json');
};

// Helper function to read settings
const readSettings = () => {
  try {
    const configPath = getGoogleConfigPath();
    if (!fs.existsSync(configPath)) {
      logger.error('Config file does not exist at:', configPath);
      return {
        ROUTES_API_KEY: '',
        OAUTH_CLIENT_ID: '',
        OAUTH_CLIENT_SECRET: ''
      };
    }
    const data = fs.readFileSync(configPath, 'utf8');
    logger.info('Read settings:', data);
    const parsed = JSON.parse(data);
    logger.info('Parsed settings:', parsed);
    return parsed;
  } catch (error) {
    logger.error('Error reading settings:', error);
    return {
      ROUTES_API_KEY: '',
      OAUTH_CLIENT_ID: '',
      OAUTH_CLIENT_SECRET: ''
    };
  }
};

// Helper function to write settings
const writeSettings = (settings: any) => {
  try {
    const configPath = getGoogleConfigPath();
    // Ensure the configuration directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
    logger.info('Wrote settings:', settings);
    return true;
  } catch (error) {
    logger.error('Error writing settings:', error);
    return false;
  }
};

/**
 * @swagger
 * /api/settings/google:
 *   get:
 *     summary: Get Google settings
 *     tags: [GoogleSettings]
 *     responses:
 *       200:
 *         description: Google settings retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const settings = readSettings();
    logger.info('GET response settings:', settings);
    res.json({
      apiKey: settings.ROUTES_API_KEY || '',
      oauthClientId: settings.OAUTH_CLIENT_ID || '',
      oauthClientSecret: settings.OAUTH_CLIENT_SECRET || ''
    });
  } catch (error) {
    logger.error('GET error:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

/**
 * @swagger
 * /api/settings/google:
 *   post:
 *     summary: Update Google settings
 *     tags: [GoogleSettings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               apiKey:
 *                 type: string
 *               oauthClientId:
 *                 type: string
 *               oauthClientSecret:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { apiKey, oauthClientId, oauthClientSecret } = req.body;
    logger.info('POST request body:', req.body);

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const settings = readSettings();
    settings.ROUTES_API_KEY = apiKey;
    settings.OAUTH_CLIENT_ID = oauthClientId || '';
    settings.OAUTH_CLIENT_SECRET = oauthClientSecret || '';

    const success = writeSettings(settings);

    if (!success) {
      return res.status(500).json({ error: 'Failed to save settings' });
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    logger.error('POST error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router; 