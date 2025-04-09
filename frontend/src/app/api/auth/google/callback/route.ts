import { NextResponse } from 'next/server';
import axios from 'axios';
import { googleConfig } from '../../../../../config/google';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('=== Frontend Callback Start ===');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect('/login?error=' + error);
    }

    console.log('Received callback with:', {
      code: code ? code.substring(0, 10) + '...' : null,
      state: state ? state.substring(0, 10) + '...' : null,
      redirectUri: googleConfig.auth.redirectUri
    });

    if (!code || !state) {
      console.log('Missing required parameters:', { code: !!code, state: !!state });
      return NextResponse.redirect('/login?error=missing_params');
    }

    // Exchange code for token
    console.log('Sending token request to backend...');
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('redirectUri', googleConfig.auth.redirectUri);
    params.append('state', state);

    const tokenResponse = await axios.post(`${googleConfig.api.baseUrl}/google/auth/callback`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('Token response received:', {
      hasSessionId: !!tokenResponse.data.sessionId,
      hasUserInfo: !!tokenResponse.data.userInfo,
      sessionId: tokenResponse.data.sessionId ? tokenResponse.data.sessionId.substring(0, 10) + '...' : null
    });

    if (!tokenResponse.data.sessionId || !tokenResponse.data.userInfo) {
      console.log('Invalid response from backend:', tokenResponse.data);
      return NextResponse.redirect('/login?error=invalid_response');
    }

    // Create the response with redirect to frontend
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('session', tokenResponse.data.sessionId);
    const nextResponse = NextResponse.redirect(redirectUrl);

    console.log('Setting cookies...');
    // Set the session ID in a cookie
    nextResponse.cookies.set('session_id', tokenResponse.data.sessionId, {
      httpOnly: false, // Make it accessible to client-side JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    // Set the user info in a cookie (not httpOnly so frontend can read it)
    nextResponse.cookies.set('user_info', JSON.stringify(tokenResponse.data.userInfo), {
      httpOnly: false, // Make it accessible to client-side JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    console.log('Cookies set successfully');
    console.log('=== Frontend Callback End ===');
    return nextResponse;
  } catch (error) {
    console.error('=== Frontend Callback Error ===');
    console.error('Error in callback:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });

      // Handle specific error cases
      if (error.response?.status === 400) {
        return NextResponse.redirect(new URL('/login?error=invalid_request', request.url));
      } else if (error.response?.status === 401) {
        return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
      } else if (error.response?.status === 403) {
        return NextResponse.redirect(new URL('/login?error=forbidden', request.url));
      }
    }
    console.error('=== Frontend Callback Error End ===');
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
  }
} 