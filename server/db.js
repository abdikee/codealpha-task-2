import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'social_media',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Connection error handling
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Connection retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Wait for specified milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a query with automatic retry logic
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} Query result
 */
export async function query(text, params = [], retryCount = 0) {
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn('Slow query detected:', {
        text,
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', {
      message: error.message,
      query: text,
      params,
      retryCount
    });
    
    // Retry logic for connection errors
    if (retryCount < MAX_RETRIES && isRetryableError(error)) {
      console.log(`Retrying query (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await wait(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      return query(text, params, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * Get a client from the pool for transaction support
 * @returns {Promise<Object>} Database client
 */
export async function getClient() {
  try {
    const client = await pool.connect();
    
    // Wrap the release method to add error handling
    const originalRelease = client.release.bind(client);
    client.release = () => {
      try {
        originalRelease();
      } catch (error) {
        console.error('Error releasing client:', error);
      }
    };
    
    return client;
  } catch (error) {
    console.error('Error getting database client:', error);
    throw error;
  }
}

/**
 * Execute a transaction with automatic rollback on error
 * @param {Function} callback - Async function that receives a client and executes queries
 * @returns {Promise<any>} Result from callback
 */
export async function transaction(callback) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if an error is retryable
 * @param {Error} error - Database error
 * @returns {boolean} True if error is retryable
 */
function isRetryableError(error) {
  const retryableCodes = [
    'ECONNREFUSED', // Connection refused
    'ETIMEDOUT', // Connection timeout
    'ENOTFOUND', // DNS lookup failed
    'ECONNRESET', // Connection reset
    '57P03', // PostgreSQL: cannot connect now
    '53300', // PostgreSQL: too many connections
  ];
  
  return retryableCodes.includes(error.code);
}

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connection successful:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

/**
 * Close all connections in the pool
 * @returns {Promise<void>}
 */
export async function closePool() {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
    throw error;
  }
}

/**
 * Get pool statistics
 * @returns {Object} Pool statistics
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// Export pool for advanced use cases
export { pool };

// Test connection on module load
testConnection().catch(err => {
  console.error('Initial database connection test failed:', err);
});
