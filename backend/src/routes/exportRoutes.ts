import { Router } from 'express';
import { generateExcelExport } from '../controllers/exportController';

const router = Router();

/**
 * @swagger
 * /api/exports/excel:
 *   post:
 *     summary: Generate an Excel export for invoiced appointments
 *     tags: [Exports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointmentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of appointment IDs to include in the export
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/excel', generateExcelExport);

export default router; 