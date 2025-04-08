import express from 'express';
import { generateTestData } from '../controllers/testDataController';

const router = express.Router();

/**
 * @swagger
 * /test-data/generate:
 *   get:
 *     summary: Generate test data for the application
 *     description: Creates customers with dogs and randomized appointments spanning across months. Includes multi-dog appointments and some dogs with multiple services (most have just one service).
 *     tags: [Test Data]
 *     parameters:
 *       - in: query
 *         name: numCustomers
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         description: Number of customers to generate (maximum 1000)
 *         default: 20
 *         example: 20
 *       - in: query
 *         name: minDogsPerCustomer
 *         schema:
 *           type: integer
 *         description: Minimum number of dogs per customer
 *         default: 0
 *         example: 0
 *       - in: query
 *         name: maxDogsPerCustomer
 *         schema:
 *           type: integer
 *         description: Maximum number of dogs per customer
 *         default: 3
 *         example: 3
 *       - in: query
 *         name: minAppointmentsPerDay
 *         schema:
 *           type: integer
 *         description: Minimum number of appointments per day
 *         default: 4
 *         example: 4
 *       - in: query
 *         name: maxAppointmentsPerDay
 *         schema:
 *           type: integer
 *         description: Maximum number of appointments per day
 *         default: 5
 *         example: 5
 *       - in: query
 *         name: monthRange
 *         schema:
 *           type: integer
 *         description: Range of months to generate appointments for (current month ± this value). 0 means only current month.
 *         default: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Test data generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Test data generated successfully
 *                 summary:
 *                   type: object
 *                   properties:
 *                     customers:
 *                       type: number
 *                       example: 20
 *                     dogs:
 *                       type: number
 *                       example: 45
 *                     appointments:
 *                       type: string
 *                       example: Appointments created from 2023-04-01 to 2023-06-30
 *                     features:
 *                       type: string
 *                       example: Includes multi-dog appointments and some dogs with multiple services
 *                     configuration:
 *                       type: object
 *                       properties:
 *                         numCustomers:
 *                           type: number
 *                           example: 20
 *                         minDogsPerCustomer:
 *                           type: number
 *                           example: 0
 *                         maxDogsPerCustomer:
 *                           type: number
 *                           example: 3
 *                         minAppointmentsPerDay:
 *                           type: number
 *                           example: 4
 *                         maxAppointmentsPerDay:
 *                           type: number
 *                           example: 5
 *                         monthRange:
 *                           type: number
 *                           example: 1
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid dog count range. Min must be >= 0 and max must be >= min
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to generate test data
 *                 error:
 *                   type: string
 */
router.get('/generate', generateTestData);

export default router; 