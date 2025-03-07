import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { validate } from '../middleware/validate';
import { digiBTWSchema } from '../schemas/digiBTWSchema';

const router = Router();
const handler = new RouteHandler('DigiBTW_Expenses');

/**
 * @swagger
 * /api/digibtw:
 *   get:
 *     summary: Retrieve all DigiBTW records
 *     tags: [DigiBTW]
 *     responses:
 *       200:
 *         description: A list of DigiBTW records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DigiBTW'
 *       500:
 *         description: Server error
 */
router.get('/', handler.getAll.bind(handler));

/**
 * @swagger
 * /api/digibtw/{id}:
 *   get:
 *     summary: Get a DigiBTW record by ID
 *     tags: [DigiBTW]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The DigiBTW record ID
 *     responses:
 *       200:
 *         description: DigiBTW record found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DigiBTW'
 *       404:
 *         description: DigiBTW record not found
 *       500:
 *         description: Server error
 */
router.get('/:id', handler.getById.bind(handler));

/**
 * @swagger
 * /api/digibtw:
 *   post:
 *     summary: Create a new DigiBTW record
 *     tags: [DigiBTW]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DigiBTWInput'
 *     responses:
 *       201:
 *         description: DigiBTW record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DigiBTW'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/', validate(digiBTWSchema), handler.create.bind(handler));

/**
 * @swagger
 * /api/digibtw/{id}:
 *   put:
 *     summary: Update a DigiBTW record
 *     tags: [DigiBTW]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The DigiBTW record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DigiBTWInput'
 *     responses:
 *       200:
 *         description: DigiBTW record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DigiBTW'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: DigiBTW record not found
 *       500:
 *         description: Server error
 */
router.put('/:id', validate(digiBTWSchema), handler.update.bind(handler));

/**
 * @swagger
 * /api/digibtw/{id}:
 *   delete:
 *     summary: Delete a DigiBTW record
 *     tags: [DigiBTW]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The DigiBTW record ID
 *     responses:
 *       200:
 *         description: DigiBTW record deleted successfully
 *       404:
 *         description: DigiBTW record not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', handler.delete.bind(handler));

export default router; 