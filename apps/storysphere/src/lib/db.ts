import { Pool } from "pg";
import path from "path";

type DBClient =
  | { type: "sqlite"; db: any }
  | { type: "pg"; pool: Pool }
  | { type: "memory"; kv: Map<string, string> };

function createClient(): DBClient {
  const pgUrl = process.env.DATABASE_URL;
  if (pgUrl) {
    const pool = new Pool({ connectionString: pgUrl });
    return { type: "pg", pool };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require("better-sqlite3");
    const dbPath = process.env.SQLITE_PATH ?? path.join(process.cwd(), "apps", "storysphere", "data", "storysphere.db");
    const db = new Database(dbPath);
    return { type: "sqlite", db };
  } catch (err) {
    console.warn("better-sqlite3 not available, falling back to in-memory KV store", err);
    return { type: "memory", kv: new Map() };
  }
}

export const client = createClient();
