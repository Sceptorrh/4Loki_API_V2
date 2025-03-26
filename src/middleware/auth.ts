import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/session/sessionService';
import { logger } from '../utils/logger';
import pool from '../config/database';

// Extend the Request type to include the user property
export interface AuthRequest extends Request {
  user?: any;
}

// Paths that don't require authentication
const publicPaths = [
  '/api/v1/health',
  '/api/v1/google/auth/login-url',
  '/api/v1/google/auth/callback',
  '/api/auth/google/callback',
  '/api/auth/google/login-url',
  '/api/v1/google/auth/store-state',
  '/api/v1/google/maps/forward-geocode',
  '/api/v1/google/maps/places/autocomplete',
  '/api/v1/google/maps/places/details'
];

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Authentication middleware - Request received');
    logger.info('Full path:', req.originalUrl);

    // Check if the path is public
    if (publicPaths.some(path => req.originalUrl.startsWith(path))) {
      logger.info('Public path detected, skipping authentication');
      return next();
    }

    // First try to get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      logger.info('Token found in Authorization header');
      // TODO: Implement JWT token validation if needed
      return next();
    }

    // If no token, check for session ID
    logger.info('No token in Authorization header, checking session ID');
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      logger.error('No session ID found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Validate session using SessionService
    const sessionService = SessionService.getInstance();
    const isValid = await sessionService.validateSession(sessionId as string);

    if (!isValid) {
      logger.error('Invalid or expired session');
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    logger.info('Session validated successfully');
    next();
  } catch (error) {
    logger.error('Error in authentication middleware:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
}; 