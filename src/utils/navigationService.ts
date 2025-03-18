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
    
    // Check if addresses are set
    if (!settings.HomeAddress || !settings.WorkAddress) {
      logger.info('Home or work address not set. Skipping travel time update.');
      return;
    }
    
    // Get API key from secrets instead of database
    const apiKey = secrets.ROUTES_API_KEY || settings.ApiKey;
    
    if (!apiKey) {
      logger.warn('No API key found in secrets or database. Skipping travel time update.');
      return;
    }
    
    // Make API calls to get travel times (home to work)
    const homeToWorkData = await fetchTravelTime(
      settings.HomeAddress,
      settings.WorkAddress,
      apiKey
    );
    
    // Make API calls to get travel times (work to home)
    const workToHomeData = await fetchTravelTime(
      settings.WorkAddress,
      settings.HomeAddress,
      apiKey
    );
    
    // Save to database
    if (homeToWorkData) {
      await pool.query(
        'INSERT INTO TravelTime (IsHomeToWork, Duration, Distance) VALUES (?, ?, ?)',
        [true, homeToWorkData.duration, homeToWorkData.distance]
      );
    }
    
    if (workToHomeData) {
      await pool.query(
        'INSERT INTO TravelTime (IsHomeToWork, Duration, Distance) VALUES (?, ?, ?)',
        [false, workToHomeData.duration, workToHomeData.distance]
      );
    }
    
    logger.info('Travel times updated successfully');
  } catch (error) {
    logger.error('Error updating travel times:', error);
  }
};

/**
 * Fetch travel time using Google Routes API
 * Documentation: https://developers.google.com/maps/documentation/routes
 */
const fetchTravelTime = async (
  origin: string,
  destination: string,
  apiKey?: string
): Promise<{ duration: number; distance: number } | null> => {
  try {
    // For development, return some mock data if no API key or env is development
    if (!apiKey || process.env.NODE_ENV === 'development') {
      logger.info('Using mock data for travel time calculation');
      return {
        duration: Math.floor(Math.random() * 3600) + 900, // 15-75 minutes in seconds
        distance: (Math.floor(Math.random() * 50) + 5) * 1000, // 5-55 km in meters
      };
    }
    
    logger.debug(`Fetching travel time from ${origin} to ${destination}`);
    
    // Google Routes API request
    const response = await axios.post(
      `https://routes.googleapis.com/directions/v2:computeRoutes`,
      {
        origin: {
          address: origin
        },
        destination: {
          address: destination
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false
        },
        languageCode: "en-US",
        units: "METRIC"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.travelAdvisory'
        }
      }
    );
    
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        duration: parseInt(route.duration.replace('s', ''), 10), // Remove 's' from duration string (e.g., '300s' -> 300)
        distance: route.distanceMeters,
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Error fetching travel time from Routes API:', error);
    return null;
  }
}; 