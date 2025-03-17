import express from 'express';
import { getFinancialStats, getAppointmentStats, getServiceTypeStats } from '../controllers/reportsController';

const router = express.Router();

router.get('/financial', getFinancialStats);
router.get('/appointments', getAppointmentStats);
router.get('/services', getServiceTypeStats);

export default router; 