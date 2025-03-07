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

const app = express();

// CORS configuration
const allowedOrigins = process.env.VITE_ALLOWED_ORIGINS?.split(',') || ['*'];
const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors(corsOptions));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Routes
setupRoutes(app);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/dogs', dogRoutes);
app.use('/api/v1/services', serviceRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

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