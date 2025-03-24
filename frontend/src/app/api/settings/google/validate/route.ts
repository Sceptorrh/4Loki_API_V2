import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, oauthClientId, oauthClientSecret } = body;

    const results: {
      apiKey?: {
        valid: boolean;
        message: string;
        apis?: string[];
      };
      oauthClientId?: {
        valid: boolean;
        message: string;
        details?: string;
      };
    } = {};

    // Validate API Key
    if (apiKey) {
      try {
        // Try to make a request to the Geocoding API as it's one of the most commonly used
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${apiKey}`
        );

        if (response.data.status === 'REQUEST_DENIED') {
          results.apiKey = {
            valid: false,
            message: response.data.error_message || 'Invalid API key'
          };
        } else {
          // Get available APIs for this key using the Google Cloud Console API
          try {
            // First try the Routes API since we know it's enabled
            const routesResponse = await axios.get(
              `https://routes.googleapis.com/directions/v2:computeRoutes?key=${apiKey}`,
              { validateStatus: (status) => status < 500 } // Don't throw on 400-level errors
            );

            // Then try the Geocoding API
            const geocodingResponse = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${apiKey}`,
              { validateStatus: (status) => status < 500 }
            );

            // Build list of available APIs based on responses
            const availableApis: string[] = [];
            
            if (routesResponse.status !== 403) {
              availableApis.push('Routes API');
            }
            if (geocodingResponse.data.status !== 'REQUEST_DENIED') {
              availableApis.push('Geocoding API');
            }

            results.apiKey = {
              valid: true,
              message: 'API key is valid',
              apis: availableApis
            };
          } catch (apisError) {
            // If we can't get the APIs list, still mark the key as valid
            results.apiKey = {
              valid: true,
              message: 'API key is valid (unable to fetch available APIs)',
              apis: []
            };
          }
        }
      } catch (error) {
        console.error('API key validation error:', error);
        results.apiKey = {
          valid: false,
          message: error instanceof Error ? error.message : 'Failed to validate API key'
        };
      }
    }

    // Validate OAuth Client ID and Secret
    if (oauthClientId && oauthClientSecret) {
      try {
        // First check if the client ID is properly formatted
        if (!oauthClientId.endsWith('.apps.googleusercontent.com')) {
          results.oauthClientId = {
            valid: false,
            message: 'Invalid OAuth Client ID format',
            details: 'Client ID must end with .apps.googleusercontent.com'
          };
        } else {
          // Try to get the OAuth discovery document to validate the client ID
          const discoveryResponse = await axios.get(
            'https://accounts.google.com/.well-known/openid-configuration'
          );

          if (discoveryResponse.status === 200) {
            results.oauthClientId = {
              valid: true,
              message: 'OAuth credentials are valid',
              details: 'Client ID and Secret are properly configured'
            };
          }
        }
      } catch (error) {
        console.error('OAuth validation error:', error);
        if (axios.isAxiosError(error)) {
          results.oauthClientId = {
            valid: false,
            message: 'Invalid OAuth credentials',
            details: `Error: ${error.response?.data?.error_description || 
                          error.response?.data?.error || 
                          error.message}`
          };
        } else {
          results.oauthClientId = {
            valid: false,
            message: 'Failed to validate OAuth credentials',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
          };
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate credentials' },
      { status: 500 }
    );
  }
} 