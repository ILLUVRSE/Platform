import { createServer, IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";

const port = Number(process.env.PORT ?? 4300);
const token = process.env.FINANCE_TOKEN;
const localSecret = process.env.FINANCE_LOCAL_SECRET ?? "illuvrse-local-finance";

const receipts = new Map<string, Record<string, unknown>>();

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

function signReceipt(payload: string) {
  return crypto.createHmac("sha256", localSecret).update(payload).digest("hex");
}

const server = createServer(async (req, res) => {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  if (url.startsWith("/healthz") && method === "GET") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (url.startsWith("/receipt") && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = (await readJson<Record<string, unknown>>(req)) ?? {};
      const sha256 = String(body.sha256 ?? "");
      if (!sha256) return sendJson(res, 400, { error: "sha256 required" });

      const amount = Number(body.amount ?? 0);
      const currency = String(body.currency ?? "USD");
      const id = `rcpt-${Date.now()}`;
      const signature = signReceipt(`${sha256}:${amount}:${currency}`);

      const receipt = {
        id,
        sha256,
        amount,
        currency,
        signed: true,
        signature
      };

      const delivery = {
        encryptedBlob: `s3://illuvrse-artifacts/${sha256}`,
        proof: `delivery-proof-${sha256}`
      };

      receipts.set(id, receipt);

      return sendJson(res, 200, { receipt, delivery });
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  if (url.startsWith("/verify") && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = (await readJson<Record<string, unknown>>(req)) ?? {};
      const receipt = body.receipt as Record<string, unknown> | undefined;
      if (!receipt?.sha256 || !receipt?.signature) {
        return sendJson(res, 400, { valid: false, error: "missing receipt" });
      }

      const amount = Number(receipt.amount ?? 0);
      const currency = String(receipt.currency ?? "USD");
      const expected = signReceipt(`${receipt.sha256}:${amount}:${currency}`);
      const valid = safeEqual(expected, String(receipt.signature));

      return sendJson(res, 200, {
        valid,
        receipt,
        proof: {
          sha256: receipt.sha256,
          signer: "finance",
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      return sendJson(res, 400, { valid: false, error: (err as Error).message });
    }
  }

  return sendJson(res, 404, { error: "not found" });
});

server.listen(port, () => {
  console.log(`Finance service listening on ${port}`);
});
