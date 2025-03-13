import { config } from 'dotenv';
import pool from '../src/config/database';
import { startServer, closeServer } from '../src/server';

// Load environment variables from .env.test if it exists
config({ path: '.env.test' });

// Increase test timeout
jest.setTimeout(5000);

// Global setup before all tests
beforeAll(async () => {
  console.log('Setting up test environment...');
  try {
    // Test database connection
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
});

// Global teardown after all tests
afterAll(async () => {
  console.log('Cleaning up test environment...');
  try {
    // Close server first
    await closeServer();
    console.log('Server closed.');
    
    // Then close database connection
    await pool.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error; // Re-throw to make Jest aware of the error
  }
}); 