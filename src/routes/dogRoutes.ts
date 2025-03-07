import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { dogSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';

const router = Router();
const handler = new RouteHandler('Dog', dogSchema);

// Get all dogs
router.get('/', handler.getAll.bind(handler));

// Get dog by ID
router.get('/:id', handler.getById.bind(handler));

// Create new dog
router.post('/', validate(dogSchema), handler.create.bind(handler));

// Update dog
router.put('/:id', validate(dogSchema), handler.update.bind(handler));

// Delete dog
router.delete('/:id', handler.delete.bind(handler));

// Get dogs by customer
router.get('/customer/:customerId', handler.getByCustomerId.bind(handler));

// Get dogs by size
router.get('/size/:sizeId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Dog WHERE DogSizeId = ?',
      [req.params.sizeId]
    );
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching dogs by size', 500);
  }
});

// Get dogs with allergies
router.get('/allergies', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Dog WHERE Allergies IS NOT NULL AND Allergies != ""'
    );
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching dogs with allergies', 500);
  }
});

// Get dogs with service notes
router.get('/service-notes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Dog WHERE ServiceNote IS NOT NULL AND ServiceNote != ""'
    );
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching dogs with service notes', 500);
  }
});

export default router; 