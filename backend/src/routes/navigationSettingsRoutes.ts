import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import secrets from '../config/secrets';

const router = Router();

// Helper function to get the navigation settings file path
const getNavigationSettingsPath = () => {
  return path.join(process.cwd(), '..', 'configuration', 'navigation.json');
};

// Helper function to get the Google configuration file path
const getGoogleConfigPath = () => {
  return path.join(process.cwd(), '..', 'configuration', 'google.json');
};

// Helper function to ensure configuration directory exists
const ensureConfigDir = () => {
  const configDir = path.join(process.cwd(), 'configuration');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
};

// Helper function to create default Google configuration
const createDefaultGoogleConfig = () => {
  const defaultConfig = {
    ROUTES_API_KEY: '',
    OAUTH_CLIENT_ID: '',
    OAUTH_CLIENT_SECRET: ''
  };
  const filePath = getGoogleConfigPath();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2));
    console.warn('Created new Google configuration file at:', filePath);
    console.warn('Please update the configuration with your Google API credentials.');
  }
};

// Helper function to read navigation settings
const readNavigationSettings = () => {
  try {
    ensureConfigDir();
    createDefaultGoogleConfig();
    
    const filePath = getNavigationSettingsPath();
    if (!fs.existsSync(filePath)) {
      const defaultSettings = {
        homeLatitude: '',
        homeLongitude: '',
        workLatitude: '',
        workLongitude: ''
      };
      fs.writeFileSync(filePath, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading navigation settings:', error);
    return {
      homeLatitude: '',
      homeLongitude: '',
      workLatitude: '',
      workLongitude: ''
    };
  }
};

// Helper function to write navigation settings
const writeNavigationSettings = (settings: any) => {
  try {
    const filePath = getNavigationSettingsPath();
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing navigation settings:', error);
    return false;
  }
};

/**
 * @swagger
 * /api/navigation-settings:
 *   get:
 *     summary: Get navigation settings
 *     tags: [NavigationSettings]
 *     responses:
 *       200:
 *         description: Navigation settings retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const settings = readNavigationSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching navigation settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/navigation-settings:
 *   post:
 *     summary: Create or update navigation settings
 *     tags: [NavigationSettings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               HomeLatitude:
 *                 type: string
 *               HomeLongitude:
 *                 type: string
 *               WorkLatitude:
 *                 type: string
 *               WorkLongitude:
 *                 type: string
 *     responses:
 *       200:
 *         description: Navigation settings updated successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  console.log('POST request received at /api/navigation-settings:', req.body);
  
  const { HomeLatitude, HomeLongitude, WorkLatitude, WorkLongitude } = req.body;
  
  if (!HomeLatitude || !HomeLongitude || !WorkLatitude || !WorkLongitude) {
    return res.status(400).json({ message: 'Home and work coordinates are required' });
  }
  
  try {
    const settings = {
      homeLatitude: HomeLatitude,
      homeLongitude: HomeLongitude,
      workLatitude: WorkLatitude,
      workLongitude: WorkLongitude
    };

    const success = writeNavigationSettings(settings);
    
    if (success) {
      res.status(200).json({ message: 'Navigation settings updated successfully' });
    } else {
      res.status(500).json({ message: 'Failed to save navigation settings' });
    }
  } catch (error: any) {
    console.error('Error saving navigation settings:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

/**
 * @swagger
 * /api/navigation-settings/api-key-status:
 *   get:
 *     summary: Check if a Routes API key is configured on the server
 *     tags: [NavigationSettings]
 *     responses:
 *       200:
 *         description: Returns the status of the API key configuration
 */
router.get('/api-key-status', async (req, res) => {
  try {
    // Check if API key is configured in secrets or environment variables
    const hasServerApiKey = !!secrets.ROUTES_API_KEY;
    
    console.log(`API key status check: hasServerApiKey = ${hasServerApiKey}`);
    
    res.json({ 
      hasServerApiKey,
      message: hasServerApiKey 
        ? 'API key is configured on the server' 
        : 'No API key is configured on the server'
    });
  } catch (error) {
    console.error('Error checking API key configuration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/navigation-settings/api-key:
 *   get:
 *     summary: Get the Google API key for frontend use
 *     tags: [NavigationSettings]
 *     responses:
 *       200:
 *         description: Returns the API key for Maps integration
 */
router.get('/api-key', async (req, res) => {
  try {
    // Only use API key from secrets
    const apiKey = secrets.ROUTES_API_KEY;
    
    if (!apiKey) {
      return res.status(404).json({ 
        message: 'No API key configured. Please add ROUTES_API_KEY to configuration/google.json'
      });
    }
    
    res.json({ 
      apiKey,
      message: 'API key retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 