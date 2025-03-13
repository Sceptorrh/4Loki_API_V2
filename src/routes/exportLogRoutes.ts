import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';

const router = Router();
const handler = new RouteHandler('ExportLog');

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
router.get('/', handler.getAll.bind(handler));

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
router.get('/:id', handler.getById.bind(handler));

/**
 * @swagger
 * /api/export-logs:
 *   post:
 *     summary: Create a new export log
 *     tags: [ExportLog]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExportLogInput'
 *     responses:
 *       201:
 *         description: Export log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExportLog'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/', handler.create.bind(handler));

/**
 * @swagger
 * /api/export-logs/{id}:
 *   put:
 *     summary: Update an export log
 *     tags: [ExportLog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The export log ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExportLogInput'
 *     responses:
 *       200:
 *         description: Export log updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExportLog'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Export log not found
 *       500:
 *         description: Server error
 */
router.put('/:id', handler.update.bind(handler));

/**
 * @swagger
 * /api/export-logs/{id}:
 *   delete:
 *     summary: Delete an export log
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
 *         description: Export log deleted successfully
 *       404:
 *         description: Export log not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', handler.delete.bind(handler));

export default router; 