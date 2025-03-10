#!/bin/bash

# Start the test database
echo "Starting test database..."
docker-compose -f docker-compose.test.yml up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "Running database migrations..."
mysql -h127.0.0.1 -uroot -proot test_db < ./database/migrations/01-init.sql

# Run the tests
echo "Running tests..."
npm test

# Cleanup
echo "Cleaning up..."
docker-compose -f docker-compose.test.yml down

echo "Done!" 