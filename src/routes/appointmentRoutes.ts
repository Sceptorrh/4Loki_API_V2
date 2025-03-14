import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { appointmentSchema, completeAppointmentSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';
import { 
  getCompleteAppointment,
  createCompleteAppointment, 
  updateCompleteAppointment, 
  deleteCompleteAppointment,
  getAppointmentsByYearMonth
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

/**
 * @swagger
 * /appointments/year/{year}/month/{month}:
 *   get:
 *     summary: Get appointments by year and month
 *     tags: [Appointments]
 *     description: Retrieves all appointments for a specific year and month with customer contact person, status details, and dogs with services
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year (e.g. 2023)
 *         example: 2023
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *         example: 12
 *     responses:
 *       200:
 *         description: List of appointments for the specified month
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   AppointmentId:
 *                     type: integer
 *                     description: Unique identifier for the appointment
 *                     example: 123
 *                   Date:
 *                     type: string
 *                     format: date
 *                     description: Date of the appointment
 *                     example: "2023-12-15"
 *                   TimeStart:
 *                     type: string
 *                     description: Start time of the appointment
 *                     example: "14:00:00"
 *                   TimeEnd:
 *                     type: string
 *                     description: End time of the appointment
 *                     example: "15:30:00"
 *                   ContactPerson:
 *                     type: string
 *                     description: Name of the customer's contact person
 *                     example: "John Doe"
 *                   Status:
 *                     type: object
 *                     description: Appointment status information
 *                     properties:
 *                       Id:
 *                         type: string
 *                         description: Status identifier
 *                         example: "CONFIRMED"
 *                       Label:
 *                         type: string
 *                         description: Human-readable status label
 *                         example: "Confirmed"
 *                       Color:
 *                         type: string
 *                         description: Hex color code for the status (for UI display)
 *                         example: "#4CAF50"
 *                   Dogs:
 *                     type: array
 *                     description: List of dogs included in this appointment
 *                     items:
 *                       type: object
 *                       properties:
 *                         DogId:
 *                           type: integer
 *                           description: Unique identifier for the dog
 *                           example: 456
 *                         DogName:
 *                           type: string
 *                           description: Name of the dog
 *                           example: "Rex"
 *                         ServiceCount:
 *                           type: integer
 *                           description: Number of services booked for this dog
 *                           example: 3
 *       400:
 *         description: Invalid year or month format
 *       500:
 *         description: Server error
 */
router.get('/year/:year/month/:month', getAppointmentsByYearMonth);

export default router; 