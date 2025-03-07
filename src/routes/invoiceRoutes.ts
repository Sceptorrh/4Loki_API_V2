import { Router } from 'express';
import { RouteHandler } from '../utils/routeHandler';
import { invoiceSchema } from '../validation/schemas';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';

const router = Router();
const handler = new RouteHandler('Invoice', invoiceSchema);

// Get all invoices
router.get('/', handler.getAll.bind(handler));

// Get invoice by ID
router.get('/:id', handler.getById.bind(handler));

// Create new invoice
router.post('/', validate(invoiceSchema), handler.create.bind(handler));

// Update invoice
router.put('/:id', validate(invoiceSchema), handler.update.bind(handler));

// Delete invoice
router.delete('/:id', handler.delete.bind(handler));

// Get invoices by date range
router.get('/date-range', handler.getByDateRange.bind(handler));

// Get invoices by customer
router.get('/customer/:customerId', handler.getByCustomerId.bind(handler));

// Get invoices by appointment
router.get('/appointment/:appointmentId', handler.getByAppointmentId.bind(handler));

// Get unpaid invoices
router.get('/unpaid', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Invoice WHERE IsPaid = false'
    );
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching unpaid invoices', 500);
  }
});

// Get paid invoices
router.get('/paid', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Invoice WHERE IsPaid = true'
    );
    res.json(rows);
  } catch (error) {
    throw new AppError('Error fetching paid invoices', 500);
  }
});

export default router; 