import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';

const router = Router();
const handler = new RouteHandler('AdditionalHour');

// Get all additional hours
router.get('/', handler.getAll.bind(handler));

// Get additional hour by ID
router.get('/:id', handler.getById.bind(handler));

// Create new additional hour
router.post('/', handler.create.bind(handler));

// Update additional hour
router.put('/:id', handler.update.bind(handler));

// Delete additional hour
router.delete('/:id', handler.delete.bind(handler));

export default router; 