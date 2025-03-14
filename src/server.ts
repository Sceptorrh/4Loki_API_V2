import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { logStartupStatus } from './utils/startupLogger';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import { notFoundHandler } from './middleware/notFoundHandler';
import { logger } from './utils/logger';
import appointmentRoutes from './routes/appointmentRoutes';
import customerRoutes from './routes/customerRoutes';
import dogRoutes from './routes/dogRoutes';
import dropdownRoutes from './routes/dropdownRoutes';
import staticRoutes from './routes/staticRoutes';
import { NextFunction, Request, Response } from 'express';
import { Server } from 'http';
import { convertDatesToUTC, convertDatesInResponse } from './middleware/dateHandler';

const app = express();

// Create HTTP server instance
let server: Server;

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(cors(corsOptions));
app.use(compression());
// Only use morgan logger in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply date handling middleware
app.use(convertDatesToUTC);
app.use(convertDatesInResponse);

// Add error logging middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  next(err);
});

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

// Remove all the custom Swagger UI setup and use the standard approach
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: "4Loki API Documentation",
  swaggerOptions: {
    docExpansion: 'list',
    persistAuthorization: true,
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

// Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';
console.log('Registering routes with prefix:', apiPrefix);
setupRoutes(app);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Export app for testing
export { app, server };

export function startServer(port: number = parseInt(process.env.PORT || '3000')) {
  server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
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