import axios from 'axios';
import { googleConfig } from './config';
import { Request, Response } from 'express';
import pool from '../../config/database';
import { SessionService } from '../session/sessionService';
import { logger } from '../../utils/logger';
import crypto from 'crypto';
import cron from 'node-cron';
import { RowDataPacket } from 'mysql2';

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

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  expiresIn: number;
}

interface SessionRow extends RowDataPacket {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires: Date;
  session_expires: Date;
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
      logger.info('=== Get Access Token Start ===');
      logger.info('Exchanging code for token:', {
        code: code.substring(0, 10) + '...',
        redirectUri,
        clientId: googleConfig.auth.clientId ? 'present' : 'missing',
        clientSecret: googleConfig.auth.clientSecret ? 'present' : 'missing'
      });

      // Verify we have the required credentials
      if (!googleConfig.auth.clientId || !googleConfig.auth.clientSecret) {
        logger.error('Missing OAuth credentials');
        return null;
      }

      const params = new URLSearchParams({
        code,
        client_id: googleConfig.auth.clientId,
        client_secret: googleConfig.auth.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      // Log the exact parameters being sent
      logger.info('Token exchange parameters:', {
        code: code.substring(0, 10) + '...',
        client_id: googleConfig.auth.clientId,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      logger.info('Making token exchange request to Google');
      const response = await axios.post('https://oauth2.googleapis.com/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      logger.info('Token exchange successful');
      this.tokenData = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000)
      };
      logger.info('=== Get Access Token End ===');
      return response.data.access_token;
    } catch (error) {
      logger.error('=== Get Access Token Error ===');
      logger.error('Error getting access token:', error);
      if (axios.isAxiosError(error)) {
        logger.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          requestData: {
            code: code.substring(0, 10) + '...',
            redirectUri,
            clientId: googleConfig.auth.clientId ? 'present' : 'missing',
            clientSecret: googleConfig.auth.clientSecret ? 'present' : 'missing'
          }
        });
      }
      logger.error('=== Get Access Token Error End ===');
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
      logger.info('Verifying OAuth state:', { state });
      
      const [rows] = await pool.query(
        'SELECT * FROM OAuthState WHERE state = ? AND expires > NOW()',
        [state]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        logger.error('State verification failed:', { 
          state,
          reason: !Array.isArray(rows) ? 'Invalid query result' : 'No matching state found or expired'
        });
        return false;
      }

      // Delete used state
      await pool.query('DELETE FROM OAuthState WHERE state = ?', [state]);
      logger.info('State verified and deleted successfully');
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

      // Log the redirectUri that will be used
      logger.info('Generating login URL with redirect URI:', googleConfig.auth.redirectUri);

      // Generate login URL
      const loginUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      loginUrl.searchParams.append('client_id', googleConfig.auth.clientId);
      loginUrl.searchParams.append('redirect_uri', googleConfig.auth.redirectUri);
      loginUrl.searchParams.append('response_type', 'code');
      loginUrl.searchParams.append('scope', googleConfig.auth.scopes.join(' '));
      loginUrl.searchParams.append('access_type', 'offline');
      loginUrl.searchParams.append('prompt', 'consent');
      loginUrl.searchParams.append('state', state);

      logger.info('Generated login URL with state:', state);
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
    logger.info('Starting token refresh scheduler');
    // Check tokens every minute using cron
    cron.schedule('* * * * *', async () => {
      try {
        // Get all active sessions
        const [sessions] = await pool.query<SessionRow[]>(
          'SELECT * FROM Sessions WHERE session_expires > NOW()'
        );

        if (!Array.isArray(sessions) || sessions.length === 0) {
          logger.info('No active sessions found');
          return;
        }

        logger.info(`Found ${sessions.length} active sessions`);

        for (const session of sessions) {
          try {
            // Get current time from database in UTC
            const [currentTimeResult] = await pool.query('SELECT NOW() as db_time');
            const currentTime = new Date((currentTimeResult as any)[0].db_time);
            const tokenExpiresAt = new Date(session.token_expires);
            const timeUntilExpiry = tokenExpiresAt.getTime() - currentTime.getTime();
            const minutesUntilExpiry = Math.round(timeUntilExpiry / 1000 / 60);

            // Only refresh if token expires in less than 15 minutes
            if (timeUntilExpiry < 15 * 60 * 1000) {
              logger.info(`Token for session ${session.id} needs refresh (expires in ${minutesUntilExpiry} minutes)`);
              
              const params = new URLSearchParams({
                client_id: googleConfig.auth.clientId,
                client_secret: googleConfig.auth.clientSecret,
                refresh_token: session.refresh_token,
                grant_type: 'refresh_token'
              });

              const response = await axios.post('https://oauth2.googleapis.com/token', params, {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              });

              await this.sessionService.updateSessionTokens(
                session.id,
                response.data.access_token,
                response.data.expires_in
              );

              logger.info(`Token refreshed for session ${session.id}`);
            } else {
              logger.info(`Token for session ${session.id} is still valid (${minutesUntilExpiry} minutes remaining)`);
            }
          } catch (error) {
            logger.error(`Error refreshing token for session ${session.id}:`, error);
            if (axios.isAxiosError(error)) {
              logger.error('Axios error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
              });
            }
          }
        }
      } catch (error) {
        logger.error('Error checking sessions for token refresh:', error);
      }
    });
  }

  /**
   * Get the current access token, refreshing if necessary
   */
  public async getToken(sessionId: string): Promise<string | null> {
    try {
      const session = await this.sessionService.getSession(sessionId);
      if (!session) {
        logger.error('No valid session found for session ID:', sessionId);
        return null;
      }

      // Check if token needs refreshing
      if (session.tokenExpires <= new Date()) {
        try {
          logger.info('Token expired - current token expires at:', session.tokenExpires);
          logger.info('Refreshing token for session:', sessionId);
          
          const params = new URLSearchParams({
            client_id: googleConfig.auth.clientId,
            client_secret: googleConfig.auth.clientSecret,
            refresh_token: session.refreshToken,
            grant_type: 'refresh_token'
          });

          const response = await axios.post('https://oauth2.googleapis.com/token', params, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });

          // Update session with new tokens
          await this.sessionService.updateSessionTokens(
            sessionId,
            response.data.access_token,
            response.data.expires_in
          );

          logger.info('Token refreshed successfully - new token expires at:', new Date(Date.now() + response.data.expires_in * 1000));
          return response.data.access_token;
        } catch (error) {
          logger.error('Error refreshing token:', error);
          return null;
        }
      }

      logger.info('Using existing valid token that expires at:', session.tokenExpires);
      return session.accessToken;
    } catch (error) {
      logger.error('Error getting token:', error);
      return null;
    }
  }
} 