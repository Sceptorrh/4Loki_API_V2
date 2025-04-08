const { execSync } = require('child_process');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

// Set environment variables for the test database
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3307';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'root';
process.env.DB_DATABASE = '4Loki_db';
process.env.NODE_ENV = 'test';

async function main() {
  console.log('Setting up test database...');

  // Clean up existing containers
  try {
    execSync('docker stop test-db', { stdio: 'ignore' });
    execSync('docker rm test-db', { stdio: 'ignore' });
  } catch (error) {
    // Ignore errors if container doesn't exist
  }

  // Start MariaDB container
  console.log('Starting MariaDB container...');
  execSync('docker run --name test-db -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=4Loki_db -e TZ=UTC -p 3307:3306 -d mariadb:10.11', { stdio: 'inherit' });

  // Wait for database to be ready
  console.log('Waiting for database to be ready...');
  await sleep(15000); // Initial wait

  // Check database connection
  let ready = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!ready && attempts < maxAttempts) {
    try {
      execSync('mysql --host=127.0.0.1 --port=3307 --user=root --password=root 4Loki_db -e "SELECT 1;"', { stdio: 'ignore' });
      ready = true;
      console.log('Database is ready!');
    } catch (error) {
      attempts++;
      console.log(`Database not ready yet (attempt ${attempts}/${maxAttempts}), waiting 5 seconds...`);
      await sleep(5000);
    }
  }

  if (!ready) {
    console.error('Failed to connect to database after maximum attempts');
    process.exit(1);
  }

  // Set UTC timezone
  console.log('Setting database timezone...');
  execSync('mysql --host=127.0.0.1 --port=3307 --user=root --password=root -e "SET GLOBAL time_zone = \'+00:00\';"', { stdio: 'inherit' });

  // Initialize database schema
  console.log('Initializing database schema...');
  try {
    // Drop existing tables
    execSync('mysql --host=127.0.0.1 --port=3307 --user=root --password=root 4Loki_db -e "SET FOREIGN_KEY_CHECKS=0;"', { stdio: 'inherit' });
    const tables = execSync('mysql --host=127.0.0.1 --port=3307 --user=root --password=root 4Loki_db -N -e "SHOW TABLES;"', { encoding: 'utf8' });
    if (tables) {
      tables.split('\n').filter(Boolean).forEach(table => {
        execSync(`mysql --host=127.0.0.1 --port=3307 --user=root --password=root 4Loki_db -e "DROP TABLE IF EXISTS ${table};"`, { stdio: 'inherit' });
      });
    }

    // Create new tables
    execSync('mysql --host=127.0.0.1 --port=3307 --user=root --password=root 4Loki_db < ./01-init.sql', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }

  console.log('Database setup completed successfully!');
}

main().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
}); 