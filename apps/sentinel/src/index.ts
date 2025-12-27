import { createServer, IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";
import { validateAceAgentManifest } from "@illuvrse/contracts";

const port = Number(process.env.PORT ?? 4105);
const token = process.env.SENTINEL_TOKEN;
const policyVersion = process.env.SENTINEL_POLICY_VERSION ?? "v1.0.0";

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

function evaluateManifest(body: Record<string, unknown>) {
  const manifest = (body.manifest ?? body) as Record<string, unknown>;
  const validated = validateAceAgentManifest(manifest);
  const rules: { id: string; result: "pass" | "fail"; message: string }[] = [];

  rules.push({ id: "ace.manifest.required", result: "pass", message: "Required fields present" });

  const permissions = validated.permissions ?? {};
  if (permissions.network?.outbound === false && permissions.network?.domains?.length) {
    rules.push({
      id: "ace.permissions.network",
      result: "fail",
      message: "Network domains specified while outbound network disabled"
    });
  } else {
    rules.push({ id: "ace.permissions.network", result: "pass", message: "Network permissions within bounds" });
  }

  const verdict = rules.some((rule) => rule.result === "fail") ? "REJECT" : "ALLOW";
  return {
    policyVersion,
    verdict,
    severity: verdict === "REJECT" ? "high" : "low",
    rules,
    canary: verdict === "REJECT" ? "route-to-canary" : "skip",
    reason: verdict === "REJECT" ? "Policy violations detected" : "Policy evaluation passed",
    inputs: body
  };
}

const server = createServer(async (req, res) => {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  if (url.startsWith("/healthz") && method === "GET") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (url.startsWith("/evaluate") && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = (await readJson<Record<string, unknown>>(req)) ?? {};
      const verdict = evaluateManifest(body);
      return sendJson(res, verdict.verdict === "REJECT" ? 400 : 200, verdict);
    } catch (err) {
      return sendJson(res, 400, { verdict: "REJECT", reason: (err as Error).message });
    }
  }

  return sendJson(res, 404, { error: "not found" });
});

server.listen(port, () => {
  console.log(`Sentinel service listening on ${port}`);
});
