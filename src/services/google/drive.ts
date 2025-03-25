import { google } from 'googleapis';
import { googleConfig } from './config';
import fs from 'fs';
import path from 'path';
import { GoogleAuthService } from './auth';

// Interface for backup configuration
interface BackupConfig {
  googleDrive: {
    enabled: boolean;
    folderId: string;
    autoBackup: {
      enabled: boolean;
      interval: 'daily' | 'weekly' | 'monthly';
      maxFiles: number;
      time: string;
    };
  };
}

/**
 * Load backup configuration from configuration/backup.json
 */
function loadBackupConfig(): BackupConfig {
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
 * Initialize Google Drive API client with valid credentials
 */
async function getDriveClient(req: any) {
  const googleAuth = GoogleAuthService.getInstance();
  const accessToken = await googleAuth.getValidAccessToken(req);
  const tokenData = googleAuth.getTokenData();

  if (!tokenData) {
    throw new Error('No token data available');
  }

  const auth = new google.auth.OAuth2(
    googleConfig.auth.clientId,
    googleConfig.auth.clientSecret
  );

  auth.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: tokenData.expires_at
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Upload a file to Google Drive
 */
export async function uploadToDrive(filePath: string, fileName: string, req: any): Promise<string> {
  const config = loadBackupConfig();
  if (!config.googleDrive.enabled || !config.googleDrive.folderId) {
    throw new Error('Google Drive backup is not configured');
  }

  const drive = await getDriveClient(req);
  
  const fileMetadata = {
    name: fileName,
    parents: [config.googleDrive.folderId]
  };

  const media = {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    body: fs.createReadStream(filePath)
  };

  try {
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });

    return response.data.id || '';
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error('Failed to upload file to Google Drive');
  }
}

/**
 * List backup files in the configured Google Drive folder
 */
export async function listDriveFiles(accessToken: string): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
  const config = loadBackupConfig();
  if (!config.googleDrive.enabled || !config.googleDrive.folderId) {
    throw new Error('Google Drive backup is not configured');
  }

  const auth = new google.auth.OAuth2(
    googleConfig.auth.clientId,
    googleConfig.auth.clientSecret
  );
  auth.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: 'v3', auth });

  try {
    const response = await drive.files.list({
      q: `'${config.googleDrive.folderId}' in parents and mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`,
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    return (response.data.files || []).map(file => ({
      id: file.id || '',
      name: file.name || '',
      modifiedTime: file.modifiedTime || ''
    }));
  } catch (error) {
    console.error('Error listing Google Drive files:', error);
    throw new Error('Failed to list files from Google Drive');
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

  const drive = await getDriveClient(req);

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
export async function cleanupOldBackups(req: any): Promise<void> {
  const config = loadBackupConfig();
  if (!config.googleDrive.enabled || !config.googleDrive.folderId) {
    return;
  }

  const drive = await getDriveClient(req);
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
 * Check if it's time to perform an automatic backup based on the configured schedule
 */
export function shouldPerformAutoBackup(): boolean {
  const config = loadBackupConfig();
  if (!config.googleDrive.enabled || !config.googleDrive.autoBackup.enabled) {
    return false;
  }

  const now = new Date();
  const [hours, minutes] = config.googleDrive.autoBackup.time.split(':').map(Number);
  const scheduledTime = new Date(now);
  scheduledTime.setHours(hours, minutes, 0, 0);

  // If the scheduled time has passed today, check if we should backup based on interval
  if (now > scheduledTime) {
    switch (config.googleDrive.autoBackup.interval) {
      case 'daily':
        return true;
      case 'weekly':
        return now.getDay() === 0; // Sunday
      case 'monthly':
        return now.getDate() === 1; // First day of the month
      default:
        return false;
    }
  }

  return false;
} 