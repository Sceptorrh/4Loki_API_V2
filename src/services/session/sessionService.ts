import { v4 as uuidv4 } from 'uuid';
import pool from '../../config/database';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

interface Session {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpires: Date;
  sessionExpires: Date;
}

export class SessionService {
  private static instance: SessionService;
  private tokenRefreshScheduler: NodeJS.Timeout | null = null;

  private constructor() {
    // Start token refresh scheduler
    this.startTokenRefreshScheduler();
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Create a new session for a user
   */
  public static async createSession(
    userId: string,
    accessToken: string,
    refreshToken: string,
    tokenExpiresIn: number
  ): Promise<string> {
    try {
      const sessionId = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const tokenExpiresAt = new Date(Date.now() + tokenExpiresIn * 1000);

      await pool.query(
        `INSERT INTO Sessions (id, user_id, access_token, refresh_token, token_expires, session_expires) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sessionId, userId, accessToken, refreshToken, tokenExpiresAt, expiresAt]
      );

      return sessionId;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Get session by ID
   */
  public async getSession(sessionId: string): Promise<Session | null> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM Sessions WHERE id = ? AND session_expires > NOW()',
        [sessionId]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }
      
      const row = rows[0] as any;
      return {
        id: row.id,
        userId: row.user_id,
        accessToken: row.access_token,
        refreshToken: row.refresh_token,
        tokenExpires: new Date(row.token_expires),
        sessionExpires: new Date(row.session_expires)
      };
    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Validate a session and check if it's expired
   */
  public async validateSession(sessionId: string): Promise<boolean> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM Sessions WHERE id = ? AND session_expires > NOW()',
        [sessionId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating session:', error);
      return false;
    }
  }

  /**
   * Delete a session
   */
  public async deleteSession(sessionId: string): Promise<void> {
    try {
      await pool.query('DELETE FROM Sessions WHERE id = ?', [sessionId]);
      logger.info(`Deleted session ${sessionId}`);
    } catch (error) {
      logger.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
    }
  }

  /**
   * Delete all sessions for a user
   */
  public async deleteUserSessions(userId: string): Promise<boolean> {
    try {
      await pool.query('DELETE FROM Sessions WHERE user_id = ?', [userId]);
      logger.info(`Deleted all sessions for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting user sessions:', error);
      return false;
    }
  }

  /**
   * Clean up expired sessions
   */
  public async cleanupExpiredSessions(): Promise<number> {
    try {
      const [result] = await pool.query('DELETE FROM Sessions WHERE session_expires < NOW()');
      const deletedCount = (result as any).affectedRows || 0;
      logger.info(`Cleaned up ${deletedCount} expired sessions`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get the access token for a session
   */
  public async getSessionToken(sessionId: string): Promise<string | null> {
    try {
      const [rows] = await pool.query(
        'SELECT access_token, token_expires FROM Sessions WHERE id = ? AND session_expires > NOW()',
        [sessionId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const row = rows[0] as { access_token: string; token_expires: Date };
      
      // Check if token is expired
      if (new Date(row.token_expires) <= new Date()) {
        return null;
      }

      return row.access_token;
    } catch (error) {
      logger.error('Error getting session token:', error);
      return null;
    }
  }

  /**
   * Update session tokens
   */
  public async updateSessionTokens(sessionId: string, accessToken: string, tokenExpiresIn: number): Promise<void> {
    try {
      const tokenExpires = new Date();
      tokenExpires.setSeconds(tokenExpires.getSeconds() + tokenExpiresIn);

      await pool.query(
        'UPDATE Sessions SET access_token = ?, token_expires = ?, updated_at = NOW() WHERE id = ?',
        [accessToken, tokenExpires, sessionId]
      );
    } catch (error) {
      logger.error('Error updating session tokens:', error);
      throw new Error('Failed to update session tokens');
    }
  }

  private startTokenRefreshScheduler() {
    // Implementation of startTokenRefreshScheduler method
  }
} 