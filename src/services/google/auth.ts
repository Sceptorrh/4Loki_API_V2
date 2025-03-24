import axios from 'axios';
import { googleConfig } from './config';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

interface GoogleAuthResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private tokenData: TokenData | null = null;

  private constructor() {}

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Get the Google OAuth login URL
   */
  public getLoginUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: googleConfig.auth.clientId,
      redirect_uri: 'http://localhost:3001/api/auth/google/callback',
      response_type: 'code',
      scope: googleConfig.auth.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  public async getAccessToken(code: string, redirectUri: string): Promise<GoogleAuthResponse> {
    try {
      console.log('Attempting to get access token with:', {
        clientId: googleConfig.auth.clientId,
        redirectUri,
        code: code.substring(0, 10) + '...' // Log only part of the code for security
      });

      const response = await axios.post<GoogleAuthResponse>('https://oauth2.googleapis.com/token', {
        client_id: googleConfig.auth.clientId,
        client_secret: googleConfig.auth.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      console.log('Token response received:', {
        hasAccessToken: !!response.data.access_token,
        hasRefreshToken: !!response.data.refresh_token,
        expiresIn: response.data.expires_in
      });

      // Store token data in memory
      this.tokenData = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || this.tokenData?.refresh_token || '',
        expires_at: Date.now() + (response.data.expires_in * 1000)
      };

      return response.data;
    } catch (error) {
      console.error('Error getting access token:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
        throw new Error(`Failed to get access token: ${error.response?.data?.error_description || error.message}`);
      }
      throw new Error('Failed to get access token');
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    if (!this.tokenData?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      console.log('Refreshing access token...');
      const response = await axios.post<GoogleAuthResponse>('https://oauth2.googleapis.com/token', {
        client_id: googleConfig.auth.clientId,
        client_secret: googleConfig.auth.clientSecret,
        refresh_token: this.tokenData.refresh_token,
        grant_type: 'refresh_token'
      });

      console.log('Token refresh successful:', {
        hasAccessToken: !!response.data.access_token,
        expiresIn: response.data.expires_in
      });

      this.tokenData = {
        ...this.tokenData,
        access_token: response.data.access_token,
        expires_at: Date.now() + (response.data.expires_in * 1000)
      };

      return response.data.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
        throw new Error(`Failed to refresh access token: ${error.response?.data?.error_description || error.message}`);
      }
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  public async getValidAccessToken(): Promise<string> {
    if (!this.tokenData) {
      throw new Error('No token data available');
    }

    // If token is expired or about to expire in the next 5 minutes, refresh it
    if (Date.now() >= this.tokenData.expires_at - 300000) {
      console.log('Token expired or about to expire, refreshing...');
      return this.refreshAccessToken();
    }

    // Validate the current token
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.tokenData.access_token}`
        }
      });
      return this.tokenData.access_token;
    } catch (error) {
      console.log('Current token is invalid, refreshing...');
      return this.refreshAccessToken();
    }
  }

  /**
   * Get user information using the access token
   */
  public async getUserInfo(): Promise<GoogleUserInfo> {
    const accessToken = await this.getValidAccessToken();

    try {
      const response = await axios.get<GoogleUserInfo>('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error('Failed to get user info');
    }
  }

  /**
   * Clear the current token data
   */
  public clearTokenData(): void {
    this.tokenData = null;
  }
} 