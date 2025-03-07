import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';

const router = Router();
const handler = new RouteHandler('DigiBTW_Expenses');

// Get all DigiBTW records
router.get('/', handler.getAll.bind(handler));

// Get DigiBTW record by ID
router.get('/:id', handler.getById.bind(handler));

// Create new DigiBTW record
router.post('/', handler.create.bind(handler));

// Update DigiBTW record
router.put('/:id', handler.update.bind(handler));

// Delete DigiBTW record
router.delete('/:id', handler.delete.bind(handler));

export default router; 