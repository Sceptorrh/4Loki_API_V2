import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';

const router = Router();
const handler = new RouteHandler('ExportLog');

// Get all export logs
router.get('/', handler.getAll.bind(handler));

// Get export log by ID
router.get('/:id', handler.getById.bind(handler));

// Create new export log
router.post('/', handler.create.bind(handler));

// Update export log
router.put('/:id', handler.update.bind(handler));

// Delete export log
router.delete('/:id', handler.delete.bind(handler));

export default router; 