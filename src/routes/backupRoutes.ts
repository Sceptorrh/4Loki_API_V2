import express from 'express';
import multer from 'multer';
import { generateBackup, importBackup, clearDatabase, previewBackup, importProgress } from '../controllers/backupController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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

export default router; 