import fs from 'fs';
import path from 'path';

// Interface for Google configuration
interface GoogleConfig {
  ROUTES_API_KEY: string;
  OAUTH_CLIENT_ID: string;
  OAUTH_CLIENT_SECRET: string;
  [key: string]: string;
}

/**
 * Load API keys and other configuration from configuration/google.json
 */
export function loadSecrets(): GoogleConfig {
  try {
    // Path is relative to the project root
    const configPath = path.join(process.cwd(), 'configuration', 'google.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configContent) as GoogleConfig;
  } catch (error) {
    console.error('Failed to load Google configuration:', error);
    throw new Error('Failed to load Google API configuration. Please ensure configuration/google.json exists and is valid.');
  }
}

// Configuration for Google services
export const googleConfig = {
  // Get the API key from configuration
  apiKey: loadSecrets().ROUTES_API_KEY,
  
  // OAuth configuration
  auth: {
    clientId: loadSecrets().OAUTH_CLIENT_ID,
    clientSecret: loadSecrets().OAUTH_CLIENT_SECRET,
    scopes: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly'
    ]
  },
  
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