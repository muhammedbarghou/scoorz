import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection on startup
pool.on('connect', () => {
  console.log('Database connection established');
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Test the connection
pool.query('SELECT NOW()')
  .then(() => {
    console.log('Database connection test successful');
  })
  .catch((err) => {
    console.error('Database connection test failed:', err);
    process.exit(1);
  });

export const db = drizzle(pool);
