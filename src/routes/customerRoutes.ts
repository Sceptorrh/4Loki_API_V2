import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { customerSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';

const router = Router();
const handler = new RouteHandler('Customer', customerSchema);

// Get all customers
router.get('/', handler.getAll.bind(handler));

// Get customer by ID
router.get('/:id', handler.getById.bind(handler));

// Create new customer
router.post('/', validate(customerSchema), handler.create.bind(handler));

// Update customer
router.put('/:id', validate(customerSchema), handler.update.bind(handler));

// Delete customer
router.delete('/:id', handler.delete.bind(handler));

// Get customer's dogs
router.get('/:id/dogs', handler.getByCustomerId.bind(handler));

// Get customer's appointments
router.get('/:id/appointments', handler.getByCustomerId.bind(handler));

// Get customer's invoices
router.get('/:id/invoices', handler.getByCustomerId.bind(handler));

export default router; 