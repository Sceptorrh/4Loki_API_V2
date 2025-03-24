import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Define secrets interface
interface Secrets {
  ROUTES_API_KEY?: string;
  // Add other secrets as needed
}

// Initialize secrets object
const secrets: Secrets = {};

// Try to load secrets from configuration file
const configDir = path.join(process.cwd(), 'configuration');
const googleConfigPath = path.join(configDir, 'google.json');

try {
  if (fs.existsSync(googleConfigPath)) {
    const configContent = fs.readFileSync(googleConfigPath, 'utf8');
    const parsedConfig = JSON.parse(configContent);
    Object.assign(secrets, parsedConfig);
    logger.info('Loaded API keys from configuration/google.json');
  } else {
    logger.info('No configuration/google.json file found, checking environment variables');
  }
} catch (error) {
  logger.error('Error reading configuration file:', error);
}

// If secrets aren't in the file, try environment variables
if (!secrets.ROUTES_API_KEY) {
  // Load from .env file if it exists
  dotenv.config();
  
  if (process.env.ROUTES_API_KEY) {
    secrets.ROUTES_API_KEY = process.env.ROUTES_API_KEY;
    logger.info('Loaded API key from environment variable');
  } else {
    logger.warn('No Routes API key found in configuration file or environment variables');
  }
}

export default secrets; 