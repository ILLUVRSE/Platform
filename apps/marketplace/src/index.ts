import { createServer, IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";
import type { MarketplaceListing } from "@illuvrse/contracts";

const port = Number(process.env.PORT ?? 4100);
const token = process.env.MARKETPLACE_TOKEN;
const financeUrl = process.env.FINANCE_URL ?? "http://localhost:4300";
const artifactPublisherUrl = process.env.ARTIFACT_PUBLISHER_URL ?? "http://localhost:4400";
const financeToken = process.env.FINANCE_TOKEN;
const artifactToken = process.env.ARTIFACT_PUBLISHER_TOKEN;
const defaultSku = process.env.MARKETPLACE_DEFAULT_SKU ?? "agent-bundle-grid-analyst";

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

async function callService<T>(baseUrl: string, path: string, body: unknown, authToken?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: data as T };
}

function buildListing(): MarketplaceListing {
  return {
    sku: defaultSku,
    price: 49,
    currency: "USD",
    sha256: `demo-${defaultSku}`,
    status: "ready",
    signed: true,
    manifest: {
      id: "agent.bundle.grid.analyst",
      name: "Grid Analyst Bundle",
      version: "0.1.0",
      capabilities: ["generator", "catalog"],
      runtime: { container: { image: "illuvrse/agent-grid:dev" } }
    },
    proof: {
      sha256: `demo-${defaultSku}`,
      signer: "kernel-multisig",
      timestamp: new Date().toISOString(),
      policyVerdict: "PASS",
      ledgerUrl: "/developers#ledger"
    }
  };
}

const server = createServer(async (req, res) => {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  if (url.startsWith("/healthz") && method === "GET") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (url.startsWith("/listing") && method === "GET") {
    if (!ensureAuth(req, res)) return;
    return sendJson(res, 200, buildListing());
  }

  if (url.startsWith("/checkout") && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const listing = await readJson<MarketplaceListing>(req);
      if (!listing?.sha256) return sendJson(res, 400, { error: "sha256 required" });

      const financeRes = await callService(financeUrl, "/receipt", {
        sha256: listing.sha256,
        amount: listing.price,
        currency: listing.currency
      }, financeToken);

      const deliveryRes = await callService(artifactPublisherUrl, "/publish", {
        sha256: listing.sha256,
        sku: listing.sku
      }, artifactToken);

      const proof = listing.proof ?? {
        sha256: listing.sha256,
        signer: "kernel-multisig",
        timestamp: new Date().toISOString(),
        policyVerdict: "PASS",
        ledgerUrl: "/developers#ledger",
        signature: crypto.createHash("sha256").update(listing.sha256).digest("hex")
      };

      return sendJson(res, 200, {
        ...listing,
        status: "ready",
        receipt: financeRes.data,
        delivery: deliveryRes.data,
        proof
      });
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  return sendJson(res, 404, { error: "not found" });
});

server.listen(port, () => {
  console.log(`Marketplace service listening on ${port}`);
});
