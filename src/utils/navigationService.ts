import pool from '../config/database';
import { logger } from './logger';
import { calculateRoute as googleCalculateRoute, Coordinates } from '../services/google';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Fetches travel times from Google Maps API and saves to database
 */
export const fetchAndSaveTravelTimes = async (): Promise<void> => {
  try {
    // Read navigation settings from configuration file
    const navigationConfigPath = path.join(process.cwd(), 'configuration', 'navigation.json');
    const navigationConfig = JSON.parse(fs.readFileSync(navigationConfigPath, 'utf8'));
    
    // Check if coordinates are set
    if (!navigationConfig.homeLatitude || !navigationConfig.homeLongitude || 
        !navigationConfig.workLatitude || !navigationConfig.workLongitude) {
      logger.info('Home or work coordinates not set in navigation.json. Skipping travel time update.');
      return;
    }
    
    // Create coordinate objects for Google Maps
    const homeCoords: Coordinates = {
      lat: parseFloat(navigationConfig.homeLatitude),
      lng: parseFloat(navigationConfig.homeLongitude)
    };
    
    const workCoords: Coordinates = {
      lat: parseFloat(navigationConfig.workLatitude),
      lng: parseFloat(navigationConfig.workLongitude)
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