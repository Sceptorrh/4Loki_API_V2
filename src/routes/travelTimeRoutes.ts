import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';

const router = Router();
const handler = new RouteHandler('TravelTime');

/**
 * @swagger
 * /api/travel-times:
 *   get:
 *     summary: Retrieve all travel time records
 *     tags: [TravelTime]
 *     responses:
 *       200:
 *         description: A list of travel time records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TravelTime'
 *       500:
 *         description: Server error
 */
router.get('/', handler.getAll.bind(handler));

/**
 * @swagger
 * /api/travel-times/{id}:
 *   get:
 *     summary: Get a travel time record by ID
 *     tags: [TravelTime]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The travel time record ID
 *     responses:
 *       200:
 *         description: Travel time record found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravelTime'
 *       404:
 *         description: Travel time record not found
 *       500:
 *         description: Server error
 */
router.get('/:id', handler.getById.bind(handler));

/**
 * @swagger
 * /api/travel-times:
 *   post:
 *     summary: Create a new travel time record
 *     tags: [TravelTime]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TravelTimeInput'
 *     responses:
 *       201:
 *         description: Travel time record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravelTime'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/', handler.create.bind(handler));

/**
 * @swagger
 * /api/travel-times/{id}:
 *   put:
 *     summary: Update a travel time record
 *     tags: [TravelTime]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The travel time record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TravelTimeInput'
 *     responses:
 *       200:
 *         description: Travel time record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TravelTime'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Travel time record not found
 *       500:
 *         description: Server error
 */
router.put('/:id', handler.update.bind(handler));

/**
 * @swagger
 * /api/travel-times/{id}:
 *   delete:
 *     summary: Delete a travel time record
 *     tags: [TravelTime]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The travel time record ID
 *     responses:
 *       200:
 *         description: Travel time record deleted successfully
 *       404:
 *         description: Travel time record not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', handler.delete.bind(handler));

export default router; 