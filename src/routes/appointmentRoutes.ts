import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { appointmentSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';
import { getDetailedAppointment } from '../controllers/appointmentController';

const router = Router();
const handler = new RouteHandler('Appointment', appointmentSchema);

/**
 * @swagger
 * /appointments/date-range:
 *   get:
 *     summary: Get appointments by date range
 *     tags: [Appointments]
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
 *         description: List of appointments within the date range
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 */
router.get('/date-range', handler.getByDateRange.bind(handler));

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: List of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 */
router.get('/', handler.getAll.bind(handler));

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment not found
 */
router.get('/:id', handler.getById.bind(handler));

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: Created appointment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(appointmentSchema), handler.create.bind(handler));

/**
 * @swagger
 * /appointments/{id}:
 *   put:
 *     summary: Update an appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       200:
 *         description: Updated appointment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', validate(appointmentSchema), handler.update.bind(handler));

/**
 * @swagger
 * /appointments/{id}:
 *   delete:
 *     summary: Delete an appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       204:
 *         description: Appointment deleted
 *       404:
 *         description: Appointment not found
 */
router.delete('/:id', handler.delete.bind(handler));

/**
 * @swagger
 * /appointments/customer/{customerId}:
 *   get:
 *     summary: Get appointments by customer
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: List of customer's appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 */
router.get('/customer/:customerId', handler.getByCustomerId.bind(handler));

/**
 * @swagger
 * /appointments/status/{statusId}:
 *   get:
 *     summary: Get appointments by status
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: statusId
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment status ID
 *     responses:
 *       200:
 *         description: List of appointments with the specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 */
router.get('/status/:statusId', handler.getByStatus.bind(handler));

/**
 * @swagger
 * /appointments/type/{typeId}:
 *   get:
 *     summary: Get appointments by type
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment type ID
 *     responses:
 *       200:
 *         description: List of appointments of the specified type
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 */
router.get('/type/:typeId', handler.getByAppointmentId.bind(handler));

/**
 * @swagger
 * /appointments/{id}/details:
 *   get:
 *     summary: Get detailed appointment information
 *     description: Retrieves full appointment details including customer information, all customer's dogs, dogs in the appointment, and their services
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Detailed appointment information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DetailedAppointment'
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
router.get('/:id/details', getDetailedAppointment);

export default router; 