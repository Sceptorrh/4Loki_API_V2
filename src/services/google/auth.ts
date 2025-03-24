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
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private accessToken: string | null = null;

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
      redirect_uri: redirectUri,
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
      const response = await axios.post<GoogleAuthResponse>('https://oauth2.googleapis.com/token', {
        client_id: googleConfig.auth.clientId,
        client_secret: googleConfig.auth.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      this.accessToken = response.data.access_token;
      return response.data;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to get access token');
    }
  }

  /**
   * Get user information using the access token
   */
  public async getUserInfo(): Promise<GoogleUserInfo> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await axios.get<GoogleUserInfo>('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error('Failed to get user info');
    }
  }

  /**
   * Clear the current access token
   */
  public clearAccessToken(): void {
    this.accessToken = null;
  }
} 