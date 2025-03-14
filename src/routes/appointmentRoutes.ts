import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { appointmentSchema, completeAppointmentSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';
import { 
  getCompleteAppointment,
  createCompleteAppointment, 
  updateCompleteAppointment, 
  deleteCompleteAppointment 
} from '../controllers/appointmentController';

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
 * /appointments/{id}/complete:
 *   get:
 *     summary: Get complete appointment with dogs and services
 *     tags: [Appointments]
 *     description: Retrieves full appointment details including dogs in the appointment and their services
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Complete appointment information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompleteAppointment'
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
router.get('/:id/complete', getCompleteAppointment);

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
 *             $ref: '#/components/schemas/AppointmentInput'
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
 * /appointments/complete:
 *   post:
 *     summary: Create a complete appointment with dogs and services
 *     tags: [Appointments]
 *     description: Creates an appointment with associated dogs and services in a single transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompleteAppointmentInput'
 *     responses:
 *       201:
 *         description: Created appointment with details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompleteAppointment'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/complete', validate(completeAppointmentSchema), createCompleteAppointment);

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
 *             $ref: '#/components/schemas/AppointmentInput'
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
 * /appointments/{id}/complete:
 *   put:
 *     summary: Update a complete appointment with dogs and services
 *     tags: [Appointments]
 *     description: Updates an appointment with associated dogs and services in a single transaction
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
 *             $ref: '#/components/schemas/CompleteAppointmentInput'
 *     responses:
 *       200:
 *         description: Updated appointment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompleteAppointment'
 *       404:
 *         description: Appointment not found
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.put('/:id/complete', validate(completeAppointmentSchema), updateCompleteAppointment);

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
 * /appointments/{id}/complete:
 *   delete:
 *     summary: Delete a complete appointment with all related dogs and services
 *     tags: [Appointments]
 *     description: Deletes an appointment and all associated dogs and services in a single transaction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment and all related records deleted
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
router.delete('/:id/complete', deleteCompleteAppointment);

/**
 * @swagger
 * /appointments:
 *   delete:
 *     summary: Delete all appointments
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: All appointments deleted successfully
 */
router.delete('/', handler.deleteAll.bind(handler));

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

export default router; 