import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';

const router = Router();
const handler = new RouteHandler('TravelTime');

// Get all travel times
router.get('/', handler.getAll.bind(handler));

// Get travel time by ID
router.get('/:id', handler.getById.bind(handler));

// Create new travel time
router.post('/', handler.create.bind(handler));

// Update travel time
router.put('/:id', handler.update.bind(handler));

// Delete travel time
router.delete('/:id', handler.delete.bind(handler));

export default router; 