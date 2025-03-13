import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { dogPictureSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';

const router = Router();
const handler = new RouteHandler('DogPicture', dogPictureSchema);

/**
 * @swagger
 * /dog-pictures:
 *   get:
 *     summary: Get all dog pictures
 *     tags: [Dog Pictures]
 *     responses:
 *       200:
 *         description: List of dog pictures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DogPicture'
 */
router.get('/', handler.getAll.bind(handler));

/**
 * @swagger
 * /dog-pictures/{id}:
 *   get:
 *     summary: Get dog picture by ID
 *     tags: [Dog Pictures]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog Picture ID
 *     responses:
 *       200:
 *         description: Dog picture details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DogPicture'
 *       404:
 *         description: Dog picture not found
 */
router.get('/:id', handler.getById.bind(handler));

/**
 * @swagger
 * /dog-pictures:
 *   post:
 *     summary: Create a new dog picture
 *     tags: [Dog Pictures]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               DogId:
 *                 type: integer
 *               AppointmentId:
 *                 type: integer
 *               Picture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created dog picture
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DogPicture'
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(dogPictureSchema), handler.create.bind(handler));

/**
 * @swagger
 * /dog-pictures/{id}:
 *   put:
 *     summary: Update a dog picture
 *     tags: [Dog Pictures]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog Picture ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               DogId:
 *                 type: integer
 *               AppointmentId:
 *                 type: integer
 *               Picture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated dog picture
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DogPicture'
 *       404:
 *         description: Dog picture not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', validate(dogPictureSchema), handler.update.bind(handler));

/**
 * @swagger
 * /dog-pictures/{id}:
 *   delete:
 *     summary: Delete a dog picture
 *     tags: [Dog Pictures]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog Picture ID
 *     responses:
 *       204:
 *         description: Dog picture deleted
 *       404:
 *         description: Dog picture not found
 */
router.delete('/:id', handler.delete.bind(handler));

/**
 * @swagger
 * /dog-pictures/dog/{dogId}:
 *   get:
 *     summary: Get pictures by dog ID
 *     tags: [Dog Pictures]
 *     parameters:
 *       - in: path
 *         name: dogId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog ID
 *     responses:
 *       200:
 *         description: List of dog's pictures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DogPicture'
 */
router.get('/dog/:dogId', handler.getByCustomerId.bind(handler));

/**
 * @swagger
 * /dog-pictures/appointment/{appointmentId}:
 *   get:
 *     summary: Get pictures by appointment ID
 *     tags: [Dog Pictures]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: List of pictures from the appointment
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DogPicture'
 */
router.get('/appointment/:appointmentId', handler.getByAppointmentId.bind(handler));

/**
 * @swagger
 * /dog-pictures:
 *   delete:
 *     summary: Delete all dog pictures
 *     tags: [Dog Pictures]
 *     responses:
 *       200:
 *         description: All dog pictures deleted successfully
 */
router.delete('/', handler.deleteAll.bind(handler));

export default router; 