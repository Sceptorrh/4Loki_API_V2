import { NextResponse } from 'next/server';
import { googleConfig } from '../../../../../config/google';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';

// Load Google configuration from json file
function loadGoogleConfig() {
  const configPath = path.join(process.cwd(), '..', 'configuration', 'google.json');
  const configContent = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(configContent);
}

export async function GET() {
  try {
    const config = loadGoogleConfig();
    
    // Create the OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    
    // Add required parameters
    authUrl.searchParams.append('client_id', config.OAUTH_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', googleConfig.auth.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', googleConfig.auth.scopes.join(' '));
    
    // Add additional parameters for better UX
    authUrl.searchParams.append('access_type', 'offline'); // Get refresh token
    authUrl.searchParams.append('prompt', 'consent'); // Always show consent screen
    
    // Generate a secure state parameter
    const state = crypto.randomBytes(16).toString('hex');
    authUrl.searchParams.append('state', state);
    
    // Store state in the database through our backend
    try {
      await axios.post(`${googleConfig.api.baseUrl}/google/auth/store-state`, {
        state,
        expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
    } catch (error) {
      console.error('Failed to store state:', error);
      return NextResponse.redirect('/login?error=state_storage_failed');
    }
    
    console.log('Generated OAuth URL with state:', state);
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Failed to generate auth URL:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        config: {
          path: path.join(process.cwd(), '..', 'configuration', 'google.json'),
          exists: fs.existsSync(path.join(process.cwd(), '..', 'configuration', 'google.json'))
        }
      });
    }
    return NextResponse.redirect('/login?error=init_failed');
  }
} 