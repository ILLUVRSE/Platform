import { createServer, IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";
import { Pool } from "pg";

const port = Number(process.env.PORT ?? 4500);
const token = process.env.MEMORY_TOKEN;
const dbUrl = process.env.DATABASE_URL;

const pool = dbUrl ? new Pool({ connectionString: dbUrl }) : null;

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function readJson<T = unknown>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req
      .on("data", (chunk) => chunks.push(Buffer.from(chunk)))
      .on("end", () => {
        try {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve(raw ? (JSON.parse(raw) as T) : ({} as T));
        } catch (err) {
          reject(err);
        }
      })
      .on("error", reject);
  });
}

function getAuthToken(req: IncomingMessage) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  const alt = req.headers["x-illuvrse-token"];
  return Array.isArray(alt) ? alt[0] : alt;
}

function safeEqual(a?: string, b?: string) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function ensureAuth(req: IncomingMessage, res: ServerResponse) {
  if (!token) return true;
  const provided = getAuthToken(req);
  if (safeEqual(provided, token)) return true;
  sendJson(res, 401, { error: "unauthorized" });
  return false;
}

async function ensureDb() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_memory (
        id uuid PRIMARY KEY,
        agent_id text NOT NULL,
        content text NOT NULL,
        metadata jsonb,
        citations jsonb,
        embedding vector(1536),
        created_at timestamptz DEFAULT now()
      )
    `);
    await client.query("CREATE INDEX IF NOT EXISTS agent_memory_agent_id_idx ON agent_memory(agent_id)");
  } finally {
    client.release();
  }
}

function toVectorLiteral(values: number[]) {
  return `[${values.join(",")} ]`.replace(", ]", "]");
}

const server = createServer(async (req, res) => {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  if (url.startsWith("/healthz") && method === "GET") {
    return sendJson(res, 200, { status: "ok", db: Boolean(pool) });
  }

  if (!pool) {
    return sendJson(res, 503, { error: "DATABASE_URL not configured" });
  }

  if (url.startsWith("/memory/write") && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = (await readJson<Record<string, unknown>>(req)) ?? {};
      const agentId = String(body.agentId ?? "");
      const content = String(body.content ?? "");
      if (!agentId || !content) return sendJson(res, 400, { error: "agentId and content required" });

      const embedding = Array.isArray(body.embedding) ? (body.embedding as number[]).map(Number) : null;
      const metadata = body.metadata ?? null;
      const citations = body.citations ?? null;

      const id = crypto.randomUUID();
      const vector = embedding ? toVectorLiteral(embedding) : null;

      await pool.query(
        "INSERT INTO agent_memory (id, agent_id, content, metadata, citations, embedding) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, agentId, content, metadata, citations, vector]
      );

      return sendJson(res, 200, { ok: true, id });
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  if (url.startsWith("/memory/query") && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = (await readJson<Record<string, unknown>>(req)) ?? {};
      const agentId = String(body.agentId ?? "");
      if (!agentId) return sendJson(res, 400, { error: "agentId required" });

      const topK = Number(body.topK ?? 5);
      const embedding = Array.isArray(body.embedding) ? (body.embedding as number[]).map(Number) : null;

      if (embedding && embedding.length) {
        const vector = toVectorLiteral(embedding);
        const { rows } = await pool.query(
          `
            SELECT id, agent_id, content, metadata, citations, created_at,
                   1 - (embedding <=> $1) as score
            FROM agent_memory
            WHERE agent_id = $2
            ORDER BY embedding <=> $1
            LIMIT $3
          `,
          [vector, agentId, topK]
        );
        return sendJson(res, 200, { results: rows });
      }

      const { rows } = await pool.query(
        `
          SELECT id, agent_id, content, metadata, citations, created_at
          FROM agent_memory
          WHERE agent_id = $1
          ORDER BY created_at DESC
          LIMIT $2
        `,
        [agentId, topK]
      );
      return sendJson(res, 200, { results: rows });
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  return sendJson(res, 404, { error: "not found" });
});

ensureDb()
  .then(() => {
    server.listen(port, () => {
      console.log(`Memory service listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init memory service", err);
    server.listen(port, () => {
      console.log(`Memory service listening on ${port} (db init failed)`);
    });
  });
