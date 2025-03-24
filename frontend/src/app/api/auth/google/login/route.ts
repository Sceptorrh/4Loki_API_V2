import { NextResponse } from 'next/server';
import { googleConfig } from '../../../../../config/google';
import fs from 'fs';
import path from 'path';

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
    authUrl.searchParams.append('redirect_uri', 'http://localhost:3001/api/auth/google/callback');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', googleConfig.auth.scopes.join(' '));
    
    // Add additional parameters for better UX
    authUrl.searchParams.append('access_type', 'offline'); // Get refresh token
    authUrl.searchParams.append('prompt', 'consent'); // Always show consent screen
    
    // Generate a state parameter to prevent CSRF
    const state = Math.random().toString(36).substring(7);
    authUrl.searchParams.append('state', state);
    
    // Store state in cookie for validation in callback
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10 // 10 minutes
    });
    
    console.log('Setting OAuth state:', state);
    return response;
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
    return NextResponse.redirect('http://localhost:3001/login?error=init_failed');
  }
} 