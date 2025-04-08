import { google } from 'googleapis';
import { googleConfig } from './config';
import fs from 'fs';
import path from 'path';
import { GoogleAuthService } from './auth';
import axios from 'axios';
import { Readable, Writable } from 'stream';
import pool from '../../config/database';
import { generateBackup } from '../../controllers/backupController';
import { SessionService } from '../../services/session';
import { logger } from '../../utils/logger';
import { RowDataPacket } from 'mysql2';

// Interface for backup configuration
interface BackupConfig {
  googleDrive: {
    enabled: boolean;
    folderId: string;
    autoBackup: {
      enabled: boolean;
      interval: 'daily' | 'weekly' | 'monthly' | 'hourly';
      maxFiles: number;
      time: string;
      sessionId?: string;
      userId?: string;
    };
  };
}

interface SessionRow extends RowDataPacket {
  id: string;
  user_id: string;
  token_expires: Date;
  session_expires: Date;
}

interface BackupRow extends RowDataPacket {
  created_at: Date;
}

/**
 * Load backup configuration from configuration/backup.json
 */
export function loadBackupConfig(): BackupConfig {
  try {
    const configPath = path.join(process.cwd(), 'configuration', 'backup.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configContent) as BackupConfig;
  } catch (error) {
    console.error('Failed to load backup configuration:', error);
    throw new Error('Failed to load backup configuration. Please ensure configuration/backup.json exists and is valid.');
  }
}

/**
 * Get Google Drive client using OAuth token
 */
async function getDriveClient(sessionId: string) {
  const googleAuth = GoogleAuthService.getInstance();
  const accessToken = await googleAuth.getToken(sessionId);
  
  if (!accessToken) {
    throw new Error('No valid token available. User needs to authenticate.');
  }
  
  const auth = new google.auth.OAuth2(
    googleConfig.auth.clientId,
    googleConfig.auth.clientSecret
  );
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
}

/**
 * Upload a file to Google Drive
 */
export async function uploadToDrive(fileBuffer: Buffer, fileName: string, accessToken: string): Promise<string> {
  try {
    // Check if Google Drive is configured
    const configPath = path.join(process.cwd(), 'configuration', 'backup.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Backup configuration not found');
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!config.googleDrive?.enabled || !config.googleDrive?.folderId) {
      throw new Error('Google Drive backup is not configured');
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Create file metadata
    const fileMetadata = {
      name: fileName,
      parents: [config.googleDrive.folderId]
    };

    // Create a readable stream from the buffer
    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);

    // Create media
    const media = {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      body: stream
    };

    // Upload file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });

    return response.data.id || '';
  } catch (error: any) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error('Failed to upload file to Google Drive');
  }
}

/**
 * List files from Google Drive
 */
export async function listDriveFiles(accessToken: string): Promise<any[]> {
  const config = loadBackupConfig();
  if (!config.googleDrive.enabled || !config.googleDrive.folderId) {
    throw new Error('Google Drive backup is not configured');
  }

  try {
    const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params: {
        fields: 'files(id, name, mimeType, createdTime, modifiedTime)',
        pageSize: 100,
        q: `'${config.googleDrive.folderId}' in parents and mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`,
        orderBy: 'modifiedTime desc'
      }
    });

    return response.data.files || [];
  } catch (error) {
    console.error('Error listing Google Drive files:', error);
    throw new Error('Failed to list Google Drive files');
  }
}

/**
 * Download a file from Google Drive
 */
export async function downloadFromDrive(fileId: string, req: any): Promise<Buffer> {
  const config = loadBackupConfig();
  if (!config.googleDrive.enabled) {
    throw new Error('Google Drive backup is not configured');
  }

  const sessionId = req.headers['x-session-id'] as string;
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  const drive = await getDriveClient(sessionId);

  try {
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, {
      responseType: 'arraybuffer'
    });

    // Handle the arraybuffer response
    const arrayBuffer = response.data as ArrayBuffer;
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error downloading from Google Drive:', error);
    throw new Error('Failed to download file from Google Drive');
  }
}

/**
 * Delete old backup files based on the configured maximum files to keep
 */
export async function cleanupOldBackups(accessToken: string): Promise<void> {
  const config = loadBackupConfig();
  if (!config.googleDrive.enabled || !config.googleDrive.folderId) {
    return;
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  const drive = google.drive({ version: 'v3', auth });
  const maxFiles = config.googleDrive.autoBackup.maxFiles;

  try {
    const response = await drive.files.list({
      q: `'${config.googleDrive.folderId}' in parents and mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`,
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    const files = response.data.files || [];
    if (files.length > maxFiles) {
      const filesToDelete = files.slice(maxFiles);
      for (const file of filesToDelete) {
        await drive.files.delete({
          fileId: file.id!
        });
      }
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
    throw new Error('Failed to clean up old backup files');
  }
}

/**
 * Check if it's time to perform an automatic backup
 */
export async function shouldPerformAutoBackup(userId: string): Promise<boolean> {
  try {
    // Get backup configuration
    const config = await loadBackupConfig();
    if (!config?.googleDrive?.autoBackup?.enabled || !config?.googleDrive?.autoBackup?.userId) {
      logger.info('Auto backup is not enabled or no user ID configured');
      return false;
    }

    if (config.googleDrive.autoBackup.userId !== userId) {
      logger.info('User ID mismatch in backup configuration');
      return false;
    }

    // Get current time from database in UTC
    const [currentTimeResult] = await pool.query('SELECT NOW() as db_time');
    const currentTime = new Date((currentTimeResult as any)[0].db_time);

    // Get the most recent backup for this user
    const [backups] = await pool.query<BackupRow[]>(
      'SELECT * FROM backup_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (!Array.isArray(backups) || backups.length === 0) {
      logger.info('No previous backups found for user:', userId);
      return true;
    }

    const lastBackup = backups[0];
    const lastBackupTime = new Date(lastBackup.created_at);
    const timeSinceLastBackup = currentTime.getTime() - lastBackupTime.getTime();
    const hoursSinceLastBackup = timeSinceLastBackup / (1000 * 60 * 60);

    logger.info(`Last backup was ${hoursSinceLastBackup.toFixed(2)} hours ago (UTC)`);
    logger.info(`Current time (UTC from DB): ${currentTime.toISOString()}`);
    logger.info(`Last backup time (UTC): ${lastBackupTime.toISOString()}`);

    // Convert interval to hours
    let intervalHours: number;
    switch (config.googleDrive.autoBackup.interval) {
      case 'hourly':
        intervalHours = 1;
        break;
      case 'daily':
        intervalHours = 24;
        break;
      case 'weekly':
        intervalHours = 24 * 7;
        break;
      case 'monthly':
        intervalHours = 24 * 30;
        break;
      default:
        logger.error('Invalid backup interval:', config.googleDrive.autoBackup.interval);
        return false;
    }

    // Check if enough time has passed since last backup
    return hoursSinceLastBackup >= intervalHours;
  } catch (error) {
    logger.error('Error checking automatic backup schedule:', error);
    return false;
  }
}

/**
 * Perform automatic backup
 */
export async function performAutoBackup(): Promise<void> {
  try {
    const config = await loadBackupConfig();
    if (!config?.googleDrive?.autoBackup?.enabled) {
      logger.info('Automatic backup is not enabled');
      return;
    }

    const { userId } = config.googleDrive.autoBackup;
    if (!userId) {
      logger.error('No user ID found in backup configuration');
      return;
    }

    // Get the most recent active session for this user
    const [sessions] = await pool.query<SessionRow[]>(
      'SELECT * FROM Sessions WHERE user_id = ? AND session_expires > NOW() ORDER BY session_expires DESC LIMIT 1',
      [userId]
    );

    if (!Array.isArray(sessions) || sessions.length === 0) {
      logger.error('No active session found for user:', userId);
      return;
    }

    const session = sessions[0];
    logger.info(`Using session ${session.id} for automatic backup`);

    // Check if token needs refreshing
    const now = new Date();
    if (session.token_expires <= now) {
      logger.info('Token expired, refreshing...');
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: googleConfig.auth.clientId,
        client_secret: googleConfig.auth.clientSecret,
        refresh_token: session.refresh_token,
        grant_type: 'refresh_token'
      });

      // Update session with new tokens
      const sessionService = SessionService.getInstance();
      await sessionService.updateSessionTokens(
        session.id,
        response.data.access_token,
        response.data.expires_in
      );

      logger.info('Token refreshed successfully');
    }

    // Create a buffer to store the backup data
    const chunks: Buffer[] = [];
    
    // Create a proper Writable stream implementation
    const mockRes = new Writable({
      write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        chunks.push(chunk);
        callback();
      }
    });

    // Generate the backup
    await generateBackup({} as any, mockRes);

    // Combine all chunks into a single buffer
    const fileBuffer = Buffer.concat(chunks);
    
    // Upload to Google Drive
    const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
    const accessToken = session.access_token;
    
    // Upload the file to Google Drive
    const fileId = await uploadToDrive(fileBuffer, fileName, accessToken);
    if (!fileId) {
      logger.error('Failed to upload backup to Google Drive');
      return;
    }

    // Record backup in history
    await pool.query(
      'INSERT INTO backup_history (user_id, file_name, file_id, created_at) VALUES (?, ?, ?, NOW())',
      [userId, fileName, fileId]
    );

    // Cleanup old backups
    await cleanupOldBackups(accessToken);

    logger.info('Automatic backup completed successfully');
  } catch (error) {
    logger.error('Error performing automatic backup:', error);
  }
} 