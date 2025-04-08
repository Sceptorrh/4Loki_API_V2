import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { dogSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';
import { RowDataPacket, OkPacket } from 'mysql2';

const router = Router();
const handler = new RouteHandler('Dog', dogSchema);

/**
 * @swagger
 * /dogs:
 *   get:
 *     summary: Get all dogs
 *     tags: [Dogs]
 *     responses:
 *       200:
 *         description: List of dogs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dog'
 */
router.get('/', handler.getAll.bind(handler));

/**
 * @swagger
 * /dogs/table:
 *   get:
 *     summary: Get dog table data with detailed information
 *     tags: [Dogs]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering dogs by name, customer name, or breed
 *     responses:
 *       200:
 *         description: List of dogs with their details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Id:
 *                     type: integer
 *                     description: Dog ID
 *                   Name:
 *                     type: string
 *                     description: Dog name
 *                   CustomerName:
 *                     type: string
 *                     description: Customer contact person name
 *                   Size:
 *                     type: string
 *                     description: Dog size label (e.g., Small, Medium, Large)
 *                   Breeds:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: List of dog breeds assigned to the dog
 */
router.get('/table', handler.getDogTable.bind(handler));

/**
 * @swagger
 * /dogs/{id}:
 *   get:
 *     summary: Get dog by ID
 *     tags: [Dogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog ID
 *     responses:
 *       200:
 *         description: Dog details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dog'
 *       404:
 *         description: Dog not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    
    // Get dog details with size information
    const [dogRows] = await pool.query<RowDataPacket[]>(
      `SELECT d.*, ds.Label as SizeName 
       FROM Dog d 
       LEFT JOIN Statics_DogSize ds ON d.DogSizeId = ds.Id 
       WHERE d.Id = ?`,
      [id]
    );
    
    if (!Array.isArray(dogRows) || dogRows.length === 0) {
      throw new AppError('Dog not found', 404);
    }
    
    const dog = dogRows[0] as any;
    
    // Get dog breeds
    const [breedRows] = await pool.query<RowDataPacket[]>(
      `SELECT db.Id, db.Name 
       FROM DogDogbreed ddb 
       JOIN Statics_Dogbreed db ON ddb.DogBreedId = db.Id 
       WHERE ddb.DogId = ?`,
      [id]
    );
    
    // Add breeds to dog object
    dog.DogBreeds = Array.isArray(breedRows) ? breedRows : [];
    
    // Format the birthday if it exists
    if (dog.Birthday) {
      dog.Birthday = new Date(dog.Birthday).toISOString().split('T')[0];
    }
    
    res.json(dog);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Error fetching dog', 500));
    }
  }
});

/**
 * @swagger
 * /dogs:
 *   post:
 *     summary: Create a new dog
 *     tags: [Dogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DogInput'
 *     responses:
 *       201:
 *         description: Created dog
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dog'
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(dogSchema), async (req, res, next) => {
  // Sanitize input data
  if (req.body.Birthday) {
    req.body.Birthday = req.body.Birthday.trim();
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Extract dogBreeds from request body
    const { DogBreeds, ...dogData } = req.body;
    
    // Create dog
    const [result] = await connection.query<OkPacket>(
      `INSERT INTO Dog (CustomerId, Name, Birthday, Allergies, ServiceNote, DogSizeId, CreatedOn, UpdatedOn) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        dogData.CustomerId,
        dogData.Name,
        dogData.Birthday || null,
        dogData.Allergies || null,
        dogData.ServiceNote || null,
        dogData.DogSizeId || null
      ]
    );
    
    const dogId = result.insertId;
    
    // Add dog breeds if provided
    if (DogBreeds && Array.isArray(DogBreeds) && DogBreeds.length > 0) {
      const breedValues = DogBreeds.map(breed => {
        // Handle both formats: { Id: 'breedId' } or 'breedId'
        const breedId = typeof breed === 'object' ? (breed.Id || breed.id) : breed;
        return [dogId, breedId];
      });
      
      await connection.query(
        `INSERT INTO DogDogbreed (DogId, DogBreedId) VALUES ?`,
        [breedValues]
      );
    }
    
    // Get the created dog with breeds
    const [dogRows] = await connection.query<RowDataPacket[]>(
      `SELECT d.*, ds.Label as SizeLabel FROM Dog d 
       LEFT JOIN Statics_DogSize ds ON d.DogSizeId = ds.Id 
       WHERE d.Id = ?`,
      [dogId]
    );
    
    // Get dog breeds
    const [breedRows] = await connection.query<RowDataPacket[]>(
      `SELECT db.Id, db.Name 
       FROM DogDogbreed ddb 
       JOIN Statics_Dogbreed db ON ddb.DogBreedId = db.Id 
       WHERE ddb.DogId = ?`,
      [dogId]
    );
    
    await connection.commit();
    
    const dog = dogRows[0] as any;
    dog.DogBreeds = Array.isArray(breedRows) ? breedRows : [];
    
    res.status(201).json(dog);
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /dogs/{id}:
 *   put:
 *     summary: Update a dog
 *     tags: [Dogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DogInput'
 *     responses:
 *       200:
 *         description: Updated dog
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dog'
 *       404:
 *         description: Dog not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', validate(dogSchema), async (req, res, next) => {
  const id = req.params.id;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Extract dogBreeds from request body
    const { DogBreeds, Id, CreatedOn, UpdatedOn, ...dogData } = req.body;
    
    // Sanitize Birthday field
    if (dogData.Birthday === '') {
      dogData.Birthday = null;
    } else if (dogData.Birthday) {
      dogData.Birthday = dogData.Birthday.trim();
    }
    
    // Check if dog exists
    const [checkResult] = await connection.query<RowDataPacket[]>(
      'SELECT Id FROM Dog WHERE Id = ?',
      [id]
    );
    
    if (!Array.isArray(checkResult) || checkResult.length === 0) {
      throw new AppError('Dog not found', 404);
    }
    
    // Update dog
    const fields = Object.keys(dogData)
      .map(field => `${field} = ?`)
      .join(', ');
    
    await connection.query(
      `UPDATE Dog SET ${fields} WHERE Id = ?`,
      [...Object.values(dogData), id]
    );
    
    // Update dog breeds if provided
    if (DogBreeds && Array.isArray(DogBreeds)) {
      // Remove existing breeds
      await connection.query(
        'DELETE FROM DogDogbreed WHERE DogId = ?',
        [id]
      );
      
      // Add new breeds
      if (DogBreeds.length > 0) {
        const breedValues = DogBreeds.map(breed => {
          // Handle both formats: { Id: 'breedId' } or 'breedId'
          const breedId = typeof breed === 'object' ? (breed.Id || breed.id) : breed;
          return [id, breedId];
        });
        
        await connection.query(
          `INSERT INTO DogDogbreed (DogId, DogBreedId) VALUES ?`,
          [breedValues]
        );
      }
    }
    
    // Get the updated dog with breeds
    const [dogRows] = await connection.query<RowDataPacket[]>(
      `SELECT d.*, ds.Label as SizeLabel FROM Dog d 
       LEFT JOIN Statics_DogSize ds ON d.DogSizeId = ds.Id 
       WHERE d.Id = ?`,
      [id]
    );
    
    // Get dog breeds
    const [breedRows] = await connection.query<RowDataPacket[]>(
      `SELECT db.Id, db.Name 
       FROM DogDogbreed ddb 
       JOIN Statics_Dogbreed db ON ddb.DogBreedId = db.Id 
       WHERE ddb.DogId = ?`,
      [id]
    );
    
    await connection.commit();
    
    const dog = dogRows[0] as any;
    dog.DogBreeds = Array.isArray(breedRows) ? breedRows : [];
    
    res.json(dog);
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /dogs/{id}:
 *   delete:
 *     summary: Delete a dog
 *     tags: [Dogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog ID
 *     responses:
 *       204:
 *         description: Dog deleted
 *       404:
 *         description: Dog not found
 */
router.delete('/:id', handler.delete.bind(handler));

/**
 * @swagger
 * /dogs/customer/{customerId}:
 *   get:
 *     summary: Get dogs by customer ID
 *     tags: [Dogs]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: List of dogs belonging to the customer
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dog'
 */
router.get('/customer/:customerId', handler.getByCustomerId.bind(handler));

/**
 * @swagger
 * /dogs:
 *   delete:
 *     summary: Delete all dogs
 *     tags: [Dogs]
 *     responses:
 *       200:
 *         description: All dogs deleted successfully
 */
router.delete('/', handler.deleteAll.bind(handler));

export default router; 