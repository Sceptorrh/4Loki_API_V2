import { config } from 'dotenv';
import { execSync } from 'child_process';
import pool from '../src/config/database';
import { logStartupStatus } from '../src/utils/startupLogger';

// Declare global variable for TypeScript
declare global {
  var __TEST_DB_SETUP_COMPLETE__: boolean;
}

// Load environment variables from .env.test if it exists
config({ path: '.env.test' });

// Global setup that runs once before all tests
export default async function globalSetup() {
  console.log('Global setup: Setting up test environment...');
  
  try {
    // Check if we need to run the setup-test-db script
    // This will only run if the database is not already set up
    const dbSetupNeeded = process.env.SKIP_DB_SETUP !== 'true';
    
    if (dbSetupNeeded) {
      console.log('Setting up test database...');
      execSync('node scripts/setup-test-db.js', { stdio: 'inherit' });
    } else {
      console.log('Skipping database setup as SKIP_DB_SETUP=true');
    }
    
    // Log detailed connection info
    await logStartupStatus();
    
    // Test database connection
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
    
    // Store global state to indicate setup is complete
    global.__TEST_DB_SETUP_COMPLETE__ = true;
  } catch (error) {
    console.error('Failed to set up test environment:', error);
    throw error;
  }
} 