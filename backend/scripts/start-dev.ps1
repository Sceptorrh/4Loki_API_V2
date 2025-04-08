# Script to start the 4Loki API with test database
# This script runs the test database setup and then starts the application in development mode

Write-Host "🚀 Starting 4Loki API with test database..." -ForegroundColor Cyan

# Run the test database setup script
Write-Host "📦 Setting up test database..." -ForegroundColor Yellow
npm run setup-test-db

# Check if the database setup was successful
if ($?) {
    Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
    
    # Set the environment to test
    $env:NODE_ENV = "test"
    
    # Start the application in development mode
    Write-Host "🌐 Starting application in development mode..." -ForegroundColor Yellow
    Write-Host "📝 API Documentation will be available at http://localhost:3000/api-docs/" -ForegroundColor Magenta
    Write-Host "📋 Press Ctrl+C to stop the application" -ForegroundColor Gray
    
    npx nodemon src/index.ts
} else {
    Write-Host "❌ Database setup failed. Please check the error messages above." -ForegroundColor Red
} 