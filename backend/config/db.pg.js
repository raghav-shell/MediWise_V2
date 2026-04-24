import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

/**
 * PostgreSQL Connection Pool Configuration
 * Uses Supabase or any PostgreSQL database via DATABASE_URL
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('[DB] PostgreSQL connection error:', err);
  } else {
    console.log('[DB] ✅ PostgreSQL connected successfully');
  }
});

// Handle connection errors
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

/**
 * Query helper with prepared statements
 * @param {string} query - SQL query with $1, $2 placeholders
 * @param {array} values - Parameter values
 * @returns {Promise}
 */
export async function query(text, values = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, values);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.log(`[DB] Slow query (${duration}ms):`, text.substring(0, 80));
    }
    return result;
  } catch (error) {
    console.error('[DB] Query error:', error);
    throw error;
  }
}

/**
 * Transaction helper
 * @param {Function} callback - Async function to execute within transaction
 */
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DB] Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close pool (for graceful shutdown)
 */
export async function closePool() {
  await pool.end();
  console.log('[DB] Connection pool closed');
}

export default { query, transaction, closePool, pool };
