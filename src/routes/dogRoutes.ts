import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { dogSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';

const router = Router();
const handler = new RouteHandler('Dog', dogSchema);

/**
 * @swagger
 * /dogs:
 *   get:
 *     summary: Get all dogs
 *     tags: [Dogs]
 *     responses:
 *       200:
 *         description: List of dogs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dog'
 */
router.get('/', handler.getAll.bind(handler));

/**
 * @swagger
 * /dogs/{id}:
 *   get:
 *     summary: Get dog by ID
 *     tags: [Dogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog ID
 *     responses:
 *       200:
 *         description: Dog details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dog'
 *       404:
 *         description: Dog not found
 */
router.get('/:id', handler.getById.bind(handler));

/**
 * @swagger
 * /dogs:
 *   post:
 *     summary: Create a new dog
 *     tags: [Dogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Dog'
 *     responses:
 *       201:
 *         description: Created dog
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dog'
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(dogSchema), handler.create.bind(handler));

/**
 * @swagger
 * /dogs/{id}:
 *   put:
 *     summary: Update a dog
 *     tags: [Dogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Dog'
 *     responses:
 *       200:
 *         description: Updated dog
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dog'
 *       404:
 *         description: Dog not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', validate(dogSchema), handler.update.bind(handler));

/**
 * @swagger
 * /dogs/{id}:
 *   delete:
 *     summary: Delete a dog
 *     tags: [Dogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog ID
 *     responses:
 *       204:
 *         description: Dog deleted
 *       404:
 *         description: Dog not found
 */
router.delete('/:id', handler.delete.bind(handler));

/**
 * @swagger
 * /dogs/customer/{customerId}:
 *   get:
 *     summary: Get dogs by customer ID
 *     tags: [Dogs]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: List of dogs belonging to the customer
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dog'
 */
router.get('/customer/:customerId', handler.getByCustomerId.bind(handler));

/**
 * @swagger
 * /dogs/size/{sizeId}:
 *   get:
 *     summary: Get dogs by size
 *     tags: [Dogs]
 *     parameters:
 *       - in: path
 *         name: sizeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Dog size ID
 *     responses:
 *       200:
 *         description: List of dogs of the specified size
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dog'
 */
router.get('/size/:sizeId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Dog WHERE DogSizeId = ?',
      [req.params.sizeId]
    );
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching dogs by size', 500);
  }
});

/**
 * @swagger
 * /dogs/allergies:
 *   get:
 *     summary: Get dogs with allergies
 *     tags: [Dogs]
 *     responses:
 *       200:
 *         description: List of dogs with allergies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dog'
 */
router.get('/allergies', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Dog WHERE Allergies IS NOT NULL AND Allergies != ""'
    );
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching dogs with allergies', 500);
  }
});

/**
 * @swagger
 * /dogs/service-notes:
 *   get:
 *     summary: Get dogs with service notes
 *     tags: [Dogs]
 *     responses:
 *       200:
 *         description: List of dogs with service notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dog'
 */
router.get('/service-notes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Dog WHERE ServiceNote IS NOT NULL AND ServiceNote != ""'
    );
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching dogs with service notes', 500);
  }
});

export default router; 