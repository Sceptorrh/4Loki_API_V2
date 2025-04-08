import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { additionalHourSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';
import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

const router = Router();
const handler = new RouteHandler('AdditionalHour', additionalHourSchema);

/**
 * @swagger
 * /additional-hours:
 *   get:
 *     summary: Get all additional hours
 *     tags: [Additional Hours]
 *     responses:
 *       200:
 *         description: List of additional hours
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdditionalHour'
 */
router.get('/', handler.getAll.bind(handler));

/**
 * @swagger
 * /additional-hours/date-range:
 *   get:
 *     summary: Get additional hours by date range
 *     tags: [Additional Hours]
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
 *         description: List of additional hours within the date range
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdditionalHour'
 */
router.get('/date-range', handler.getByDateRange.bind(handler));

interface TravelCleaningResult {
  travelTimes: Record<string, number>;
  cleaningTimes: Record<string, number>;
}

interface AdditionalHourRow extends RowDataPacket {
  Date: string;
  HourTypeId: string;
  totalDuration: number;
}

/**
 * @swagger
 * /additional-hours/travel-cleaning:
 *   get:
 *     summary: Get travel and cleaning times for a specific date range
 *     tags: [Additional Hours]
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
 *         description: Travel and cleaning times grouped by date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 travelTimes:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                     description: Travel time in minutes for each date
 *                 cleaningTimes:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                     description: Cleaning time in minutes for each date
 */
router.get('/travel-cleaning', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const [rows] = await pool.query<AdditionalHourRow[]>(`
      SELECT 
        Date,
        HourTypeId,
        SUM(Duration) as totalDuration
      FROM AdditionalHour
      WHERE Date BETWEEN ? AND ?
        AND HourTypeId IN ('Reis', 'sch')
      GROUP BY Date, HourTypeId
    `, [startDate, endDate]);

    const result: TravelCleaningResult = {
      travelTimes: {},
      cleaningTimes: {}
    };

    rows.forEach((row) => {
      const date = row.Date;
      if (row.HourTypeId === 'Reis') {
        result.travelTimes[date] = row.totalDuration;
      } else if (row.HourTypeId === 'sch') {
        result.cleaningTimes[date] = row.totalDuration;
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching travel and cleaning times:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /additional-hours/{id}:
 *   get:
 *     summary: Get additional hour by ID
 *     tags: [Additional Hours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Additional Hour ID
 *     responses:
 *       200:
 *         description: Additional hour details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdditionalHour'
 *       404:
 *         description: Additional hour not found
 */
router.get('/:id', handler.getById.bind(handler));

/**
 * @swagger
 * /additional-hours:
 *   post:
 *     summary: Create a new additional hour
 *     tags: [Additional Hours]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdditionalHourInput'
 *     responses:
 *       201:
 *         description: Created additional hour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdditionalHour'
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(additionalHourSchema), handler.create.bind(handler));

/**
 * @swagger
 * /additional-hours/{id}:
 *   put:
 *     summary: Update an additional hour
 *     tags: [Additional Hours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Additional Hour ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdditionalHourInput'
 *     responses:
 *       200:
 *         description: Updated additional hour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdditionalHour'
 *       404:
 *         description: Additional hour not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', validate(additionalHourSchema), handler.update.bind(handler));

/**
 * @swagger
 * /additional-hours/{id}:
 *   delete:
 *     summary: Delete an additional hour
 *     tags: [Additional Hours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Additional Hour ID
 *     responses:
 *       204:
 *         description: Additional hour deleted
 *       404:
 *         description: Additional hour not found
 */
router.delete('/:id', handler.delete.bind(handler));

export default router; 