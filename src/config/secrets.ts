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

// Try to load secrets from secrets file
const secretsFilePath = path.join(process.cwd(), 'secrets.json');
try {
  if (fs.existsSync(secretsFilePath)) {
    const secretsContent = fs.readFileSync(secretsFilePath, 'utf8');
    const parsedSecrets = JSON.parse(secretsContent);
    Object.assign(secrets, parsedSecrets);
    logger.info('Loaded API keys from secrets.json');
  } else {
    logger.info('No secrets.json file found, checking environment variables');
  }
} catch (error) {
  logger.error('Error reading secrets file:', error);
}

// If secrets aren't in the file, try environment variables
if (!secrets.ROUTES_API_KEY) {
  // Load from .env file if it exists
  dotenv.config();
  
  if (process.env.ROUTES_API_KEY) {
    secrets.ROUTES_API_KEY = process.env.ROUTES_API_KEY;
    logger.info('Loaded API key from environment variable');
  } else {
    logger.warn('No Routes API key found in secrets file or environment variables');
  }
}

export default secrets; 