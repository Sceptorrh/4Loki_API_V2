import { startServer } from './server';
import { logStartupStatus } from './utils/startupLogger';

const start = async () => {
  try {
    // Log startup status
    const dbConnected = await logStartupStatus();
    
    if (!dbConnected) {
      console.error('❌ Failed to start server: Database connection failed');
      process.exit(1);
    }

    const port = parseInt(process.env.PORT || '3000');
    const server = await startServer(port);
    
    console.log('🎉 API is ready to accept requests');
    console.log(`📚 API Documentation available at http://localhost:${port}/api-docs`);
    console.log(`OpenAPI Specification available at http://localhost:${port}/api-spec.json`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server if this file is being run directly
if (require.main === module) {
  start();
} 