import { Router } from 'express';
import { 
  createExportLog, 
  getAllExportLogs, 
  getExportLogById,
  revertExport,
  revertAppointmentFromExport
} from '../controllers/exportLogController';
import { validate } from '../middleware/validate';
import { exportLogSchema, revertExportSchema } from '../validation/schemas';

const router = Router();

/**
 * @swagger
 * /api/export-logs:
 *   get:
 *     summary: Retrieve all export logs
 *     tags: [ExportLog]
 *     responses:
 *       200:
 *         description: A list of export logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExportLog'
 *       500:
 *         description: Server error
 */
router.get('/', getAllExportLogs);

/**
 * @swagger
 * /api/export-logs/{id}:
 *   get:
 *     summary: Get an export log by ID
 *     tags: [ExportLog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The export log ID
 *     responses:
 *       200:
 *         description: Export log found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExportLog'
 *       404:
 *         description: Export log not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getExportLogById);

/**
 * @swagger
 * /api/export-logs:
 *   post:
 *     summary: Create a new export log
 *     tags: [Export Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExportLogInput'
 *     responses:
 *       201:
 *         description: Created export log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExportLog'
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(exportLogSchema), createExportLog);

/**
 * @swagger
 * /api/export-logs/{id}/revert:
 *   post:
 *     summary: Revert an entire export
 *     tags: [Export Logs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The export log ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RevertExportInput'
 *     responses:
 *       200:
 *         description: Export successfully reverted
 *       400:
 *         description: Export already reverted
 *       404:
 *         description: Export log not found
 *       500:
 *         description: Server error
 */
router.post('/:id/revert', validate(revertExportSchema), revertExport);

/**
 * @swagger
 * /api/export-logs/{exportId}/appointments/{appointmentId}/revert:
 *   post:
 *     summary: Revert a single appointment from an export
 *     tags: [Export Logs]
 *     parameters:
 *       - in: path
 *         name: exportId
 *         required: true
 *         schema:
 *           type: string
 *         description: The export log ID
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The appointment ID
 *     responses:
 *       200:
 *         description: Appointment successfully reverted from export
 *       404:
 *         description: Appointment not found in this export or already reverted
 *       500:
 *         description: Server error
 */
router.post('/:exportId/appointments/:appointmentId/revert', revertAppointmentFromExport);

export default router; 