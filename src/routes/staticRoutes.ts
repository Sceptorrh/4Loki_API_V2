import { Router } from 'express';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';

const router = Router();

/**
 * @swagger
 * /static/appointment-statuses:
 *   get:
 *     summary: Get all appointment statuses
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: List of appointment statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   label:
 *                     type: string
 *                   order:
 *                     type: integer
 *                   is_active:
 *                     type: boolean
 *                   color:
 *                     type: string
 */
router.get('/appointment-statuses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label, `Order` as `order`, Is_Active as is_active, Color as color FROM Statics_AppointmentStatus ORDER BY `Order`');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching appointment statuses', 500);
  }
});

/**
 * @swagger
 * /static/appointment-types:
 *   get:
 *     summary: Get all appointment types
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: List of appointment types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   label:
 *                     type: string
 *                   order:
 *                     type: integer
 *                   is_active:
 *                     type: boolean
 */
router.get('/appointment-types', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label, `Order` as `order`, Is_Active as is_active FROM Statics_AppointmentType ORDER BY `Order`');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching appointment types', 500);
  }
});

/**
 * @swagger
 * /static/btw-percentages:
 *   get:
 *     summary: Get all BTW percentages
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: List of BTW percentages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   label:
 *                     type: string
 *                   amount:
 *                     type: number
 */
router.get('/btw-percentages', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label, Amount as amount FROM Statics_BTWpercentage ORDER BY amount');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching BTW percentages', 500);
  }
});

/**
 * @swagger
 * /static/custom-colors:
 *   get:
 *     summary: Get all custom colors
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: List of custom colors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   color:
 *                     type: string
 *                   order:
 *                     type: integer
 *                   hex:
 *                     type: string
 *                   legend:
 *                     type: string
 */
router.get('/custom-colors', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Color as color, `Order` as `order`, Hex as hex, Legend as legend FROM Statics_CustomColor ORDER BY `Order`');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching custom colors', 500);
  }
});

/**
 * @swagger
 * /static/dog-sizes:
 *   get:
 *     summary: Get all dog sizes
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: List of dog sizes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   label:
 *                     type: string
 *                   order:
 *                     type: integer
 *                   is_active:
 *                     type: boolean
 */
router.get('/dog-sizes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label, `Order` as `order`, Is_Active as is_active FROM Statics_DogSize ORDER BY `Order`');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching dog sizes', 500);
  }
});

/**
 * @swagger
 * /static/hour-types:
 *   get:
 *     summary: Get all hour types
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: List of hour types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   label:
 *                     type: string
 *                   default_text:
 *                     type: string
 *                   is_export:
 *                     type: boolean
 */
router.get('/hour-types', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label, DefaultText as default_text, IsExport as is_export FROM Statics_HourType ORDER BY label');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching hour types', 500);
  }
});

/**
 * @swagger
 * /static/import-export-types:
 *   get:
 *     summary: Get all import/export types
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: List of import/export types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   label:
 *                     type: string
 */
router.get('/import-export-types', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label FROM Statics_ImportExportType ORDER BY label');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching import/export types', 500);
  }
});

/**
 * @swagger
 * /static/invoice-categories:
 *   get:
 *     summary: Get all invoice categories
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: List of invoice categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   label:
 *                     type: string
 *                   knab:
 *                     type: string
 */
router.get('/invoice-categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label, Knab as knab FROM Statics_InvoiceCategory ORDER BY label');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching invoice categories', 500);
  }
});

/**
 * @swagger
 * /static/payment-types:
 *   get:
 *     summary: Get all payment types
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: List of payment types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   label:
 *                     type: string
 */
router.get('/payment-types', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label FROM Statics_PaymentType ORDER BY label');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching payment types', 500);
  }
});

/**
 * @swagger
 * /static/travel-time-types:
 *   get:
 *     summary: Get all travel time types
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: List of travel time types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   label:
 *                     type: string
 */
router.get('/travel-time-types', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label FROM Statics_TravelTimeType ORDER BY label');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching travel time types', 500);
  }
});

export default router; 