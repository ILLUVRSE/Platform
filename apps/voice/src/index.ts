import { createServer, IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";

const port = Number(process.env.PORT ?? 4800);
const token = process.env.VOICE_TOKEN;

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

function buildVisemes(text: string) {
  const cues = [] as { t: number; viseme: string }[];
  const chars = text.split("");
  chars.forEach((char, idx) => {
    const lower = char.toLowerCase();
    const viseme = "aeiou".includes(lower) ? "vowel" : /[bcdfghjklmnpqrstvwxyz]/.test(lower) ? "consonant" : "rest";
    cues.push({ t: idx * 80, viseme });
  });
  return cues;
}

const server = createServer(async (req, res) => {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  if (url.startsWith("/healthz") && method === "GET") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (url.startsWith("/tts") && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = (await readJson<Record<string, unknown>>(req)) ?? {};
      const text = String(body.text ?? "");
      if (!text) return sendJson(res, 400, { error: "text required" });
      const hash = crypto.createHash("sha256").update(text).digest("hex").slice(0, 12);
      return sendJson(res, 200, {
        audioUrl: `https://cdn.illuvrse.local/tts/${hash}.mp3`,
        provider: "stub",
        voiceId: body.voiceId ?? null
      });
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  if (url.startsWith("/stt") && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = (await readJson<Record<string, unknown>>(req)) ?? {};
      const audioUrl = String(body.audioUrl ?? "");
      if (!audioUrl) return sendJson(res, 400, { error: "audioUrl required" });
      return sendJson(res, 200, {
        transcript: "Stub transcript",
        provider: "stub",
        confidence: 0.5
      });
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  if (url.startsWith("/visemes") && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = (await readJson<Record<string, unknown>>(req)) ?? {};
      const text = String(body.text ?? "");
      if (!text) return sendJson(res, 400, { error: "text required" });
      return sendJson(res, 200, { cues: buildVisemes(text) });
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  return sendJson(res, 404, { error: "not found" });
});

server.listen(port, () => {
  console.log(`Voice service listening on ${port}`);
});
