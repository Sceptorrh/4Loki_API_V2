import { Router } from 'express';
import { generateExcelExport, getExportableInvoices, getExportableHours, getExportableCustomers } from '../controllers/exportController';

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

/**
 * @swagger
 * /api/exports/invoices:
 *   get:
 *     summary: Get invoices that can be exported
 *     tags: [Exports]
 *     responses:
 *       200:
 *         description: List of exportable invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   invoiceNumber:
 *                     type: string
 *                   date:
 *                     type: string
 *                   customer:
 *                     type: string
 *                   description:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   hours:
 *                     type: number
 */
router.get('/invoices', getExportableInvoices);

/**
 * @swagger
 * /api/exports/hours:
 *   get:
 *     summary: Get additional hours that can be exported
 *     tags: [Exports]
 *     responses:
 *       200:
 *         description: List of exportable hours
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   date:
 *                     type: string
 *                   customer:
 *                     type: string
 *                   description:
 *                     type: string
 *                   hours:
 *                     type: number
 */
router.get('/hours', getExportableHours);

/**
 * @swagger
 * /api/exports/customers:
 *   get:
 *     summary: Get customers that can be exported
 *     tags: [Exports]
 *     responses:
 *       200:
 *         description: List of exportable customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 */
router.get('/customers', getExportableCustomers);

export default router; 