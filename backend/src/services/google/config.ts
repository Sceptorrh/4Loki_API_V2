import fs from 'fs';
import path from 'path';

// Interface for Google configuration
interface GoogleConfig {
  ROUTES_API_KEY: string;
  OAUTH_CLIENT_ID: string;
  OAUTH_CLIENT_SECRET: string;
  AUTHORIZED_USER_EMAIL: string;
  [key: string]: string;
}

// Default configuration template
const defaultConfig: GoogleConfig = {
  ROUTES_API_KEY: '',
  OAUTH_CLIENT_ID: '',
  OAUTH_CLIENT_SECRET: '',
  AUTHORIZED_USER_EMAIL: ''
};

/**
 * Load API keys and other configuration from configuration/google.json
 * Creates the file with default values if it doesn't exist
 */
export function loadSecrets(): GoogleConfig {
  try {
    // Log the current working directory to help with debugging
    console.log('Current working directory:', process.cwd());
    
    // Try multiple potential locations for the config file
    const potentialPaths = [
      // Option 1: Relative to current working directory
      path.join(process.cwd(), 'configuration', 'google.json'),
      // Option 2: Up one level from current directory
      path.join(process.cwd(), '..', 'configuration', 'google.json'),
      // Option 3: Absolute path (if you know the exact location)
      '/c:/Users/Bradl/Documents/Projecten/CursorProjects/4Loki_API_V2/configuration/google.json'
    ];
    
    console.log('Searching for configuration in:');
    potentialPaths.forEach(p => console.log(`- ${p} (exists: ${fs.existsSync(p)})`));
    
    // Find the first path that exists
    let configPath = potentialPaths.find(p => fs.existsSync(p));
    
    if (!configPath) {
      console.error('Could not find configuration file in any of the expected locations');
      console.error('Creating default configuration in:', potentialPaths[0]);
      
      // Create default config in the first path
      const configDir = path.dirname(potentialPaths[0]);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(potentialPaths[0], JSON.stringify(defaultConfig, null, 2));
      console.warn('Created new Google configuration file at:', potentialPaths[0]);
      console.warn('Please update the configuration with your Google API credentials.');
      return defaultConfig;
    }
    
    console.log('Found configuration file at:', configPath);
    const configContent = fs.readFileSync(configPath, 'utf8');
    const parsedConfig = JSON.parse(configContent) as GoogleConfig;
    
    // Log config values (with secrets partially hidden)
    console.log('Loaded configuration:', {
      ROUTES_API_KEY: parsedConfig.ROUTES_API_KEY ? `${parsedConfig.ROUTES_API_KEY.substring(0, 8)}...` : 'missing',
      OAUTH_CLIENT_ID: parsedConfig.OAUTH_CLIENT_ID ? `${parsedConfig.OAUTH_CLIENT_ID.substring(0, 8)}...` : 'missing',
      OAUTH_CLIENT_SECRET: parsedConfig.OAUTH_CLIENT_SECRET ? `${parsedConfig.OAUTH_CLIENT_SECRET.substring(0, 8)}...` : 'missing',
      AUTHORIZED_USER_EMAIL: parsedConfig.AUTHORIZED_USER_EMAIL || 'missing'
    });
    
    return parsedConfig;
  } catch (error) {
    console.error('Failed to load Google configuration:', error);
    throw new Error('Failed to load Google API configuration. Please ensure configuration/google.json exists and is valid.');
  }
}

// Load secrets once
const secrets = loadSecrets();

// Configuration for Google services
export const googleConfig = {
  // Get the API key from configuration
  apiKey: secrets.ROUTES_API_KEY,
  
  // OAuth configuration
  auth: {
    clientId: secrets.OAUTH_CLIENT_ID,
    clientSecret: secrets.OAUTH_CLIENT_SECRET,
    redirectUri: 'http://localhost:3001/api/auth/google/callback',
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
    directions: 'https://maps.googleapis.com/maps/api/directions/json',
    
    // Places API v1 endpoints (new)
    placesAutocomplete: 'https://places.googleapis.com/v1/places:searchText',
    placesDetails: 'https://places.googleapis.com/v1/places'
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