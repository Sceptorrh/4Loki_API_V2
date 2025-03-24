import pool from '../config/database';
import { NavigationSettings, TravelTime } from '../types';
import { RowDataPacket } from 'mysql2';
import { logger } from './logger';
import { calculateRoute as googleCalculateRoute, Coordinates } from '../services/google';

/**
 * Fetches travel times from Google Maps API and saves to database
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
    
    // Create coordinate objects for Google Maps
    const homeCoords: Coordinates = {
      lat: parseFloat(settings.HomeLatitude),
      lng: parseFloat(settings.HomeLongitude)
    };
    
    const workCoords: Coordinates = {
      lat: parseFloat(settings.WorkLatitude),
      lng: parseFloat(settings.WorkLongitude)
    };
    
    // Calculate route for home to work using Google Maps API
    const homeToWorkRoute = await googleCalculateRoute(homeCoords, workCoords);
    
    // Calculate route for work to home
    const workToHomeRoute = await googleCalculateRoute(workCoords, homeCoords);
    
    // Save to database
    if (homeToWorkRoute) {
      // Convert duration to minutes and distance to kilometers
      const durationMinutes = Math.round(homeToWorkRoute.duration / 60);
      const distanceKm = Math.round(homeToWorkRoute.distance / 1000 * 10) / 10;
      
      await pool.query(
        'INSERT INTO TravelTime (IsHomeToWork, Duration, Distance) VALUES (?, ?, ?)',
        [true, durationMinutes, distanceKm]
      );
      
      logger.info(`Home to work route: ${durationMinutes} minutes, ${distanceKm} km`);
    }
    
    if (workToHomeRoute) {
      // Convert duration to minutes and distance to kilometers
      const durationMinutes = Math.round(workToHomeRoute.duration / 60);
      const distanceKm = Math.round(workToHomeRoute.distance / 1000 * 10) / 10;
      
      await pool.query(
        'INSERT INTO TravelTime (IsHomeToWork, Duration, Distance) VALUES (?, ?, ?)',
        [false, durationMinutes, distanceKm]
      );
      
      logger.info(`Work to home route: ${durationMinutes} minutes, ${distanceKm} km`);
    }
    
    logger.info('Travel times updated successfully');
  } catch (error) {
    logger.error('Error updating travel times:', error);
  }
}; 