import fs from 'fs';
import path from 'path';

// Interface for secrets.json structure
interface Secrets {
  ROUTES_API_KEY: string;
  [key: string]: string;
}

/**
 * Load API keys and other configuration from secrets.json
 */
export function loadSecrets(): Secrets {
  try {
    // Path is relative to the project root
    const secretsPath = path.join(process.cwd(), 'secrets.json');
    const secretsContent = fs.readFileSync(secretsPath, 'utf8');
    return JSON.parse(secretsContent) as Secrets;
  } catch (error) {
    console.error('Failed to load secrets.json:', error);
    throw new Error('Failed to load Google API configuration. Please ensure secrets.json exists and is valid.');
  }
}

// Configuration for Google services
export const googleConfig = {
  // Get the API key from secrets.json
  apiKey: loadSecrets().ROUTES_API_KEY,
  
  // Base URLs for different Google APIs
  maps: {
    // Routes API v2 endpoints (newer replacement for Distance Matrix and Directions)
    routesUrl: 'https://routes.googleapis.com/directions/v2:computeRoutes',
    routeMatrixUrl: 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix',
    
    // Legacy endpoints (kept for reference)
    distanceMatrixUrl: 'https://maps.googleapis.com/maps/api/distancematrix/json',
    geocodingUrl: 'https://maps.googleapis.com/maps/api/geocode/json',
    directions: 'https://maps.googleapis.com/maps/api/directions/json'
  },
  
  // Default request parameters
  defaultParams: {
    // For Routes API
    routes: {
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      polylineQuality: 'OVERVIEW',
      languageCode: 'en-US',
      units: 'METRIC'
    },
    
    // For Distance Matrix API (legacy)
    distanceMatrix: {
      units: 'metric',
      mode: 'driving', // Options: driving, walking, bicycling, transit
      language: 'en',
      avoid: '',       // Options: tolls, highways, ferries, indoor
      departure_time: 'now'
    }
  }
}; 