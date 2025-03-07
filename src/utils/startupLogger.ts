import pool from '../config/database';

export async function logStartupStatus() {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    connection.release();

    // Log environment
    console.log(`🚀 API starting in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 Server running on port ${process.env.PORT || 3000}`);
    console.log(`🔌 Database host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`📊 Database name: ${process.env.DB_NAME || '4Loki_db'}`);

    return true;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    return false;
  }
} 