import path from "path";

// Lightweight PG type so we don't depend on external typings during build.
type PgPool = {
  query: (...args: any[]) => Promise<any>;
  end: () => Promise<void>;
};

type DBClient =
  | { type: "sqlite"; db: any }
  | { type: "pg"; pool: PgPool }
  | { type: "memory"; kv: Map<string, string> };

function createClient(): DBClient {
  const pgUrl = process.env.DATABASE_URL;
  if (pgUrl) {
    const { Pool } = require("pg");
    const pool: PgPool = new Pool({ connectionString: pgUrl });
    return { type: "pg", pool };
  }

  try {
    const Database = require("better-sqlite3");
    const dbPath = process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "storysphere.db");
    const db = new Database(dbPath);
    return { type: "sqlite", db };
  } catch (err) {
    console.warn("better-sqlite3 not available, falling back to in-memory KV store", err);
    return { type: "memory", kv: new Map() };
  }
}

export const client = createClient();
