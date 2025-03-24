import fs from 'fs';
import path from 'path';

interface GoogleConfig {
  OAUTH_CLIENT_ID: string;
  OAUTH_CLIENT_SECRET: string;
}

export function loadGoogleConfig(): GoogleConfig {
  try {
    // Read from the root configuration directory
    const configPath = path.join(process.cwd(), '..', 'configuration', 'google.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configContent) as GoogleConfig;
  } catch (error) {
    console.error('Failed to load Google configuration:', error);
    throw new Error('Failed to load Google API configuration. Please ensure configuration/google.json exists and is valid.');
  }
} 