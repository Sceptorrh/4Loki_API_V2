import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { customerSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { getActiveCustomers, getActiveCustomersHistory } from '../controllers/customerController';

const router = Router();
const handler = new RouteHandler('Customer', customerSchema);
const dogHandler = new RouteHandler('Dog');

/**
 * @swagger
 * /customers/active:
 *   get:
 *     summary: Get active customers (customers with 2+ appointments and last appointment within 100 days)
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: List of active customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Id:
 *                     type: integer
 *                     description: Customer ID
 *                   Contactpersoon:
 *                     type: string
 *                     description: Contact person name
 *                   AppointmentCount:
 *                     type: integer
 *                     description: Number of appointments
 *                   DaysSinceLastAppointment:
 *                     type: integer
 *                     description: Days since last appointment
 *                   IsActive:
 *                     type: boolean
 *                     description: Flag indicating this is an active customer
 */
router.get('/active', getActiveCustomers);

/**
 * @swagger
 * /customers/active/history:
 *   get:
 *     summary: Get historical data of active customers over the past year
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: Historical data of active customers by month
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   month:
 *                     type: string
 *                     description: Month in YYYY-MM format
 *                   activeCustomers:
 *                     type: integer
 *                     description: Number of active customers for that month
 */
router.get('/active/history', getActiveCustomersHistory);

/**
 * @swagger
 * /customers/table:
 *   get:
 *     summary: Get customer table data with search functionality
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering customers by contact person, name, email, phone, or dog name
 *     responses:
 *       200:
 *         description: List of customers with their details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Id:
 *                     type: integer
 *                     description: Customer ID
 *                   Contactpersoon:
 *                     type: string
 *                     description: Contact person name
 *                   Naam:
 *                     type: string
 *                     description: Customer name
 *                   Emailadres:
 *                     type: string
 *                     description: Email address
 *                   Telefoonnummer:
 *                     type: string
 *                     description: Phone number
 *                   IsAllowContactShare:
 *                     type: string
 *                     description: Contact sharing permission
 *                   DogCount:
 *                     type: integer
 *                     description: Number of dogs
 *                   Dogs:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: List of dog names
 *                   DaysSinceLastAppointment:
 *                     type: integer
 *                     nullable: true
 *                     description: Days since last appointment
 */
router.get('/table', handler.getCustomerTable.bind(handler));

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: List of all customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Id:
 *                     type: integer
 *                     description: Customer ID
 *                   Contactpersoon:
 *                     type: string
 *                     description: Contact person name
 *                   Naam:
 *                     type: string
 *                     description: Customer name
 *                   Emailadres:
 *                     type: string
 *                     description: Customer email
 *                   Telefoonnummer:
 *                     type: string
 *                     description: Customer phone number
 */
router.get('/', handler.getAll.bind(handler));

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 */
router.get('/:id', handler.getById.bind(handler));

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerInput'
 *     responses:
 *       201:
 *         description: Created customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(customerSchema), handler.create.bind(handler));

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: Update a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerInput'
 *     responses:
 *       200:
 *         description: Updated customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', validate(customerSchema), handler.update.bind(handler));

/**
 * @swagger
 * /customers:
 *   delete:
 *     summary: Delete all customers
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: All customers deleted successfully
 */
router.delete('/', handler.deleteAll.bind(handler));

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       204:
 *         description: Customer deleted
 *       404:
 *         description: Customer not found
 */
router.delete('/:id', handler.delete.bind(handler));

/**
 * @swagger
 * /customers/{id}/dogs:
 *   get:
 *     summary: Get customer's dogs
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: List of customer's dogs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dog'
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.get('/:id/dogs', async (req, res, next) => {
  try {
    await dogHandler.getByCustomerId(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /customers/{id}/appointments:
 *   get:
 *     summary: Get customer's appointments
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
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
router.get('/:id/appointments', handler.getByCustomerId.bind(handler));

export default router; 