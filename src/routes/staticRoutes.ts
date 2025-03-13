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

/**
 * @swagger
 * /static/appointment-statuses:
 *   post:
 *     summary: Insert appointment statuses
 *     tags: [Static Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 *                 order:
 *                   type: integer
 *                 is_active:
 *                   type: boolean
 *                 color:
 *                   type: string
 */
router.post('/appointment-statuses', async (req, res) => {
  try {
    const statuses = req.body;
    console.log('Received appointment statuses:', JSON.stringify(statuses, null, 2));
    
    if (!Array.isArray(statuses)) {
      throw new AppError('Request body must be an array', 400);
    }

    for (const status of statuses) {
      if (!status.id || !status.label || typeof status.order !== 'number' || typeof status.is_active !== 'number' || !status.color) {
        console.log('Invalid status object:', status);
        throw new AppError('Invalid status object', 400);
      }

      console.log('Inserting status:', status);
      const result = await pool.query(
        'INSERT INTO Statics_AppointmentStatus (Id, Label, `Order`, Is_Active, Color) VALUES (?, ?, ?, ?, ?)',
        [status.id, status.label, status.order, status.is_active, status.color]
      );
      console.log('Insert result:', result);
    }
    res.status(201).json({ message: 'Appointment statuses inserted successfully' });
  } catch (error: any) {
    console.error('Error inserting appointment statuses:', error);
    throw new AppError(`Error inserting appointment statuses: ${error.message || 'Unknown error'}`, 500);
  }
});

/**
 * @swagger
 * /static/appointment-types:
 *   post:
 *     summary: Insert appointment types
 *     tags: [Static Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 label:
 *                   type: string
 *                 order:
 *                   type: integer
 *                 is_active:
 *                   type: boolean
 *                 label_dutch:
 *                   type: string
 */
router.post('/appointment-types', async (req, res) => {
  try {
    const types = req.body;
    for (const type of types) {
      await pool.query(
        'INSERT INTO Statics_AppointmentType (Id, Label, `Order`, Is_Active, LabelDutch) VALUES (?, ?, ?, ?, ?)',
        [type.id, type.label, type.order, type.is_active, type.label_dutch]
      );
    }
    res.status(201).json({ message: 'Appointment types inserted successfully' });
  } catch (error) {
    throw new AppError('Error inserting appointment types', 500);
  }
});

/**
 * @swagger
 * /static/btw-percentages:
 *   post:
 *     summary: Insert BTW percentages
 *     tags: [Static Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 label:
 *                   type: string
 *                 amount:
 *                   type: number
 */
router.post('/btw-percentages', async (req, res) => {
  try {
    const percentages = req.body;
    for (const percentage of percentages) {
      await pool.query(
        'INSERT INTO Statics_BTWpercentage (Id, Label, Amount) VALUES (?, ?, ?)',
        [percentage.id, percentage.label, percentage.amount]
      );
    }
    res.status(201).json({ message: 'BTW percentages inserted successfully' });
  } catch (error) {
    throw new AppError('Error inserting BTW percentages', 500);
  }
});

/**
 * @swagger
 * /static/custom-colors:
 *   post:
 *     summary: Insert custom colors
 *     tags: [Static Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
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
 */
router.post('/custom-colors', async (req, res) => {
  try {
    const colors = req.body;
    console.log('Received custom colors:', JSON.stringify(colors, null, 2));
    
    if (!Array.isArray(colors)) {
      throw new AppError('Request body must be an array', 400);
    }

    for (const color of colors) {
      if (!color.color || !color.order || !color.hex || !color.legend) {
        console.log('Invalid color object:', color);
        throw new AppError('Invalid color object', 400);
      }

      console.log('Inserting color:', color);
      const result = await pool.query(
        'INSERT INTO Statics_CustomColor (Color, `Order`, Hex, Legend) VALUES (?, ?, ?, ?)',
        [color.color, color.order, color.hex, color.legend]
      );
      console.log('Insert result:', result);
    }

    // Verify the colors were inserted
    const [insertedColors] = await pool.query('SELECT * FROM Statics_CustomColor');
    console.log('Inserted colors in database:', insertedColors);

    res.status(201).json({ message: 'Custom colors inserted successfully' });
  } catch (error: any) {
    console.error('Error inserting custom colors:', error);
    throw new AppError(`Error inserting custom colors: ${error.message || 'Unknown error'}`, 500);
  }
});

/**
 * @swagger
 * /static/dog-sizes:
 *   post:
 *     summary: Insert dog sizes
 *     tags: [Static Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 *                 order:
 *                   type: integer
 *                 is_active:
 *                   type: boolean
 */
router.post('/dog-sizes', async (req, res) => {
  try {
    const sizes = req.body;
    for (const size of sizes) {
      await pool.query(
        'INSERT INTO Statics_DogSize (Id, Label, `Order`, Is_Active) VALUES (?, ?, ?, ?)',
        [size.id, size.label, size.order, size.is_active]
      );
    }
    res.status(201).json({ message: 'Dog sizes inserted successfully' });
  } catch (error) {
    throw new AppError('Error inserting dog sizes', 500);
  }
});

/**
 * @swagger
 * /static/hour-types:
 *   post:
 *     summary: Insert hour types
 *     tags: [Static Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 *                 order:
 *                   type: integer
 *                 is_active:
 *                   type: boolean
 *                 default_text:
 *                   type: string
 *                 is_export:
 *                   type: boolean
 */
router.post('/hour-types', async (req, res) => {
  try {
    const types = req.body;
    for (const type of types) {
      await pool.query(
        'INSERT INTO Statics_HourType (Id, Label, `Order`, Is_Active, DefaultText, IsExport) VALUES (?, ?, ?, ?, ?, ?)',
        [type.id, type.label, type.order, type.is_active, type.default_text, type.is_export]
      );
    }
    res.status(201).json({ message: 'Hour types inserted successfully' });
  } catch (error) {
    throw new AppError('Error inserting hour types', 500);
  }
});

/**
 * @swagger
 * /static/import-export-types:
 *   post:
 *     summary: Insert import/export types
 *     tags: [Static Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 */
router.post('/import-export-types', async (req, res) => {
  try {
    const types = req.body;
    for (const type of types) {
      await pool.query(
        'INSERT INTO Statics_ImportExportType (Id, Label) VALUES (?, ?)',
        [type.id, type.label]
      );
    }
    res.status(201).json({ message: 'Import/export types inserted successfully' });
  } catch (error) {
    throw new AppError('Error inserting import/export types', 500);
  }
});

/**
 * @swagger
 * /static/invoice-categories:
 *   post:
 *     summary: Insert invoice categories
 *     tags: [Static Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 label:
 *                   type: string
 *                 order:
 *                   type: integer
 *                 is_active:
 *                   type: boolean
 *                 knab:
 *                   type: string
 */
router.post('/invoice-categories', async (req, res) => {
  try {
    const categories = req.body;
    for (const category of categories) {
      await pool.query(
        'INSERT INTO Statics_InvoiceCategory (Id, Label, `Order`, Is_Active, Knab) VALUES (?, ?, ?, ?, ?)',
        [category.id, category.label, category.order, category.is_active, category.knab]
      );
    }
    res.status(201).json({ message: 'Invoice categories inserted successfully' });
  } catch (error) {
    throw new AppError('Error inserting invoice categories', 500);
  }
});

/**
 * @swagger
 * /static/payment-types:
 *   post:
 *     summary: Insert payment types
 *     tags: [Static Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 label:
 *                   type: string
 *                 order:
 *                   type: integer
 *                 is_active:
 *                   type: boolean
 *                 label_dutch:
 *                   type: string
 */
router.post('/payment-types', async (req, res) => {
  try {
    const types = req.body;
    for (const type of types) {
      await pool.query(
        'INSERT INTO Statics_PaymentType (Id, Label, `Order`, Is_Active, LabelDutch) VALUES (?, ?, ?, ?, ?)',
        [type.id, type.label, type.order, type.is_active, type.label_dutch]
      );
    }
    res.status(201).json({ message: 'Payment types inserted successfully' });
  } catch (error) {
    throw new AppError('Error inserting payment types', 500);
  }
});

/**
 * @swagger
 * /static/travel-time-types:
 *   post:
 *     summary: Insert travel time types
 *     tags: [Static Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 label:
 *                   type: string
 *                 order:
 *                   type: integer
 *                 is_active:
 *                   type: boolean
 */
router.post('/travel-time-types', async (req, res) => {
  try {
    const types = req.body;
    for (const type of types) {
      await pool.query(
        'INSERT INTO Statics_TravelTimeType (Id, Label, `Order`, Is_Active) VALUES (?, ?, ?, ?)',
        [type.id, type.label, type.order, type.is_active]
      );
    }
    res.status(201).json({ message: 'Travel time types inserted successfully' });
  } catch (error) {
    throw new AppError('Error inserting travel time types', 500);
  }
});

/**
 * @swagger
 * /static/appointment-statuses:
 *   delete:
 *     summary: Delete all appointment statuses
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: All appointment statuses deleted successfully
 */
router.delete('/appointment-statuses', async (req, res) => {
  try {
    // First, get all appointments that have appointment statuses
    const [appointments] = await pool.query('SELECT Id, AppointmentStatusId FROM Appointment');
    
    if (Array.isArray(appointments) && appointments.length > 0) {
      // Update all appointments to use a temporary status
      await pool.query('UPDATE Appointment SET AppointmentStatusId = NULL');
    }
    
    // Now we can safely delete the appointment statuses
    await pool.query('DELETE FROM Statics_AppointmentStatus');
    
    res.json({ message: 'All appointment statuses deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting appointment statuses:', error);
    throw new AppError(`Error deleting appointment statuses: ${error.message || 'Unknown error'}`, 500);
  }
});

/**
 * @swagger
 * /static/custom-colors:
 *   delete:
 *     summary: Delete all custom colors
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: All custom colors deleted successfully
 */
router.delete('/custom-colors', async (req, res) => {
  try {
    await pool.query('DELETE FROM Statics_CustomColor');
    res.json({ message: 'All custom colors deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting custom colors:', error);
    throw new AppError(`Error deleting custom colors: ${error.message || 'Unknown error'}`, 500);
  }
});

/**
 * @swagger
 * /static/appointment-types:
 *   delete:
 *     summary: Delete all appointment types
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: All appointment types deleted successfully
 */
router.delete('/appointment-types', async (req, res) => {
  try {
    // First, get all appointments that have appointment types
    const [appointments] = await pool.query('SELECT Id, AppointmentTypeId FROM Appointment');
    
    if (Array.isArray(appointments) && appointments.length > 0) {
      // Update all appointments to use a temporary type
      await pool.query('UPDATE Appointment SET AppointmentTypeId = NULL');
    }
    
    // Now we can safely delete the appointment types
    await pool.query('DELETE FROM Statics_AppointmentType');
    
    res.json({ message: 'All appointment types deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting appointment types:', error);
    throw new AppError(`Error deleting appointment types: ${error.message || 'Unknown error'}`, 500);
  }
});

/**
 * @swagger
 * /static/dog-sizes:
 *   delete:
 *     summary: Delete all dog sizes
 *     tags: [Static Tables]
 *     responses:
 *       200:
 *         description: All dog sizes deleted successfully
 */
router.delete('/dog-sizes', async (req, res) => {
  try {
    // First, get all dogs that have sizes
    const [dogs] = await pool.query('SELECT Id, DogSizeId FROM Dog');
    
    if (Array.isArray(dogs) && dogs.length > 0) {
      // Update all dogs to use a temporary size
      await pool.query('UPDATE Dog SET DogSizeId = NULL');
    }
    
    // Now we can safely delete the dog sizes
    await pool.query('DELETE FROM Statics_DogSize');
    
    res.json({ message: 'All dog sizes deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting dog sizes:', error);
    throw new AppError(`Error deleting dog sizes: ${error.message || 'Unknown error'}`, 500);
  }
});

export default router; 