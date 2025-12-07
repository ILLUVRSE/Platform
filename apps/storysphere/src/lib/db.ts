import Database from "better-sqlite3";
import { Pool } from "pg";
import path from "path";

type DBClient =
  | { type: "sqlite"; db: Database.Database }
  | { type: "pg"; pool: Pool };

function createClient(): DBClient {
  const pgUrl = process.env.DATABASE_URL;
  if (pgUrl) {
    const pool = new Pool({ connectionString: pgUrl });
    return { type: "pg", pool };
  }
  const dbPath = process.env.SQLITE_PATH ?? path.join(process.cwd(), "apps", "storysphere", "data", "storysphere.db");
  const db = new Database(dbPath);
  return { type: "sqlite", db };
}

export const client = createClient();
