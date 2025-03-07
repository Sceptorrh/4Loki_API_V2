import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';

const router = Router();
const handler = new RouteHandler('Service');

// Get all services
router.get('/', handler.getAll.bind(handler));

// Get service by ID
router.get('/:id', handler.getById.bind(handler));

// Create new service
router.post('/', handler.create.bind(handler));

// Update service
router.put('/:id', handler.update.bind(handler));

// Delete service
router.delete('/:id', handler.delete.bind(handler));

export default router; 