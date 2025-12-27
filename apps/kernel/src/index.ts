import { createServer, IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";
import { KMSClient, SignCommand, VerifyCommand } from "@aws-sdk/client-kms";
import type { KernelSignRequest, KernelSignResponse, KernelVerifyRequest, KernelVerifyResponse } from "@illuvrse/contracts";
import { prisma } from "@illuvrse/db";

const port = Number(process.env.PORT ?? 4000);
const region = process.env.AWS_REGION;
const keyId = process.env.KERNEL_KMS_KEY_ID;
const token = process.env.KERNEL_TOKEN;
const ledgerUrl = process.env.KERNEL_LEDGER_URL;
const localSecret = process.env.KERNEL_LOCAL_SECRET ?? "illuvrse-local-kernel";
const signingAlgorithm = "RSASSA_PSS_SHA_256";
const dbEnabled = Boolean(process.env.DATABASE_URL);

const kms = keyId ? new KMSClient({ region }) : null;

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

function buildProof(sha256: string, signature: string): KernelSignResponse {
  return {
    sha256,
    signature,
    signer: keyId ? `kms:${keyId}` : "local-kernel",
    timestamp: new Date().toISOString(),
    policyVerdict: "PASS",
    ledgerUrl,
    requestId: crypto.randomUUID()
  };
}

async function writeAudit(action: string, summary: string, metadata: Record<string, unknown>) {
  if (!dbEnabled) return;
  try {
    await prisma.auditLog.create({
      data: {
        action,
        summary,
        metadata,
        actor: "kernel"
      }
    });
  } catch (err) {
    console.warn("Kernel audit failed", err);
  }
}

async function signPayload(sha256: string): Promise<KernelSignResponse> {
  if (kms && keyId) {
    const response = await kms.send(
      new SignCommand({
        KeyId: keyId,
        Message: Buffer.from(sha256),
        MessageType: "RAW",
        SigningAlgorithm: signingAlgorithm
      })
    );
    const signature = response.Signature ? Buffer.from(response.Signature).toString("base64") : "";
    const proof = buildProof(sha256, signature);
    await writeAudit("kernel.sign", "Kernel signed payload", { sha256, signer: proof.signer });
    return proof;
  }

  const signature = crypto.createHmac("sha256", localSecret).update(sha256).digest("hex");
  const proof = buildProof(sha256, signature);
  await writeAudit("kernel.sign", "Kernel signed payload (local)", { sha256, signer: proof.signer });
  return proof;
}

async function verifyPayload(sha256: string, signature: string): Promise<KernelVerifyResponse> {
  if (kms && keyId) {
    const response = await kms.send(
      new VerifyCommand({
        KeyId: keyId,
        Message: Buffer.from(sha256),
        MessageType: "RAW",
        Signature: Buffer.from(signature, "base64"),
        SigningAlgorithm: signingAlgorithm
      })
    );
    const result = {
      sha256,
      signature,
      signer: `kms:${keyId}`,
      timestamp: new Date().toISOString(),
      valid: Boolean(response.SignatureValid),
      policyVerdict: "PASS",
      ledgerUrl
    };
    await writeAudit("kernel.verify", "Kernel verified payload", { sha256, valid: result.valid });
    return result;
  }

  const expected = crypto.createHmac("sha256", localSecret).update(sha256).digest("hex");
  const result = {
    sha256,
    signature,
    signer: "local-kernel",
    timestamp: new Date().toISOString(),
    valid: safeEqual(expected, signature),
    policyVerdict: "PASS",
    ledgerUrl
  };
  await writeAudit("kernel.verify", "Kernel verified payload (local)", { sha256, valid: result.valid });
  return result;
}

const server = createServer(async (req, res) => {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  if (url.startsWith("/healthz") && method === "GET") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (url.startsWith("/audit") && method === "GET") {
    if (!ensureAuth(req, res)) return;
    if (!dbEnabled) return sendJson(res, 200, { events: [] });
    try {
      const parsed = new URL(url, `http://${req.headers.host}`);
      const actor = parsed.searchParams.get("actor") ?? undefined;
      const action = parsed.searchParams.get("action") ?? undefined;
      const since = parsed.searchParams.get("since") ?? undefined;
      const until = parsed.searchParams.get("until") ?? undefined;
      const limit = Number(parsed.searchParams.get("limit") ?? 200);

      const where: Record<string, unknown> = {};
      if (actor) where.actor = actor;
      if (action) where.action = action;
      if (since || until) {
        where.createdAt = {
          ...(since ? { gte: new Date(since) } : {}),
          ...(until ? { lte: new Date(until) } : {})
        };
      }

      const rows = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Number.isFinite(limit) ? limit : 200
      });

      const events = rows.map((row) => ({
        id: row.id,
        message: row.summary,
        timestamp: row.createdAt.getTime(),
        actor: row.actor ?? undefined,
        action: row.action,
        metadata: row.metadata ?? undefined
      }));
      return sendJson(res, 200, { events });
    } catch (err) {
      return sendJson(res, 500, { error: (err as Error).message });
    }
  }

  if (url.startsWith("/sign") && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = await readJson<KernelSignRequest>(req);
      if (!body?.sha256) return sendJson(res, 400, { error: "sha256 required" });
      const response = await signPayload(body.sha256);
      return sendJson(res, 200, response);
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  if (url.startsWith("/verify") && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = await readJson<KernelVerifyRequest>(req);
      if (!body?.sha256 || !body?.signature) return sendJson(res, 400, { error: "sha256 and signature required" });
      const response = await verifyPayload(body.sha256, body.signature);
      return sendJson(res, 200, response);
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  return sendJson(res, 404, { error: "not found" });
});

server.listen(port, () => {
  console.log(`Kernel service listening on ${port}`);
});
