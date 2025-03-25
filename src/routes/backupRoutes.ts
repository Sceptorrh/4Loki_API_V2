import { Router } from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateBackup, importBackup, clearDatabase, previewBackup, importProgress, previewDriveBackup } from '../controllers/backupController';
import { uploadToDrive, listDriveFiles, downloadFromDrive, shouldPerformAutoBackup, cleanupOldBackups } from '../services/google/drive';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { GoogleAuthService } from '../services/google/auth';

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
 * /api/backup/import/progress:
 *   get:
 *     summary: Get progress updates during import process using SSE
 *     tags: [Backup]
 *     responses:
 *       200:
 *         description: Stream of progress updates
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
router.options('/import/progress', (req, res) => {
  // Preflight response for CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Connection');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(204).end();
});

router.get('/import/progress', importProgress);

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
    
    const configPath = path.join(process.cwd(), 'configuration', 'backup.json');
    logger.info('Reading config from:', configPath);
    
    if (!fs.existsSync(configPath)) {
      logger.error('Config file does not exist at:', configPath);
      return res.status(404).json({ message: 'Backup configuration file not found' });
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    logger.info('Config content:', configContent);
    
    res.json(JSON.parse(configContent));
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
router.get('/drive-files', async (req: Request, res: Response) => {
  try {
    const accessToken = await googleAuth.getValidAccessToken(req);
    const files = await listDriveFiles(accessToken);
    res.json({ files });
  } catch (error: any) {
    console.error('Error listing drive files:', error);
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

router.post('/export-drive', async (req: Request, res: Response) => {
  try {
    // Create a temporary file path
    const tempPath = path.join(process.cwd(), 'uploads', `backup_${Date.now()}.xlsx`);
    
    // Create a writable stream for the backup file
    const writeStream = fs.createWriteStream(tempPath);
    
    // Create a mock response object that writes to our file
    const mockRes = {
      setHeader: () => {},
      write: (data: Buffer) => writeStream.write(data),
      end: () => writeStream.end()
    } as unknown as Response;

    // Generate the backup using the existing function
    await generateBackup(req, mockRes);
    
    // Wait for the file to be fully written
    await new Promise<void>((resolve) => writeStream.on('finish', () => resolve()));
    
    // Upload the file to Google Drive
    const fileName = `4loki_backup_${new Date().toISOString().split('T')[0]}.xlsx`;
    const fileId = await uploadToDrive(tempPath, fileName, req);
    
    // Clean up old backups if configured
    await cleanupOldBackups(req);

    // Clean up the temporary file
    fs.unlinkSync(tempPath);

    res.json({ success: true, fileId });
  } catch (error: any) {
    console.error('Error exporting to Google Drive:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/check-auto-backup', async (req: Request, res: Response) => {
  try {
    const shouldBackup = shouldPerformAutoBackup();
    res.json({ shouldBackup });
  } catch (error) {
    console.error('Error checking auto backup:', error);
    res.status(500).json({ message: 'Failed to check auto backup status' });
  }
});

// Preview backup from Google Drive
router.post('/preview-drive', previewDriveBackup);

// Import backup from Google Drive
router.post('/import-drive', async (req: Request, res: Response) => {
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
    console.error('Error importing from drive:', error);
    res.status(500).json({ message: 'Failed to import from Google Drive backup' });
  }
});

export default router; 