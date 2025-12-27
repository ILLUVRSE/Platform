import { createServer, ServerResponse } from "http";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const port = Number(process.env.PORT ?? 4700);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const registryPath = process.env.AVATAR_REGISTRY_PATH ?? path.join(__dirname, "..", "avatars.json");

type AvatarEntry = {
  id: string;
  name: string;
  rig?: string;
  assets: string[];
  voiceConfigId?: string;
  agentId?: string;
};

type AvatarRegistry = { avatars: AvatarEntry[] };

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function loadRegistry(): AvatarRegistry {
  const raw = readFileSync(registryPath, "utf8");
  return JSON.parse(raw) as AvatarRegistry;
}

const server = createServer((req, res) => {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  if (url.startsWith("/healthz") && method === "GET") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (url === "/avatars" && method === "GET") {
    const registry = loadRegistry();
    return sendJson(res, 200, registry);
  }

  if (url.startsWith("/avatars/") && method === "GET") {
    const id = url.split("/")[2];
    const registry = loadRegistry();
    const match = registry.avatars.find((avatar) => avatar.id === id);
    if (!match) return sendJson(res, 404, { error: "avatar not found" });
    return sendJson(res, 200, match);
  }

  return sendJson(res, 404, { error: "not found" });
});

server.listen(port, () => {
  console.log(`Avatar registry listening on ${port}`);
});
