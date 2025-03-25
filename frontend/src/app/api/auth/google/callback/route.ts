import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load Google configuration from json file
function loadGoogleConfig() {
  const configPath = path.join(process.cwd(), '..', 'configuration', 'google.json');
  const configContent = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(configContent);
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const BASE_URL = API_URL.endsWith('/api/v1') ? API_URL.replace(/\/api\/v1$/, '') : API_URL;
const FRONTEND_URL = 'http://localhost:3001';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const redirectUri = `${FRONTEND_URL}/api/auth/google/callback`;

    console.log('Received callback with:', {
      code: code ? code.substring(0, 10) + '...' : null,
      redirectUri
    });

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Exchange code for token
    console.log('Sending token request to backend...');
    const tokenResponse = await axios.post(`${BASE_URL}/api/v1/google/auth/callback`, {
      code,
      redirectUri
    });

    console.log('Token response received:', {
      hasAccessToken: !!tokenResponse.data.access_token,
      hasUserInfo: !!tokenResponse.data.userInfo
    });

    if (!tokenResponse.data.access_token) {
      return NextResponse.json({ error: 'No access token received' }, { status: 500 });
    }

    // Create the response with redirect to frontend
    const redirectUrl = new URL('/', FRONTEND_URL);
    const nextResponse = NextResponse.redirect(redirectUrl);

    // Set the access token in a cookie
    nextResponse.cookies.set('google_token', tokenResponse.data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600 // 1 hour
    });

    // Set the refresh token in a cookie if it exists
    if (tokenResponse.data.refresh_token) {
      nextResponse.cookies.set('google_refresh_token', tokenResponse.data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Error in Google callback:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      return NextResponse.json(
        { error: error.response?.data?.message || 'Authentication failed' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 