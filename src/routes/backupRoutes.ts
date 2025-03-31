import { Router } from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Writable } from 'stream';
import { generateBackup, importBackup, clearDatabase, previewBackup, previewDriveBackup, importDriveBackup } from '../controllers/backupController';
import { uploadToDrive, listDriveFiles, downloadFromDrive, shouldPerformAutoBackup, performAutoBackup, cleanupOldBackups, loadBackupConfig } from '../services/google/drive';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { GoogleAuthService } from '../services/google/auth';
import { BackupConfig } from '../interfaces/backupConfig';
import { SessionService } from '../services/session/sessionService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const googleAuth = GoogleAuthService.getInstance();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/backup/export:
 *   get:
 *     summary: Generate a complete data backup of all non-static tables
 *     tags: [Backup]
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Server error
 */
router.get('/export', generateBackup);

/**
 * @swagger
 * /api/backup/preview:
 *   post:
 *     summary: Preview data from a backup file before import
 *     tags: [Backup]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel backup file to preview
 *     responses:
 *       200:
 *         description: Preview generated successfully
 *       400:
 *         description: Invalid input or no file uploaded
 *       500:
 *         description: Server error
 */
router.post('/preview', upload.single('file'), previewBackup);

/**
 * @swagger
 * /api/backup/import:
 *   post:
 *     summary: Import data from a backup file
 *     tags: [Backup]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel backup file to import
 *     responses:
 *       200:
 *         description: Backup imported successfully
 *       400:
 *         description: Invalid input or no file uploaded
 *       500:
 *         description: Server error
 */
router.post('/import', upload.single('file'), importBackup);

// Clear database
router.post('/clear', clearDatabase);

// Google Drive configuration routes
router.get('/config', async (req: Request, res: Response) => {
  try {
    logger.info('GET /backup/config - Request received');
    logger.info('Headers:', req.headers);
    logger.info('Cookies:', req.headers.cookie);
    
    const configDir = path.join(process.cwd(), 'configuration');
    const configPath = path.join(configDir, 'backup.json');
    logger.info('Reading config from:', configPath);
    
    // Create configuration directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Create default configuration if it doesn't exist
    if (!fs.existsSync(configPath)) {
      const defaultConfig: BackupConfig = {
        googleDrive: {
          enabled: false,
          folderId: '',
          autoBackup: {
            enabled: false,
            interval: 'hourly',
            maxFiles: 30
          }
        }
      };
      
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      logger.info('Created new backup configuration file with default values');
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    // Ensure the config matches the expected structure
    if (!config.googleDrive) {
      config.googleDrive = {
        enabled: false,
        folderId: '',
        autoBackup: {
          enabled: false,
          interval: 'hourly',
          maxFiles: 30
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      logger.info('Updated existing config to match expected structure');
    }
    
    // Remove time field if interval is hourly
    if (config.googleDrive.autoBackup.interval === 'hourly') {
      delete config.googleDrive.autoBackup.time;
    }
    
    logger.info('Config content:', configContent);
    res.json(config);
  } catch (error) {
    logger.error('Error reading backup config:', error);
    res.status(500).json({ message: 'Failed to read backup configuration' });
  }
});

router.post('/config', async (req: Request, res: Response) => {
  try {
    logger.info('POST /backup/config - Request received');
    logger.info('Headers:', req.headers);
    logger.info('Cookies:', req.headers.cookie);
    logger.info('Request body:', req.body);
    
    // Get session ID from headers or cookies
    const sessionId = req.headers['x-session-id'] || req.cookies['session_id'];
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    // Get user ID from session
    const sessionService = SessionService.getInstance();
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    // Add user ID to the configuration if auto backup is enabled
    if (req.body.googleDrive?.autoBackup?.enabled) {
      req.body.googleDrive.autoBackup.userId = session.userId;
    }
    
    const configPath = path.join(process.cwd(), 'configuration', 'backup.json');
    logger.info('Writing config to:', configPath);
    
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    logger.info('Config updated successfully');
    
    res.json({ message: 'Backup configuration updated successfully' });
  } catch (error) {
    logger.error('Error updating backup config:', error);
    res.status(500).json({ message: 'Failed to update backup configuration' });
  }
});

// Google Drive backup routes
router.get('/drive-files', async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies['session_id'];
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    const accessToken = await googleAuth.getToken(sessionId);
    if (!accessToken) {
      return res.status(401).json({ message: 'No valid token available' });
    }

    const files = await listDriveFiles(accessToken);
    res.json({ files });
  } catch (error: any) {
    logger.error('Error listing drive files:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/drive-files/:fileId', async (req: Request, res: Response) => {
  try {
    const fileData = await downloadFromDrive(req.params.fileId, req);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=backup.xlsx');
    res.send(fileData);
  } catch (error: any) {
    console.error('Error downloading drive file:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/restore-drive', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.body;
    if (!fileId) {
      return res.status(400).json({ message: 'File ID is required' });
    }

    const fileBuffer = await downloadFromDrive(fileId, req);
    const tempPath = path.join(process.cwd(), 'uploads', `temp_${Date.now()}.xlsx`);
    fs.writeFileSync(tempPath, fileBuffer);

    // Create a mock file object for the importBackup function
    const mockFile: Express.Multer.File = {
      path: tempPath,
      filename: `temp_${Date.now()}.xlsx`,
      fieldname: 'file',
      originalname: `backup_${Date.now()}.xlsx`,
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      destination: 'uploads/',
      size: fileBuffer.length,
      stream: fs.createReadStream(tempPath),
      buffer: fileBuffer
    };

    // Call the existing import function
    const mockReq = {
      file: mockFile
    } as Request;
    
    await importBackup(mockReq as any, res);

    // Clean up the temporary file
    fs.unlinkSync(tempPath);
  } catch (error) {
    console.error('Error restoring from drive:', error);
    res.status(500).json({ message: 'Failed to restore from Google Drive backup' });
  }
});

router.post('/export-drive', async (req: AuthRequest, res: Response) => {
  try {
    // Get session ID from headers or cookies
    const sessionId = req.headers['x-session-id'] || req.cookies['session_id'];
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    // Get access token
    const accessToken = await googleAuth.getToken(sessionId);
    if (!accessToken) {
      return res.status(401).json({ message: 'No valid token available' });
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

    // Generate the backup using the existing function
    await generateBackup(req, mockRes);
    
    // Combine all chunks into a single buffer
    const fileBuffer = Buffer.concat(chunks);
    
    // Upload the file to Google Drive with the access token
    const fileName = `4loki_backup_${new Date().toISOString().split('T')[0]}.xlsx`;
    const fileId = await uploadToDrive(fileBuffer, fileName, accessToken);
    
    // Clean up old backups if configured
    await cleanupOldBackups(accessToken);

    res.json({ success: true, fileId });
  } catch (error: any) {
    console.error('Error exporting to Google Drive:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if automatic backup should run
router.get('/check-auto-backup', async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    const sessionService = SessionService.getInstance();
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    const shouldBackup = await shouldPerformAutoBackup(session.userId);
    res.json({ shouldBackup });
  } catch (error) {
    logger.error('Error checking auto backup:', error);
    res.status(500).json({ message: 'Failed to check auto backup status' });
  }
});

// Preview backup from Google Drive
router.post('/preview-drive', previewDriveBackup);

// Import backup from Google Drive
router.post('/import-drive', importDriveBackup);

// Get backup status endpoint
router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    const accessToken = await googleAuth.getToken(sessionId);
    if (!accessToken) {
      return res.status(401).json({ message: 'No valid token available' });
    }

    // Check if automatic backup is needed
    const config = await loadBackupConfig();
    if (config?.googleDrive?.autoBackup?.enabled) {
      const sessionService = SessionService.getInstance();
      const session = await sessionService.getSession(sessionId);
      if (session) {
        const shouldBackup = await shouldPerformAutoBackup(session.userId);
        if (shouldBackup) {
          logger.info('Starting automatic backup...');
          await performAutoBackup();
        }
      }
    }
  } catch (error) {
    logger.error('Error getting backup status:', error);
    res.status(500).json({ message: 'Failed to get backup status' });
  }
});

// Test automatic backup
router.post('/test-auto-backup', async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      return res.status(401).json({ message: 'Session ID is required' });
    }

    const sessionService = SessionService.getInstance();
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    const shouldBackup = await shouldPerformAutoBackup(session.userId);
    if (shouldBackup) {
      logger.info('Starting test automatic backup...');
      await performAutoBackup();
      logger.info('Test automatic backup completed');
      res.json({ success: true, message: 'Test automatic backup completed successfully' });
    } else {
      res.json({ success: true, message: 'No backup needed at this time' });
    }
  } catch (error) {
    logger.error('Error in test automatic backup:', error);
    res.status(500).json({ success: false, message: 'Failed to perform test automatic backup' });
  }
});

export default router; 