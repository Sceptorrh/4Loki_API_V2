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
 * /travel-times:
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
 * /travel-times:
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
 * /travel-times/update:
 *   post:
 *     summary: Calculate and store travel times between home and work locations using coordinates
 *     tags: [TravelTime]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               homeLocation:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               workLocation:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *     responses:
 *       201:
 *         description: Travel times calculated and stored successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/update', async (req: Request, res: Response) => {
  try {
    const { homeLocation, workLocation } = req.body;
    
    // Validate input
    if (!homeLocation || !workLocation || 
        !homeLocation.lat || !homeLocation.lng ||
        !workLocation.lat || !workLocation.lng) {
      return res.status(400).json({ message: 'Home and work coordinates are required' });
    }

    // Create objects for OSRM format
    const homeCoords = {
      lat: homeLocation.lat,
      lon: homeLocation.lng
    };
    
    const workCoords = {
      lat: workLocation.lat,
      lon: workLocation.lng
    };
    
    // Calculate route for home to work
    const homeToWorkRoute = await calculateRoute(homeCoords, workCoords);
    // Calculate route for work to home
    const workToHomeRoute = await calculateRoute(workCoords, homeCoords);
    
    if (!homeToWorkRoute || !workToHomeRoute) {
      return res.status(500).json({ message: 'Failed to calculate one or both routes' });
    }
    
    // Convert duration to minutes and distance to kilometers
    const homeToWorkDurationMinutes = Math.round(homeToWorkRoute.duration / 60);
    const homeToWorkDistanceKm = Math.round(homeToWorkRoute.distance / 1000 * 10) / 10; // Round to 1 decimal
    
    const workToHomeDurationMinutes = Math.round(workToHomeRoute.duration / 60);
    const workToHomeDistanceKm = Math.round(workToHomeRoute.distance / 1000 * 10) / 10; // Round to 1 decimal
    
    // Insert both travel times into database
    const homeToWorkResult = await pool.query(
      'INSERT INTO TravelTime (IsHomeToWork, Duration, Distance, CreatedOn) VALUES (?, ?, ?, NOW())',
      [true, homeToWorkDurationMinutes, homeToWorkDistanceKm]
    );
    
    const workToHomeResult = await pool.query(
      'INSERT INTO TravelTime (IsHomeToWork, Duration, Distance, CreatedOn) VALUES (?, ?, ?, NOW())',
      [false, workToHomeDurationMinutes, workToHomeDistanceKm]
    );
    
    // Return success response
    res.status(201).json({
      message: 'Travel times updated successfully',
      homeToWork: {
        duration: homeToWorkDurationMinutes, // now in minutes
        distance: homeToWorkDistanceKm // now in km
      },
      workToHome: {
        duration: workToHomeDurationMinutes, // now in minutes
        distance: workToHomeDistanceKm // now in km
      }
    });
    
  } catch (error) {
    console.error('Error updating travel times:', error);
    res.status(500).json({ message: 'Server error updating travel times' });
  }
});

/**
 * @swagger
 * /travel-times/calculate:
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
    const { originCoords, destinationCoords, isHomeToWork } = req.body;
    
    // Validate input
    if (!originCoords || !destinationCoords ||
        !originCoords.lat || !originCoords.lon ||
        !destinationCoords.lat || !destinationCoords.lon) {
      return res.status(400).json({ message: 'Origin and destination coordinates are required' });
    }

    // Calculate route using OSRM
    const routeData = await calculateRoute(originCoords, destinationCoords);
    
    if (!routeData) {
      return res.status(500).json({ message: 'Failed to calculate route' });
    }
    
    // Convert duration to minutes and distance to kilometers
    const durationInMinutes = Math.round(routeData.duration / 60);
    const distanceInKm = Math.round(routeData.distance / 1000 * 10) / 10; // Round to 1 decimal
    
    // Store travel time in database
    const [result] = await pool.query(
      'INSERT INTO TravelTime (IsHomeToWork, Duration, Distance, CreatedOn) VALUES (?, ?, ?, NOW())',
      [isHomeToWork, durationInMinutes, distanceInKm]
    );
    
    // Get the newly created record
    interface TravelTimeRecord extends RowDataPacket, TravelTime {}
    
    const [newRecord] = await pool.query<TravelTimeRecord[]>(
      'SELECT * FROM TravelTime WHERE Id = ?',
      [(result as any).insertId]
    );
    
    res.status(201).json({
      travelTime: newRecord[0],
      route: {
        duration: durationInMinutes, // now in minutes
        distance: distanceInKm // now in km
      }
    });
    
  } catch (error) {
    console.error('Error calculating travel time:', error);
    res.status(500).json({ message: 'Server error calculating travel time' });
  }
});

/**
 * @swagger
 * /travel-times/latest:
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
 * /travel-times/average:
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

/**
 * @swagger
 * /travel-times/{id}:
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
 * /travel-times/{id}:
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
 * /travel-times/{id}:
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