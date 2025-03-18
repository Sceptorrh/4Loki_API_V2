import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { TravelTime } from '../types';
import pool from '../config/database';
import axios from 'axios';
import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';

const router = Router();
const handler = new RouteHandler('TravelTime');

/**
 * @swagger
 * /api/travel-times:
 *   get:
 *     summary: Retrieve all travel time records
 *     tags: [TravelTime]
 *     responses:
 *       200:
 *         description: A list of travel time records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TravelTime'
 *       500:
 *         description: Server error
 */
router.get('/', handler.getAll.bind(handler));

/**
 * @swagger
 * /api/travel-times/{id}:
 *   get:
 *     summary: Get a travel time record by ID
 *     tags: [TravelTime]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The travel time record ID
 *     responses:
 *       200:
 *         description: Travel time record found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravelTime'
 *       404:
 *         description: Travel time record not found
 *       500:
 *         description: Server error
 */
router.get('/:id', handler.getById.bind(handler));

/**
 * @swagger
 * /api/travel-times:
 *   post:
 *     summary: Create a new travel time record
 *     tags: [TravelTime]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TravelTimeInput'
 *     responses:
 *       201:
 *         description: Travel time record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravelTime'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/', handler.create.bind(handler));

/**
 * @swagger
 * /api/travel-times/{id}:
 *   put:
 *     summary: Update a travel time record
 *     tags: [TravelTime]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The travel time record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TravelTimeInput'
 *     responses:
 *       200:
 *         description: Travel time record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravelTime'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Travel time record not found
 *       500:
 *         description: Server error
 */
router.put('/:id', handler.update.bind(handler));

/**
 * @swagger
 * /api/travel-times/{id}:
 *   delete:
 *     summary: Delete a travel time record
 *     tags: [TravelTime]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The travel time record ID
 *     responses:
 *       200:
 *         description: Travel time record deleted successfully
 *       404:
 *         description: Travel time record not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', handler.delete.bind(handler));

/**
 * @swagger
 * /api/travel-times/calculate:
 *   post:
 *     summary: Calculate and store travel time between two addresses
 *     tags: [TravelTime]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originAddress:
 *                 type: string
 *                 description: Starting point address
 *               destinationAddress:
 *                 type: string
 *                 description: Destination address
 *               isHomeToWork:
 *                 type: boolean
 *                 description: Whether this is a home to work travel time
 *     responses:
 *       201:
 *         description: Travel time calculated and stored successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { originAddress, destinationAddress, isHomeToWork } = req.body;
    
    // Validate input
    if (!originAddress || !destinationAddress) {
      return res.status(400).json({ message: 'Origin and destination addresses are required' });
    }

    // Geocode the addresses to get coordinates using Nominatim (OpenStreetMap)
    const originCoords = await geocodeAddress(originAddress);
    const destCoords = await geocodeAddress(destinationAddress);
    
    if (!originCoords || !destCoords) {
      return res.status(400).json({ message: 'Failed to geocode one or both addresses' });
    }
    
    // Calculate route using OSRM
    const routeData = await calculateRoute(originCoords, destCoords);
    
    if (!routeData) {
      return res.status(500).json({ message: 'Failed to calculate route' });
    }
    
    // Extract duration in seconds and distance in meters
    const durationInSeconds = routeData.duration;
    const distanceInMeters = routeData.distance;
    
    // Convert to minutes for storage
    const durationInMinutes = Math.round(durationInSeconds / 60);
    
    // Store travel time in database
    const [result] = await pool.query(
      'INSERT INTO TravelTime (IsHomeToWork, Duration, Distance, CreatedOn) VALUES (?, ?, ?, NOW())',
      [isHomeToWork, durationInMinutes, distanceInMeters]
    );
    
    // Get the newly created record
    interface TravelTimeRecord extends RowDataPacket, TravelTime {}
    
    const [newRecord] = await pool.query<TravelTimeRecord[]>(
      'SELECT * FROM TravelTime WHERE Id = ?',
      [(result as any).insertId]
    );
    
    res.status(201).json({
      travelTime: newRecord[0],
      route: routeData
    });
    
  } catch (error) {
    console.error('Error calculating travel time:', error);
    res.status(500).json({ message: 'Server error calculating travel time' });
  }
});

/**
 * @swagger
 * /api/travel-times/latest:
 *   get:
 *     summary: Get the latest travel time records
 *     tags: [TravelTime]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records to return
 *       - in: query
 *         name: isHomeToWork
 *         schema:
 *           type: boolean
 *         description: Filter by home-to-work or work-to-home
 *     responses:
 *       200:
 *         description: Latest travel time records retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const isHomeToWorkFilter = req.query.isHomeToWork !== undefined 
      ? `WHERE IsHomeToWork = ${req.query.isHomeToWork === 'true' ? 1 : 0}` 
      : '';
    
    interface TravelTimeRecord extends RowDataPacket, TravelTime {}
    
    const [rows] = await pool.query<TravelTimeRecord[]>(
      `SELECT * FROM TravelTime ${isHomeToWorkFilter} ORDER BY CreatedOn DESC LIMIT ?`,
      [limit]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching latest travel times:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/travel-times/average:
 *   get:
 *     summary: Get average travel time and distance
 *     tags: [TravelTime]
 *     parameters:
 *       - in: query
 *         name: isHomeToWork
 *         schema:
 *           type: boolean
 *         required: true
 *         description: Filter by home-to-work or work-to-home
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to calculate average from
 *     responses:
 *       200:
 *         description: Average travel time retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/average', async (req: Request, res: Response) => {
  try {
    if (req.query.isHomeToWork === undefined) {
      return res.status(400).json({ message: 'isHomeToWork parameter is required' });
    }
    
    const isHomeToWork = req.query.isHomeToWork === 'true';
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    
    interface TravelTimeAverage extends RowDataPacket {
      averageDuration: number;
      averageDistance: number;
      recordCount: number;
    }
    
    const [result] = await pool.query<TravelTimeAverage[]>(
      `SELECT 
        AVG(Duration) as averageDuration,
        AVG(Distance) as averageDistance,
        COUNT(*) as recordCount
      FROM TravelTime 
      WHERE IsHomeToWork = ? AND CreatedOn >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [isHomeToWork, days]
    );
    
    if (Array.isArray(result) && result.length > 0) {
      const averageData = result[0];
      
      // Round values for better readability
      res.json({
        averageDuration: Math.round(averageData.averageDuration || 0),
        averageDistance: Math.round(averageData.averageDistance || 0),
        recordCount: averageData.recordCount,
        period: `${days} days`,
        routeType: isHomeToWork ? 'Home to Work' : 'Work to Home'
      });
    } else {
      res.json({
        averageDuration: 0,
        averageDistance: 0,
        recordCount: 0,
        period: `${days} days`,
        routeType: isHomeToWork ? 'Home to Work' : 'Work to Home'
      });
    }
  } catch (error) {
    console.error('Error calculating average travel time:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions for geocoding and route calculation
async function geocodeAddress(address: string) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': '4Loki_API_V2'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function calculateRoute(origin: {lat: number, lon: number}, destination: {lat: number, lon: number}) {
  try {
    // Using OSRM (Open Source Routing Machine) demo server
    // For production, consider setting up your own OSRM server or using a commercial service
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
    
    const response = await axios.get(url, {
      params: {
        overview: 'false',
        alternatives: 'false',
        steps: 'false'
      }
    });
    
    if (response.data && 
        response.data.routes && 
        response.data.routes.length > 0) {
      return {
        duration: response.data.routes[0].duration,
        distance: response.data.routes[0].distance
      };
    }
    return null;
  } catch (error) {
    console.error('Routing calculation error:', error);
    return null;
  }
}

export default router; 