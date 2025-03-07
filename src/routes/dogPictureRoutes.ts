import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';

const router = Router();
const handler = new RouteHandler('DogPicture');

// Get all dog pictures
router.get('/', handler.getAll.bind(handler));

// Get dog picture by ID
router.get('/:id', handler.getById.bind(handler));

// Create new dog picture
router.post('/', handler.create.bind(handler));

// Update dog picture
router.put('/:id', handler.update.bind(handler));

// Delete dog picture
router.delete('/:id', handler.delete.bind(handler));

export default router; 