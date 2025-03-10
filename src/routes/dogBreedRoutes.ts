import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { dogBreedSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';

const router = Router();
const handler = new RouteHandler('DogBreed', dogBreedSchema);

/**
 * @swagger
 * /dog-breeds:
 *   get:
 *     summary: Get all dog breeds
 *     tags: [Dog Breeds]
 *     responses:
 *       200:
 *         description: List of dog breeds
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DogBreed'
 */
router.get('/', handler.getAll.bind(handler));

/**
 * @swagger
 * /dog-breeds/{id}:
 *   get:
 *     summary: Get dog breed by ID
 *     tags: [Dog Breeds]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog breed ID
 *     responses:
 *       200:
 *         description: Dog breed details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DogBreed'
 *       404:
 *         description: Dog breed not found
 */
router.get('/:id', handler.getById.bind(handler));

/**
 * @swagger
 * /dog-breeds:
 *   post:
 *     summary: Create a new dog breed
 *     tags: [Dog Breeds]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DogBreed'
 *     responses:
 *       201:
 *         description: Created dog breed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DogBreed'
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(dogBreedSchema), handler.create.bind(handler));

/**
 * @swagger
 * /dog-breeds/{id}:
 *   put:
 *     summary: Update a dog breed
 *     tags: [Dog Breeds]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog breed ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DogBreed'
 *     responses:
 *       200:
 *         description: Updated dog breed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DogBreed'
 *       404:
 *         description: Dog breed not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', validate(dogBreedSchema), handler.update.bind(handler));

/**
 * @swagger
 * /dog-breeds/{id}:
 *   delete:
 *     summary: Delete a dog breed
 *     tags: [Dog Breeds]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog breed ID
 *     responses:
 *       204:
 *         description: Dog breed deleted
 *       404:
 *         description: Dog breed not found
 */
router.delete('/:id', handler.delete.bind(handler));

export default router; 