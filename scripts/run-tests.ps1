# Function to check if a command exists
function Test-CommandExists {
    param (
        [string]$command
    )
    $exists = $null -ne (Get-Command -Name $command -ErrorAction SilentlyContinue)
    return $exists
}

# Check if Docker is running
Write-Host "Checking if Docker is running..."
try {
    $dockerStatus = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Docker is not running or not installed."
        Write-Host "Please make sure Docker Desktop is installed and running."
        Write-Host "You can download Docker Desktop from: https://www.docker.com/products/docker-desktop"
        exit 1
    }
    Write-Host "Docker is running."
} catch {
    Write-Host "Error: Docker is not installed or not in PATH."
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
}

# Check if MySQL client is available
Write-Host "Checking if MySQL client is available..."
if (-not (Test-CommandExists "mysql")) {
    Write-Host "Error: MySQL client is not installed or not in PATH."
    Write-Host "Please install MySQL client:"
    Write-Host "1. Download MySQL Installer from: https://dev.mysql.com/downloads/installer/"
    Write-Host "2. Run the installer and select 'Custom' installation"
    Write-Host "3. Select 'MySQL Command Line Client' from the available products"
    Write-Host "4. Complete the installation"
    Write-Host "5. Make sure to add MySQL to your system PATH"
    exit 1
}
Write-Host "MySQL client is available."

# Clean up existing containers
docker stop test-db 2>$null
docker rm test-db 2>$null

# Start test database with UTC timezone
docker run --name test-db -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=4Loki_db -e TZ=UTC -p 3307:3306 -d mariadb:10.11



# Wait for database to be ready
Write-Host "Waiting for database to be ready..."
Start-Sleep -Seconds 15  # Increased initial wait time

# Check if database is ready
$maxAttempts = 10
$attempt = 1
$ready = $false

while (-not $ready -and $attempt -le $maxAttempts) {
    Write-Host "Attempt $attempt of $maxAttempts to connect to database..."
    try {
        $null = mysql --host=127.0.0.1 --port=3307 --user=root --password=root 4Loki_db -e "SELECT 1;" 2>$null
        $ready = $true
        Write-Host "Database is ready!"
    } catch {
        Write-Host "Database not ready yet, waiting 5 seconds..."
        Start-Sleep -Seconds 5
        $attempt++
    }
}

if (-not $ready) {
    Write-Host "Failed to connect to database after $maxAttempts attempts"
    exit 1
}

# Initialize database schema
Write-Host "Initializing database schema..."


# Set UTC timezone in the database
mysql --host=127.0.0.1 --port=3307 --user=root --password=root -e "SET GLOBAL time_zone = '+00:00';"

# Function to execute SQL and handle errors
function Execute-SQL {
    param (
        [string]$command
    )
    try {
        $output = $command | mysql --host=127.0.0.1 --port=3307 --user=root --password=root 4Loki_db 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error executing SQL: $output"
            return $false
        }
        return $true
    } catch {
        Write-Host "Exception executing SQL: $_"
        return $false
    }
}

# Step 1: Drop existing tables if they exist
Write-Host "Step 1: Dropping existing tables..."
$dropSuccess = Execute-SQL "SET FOREIGN_KEY_CHECKS=0; SHOW TABLES" | ForEach-Object {
    if ($_ -match '\w+') {
        Execute-SQL "DROP TABLE IF EXISTS ``$_``;"
    }
}

# Step 2: Create tables
Write-Host "Step 2: Creating tables..."
$createSuccess = Execute-SQL "SET FOREIGN_KEY_CHECKS=0; source ./01-init.sql;"

if (-not $createSuccess) {
    Write-Host "Failed to create tables. Exiting..."
    exit 1
}

# Step 3: Verify tables were created
Write-Host "Step 3: Verifying tables..."
$tables = mysql --host=127.0.0.1 --port=3307 --user=root --password=root 4Loki_db -N -e "SHOW TABLES;"
if ($LASTEXITCODE -eq 0 -and $tables) {
    Write-Host "Tables created successfully:"
    $tables | ForEach-Object { Write-Host "- $_" }
} else {
    Write-Host "No tables found or error checking tables. Exiting..."
    exit 1
}

Write-Host "Database initialization completed successfully."

# Set environment variables for the database connection
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3307"
$env:DB_USER = "root"
$env:DB_PASSWORD = "root"
$env:DB_DATABASE = "4Loki_db"
$env:NODE_ENV = "test"

# Run Jest directly with the environment variables
Write-Host "Running tests..."
npx jest --verbose --detectOpenHandles --forceExit --no-cache

Write-Host "`nDatabase connection details:"
Write-Host "Host: 127.0.0.1"
Write-Host "Port: 3307"
Write-Host "User: root"
Write-Host "Password: root"
Write-Host "Database: 4Loki_db"
