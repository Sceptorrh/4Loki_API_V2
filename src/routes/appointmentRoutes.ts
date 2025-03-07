import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { appointmentSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';

const router = Router();
const handler = new RouteHandler('Appointment', appointmentSchema);

// Get all appointments
router.get('/', handler.getAll.bind(handler));

// Get appointment by ID
router.get('/:id', handler.getById.bind(handler));

// Create new appointment
router.post('/', validate(appointmentSchema), handler.create.bind(handler));

// Update appointment
router.put('/:id', validate(appointmentSchema), handler.update.bind(handler));

// Delete appointment
router.delete('/:id', handler.delete.bind(handler));

// Get appointments by date range
router.get('/date-range', handler.getByDateRange.bind(handler));

// Get appointments by customer
router.get('/customer/:customerId', handler.getByCustomerId.bind(handler));

// Get appointments by status
router.get('/status/:statusId', handler.getByAppointmentId.bind(handler));

// Get appointments by type
router.get('/type/:typeId', handler.getByAppointmentId.bind(handler));

export default router; 