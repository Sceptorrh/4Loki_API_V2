import { Router } from 'express';
import pool from '../config/database';
import { NavigationSettings } from '../types';
import { RowDataPacket } from 'mysql2';
import secrets from '../config/secrets';

const router = Router();

/**
 * @swagger
 * /api/navigation-settings:
 *   get:
 *     summary: Get navigation settings
 *     tags: [NavigationSettings]
 *     responses:
 *       200:
 *         description: Navigation settings retrieved successfully
 *       404:
 *         description: Navigation settings not found
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM NavigationSettings LIMIT 1');
    
    if (!rows || rows.length === 0) {
      // Return default settings instead of 404
      return res.json({
        Id: null,
        HomeAddress: '',
        WorkAddress: '',
        HomeLatitude: null,
        HomeLongitude: null,
        WorkLatitude: null,
        WorkLongitude: null,
        ApiKey: null,
        UpdatedOn: new Date().toISOString()
      });
    }
    
    res.json(rows[0]);
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
 *                 type: number
 *               HomeLongitude:
 *                 type: number
 *               WorkLatitude:
 *                 type: number
 *               WorkLongitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Navigation settings updated successfully
 *       201:
 *         description: Navigation settings created successfully
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
    // Check if settings already exist
    const [exists] = await pool.query<RowDataPacket[]>('SELECT Id FROM NavigationSettings LIMIT 1');
    
    if (exists && exists.length > 0) {
      // Update existing settings
      const id = exists[0].Id;
      console.log('Updating existing settings with ID:', id);
      await pool.query(
        'UPDATE NavigationSettings SET HomeLatitude = ?, HomeLongitude = ?, WorkLatitude = ?, WorkLongitude = ? WHERE Id = ?',
        [HomeLatitude, HomeLongitude, WorkLatitude, WorkLongitude, id]
      );
      
      res.status(200).json({ message: 'Navigation settings updated successfully' });
    } else {
      // Create new settings
      console.log('Creating new navigation settings');
      await pool.query(
        'INSERT INTO NavigationSettings (HomeLatitude, HomeLongitude, WorkLatitude, WorkLongitude) VALUES (?, ?, ?, ?)',
        [HomeLatitude, HomeLongitude, WorkLatitude, WorkLongitude]
      );
      
      res.status(201).json({ message: 'Navigation settings created successfully' });
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
        message: 'No API key configured. Please add ROUTES_API_KEY to secrets.json'
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