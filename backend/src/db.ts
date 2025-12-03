import { Pool } from 'pg';
import { config } from './config';

let pool: Pool | null = null;

if (config.db.url) {
  pool = new Pool({
    connectionString: config.db.url,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
} else {
  console.warn('DATABASE_URL not set. Postgres integration disabled.');
}

export const db = {
  query: (text: string, params?: any[]) => {
    if (!pool) throw new Error('Database not initialized');
    return pool.query(text, params);
  },
  getClient: () => {
    if (!pool) throw new Error('Database not initialized');
    return pool.connect();
  },
  isReady: () => !!pool
};
