import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import { notFoundHandler } from './middleware/notFoundHandler';
import { logger } from './utils/logger';
import appointmentRoutes from './routes/appointmentRoutes';
import customerRoutes from './routes/customerRoutes';
import dogRoutes from './routes/dogRoutes';
import exportLogRoutes from './routes/exportLogRoutes';
import travelTimeRoutes from './routes/travelTimeRoutes';
import dropdownRoutes from './routes/dropdownRoutes';
import staticRoutes from './routes/staticRoutes';
import exportRoutes from './routes/exportRoutes';
import googleRoutes from './routes/googleRoutes';
import aiSearchRoutes from './routes/aiSearch';
import aiSettingsRoutes from './routes/aiSettings';
import { NextFunction, Request, Response } from 'express';
import { Server } from 'http';
import { convertDatesToUTC, convertDatesInResponse } from './middleware/dateHandler';
import cron from 'node-cron';
import { fetchAndSaveTravelTimes } from './utils/navigationService';
import cookieParser from 'cookie-parser';
import { authenticateToken } from './middleware/auth';
import { shouldPerformAutoBackup, performAutoBackup } from './services/google/drive';
import { loadBackupConfig } from './services/google/drive';

const app = express();

// Create HTTP server instance
let server: Server;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:3002', 'http://127.0.0.1:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'Cookie', 'x-session-id'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Set-Cookie'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Apply cookie-parser middleware
app.use(cookieParser());

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://maps.googleapis.com",
          "https://*.googleapis.com",
          "https://*.gstatic.com",
          "http://localhost:3000",
          "http://localhost:3001"
        ],
        connectSrc: [
          "'self'",
          "https://maps.googleapis.com",
          "https://*.googleapis.com",
          "https://*.gstatic.com",
          "https://maps.gstatic.com",
          "http://localhost:3000",
          "http://localhost:3001"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://maps.googleapis.com",
          "https://*.googleapis.com",
          "https://*.gstatic.com",
          "https://maps.gstatic.com",
          "http://localhost:3000",
          "http://localhost:3001"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://maps.googleapis.com",
          "https://*.googleapis.com",
          "https://*.gstatic.com",
          "http://localhost:3000",
          "http://localhost:3001"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://*.gstatic.com"
        ]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false
  })
);

app.use(compression());
// Enable morgan logger in all environments
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply date handling middleware
app.use(convertDatesToUTC);
app.use(convertDatesInResponse);

// Add custom JavaScript file for download button
app.get('/api-docs/custom-swagger.js', (req, res) => {
  res.set({
    'Content-Type': 'application/javascript',
    'Cache-Control': 'public, max-age=0'
  });
  res.send(`
    window.onload = function() {
      // Create download button
      const downloadButton = document.createElement('button');
      downloadButton.className = 'btn download-spec-btn';
      downloadButton.innerHTML = '⬇️ Download OpenAPI Spec';
      downloadButton.style.cssText = 'margin: 10px 0; padding: 5px 10px; background: #4990e2; color: white; border: none; border-radius: 4px; cursor: pointer;';
      
      // Add click handler
      downloadButton.onclick = function() {
        window.location.href = '/api-spec.json';
      };
      
      // Insert button after the info container
      const infoContainer = document.querySelector('.information-container');
      if (infoContainer) {
        infoContainer.parentNode.insertBefore(downloadButton, infoContainer.nextSibling);
      }
    };
  `);
});

// Make swagger spec available as JSON
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Debug endpoint to check the Swagger spec
app.get('/debug-swagger', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const spec = swaggerSpec as any;
  const debugInfo = {
    paths: Object.keys(spec.paths || {}),
    tags: spec.tags,
    components: {
      schemas: Object.keys(spec.components?.schemas || {})
    }
  };
  res.send(debugInfo);
});

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: "4Loki API Documentation",
  swaggerOptions: {
    docExpansion: 'list',
    displayRequestDuration: true
  }
}));

// Add endpoint to download OpenAPI spec
app.get('/api-spec.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=openapi-spec.json');
  res.send(JSON.stringify(swaggerSpec, null, 2));
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Apply global authentication middleware
app.use(authenticateToken);

// Add error logging middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  next(err);
});

// Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';
console.log('Registering routes with prefix:', apiPrefix);
setupRoutes(app);

// Remove all direct route registrations
// app.use('/api/v1/appointments', appointmentRoutes);
// app.use('/api/v1/customers', customerRoutes);
// app.use('/api/v1/dogs', dogRoutes);
// app.use('/api/v1/export-logs', exportLogRoutes);
// app.use('/api/v1/travel-times', travelTimeRoutes);
// app.use('/api/v1/dropdowns', dropdownRoutes);
// app.use('/api/v1/static', staticRoutes);
// app.use('/api/v1/exports', exportRoutes);
// app.use('/api/v1/google', googleRoutes);
// app.use('/api/v1', aiSearchRoutes);
// app.use('/api/v1', aiSettingsRoutes);

// Also register Google routes without the v1 prefix for direct OAuth redirects
app.use('/api/auth/google', googleRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Export app for testing
export { app, server };

export function startServer(port: number = parseInt(process.env.PORT || '3000')) {
  server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
    
    // Set up scheduler to update travel times every 5 minutes on weekdays between 5:30 AM and 10 PM
    cron.schedule('*/5 5-22 * * 1-5', async () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      // Only run if time is between 5:30 AM and 10:00 PM
      if ((hour > 5 || (hour === 5 && minute >= 30)) && hour < 22) {
        logger.info('Running travel time update job');
        try {
          await fetchAndSaveTravelTimes();
        } catch (error) {
          logger.error('Error in travel time update job:', error);
        }
      }
    });

    // Check for automatic backups
    const checkAutoBackup = async () => {
      try {
        // Check if automatic backup is needed
        const config = await loadBackupConfig();
        if (config?.googleDrive?.autoBackup?.enabled && config?.googleDrive?.autoBackup?.userId) {
          const shouldBackup = await shouldPerformAutoBackup(config.googleDrive.autoBackup.userId);
          if (shouldBackup) {
            logger.info('Starting automatic backup...');
            await performAutoBackup();
          }
        }
      } catch (error) {
        logger.error('Error in automatic backup check:', error);
      }
    };

    // Schedule automatic backup check using cron
    cron.schedule('*/5 * * * *', checkAutoBackup);
  });
  
  return server;
}

export function closeServer() {
  if (server) {
    return new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  return Promise.resolve();
}

// Only call startServer if this file is being run directly
if (require.main === module) {
  startServer();
} 