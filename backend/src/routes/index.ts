import { Express } from 'express';
import customerRoutes from './customerRoutes';
import dogRoutes from './dogRoutes';
import appointmentRoutes from './appointmentRoutes';
import travelTimeRoutes from './travelTimeRoutes';
import staticRoutes from './staticRoutes';
import dropdownRoutes from './dropdownRoutes';
import additionalHourRoutes from './additionalHourRoutes';
import exportLogRoutes from './exportLogRoutes';
import testDataRoutes from './testDataRoutes';
import exportRoutes from './exportRoutes';
import backupRoutes from './backupRoutes';
import navigationSettingsRoutes from './navigationSettingsRoutes';
import googleSettingsRoutes from './googleSettingsRoutes';
import googleRoutes from './googleRoutes';
import aiSettingsRoutes from './aiSettings';

export const setupRoutes = (app: Express) => {
  const apiPrefix = process.env.API_PREFIX || '/api/v1';

  app.use(`${apiPrefix}/customers`, customerRoutes);
  app.use(`${apiPrefix}/dogs`, dogRoutes);
  app.use(`${apiPrefix}/appointments`, appointmentRoutes);
  app.use(`${apiPrefix}/travel-time`, travelTimeRoutes);
  app.use(`${apiPrefix}/static`, staticRoutes);
  app.use(`${apiPrefix}/dropdowns`, dropdownRoutes);
  app.use(`${apiPrefix}/additional-hours`, additionalHourRoutes);
  app.use(`${apiPrefix}/export-logs`, exportLogRoutes);
  app.use(`${apiPrefix}/test-data`, testDataRoutes);
  app.use(`${apiPrefix}/exports`, exportRoutes);
  app.use(`${apiPrefix}/backup`, backupRoutes);
  app.use(`${apiPrefix}/navigation-settings`, navigationSettingsRoutes);
  app.use(`${apiPrefix}/settings/google`, googleSettingsRoutes);
  app.use(`${apiPrefix}/settings/navigation`, navigationSettingsRoutes);
  app.use(`${apiPrefix}/settings/ai`, aiSettingsRoutes);
  app.use(`${apiPrefix}/google`, googleRoutes);
}; 