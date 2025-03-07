import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { logStartupStatus } from './utils/startupLogger';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "4Loki API Documentation"
}));

// Routes
setupRoutes(app);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
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
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 