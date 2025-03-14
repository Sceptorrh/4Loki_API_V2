import { config } from 'dotenv';
import pool from '../src/config/database';
import { closeServer } from '../src/server';

// Load environment variables from .env.test if it exists
config({ path: '.env.test' });

// Global teardown that runs once after all tests
export default async function globalTeardown() {
  console.log('Global teardown: Cleaning up test environment...');
  
  try {
    // Close server first
    await closeServer();
    console.log('Server closed.');
    
    // Then close database connection
    await pool.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error during global teardown:', error);
    throw error;
  }
} 