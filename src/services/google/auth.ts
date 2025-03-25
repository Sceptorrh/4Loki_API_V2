import axios from 'axios';
import { googleConfig } from './config';
import { Request, Response } from 'express';
import pool from '../../config/database';

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
  public async getAccessToken(code: string, redirectUri: string, res: Response): Promise<GoogleAuthResponse> {
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

      // Store tokens in database
      await this.storeTokensInDb(
        response.data.access_token,
        response.data.refresh_token || this.tokenData.refresh_token,
        new Date(Date.now() + (response.data.expires_in * 1000))
      );

      // Store access token in cookie
      res.cookie('google_token', response.data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: response.data.expires_in * 1000 // Convert to milliseconds
      });

      // Store refresh token in a separate secure cookie
      if (response.data.refresh_token) {
        res.cookie('google_refresh_token', response.data.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
      }

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
   * Store tokens in the database
   */
  private async storeTokensInDb(accessToken: string, refreshToken: string, expiresAt: Date): Promise<void> {
    try {
      // Delete any existing tokens
      await pool.query('DELETE FROM GoogleAuth');
      
      // Insert new tokens
      await pool.query(
        'INSERT INTO GoogleAuth (access_token, refresh_token, expires_at) VALUES (?, ?, ?)',
        [accessToken, refreshToken, expiresAt]
      );
    } catch (error) {
      console.error('Error storing tokens in database:', error);
      throw new Error('Failed to store tokens in database');
    }
  }

  /**
   * Get tokens from the database
   */
  private async getTokensFromDb(): Promise<TokenData | null> {
    try {
      const [rows] = await pool.query('SELECT * FROM GoogleAuth ORDER BY id DESC LIMIT 1');
      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const row = rows[0] as any;
      return {
        access_token: row.access_token,
        refresh_token: row.refresh_token,
        expires_at: new Date(row.expires_at).getTime()
      };
    } catch (error) {
      console.error('Error getting tokens from database:', error);
      return null;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    try {
      // Try to get refresh token from memory first
      let refreshToken = this.tokenData?.refresh_token;
      
      // If not in memory, try to get from database
      if (!refreshToken) {
        const dbTokens = await this.getTokensFromDb();
        if (!dbTokens?.refresh_token) {
          throw new Error('No refresh token available - user needs to re-authenticate');
        }
        refreshToken = dbTokens.refresh_token;
      }

      console.log('Refreshing access token...');
      const response = await axios.post<GoogleAuthResponse>('https://oauth2.googleapis.com/token', {
        client_id: googleConfig.auth.clientId,
        client_secret: googleConfig.auth.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      console.log('Token refresh successful:', {
        hasAccessToken: !!response.data.access_token,
        expiresIn: response.data.expires_in
      });

      // Update token data in memory
      this.tokenData = {
        access_token: response.data.access_token,
        refresh_token: refreshToken,
        expires_at: Date.now() + (response.data.expires_in * 1000)
      };

      // Update tokens in database
      await this.storeTokensInDb(
        response.data.access_token,
        refreshToken,
        new Date(Date.now() + (response.data.expires_in * 1000))
      );

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
   * Get a valid access token
   */
  public async getValidAccessToken(req: Request): Promise<string> {
    try {
      // Try to get token from cookie-parser
      let token = req.cookies?.google_token;
      
      // If not found, try to parse raw cookies
      if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split('; ');
        const tokenCookie = cookies.find(cookie => cookie.startsWith('google_token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }

      // If no token in cookies, try to get from database
      if (!token) {
        const dbTokens = await this.getTokensFromDb();
        if (dbTokens) {
          // Check if token is expired
          if (Date.now() >= dbTokens.expires_at) {
            // Token is expired, try to refresh it
            return await this.refreshAccessToken();
          }
          return dbTokens.access_token;
        }
      }

      if (!token) {
        throw new Error('No Google token found');
      }
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  /**
   * Get user information using the access token
   */
  public async getUserInfo(req: Request): Promise<GoogleUserInfo> {
    const accessToken = await this.getValidAccessToken(req);

    try {
      const response = await axios.get<GoogleUserInfo>('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting user info:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get user info: ${error.response?.data?.error_description || error.message}`);
      }
      throw new Error('Failed to get user info');
    }
  }

  /**
   * Clear the current token data
   */
  public async clearTokenData(res: Response): Promise<void> {
    this.tokenData = null;
    res.clearCookie('google_token');
    res.clearCookie('google_token_expires');
    res.clearCookie('google_refresh_token');
    
    // Clear tokens from database
    try {
      await pool.query('DELETE FROM GoogleAuth');
    } catch (error) {
      console.error('Error clearing tokens from database:', error);
    }
  }

  /**
   * Get the current token data
   */
  public getTokenData(): TokenData | null {
    return this.tokenData;
  }
} 