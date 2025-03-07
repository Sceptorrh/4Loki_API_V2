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
import serviceRoutes from './routes/serviceRoutes';
import { NextFunction, Request, Response } from 'express';

const app = express();

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
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add error logging middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  next(err);
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Add endpoint to download OpenAPI spec
app.get('/api-spec.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=openapi-spec.json');
  res.send(JSON.stringify(swaggerSpec, null, 2));
});

// Serve Swagger UI static files
app.use('/swagger-ui', express.static(path.join(__dirname, '../node_modules/swagger-ui-dist')));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';
app.use(`${apiPrefix}/customers`, customerRoutes);
app.use(`${apiPrefix}/dogs`, dogRoutes);
app.use(`${apiPrefix}/appointments`, appointmentRoutes);
app.use(`${apiPrefix}/services`, serviceRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Start server with logging
const startServer = async () => {
  try {
    // Log startup status
    const dbConnected = await logStartupStatus();
    
    if (!dbConnected) {
      console.error('❌ Failed to start server: Database connection failed');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`✨ Server is running on port ${PORT}`);
      console.log('🎉 API is ready to accept requests');
      console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
      console.log(`OpenAPI Specification available at http://localhost:${PORT}/api-spec.json`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 