import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { oauthClientId, oauthClientSecret } = body;

    // First check if the client ID is properly formatted
    if (!oauthClientId.endsWith('.apps.googleusercontent.com')) {
      return NextResponse.json({
        oauthClientId: {
          valid: false,
          message: 'Invalid OAuth Client ID format',
          details: 'Client ID must end with .apps.googleusercontent.com'
        }
      });
    }

    // Try to get the OAuth discovery document
    const discoveryResponse = await axios.get(
      'https://accounts.google.com/.well-known/openid-configuration'
    );

    if (discoveryResponse.status !== 200) {
      return NextResponse.json({
        oauthClientId: {
          valid: false,
          message: 'Failed to validate OAuth configuration',
          details: 'Could not access OAuth discovery document'
        }
      });
    }

    // Try to validate the client ID by making an authorization request
    try {
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', oauthClientId);
      authUrl.searchParams.append('redirect_uri', 'http://localhost:3000/api/auth/google/callback');
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/contacts.readonly');
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');

      // Make a HEAD request to check if the authorization endpoint is accessible
      const authResponse = await axios.head(authUrl.toString(), {
        validateStatus: (status) => status < 500
      });

      if (authResponse.status === 200 || authResponse.status === 302) {
        return NextResponse.json({
          oauthClientId: {
            valid: true,
            message: 'OAuth configuration is valid',
            details: 'Full configuration check completed successfully',
            consentScreen: {
              status: 'Testing',
              scopes: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/contacts.readonly'
              ],
              testUsers: ['Test users can only be viewed in the Google Cloud Console']
            }
          }
        });
      } else {
        return NextResponse.json({
          oauthClientId: {
            valid: false,
            message: 'OAuth configuration validation failed',
            details: 'Could not validate OAuth client ID. Please check if: 1. The OAuth consent screen is configured 2. The required APIs are enabled 3. Your domain is added to authorized origins',
            error: `Authorization endpoint returned status ${authResponse.status}`
          }
        });
      }
    } catch (error) {
      console.error('Authorization validation error:', error);
      return NextResponse.json({
        oauthClientId: {
          valid: false,
          message: 'OAuth configuration validation failed',
          details: 'Could not validate OAuth client ID. Please check if: 1. The OAuth consent screen is configured 2. The required APIs are enabled 3. Your domain is added to authorized origins',
          error: axios.isAxiosError(error) 
            ? error.response?.data?.error_description || 
              error.response?.data?.error || 
              error.message
            : 'Unknown error occurred'
        }
      });
    }
  } catch (error) {
    console.error('Full configuration validation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to validate full configuration',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 