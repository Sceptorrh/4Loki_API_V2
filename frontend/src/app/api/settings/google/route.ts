import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Get the path to the configuration directory in the root
const CONFIG_DIR = path.join(process.cwd(), '..', 'configuration');
const GOOGLE_CONFIG_FILE = path.join(CONFIG_DIR, 'google.json');

console.log('Current working directory:', process.cwd());
console.log('Config directory:', CONFIG_DIR);
console.log('Google Config File:', GOOGLE_CONFIG_FILE);
console.log('Config directory exists:', fs.existsSync(CONFIG_DIR));
console.log('Config file exists:', fs.existsSync(GOOGLE_CONFIG_FILE));

// Helper function to read settings
const readSettings = () => {
  try {
    if (!fs.existsSync(GOOGLE_CONFIG_FILE)) {
      console.error('Config file does not exist at:', GOOGLE_CONFIG_FILE);
      return {
        ROUTES_API_KEY: '',
        OAUTH_CLIENT_ID: '',
        OAUTH_CLIENT_SECRET: ''
      };
    }
    const data = fs.readFileSync(GOOGLE_CONFIG_FILE, 'utf8');
    console.log('Read settings:', data);
    const parsed = JSON.parse(data);
    console.log('Parsed settings:', parsed);
    return parsed;
  } catch (error) {
    console.error('Error reading settings:', error);
    return {
      ROUTES_API_KEY: '',
      OAUTH_CLIENT_ID: '',
      OAUTH_CLIENT_SECRET: ''
    };
  }
};

// Helper function to write settings
const writeSettings = (settings: any) => {
  try {
    fs.writeFileSync(GOOGLE_CONFIG_FILE, JSON.stringify(settings, null, 2));
    console.log('Wrote settings:', settings);
    return true;
  } catch (error) {
    console.error('Error writing settings:', error);
    return false;
  }
};

export async function GET() {
  try {
    const settings = readSettings();
    console.log('GET response settings:', settings);
    return NextResponse.json({
      apiKey: settings.ROUTES_API_KEY || '',
      oauthClientId: settings.OAUTH_CLIENT_ID || '',
      oauthClientSecret: settings.OAUTH_CLIENT_SECRET || ''
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Failed to read settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, oauthClientId, oauthClientSecret } = body;
    console.log('POST request body:', body);

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const settings = readSettings();
    settings.ROUTES_API_KEY = apiKey;
    settings.OAUTH_CLIENT_ID = oauthClientId || '';
    settings.OAUTH_CLIENT_SECRET = oauthClientSecret || '';

    const success = writeSettings(settings);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 