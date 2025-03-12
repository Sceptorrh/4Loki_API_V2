import { Express } from 'express';
import customerRoutes from './customerRoutes';
import dogRoutes from './dogRoutes';
import appointmentRoutes from './appointmentRoutes';
import invoiceRoutes from './invoiceRoutes';
import serviceRoutes from './serviceRoutes';
import dogPictureRoutes from './dogPictureRoutes';
import additionalHourRoutes from './additionalHourRoutes';
import digiBTWRoutes from './digiBTWRoutes';
import exportLogRoutes from './exportLogRoutes';
import travelTimeRoutes from './travelTimeRoutes';
import staticRoutes from './staticRoutes';
import dropdownRoutes from './dropdownRoutes';
import dogBreedRoutes from './dogBreedRoutes';

export const setupRoutes = (app: Express) => {
  const apiPrefix = process.env.API_PREFIX || '/api/v1';

  app.use(`${apiPrefix}/customers`, customerRoutes);
  app.use(`${apiPrefix}/dogs`, dogRoutes);
  app.use(`${apiPrefix}/appointments`, appointmentRoutes);
  app.use(`${apiPrefix}/invoices`, invoiceRoutes);
  app.use(`${apiPrefix}/services`, serviceRoutes);
  app.use(`${apiPrefix}/dog-pictures`, dogPictureRoutes);
  app.use(`${apiPrefix}/additional-hours`, additionalHourRoutes);
  app.use(`${apiPrefix}/digi-btw`, digiBTWRoutes);
  app.use(`${apiPrefix}/export-logs`, exportLogRoutes);
  app.use(`${apiPrefix}/travel-times`, travelTimeRoutes);
  app.use(`${apiPrefix}/static`, staticRoutes);
  app.use(`${apiPrefix}/dropdowns`, dropdownRoutes);
  app.use(`${apiPrefix}/dog-breeds`, dogBreedRoutes);
}; 