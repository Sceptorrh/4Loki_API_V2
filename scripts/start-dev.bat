@echo off
echo 🚀 Starting 4Loki API with test database...

:: Run the test database setup script
echo 📦 Setting up test database...
call npm run setup-test-db

:: Check if the database setup was successful
if %ERRORLEVEL% EQU 0 (
    echo ✅ Database setup completed successfully!
    
    :: Set the environment to test
    set NODE_ENV=test
    
    :: Start the application in development mode
    echo 🌐 Starting application in development mode...
    echo 📝 API Documentation will be available at http://localhost:3000/api-docs/
    echo 📋 Press Ctrl+C to stop the application
    
    npx nodemon src/index.ts
) else (
    echo ❌ Database setup failed. Please check the error messages above.
) 