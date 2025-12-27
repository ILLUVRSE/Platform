import { createServer, IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";

const port = Number(process.env.PORT ?? 4400);
const token = process.env.ARTIFACT_PUBLISHER_TOKEN;
const bucket = process.env.ARTIFACT_BUCKET ?? "illuvrse-artifacts";

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

const server = createServer(async (req, res) => {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  if (url.startsWith("/healthz") && method === "GET") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (url.startsWith("/publish") && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = (await readJson<Record<string, unknown>>(req)) ?? {};
      const sha256 = String(body.sha256 ?? "");
      if (!sha256) return sendJson(res, 400, { error: "sha256 required" });

      const delivery = {
        encryptedBlob: `s3://${bucket}/${sha256}`,
        proof: `delivery-proof-${sha256}`,
        policy: "PASS"
      };

      return sendJson(res, 200, { delivery });
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  return sendJson(res, 404, { error: "not found" });
});

server.listen(port, () => {
  console.log(`ArtifactPublisher service listening on ${port}`);
});
