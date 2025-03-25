import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Extend the Request type to include the user property
export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  logger.info('Authentication middleware - Request received');
  logger.info('Headers:', req.headers);
  logger.info('Cookies:', req.headers.cookie);
  logger.info('Full path:', req.originalUrl);

  // First check Authorization header
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // If no token in header, check cookies
  if (!token) {
    logger.info('No token in Authorization header, checking cookies');
    const cookies = req.headers.cookie?.split('; ') || [];
    const tokenCookie = cookies.find(cookie => cookie.startsWith('google_token='));
    if (tokenCookie) {
      token = tokenCookie.split('=')[1];
      logger.info('Found Google token in cookies');
    } else {
      logger.info('No Google token found in cookies');
    }
  } else {
    logger.info('Found token in Authorization header');
  }

  if (!token) {
    logger.error('No token found in request');
    return res.status(401).json({ message: 'Authentication token is required' });
  }

  // Check if this is a backup route using the full path
  const isBackupRoute = req.originalUrl.includes('/api/v1/backup/') || req.originalUrl === '/api/v1/backup';
  logger.info(`Full path: ${req.originalUrl}, isBackupRoute: ${isBackupRoute}`);

  // For backup routes, just pass the token through
  if (isBackupRoute) {
    logger.info('Backup route detected, passing through Google token');
    req.user = { token }; // Just pass the token through
    return next();
  }

  // For other routes, verify as JWT
  try {
    logger.info('Verifying JWT token');
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = user;
    logger.info('JWT token verified successfully');
    next();
  } catch (error) {
    logger.error('JWT verification failed:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}; 