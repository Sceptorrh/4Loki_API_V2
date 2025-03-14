import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { additionalHourSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';

const router = Router();
const handler = new RouteHandler('AdditionalHour', additionalHourSchema);

/**
 * @swagger
 * /additional-hours:
 *   get:
 *     summary: Get all additional hours
 *     tags: [Additional Hours]
 *     responses:
 *       200:
 *         description: List of additional hours
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdditionalHour'
 */
router.get('/', handler.getAll.bind(handler));

/**
 * @swagger
 * /additional-hours/{id}:
 *   get:
 *     summary: Get additional hour by ID
 *     tags: [Additional Hours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Additional Hour ID
 *     responses:
 *       200:
 *         description: Additional hour details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdditionalHour'
 *       404:
 *         description: Additional hour not found
 */
router.get('/:id', handler.getById.bind(handler));

/**
 * @swagger
 * /additional-hours:
 *   post:
 *     summary: Create a new additional hour
 *     tags: [Additional Hours]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdditionalHourInput'
 *     responses:
 *       201:
 *         description: Created additional hour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdditionalHour'
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(additionalHourSchema), handler.create.bind(handler));

/**
 * @swagger
 * /additional-hours/{id}:
 *   put:
 *     summary: Update an additional hour
 *     tags: [Additional Hours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Additional Hour ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdditionalHourInput'
 *     responses:
 *       200:
 *         description: Updated additional hour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdditionalHour'
 *       404:
 *         description: Additional hour not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', validate(additionalHourSchema), handler.update.bind(handler));

/**
 * @swagger
 * /additional-hours/{id}:
 *   delete:
 *     summary: Delete an additional hour
 *     tags: [Additional Hours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Additional Hour ID
 *     responses:
 *       204:
 *         description: Additional hour deleted
 *       404:
 *         description: Additional hour not found
 */
router.delete('/:id', handler.delete.bind(handler));

/**
 * @swagger
 * /additional-hours/date-range:
 *   get:
 *     summary: Get additional hours by date range
 *     tags: [Additional Hours]
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
 *         description: List of additional hours within the date range
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdditionalHour'
 */
router.get('/date-range', handler.getByDateRange.bind(handler));

/**
 * @swagger
 * /additional-hours/invoice/{invoiceId}:
 *   get:
 *     summary: Get additional hours by invoice ID
 *     tags: [Additional Hours]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: List of additional hours for the invoice
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdditionalHour'
 */
router.get('/invoice/:invoiceId', handler.getByAppointmentId.bind(handler));

export default router; 