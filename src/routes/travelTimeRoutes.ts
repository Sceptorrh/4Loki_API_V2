import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { TravelTime } from '../types';
import pool from '../config/database';
import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { calculateRoute, Coordinates } from '../services/google';

const router = Router();
const handler = new RouteHandler('TravelTime');

/**
 * @swagger
 * /travel-times/stats:
 *   get:
 *     summary: Get travel time statistics
 *     tags: [TravelTime]
 *     responses:
 *       200:
 *         description: Travel time statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 min:
 *                   type: number
 *                   description: Minimum travel time in minutes
 *                 max:
 *                   type: number
 *                   description: Maximum travel time in minutes
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        MIN(Duration) as min,
        MAX(Duration) as max
      FROM TravelTime
      WHERE CreatedOn >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    if (!Array.isArray(rows) || rows.length === 0) {
      // If no recent data, return default values
      return res.json({ min: 15, max: 45 });
    }

    const stats = rows[0] as { min: number; max: number };
    res.json({
      min: stats.min || 15,
      max: stats.max || 45
    });
  } catch (error) {
    console.error('Error fetching travel time statistics:', error);
    res.status(500).json({ message: 'Error fetching travel time statistics' });
  }
});

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

    // Create objects for Google Maps format
    const homeCoords: Coordinates = {
      lat: homeLocation.lat,
      lng: homeLocation.lng
    };
    
    const workCoords: Coordinates = {
      lat: workLocation.lat,
      lng: workLocation.lng
    };
    
    try {
      // Calculate route for home to work using Google Maps
      const homeToWorkRoute = await calculateRoute(homeCoords, workCoords);
      // Calculate route for work to home using Google Maps
      const workToHomeRoute = await calculateRoute(workCoords, homeCoords);
      
      if (!homeToWorkRoute || !workToHomeRoute) {
        return res.status(500).json({ 
          message: 'Failed to calculate one or both routes. Check if the Google Maps API key is properly configured and has access to the Routes API.' 
        });
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
          distance: homeToWorkDistanceKm, // now in km
          originAddress: homeToWorkRoute.originAddress,
          destinationAddress: homeToWorkRoute.destinationAddress
        },
        workToHome: {
          duration: workToHomeDurationMinutes, // now in minutes
          distance: workToHomeDistanceKm, // now in km
          originAddress: workToHomeRoute.originAddress,
          destinationAddress: workToHomeRoute.destinationAddress
        }
      });
    } catch (routeError: any) {
      console.error('Error calculating routes:', routeError);
      
      // Check for specific Google Maps API errors
      if (routeError.message && routeError.message.includes('Google Maps API')) {
        return res.status(503).json({ 
          message: routeError.message,
          googleApiError: true
        });
      } else if (routeError.message && routeError.message.includes('not authorized')) {
        return res.status(403).json({ 
          message: 'The Google Maps API key is not authorized to use the Routes API. Please enable it in the Google Cloud Console.',
          googleApiError: true
        });
      }
      
      return res.status(500).json({ 
        message: 'Error calculating routes with Google Maps API', 
        error: routeError.message
      });
    }
  } catch (error: any) {
    console.error('Error updating travel times:', error);
    res.status(500).json({ 
      message: `Server error updating travel times: ${error.message || 'Unknown error'}`
    });
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
 *               originCoords:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               destinationCoords:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
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
        !originCoords.lat || !originCoords.lng ||
        !destinationCoords.lat || !destinationCoords.lng) {
      return res.status(400).json({ message: 'Origin and destination coordinates are required' });
    }

    // Calculate route using Google Maps
    const routeData = await calculateRoute(
      originCoords as Coordinates,
      destinationCoords as Coordinates
    );
    
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
        distance: distanceInKm, // now in km
        originAddress: routeData.originAddress,
        destinationAddress: routeData.destinationAddress
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

export default router; 