import axios from 'axios';
import pool from '../config/database';
import { NavigationSettings, TravelTime } from '../types';
import { RowDataPacket } from 'mysql2';
import secrets from '../config/secrets';
import { logger } from './logger';

/**
 * Fetches travel times from navigation API and saves to database
 */
export const fetchAndSaveTravelTimes = async (): Promise<void> => {
  try {
    // Get navigation settings
    const [settingsRows] = await pool.query<RowDataPacket[]>('SELECT * FROM NavigationSettings LIMIT 1');
    
    if (!settingsRows || settingsRows.length === 0) {
      logger.info('No navigation settings found. Skipping travel time update.');
      return;
    }
    
    const settings = settingsRows[0] as NavigationSettings;
    
    // Check if coordinates are set
    if (!settings.HomeLatitude || !settings.HomeLongitude || 
        !settings.WorkLatitude || !settings.WorkLongitude) {
      logger.info('Home or work coordinates not set. Skipping travel time update.');
      return;
    }
    
    // Create coordinate objects
    const homeCoords = {
      lat: parseFloat(settings.HomeLatitude),
      lon: parseFloat(settings.HomeLongitude)
    };
    
    const workCoords = {
      lat: parseFloat(settings.WorkLatitude),
      lon: parseFloat(settings.WorkLongitude)
    };
    
    // Calculate route for home to work using OSRM
    const homeToWorkRoute = await calculateRoute(homeCoords, workCoords);
    
    // Calculate route for work to home
    const workToHomeRoute = await calculateRoute(workCoords, homeCoords);
    
    // Save to database
    if (homeToWorkRoute) {
      await pool.query(
        'INSERT INTO TravelTime (IsHomeToWork, Duration, Distance) VALUES (?, ?, ?)',
        [true, homeToWorkRoute.duration, homeToWorkRoute.distance]
      );
    }
    
    if (workToHomeRoute) {
      await pool.query(
        'INSERT INTO TravelTime (IsHomeToWork, Duration, Distance) VALUES (?, ?, ?)',
        [false, workToHomeRoute.duration, workToHomeRoute.distance]
      );
    }
    
    logger.info('Travel times updated successfully');
  } catch (error) {
    logger.error('Error updating travel times:', error);
  }
};

/**
 * Calculate route using OSRM (Open Source Routing Machine)
 */
const calculateRoute = async (
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number }
): Promise<{ duration: number; distance: number } | null> => {
  try {
    // For development, return some mock data
    if (process.env.NODE_ENV === 'development') {
      logger.info('Using mock data for travel time calculation');
      return {
        duration: Math.floor(Math.random() * 3600) + 900, // 15-75 minutes in seconds
        distance: (Math.floor(Math.random() * 50) + 5) * 1000, // 5-55 km in meters
      };
    }
    
    logger.debug(`Calculating route from [${origin.lat},${origin.lon}] to [${destination.lat},${destination.lon}]`);
    
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
    logger.error('Error calculating route:', error);
    return null;
  }
}; 