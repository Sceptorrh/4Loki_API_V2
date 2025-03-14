import { Router } from 'express';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

interface CustomerWithDogs extends RowDataPacket {
  id: number;
  contactperson: string;
  dogs: string;
}

const router = Router();

/**
 * @swagger
 * /dropdowns/dogbreeds:
 *   get:
 *     summary: Get dog breeds for dropdown
 *     tags: [Dropdowns]
 *     responses:
 *       200:
 *         description: List of dog breeds
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 */
router.get('/dogbreeds', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Name as name FROM Statics_Dogbreed ORDER BY name');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /dropdowns/customers:
 *   get:
 *     summary: Get customers with their dogs for dropdown
 *     tags: [Dropdowns]
 *     responses:
 *       200:
 *         description: List of customers with their dogs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   contactperson:
 *                     type: string
 *                   dogs:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 */
router.get('/customers', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.Id as id,
        c.Contactpersoon as contactperson,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', d.Id,
            'name', d.Name
          )
        ) as dogs
      FROM Customer c
      LEFT JOIN Dog d ON c.Id = d.CustomerId
      GROUP BY c.Id, c.Contactpersoon
      ORDER BY c.Contactpersoon
    `;
    const [rows] = await pool.query<CustomerWithDogs[]>(query);
    const processedRows = (rows as CustomerWithDogs[]).map(row => ({
      ...row,
      dogs: JSON.parse(row.dogs)[0].id === null ? [] : JSON.parse(row.dogs)
    }));
    res.json(processedRows);
  } catch (error) {
    throw new AppError('Error fetching customers', 500);
  }
});

/**
 * @swagger
 * /dropdowns/hourtypes:
 *   get:
 *     summary: Get hour types for dropdown
 *     tags: [Dropdowns]
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
 *                     type: string
 *                   label:
 *                     type: string
 *                   defaulttext:
 *                     type: string
 *                   isExport:
 *                     type: boolean
 */
router.get('/hourtypes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label, DefaultText as defaulttext, IsExport as isExport FROM Statics_HourType ORDER BY label');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching hour types', 500);
  }
});

/**
 * @swagger
 * /dropdowns/customcolors:
 *   get:
 *     summary: Get custom colors for dropdown
 *     tags: [Dropdowns]
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
 *                   hex:
 *                     type: string
 *                   legend:
 *                     type: string
 */
router.get('/customcolors', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Color as color, Hex as hex, Legend as legend FROM Statics_CustomColor ORDER BY legend');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching custom colors', 500);
  }
});

/**
 * @swagger
 * /dropdowns/importexporttypes:
 *   get:
 *     summary: Get import/export types for dropdown
 *     tags: [Dropdowns]
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
 *                     type: string
 *                   label:
 *                     type: string
 */
router.get('/importexporttypes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label FROM Statics_ImportExportType ORDER BY label');
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching import/export types', 500);
  }
});

/**
 * @swagger
 * /dropdowns/traveldirections:
 *   get:
 *     summary: Get travel directions for dropdown
 *     tags: [Dropdowns]
 *     responses:
 *       200:
 *         description: List of travel directions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: boolean
 *                   label:
 *                     type: string
 */
router.get('/traveldirections', async (req, res) => {
  try {
    // Return the two possible values for IsHomeToWork
    const directions = [
      { value: true, label: 'Home to Work' },
      { value: false, label: 'Work to Home' }
    ];
    res.json(directions);
  } catch (error) {
    throw new AppError('Error fetching travel directions', 500);
  }
});

export default router; 