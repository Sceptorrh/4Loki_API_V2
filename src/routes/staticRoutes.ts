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
router.get('/appointment-statuses', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label, `Order` as `order`, Color as color FROM Statics_AppointmentStatus ORDER BY `Order`');
    res.json(rows);
  } catch (error) {
    return next(new AppError('Error fetching appointment statuses', 500));
  }
});

/**
 * @swagger
 * /static/appointment-statuses/{id}:
 *   get:
 *     summary: Get appointment status by ID
 *     tags: [Static Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment status ID
 *     responses:
 *       200:
 *         description: Appointment status details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 *                 order:
 *                   type: integer
 *                 color:
 *                   type: string
 *       404:
 *         description: Appointment status not found
 */
router.get('/appointment-statuses/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT Id as id, Label as label, `Order` as `order`, Color as color FROM Statics_AppointmentStatus WHERE Id = ?', [id]);
    
    if (!rows || (rows as any[]).length === 0) {
      return next(new AppError('Appointment status not found', 404));
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Error fetching appointment status', 500));
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
 *                     type: string
 *                   label:
 *                     type: string
 *                   order:
 *                     type: integer
 */
router.get('/appointment-types', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label, `Order` as `order` FROM Statics_AppointmentType ORDER BY `Order`');
    res.json(rows);
  } catch (error) {
    return next(new AppError('Error fetching appointment types', 500));
  }
});

/**
 * @swagger
 * /static/appointment-types/{id}:
 *   get:
 *     summary: Get appointment type by ID
 *     tags: [Static Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment type ID
 *     responses:
 *       200:
 *         description: Appointment type details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 *                 order:
 *                   type: integer
 *       404:
 *         description: Appointment type not found
 */
router.get('/appointment-types/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT Id as id, Label as label, `Order` as `order` FROM Statics_AppointmentType WHERE Id = ?', [id]);
    
    if (!rows || (rows as any[]).length === 0) {
      return next(new AppError('Appointment type not found', 404));
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Error fetching appointment type', 500));
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
 *                     type: string
 *                   label:
 *                     type: string
 *                   amount:
 *                     type: number
 */
router.get('/btw-percentages', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label, Amount as amount FROM Statics_BTWpercentage ORDER BY amount');
    res.json(rows);
  } catch (error) {
    return next(new AppError('Error fetching BTW percentages', 500));
  }
});

/**
 * @swagger
 * /static/btw-percentages/{id}:
 *   get:
 *     summary: Get BTW percentage by ID
 *     tags: [Static Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: BTW percentage ID
 *     responses:
 *       200:
 *         description: BTW percentage details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 *                 amount:
 *                   type: number
 *       404:
 *         description: BTW percentage not found
 */
router.get('/btw-percentages/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT Id as id, Label as label, Amount as amount FROM Statics_BTWpercentage WHERE Id = ?', [id]);
    
    if (!rows || (rows as any[]).length === 0) {
      return next(new AppError('BTW percentage not found', 404));
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Error fetching BTW percentage', 500));
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
router.get('/custom-colors', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT Color as color, `Order` as `order`, Hex as hex, Legend as legend FROM Statics_CustomColor ORDER BY `Order`');
    res.json(rows);
  } catch (error) {
    return next(new AppError('Error fetching custom colors', 500));
  }
});

/**
 * @swagger
 * /static/custom-colors/{color}:
 *   get:
 *     summary: Get custom color by color name
 *     tags: [Static Tables]
 *     parameters:
 *       - in: path
 *         name: color
 *         required: true
 *         schema:
 *           type: string
 *         description: Color name
 *     responses:
 *       200:
 *         description: Custom color details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 color:
 *                   type: string
 *                 order:
 *                   type: integer
 *                 hex:
 *                   type: string
 *                 legend:
 *                   type: string
 *       404:
 *         description: Custom color not found
 */
router.get('/custom-colors/:color', async (req, res, next) => {
  try {
    const { color } = req.params;
    const [rows] = await pool.query('SELECT Color as color, `Order` as `order`, Hex as hex, Legend as legend FROM Statics_CustomColor WHERE Color = ?', [color]);
    
    if (!rows || (rows as any[]).length === 0) {
      return next(new AppError('Custom color not found', 404));
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Error fetching custom color', 500));
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
 *                     type: string
 *                   label:
 *                     type: string
 *                   order:
 *                     type: integer
 */
router.get('/dog-sizes', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label, `Order` as `order` FROM Statics_DogSize ORDER BY `Order`');
    res.json(rows);
  } catch (error) {
    return next(new AppError('Error fetching dog sizes', 500));
  }
});

/**
 * @swagger
 * /static/dog-sizes/{id}:
 *   get:
 *     summary: Get dog size by ID
 *     tags: [Static Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dog size ID
 *     responses:
 *       200:
 *         description: Dog size details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 *                 order:
 *                   type: integer
 *       404:
 *         description: Dog size not found
 */
router.get('/dog-sizes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT Id as id, Label as label, `Order` as `order` FROM Statics_DogSize WHERE Id = ?', [id]);
    
    if (!rows || (rows as any[]).length === 0) {
      return next(new AppError('Dog size not found', 404));
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Error fetching dog size', 500));
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
 *                     type: string
 *                   label:
 *                     type: string
 *                   default_text:
 *                     type: string
 *                   is_export:
 *                     type: boolean
 */
router.get('/hour-types', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label, DefaultText as default_text, IsExport as is_export FROM Statics_HourType ORDER BY label');
    res.json(rows);
  } catch (error) {
    return next(new AppError('Error fetching hour types', 500));
  }
});

/**
 * @swagger
 * /static/hour-types/{id}:
 *   get:
 *     summary: Get hour type by ID
 *     tags: [Static Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hour type ID
 *     responses:
 *       200:
 *         description: Hour type details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 *                 default_text:
 *                   type: string
 *                 is_export:
 *                   type: boolean
 *       404:
 *         description: Hour type not found
 */
router.get('/hour-types/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT Id as id, Label as label, DefaultText as default_text, IsExport as is_export FROM Statics_HourType WHERE Id = ?', [id]);
    
    if (!rows || (rows as any[]).length === 0) {
      return next(new AppError('Hour type not found', 404));
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Error fetching hour type', 500));
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
 *                     type: string
 *                   label:
 *                     type: string
 */
router.get('/import-export-types', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label FROM Statics_ImportExportType ORDER BY label');
    res.json(rows);
  } catch (error) {
    return next(new AppError('Error fetching import/export types', 500));
  }
});

/**
 * @swagger
 * /static/import-export-types/{id}:
 *   get:
 *     summary: Get import/export type by ID
 *     tags: [Static Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Import/export type ID
 *     responses:
 *       200:
 *         description: Import/export type details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 *       404:
 *         description: Import/export type not found
 */
router.get('/import-export-types/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT Id as id, Label as label FROM Statics_ImportExportType WHERE Id = ?', [id]);
    
    if (!rows || (rows as any[]).length === 0) {
      return next(new AppError('Import/export type not found', 404));
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Error fetching import/export type', 500));
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
 *                     type: string
 *                   label:
 *                     type: string
 */
router.get('/payment-types', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label FROM Statics_PaymentType ORDER BY label');
    res.json(rows);
  } catch (error) {
    return next(new AppError('Error fetching payment types', 500));
  }
});

/**
 * @swagger
 * /static/payment-types/{id}:
 *   get:
 *     summary: Get payment type by ID
 *     tags: [Static Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment type ID
 *     responses:
 *       200:
 *         description: Payment type details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 *       404:
 *         description: Payment type not found
 */
router.get('/payment-types/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT Id as id, Label as label FROM Statics_PaymentType WHERE Id = ?', [id]);
    
    if (!rows || (rows as any[]).length === 0) {
      return next(new AppError('Payment type not found', 404));
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Error fetching payment type', 500));
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
 *                     type: string
 *                   label:
 *                     type: string
 */
router.get('/travel-time-types', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT Id as id, Label as label FROM Statics_TravelTimeType ORDER BY label');
    res.json(rows);
  } catch (error) {
    return next(new AppError('Error fetching travel time types', 500));
  }
});

/**
 * @swagger
 * /static/travel-time-types/{id}:
 *   get:
 *     summary: Get travel time type by ID
 *     tags: [Static Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Travel time type ID
 *     responses:
 *       200:
 *         description: Travel time type details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 *       404:
 *         description: Travel time type not found
 */
router.get('/travel-time-types/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT Id as id, Label as label FROM Statics_TravelTimeType WHERE Id = ?', [id]);
    
    if (!rows || (rows as any[]).length === 0) {
      return next(new AppError('Travel time type not found', 404));
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Error fetching travel time type', 500));
  }
});

/**
 * @swagger
 * /static/dog-breeds:
 *   get:
 *     summary: Get all dog breeds
 *     tags: [Static Tables]
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
 *                   Id:
 *                     type: string
 *                   Name:
 *                     type: string
 */
router.get('/dog-breeds', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT Id, Name FROM Statics_Dogbreed ORDER BY Name');
    res.json(rows);
  } catch (error) {
    return next(new AppError('Error fetching dog breeds', 500));
  }
});

/**
 * @swagger
 * /static/dog-breeds/{id}:
 *   get:
 *     summary: Get dog breed by ID
 *     tags: [Static Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dog breed ID
 *     responses:
 *       200:
 *         description: Dog breed details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Id:
 *                   type: string
 *                 Name:
 *                   type: string
 *       404:
 *         description: Dog breed not found
 */
router.get('/dog-breeds/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT Id, Name FROM Statics_Dogbreed WHERE Id = ?', [id]);
    
    if (!rows || (rows as any[]).length === 0) {
      return next(new AppError('Dog breed not found', 404));
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Error fetching dog breed', 500));
  }
});

/**
 * @swagger
 * /static/services:
 *   get:
 *     summary: Get all services
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: List of services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Id:
 *                     type: string
 *                   Name:
 *                     type: string
 *                   StandardPrice:
 *                     type: number
 *                   IsPriceAllowed:
 *                     type: boolean
 *                   StandardDuration:
 *                     type: integer
 */
router.get('/services', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT Id, Name, StandardPrice, IsPriceAllowed, StandardDuration FROM Statics_Service ORDER BY Name');
    res.json(rows);
  } catch (error) {
    return next(new AppError('Error fetching services', 500));
  }
});

/**
 * @swagger
 * /static/services/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Static Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Id:
 *                   type: string
 *                 Name:
 *                   type: string
 *                 StandardPrice:
 *                   type: number
 *                 IsPriceAllowed:
 *                   type: boolean
 *                 StandardDuration:
 *                   type: number
 *       404:
 *         description: Service not found
 */
router.get('/services/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT Id, Name, StandardPrice, IsPriceAllowed, StandardDuration FROM Statics_Service WHERE Id = ?', [id]);
    
    if (!rows || (rows as any[]).length === 0) {
      return next(new AppError('Service not found', 404));
    }
    
    res.json((rows as any[])[0]);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Error fetching service', 500));
  }
});

export default router; 