import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { invoiceSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';

const router = Router();
const handler = new RouteHandler('Invoice', invoiceSchema);

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
 *     responses:
 *       200:
 *         description: List of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 */
router.get('/', handler.getAll.bind(handler));

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       404:
 *         description: Invoice not found
 */
router.get('/:id', handler.getById.bind(handler));

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceInput'
 *     responses:
 *       201:
 *         description: Created invoice
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(invoiceSchema), handler.create.bind(handler));

/**
 * @swagger
 * /invoices/{id}:
 *   put:
 *     summary: Update an invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceInput'
 *     responses:
 *       200:
 *         description: Updated invoice
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       404:
 *         description: Invoice not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', validate(invoiceSchema), handler.update.bind(handler));

/**
 * @swagger
 * /invoices/{id}:
 *   delete:
 *     summary: Delete an invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     responses:
 *       204:
 *         description: Invoice deleted
 *       404:
 *         description: Invoice not found
 */
router.delete('/:id', handler.delete.bind(handler));

/**
 * @swagger
 * /invoices/date-range:
 *   get:
 *     summary: Get invoices by date range
 *     tags: [Invoices]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of invoices within the date range
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 */
router.get('/date-range', handler.getByDateRange.bind(handler));

/**
 * @swagger
 * /invoices/customer/{customerId}:
 *   get:
 *     summary: Get invoices by customer
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: List of customer's invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 */
router.get('/customer/:customerId', handler.getByCustomerId.bind(handler));

/**
 * @swagger
 * /invoices/appointment/{appointmentId}:
 *   get:
 *     summary: Get invoices by appointment
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: List of invoices for the appointment
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 */
router.get('/appointment/:appointmentId', handler.getByAppointmentId.bind(handler));

/**
 * @swagger
 * /invoices/unpaid:
 *   get:
 *     summary: Get unpaid invoices
 *     tags: [Invoices]
 *     responses:
 *       200:
 *         description: List of unpaid invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 */
router.get('/unpaid', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Invoice WHERE IsPaid = false'
    );
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching unpaid invoices', 500);
  }
});

/**
 * @swagger
 * /invoices/paid:
 *   get:
 *     summary: Get paid invoices
 *     tags: [Invoices]
 *     responses:
 *       200:
 *         description: List of paid invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 */
router.get('/paid', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Invoice WHERE IsPaid = true'
    );
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching paid invoices', 500);
  }
});

export default router; 