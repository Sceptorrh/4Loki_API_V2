import axios from 'axios';
import { googleConfig } from './config';
import { Request, Response } from 'express';
import pool from '../../config/database';
import { SessionService } from '../session/sessionService';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

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
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  expiresIn: number;
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private tokenData: TokenData | null = null;
  private sessionService: SessionService;
  private tokenRefreshInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.sessionService = SessionService.getInstance();
    this.startTokenRefreshScheduler();
  }

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Get the current token data from memory
   */
  public getTokenData(): TokenData | null {
    return this.tokenData;
  }

  /**
   * Get access token for Google API calls
   */
  public async getAccessToken(code: string, redirectUri: string): Promise<string | null> {
    try {
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: googleConfig.auth.clientId,
        client_secret: googleConfig.auth.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Store tokens in memory
      this.tokenData = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
        expiresIn: expires_in
      };

      return access_token;
    } catch (error) {
      logger.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get user info from Google
   */
  public async getUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting user info:', error);
      return null;
    }
  }

  /**
   * Verify OAuth state parameter
   */
  public async verifyOAuthState(state: string): Promise<boolean> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM OAuthState WHERE state = ? AND expires > NOW()',
        [state]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return false;
      }

      // Delete used state
      await pool.query('DELETE FROM OAuthState WHERE state = ?', [state]);
      return true;
    } catch (error) {
      logger.error('Error verifying OAuth state:', error);
      return false;
    }
  }

  /**
   * Store OAuth state for CSRF protection
   */
  public async storeOAuthState(state: string): Promise<void> {
    try {
      // Set expiration for 10 minutes
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 10);
      
      await pool.query(
        'INSERT INTO OAuthState (state, expires) VALUES (?, ?)',
        [state, expires]
      );
    } catch (error) {
      logger.error('Error storing OAuth state:', error);
      throw new Error('Failed to store OAuth state');
    }
  }

  /**
   * Generate OAuth login URL
   */
  public async generateLoginUrl(): Promise<string> {
    try {
      // Generate state parameter
      const state = crypto.randomBytes(16).toString('hex');
      
      // Store state in database
      await this.storeOAuthState(state);

      // Generate login URL
      const loginUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      loginUrl.searchParams.append('client_id', googleConfig.auth.clientId);
      loginUrl.searchParams.append('redirect_uri', googleConfig.auth.redirectUri);
      loginUrl.searchParams.append('response_type', 'code');
      loginUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email');
      loginUrl.searchParams.append('access_type', 'offline');
      loginUrl.searchParams.append('prompt', 'consent');
      loginUrl.searchParams.append('state', state);

      return loginUrl.toString();
    } catch (error) {
      logger.error('Error generating login URL:', error);
      throw new Error('Failed to generate login URL');
    }
  }

  /**
   * Start token refresh scheduler
   */
  private startTokenRefreshScheduler(): void {
    // Check tokens every 10 minutes
    this.tokenRefreshInterval = setInterval(async () => {
      try {
        await this.refreshTokenIfNeeded();
      } catch (error) {
        logger.error('Error in token refresh scheduler:', error);
      }
    }, 10 * 60 * 1000);
  }

  /**
   * Refresh token if it's about to expire
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.tokenData) return;

    // Refresh if token expires in less than 15 minutes
    const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);
    if (this.tokenData.expiresAt < fifteenMinutesFromNow) {
      try {
        const response = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: googleConfig.auth.clientId,
          client_secret: googleConfig.auth.clientSecret,
          refresh_token: this.tokenData.refreshToken,
          grant_type: 'refresh_token'
        });

        this.tokenData = {
          accessToken: response.data.access_token,
          refreshToken: this.tokenData.refreshToken,
          expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
          expiresIn: response.data.expires_in
        };
      } catch (error) {
        logger.error('Error refreshing token:', error);
      }
    }
  }

  /**
   * Get the current access token, refreshing if necessary
   */
  public async getToken(sessionId: string): Promise<string | null> {
    try {
      const session = await this.sessionService.getSession(sessionId);
      if (!session) {
        return null;
      }

      // Check if token needs refreshing
      if (session.tokenExpires <= new Date()) {
        try {
          const response = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: googleConfig.auth.clientId,
            client_secret: googleConfig.auth.clientSecret,
            refresh_token: session.refreshToken,
            grant_type: 'refresh_token'
          });

          // Update session with new tokens
          await this.sessionService.updateSessionTokens(
            sessionId,
            response.data.access_token,
            response.data.expires_in
          );

          return response.data.access_token;
        } catch (error) {
          logger.error('Error refreshing token:', error);
          return null;
        }
      }

      return session.accessToken;
    } catch (error) {
      logger.error('Error getting token:', error);
      return null;
    }
  }
} 