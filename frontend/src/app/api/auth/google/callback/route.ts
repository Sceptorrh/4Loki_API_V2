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
    const state = searchParams.get('state');
    const redirectUri = `${FRONTEND_URL}/api/auth/google/callback`;

    console.log('Received callback with:', {
      code: code ? code.substring(0, 10) + '...' : null,
      state: state ? state.substring(0, 10) + '...' : null,
      redirectUri
    });

    if (!code || !state) {
      return NextResponse.json({ error: 'Code and state are required' }, { status: 400 });
    }

    // Exchange code for token
    console.log('Sending token request to backend...');
    const tokenResponse = await axios.post(`${BASE_URL}/api/v1/google/auth/callback`, {
      code,
      redirectUri,
      state
    });

    console.log('Token response received:', {
      hasSessionId: !!tokenResponse.data.sessionId,
      hasUserInfo: !!tokenResponse.data.userInfo
    });

    if (!tokenResponse.data.sessionId || !tokenResponse.data.userInfo) {
      return NextResponse.json({ error: 'Invalid response from backend' }, { status: 500 });
    }

    // Create the response with redirect to frontend
    const redirectUrl = new URL('/', FRONTEND_URL);
    const nextResponse = NextResponse.redirect(redirectUrl);

    // Set the session ID in a cookie
    nextResponse.cookies.set('session_id', tokenResponse.data.sessionId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    // Set the user info in a cookie
    nextResponse.cookies.set('user_info', JSON.stringify(tokenResponse.data.userInfo), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return nextResponse;
  } catch (error) {
    console.error('Error in callback:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    return NextResponse.redirect(`${FRONTEND_URL}/login?error=callback_failed`);
  }
} 