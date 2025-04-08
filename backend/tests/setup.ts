import { config } from 'dotenv';
import { startServer } from '../src/server';

// Load environment variables from .env.test if it exists
config({ path: '.env.test' });

// Increase test timeout
jest.setTimeout(5000);

// Setup before all tests in each file
beforeAll(async () => {
  console.log('Setting up test file environment...');
  
  // No need to initialize database connection here as it's handled in globalSetup
  
  // Start server for this test file if needed
  // The server is started for each test file but database is initialized only once
  await startServer();
});

// Teardown after all tests in each file
afterAll(async () => {
  console.log('Cleaning up test file environment...');
  
  // No need to close server or database here as it's handled in globalTeardown
  // Individual test files don't need to worry about cleanup
}); 