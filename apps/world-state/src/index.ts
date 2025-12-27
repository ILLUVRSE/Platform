import { createServer, IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";

const port = Number(process.env.PORT ?? 4600);
const token = process.env.WORLD_TOKEN;

type Vec3 = { x: number; y: number; z: number };

type WorldEntity = {
  id: string;
  type: string;
  label?: string;
  position: Vec3;
  updatedAt: number;
};

type RoomState = {
  entities: Map<string, WorldEntity>;
  clients: Set<WebSocket>;
  clientsById: Map<string, WebSocket>;
};

const rooms = new Map<string, RoomState>();
const snapshots = new Map<string, { roomId: string; entities: WorldEntity[]; createdAt: number }>();

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

function getRoom(roomId: string) {
  const existing = rooms.get(roomId);
  if (existing) return existing;
  const created: RoomState = { entities: new Map(), clients: new Set(), clientsById: new Map() };
  rooms.set(roomId, created);
  return created;
}

function broadcast(roomId: string, payload: unknown) {
  const room = getRoom(roomId);
  const message = JSON.stringify(payload);
  room.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

const server = createServer(async (req, res) => {
  const url = parse(req.url ?? "", true);
  const method = req.method ?? "GET";

  if (url.pathname === "/healthz" && method === "GET") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (url.pathname === "/snapshot" && method === "GET") {
    const roomId = typeof url.query?.room === "string" ? url.query.room : "lobby";
    const room = getRoom(roomId);
    return sendJson(res, 200, { room: roomId, entities: Array.from(room.entities.values()) });
  }

  if (url.pathname === "/snapshot" && method === "POST") {
    if (!ensureAuth(req, res)) return;
    const body = await readJson<Record<string, unknown>>(req).catch(() => ({}));
    const roomId = typeof body.room === "string" ? body.room : "lobby";
    const room = getRoom(roomId);
    const id = crypto.randomUUID();
    snapshots.set(id, { roomId, entities: Array.from(room.entities.values()), createdAt: Date.now() });
    return sendJson(res, 200, { ok: true, snapshotId: id });
  }

  if (url.pathname === "/replay" && method === "POST") {
    if (!ensureAuth(req, res)) return;
    const body = await readJson<Record<string, unknown>>(req).catch(() => ({}));
    const snapshotId = typeof body.snapshotId === "string" ? body.snapshotId : \"\";
    const snapshot = snapshots.get(snapshotId);
    if (!snapshot) return sendJson(res, 404, { error: \"snapshot not found\" });
    const room = getRoom(snapshot.roomId);
    room.entities.clear();
    snapshot.entities.forEach((entity) => room.entities.set(entity.id, entity));
    broadcast(snapshot.roomId, { type: \"world.snapshot\", room: snapshot.roomId, entities: snapshot.entities });
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === "/events/agent" && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = (await readJson<Record<string, unknown>>(req)) ?? {};
      const roomId = typeof body.room === "string" ? body.room : "lobby";
      broadcast(roomId, { type: "agent.event", payload: body });
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  if (url.pathname === "/moderate/remove" && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = (await readJson<Record<string, unknown>>(req)) ?? {};
      const roomId = typeof body.room === "string" ? body.room : "lobby";
      const id = typeof body.id === "string" ? body.id : "";
      if (!id) return sendJson(res, 400, { error: "id required" });
      const room = getRoom(roomId);
      room.entities.delete(id);
      const socket = room.clientsById.get(id);
      if (socket) {
        socket.close();
        room.clientsById.delete(id);
      }
      broadcast(roomId, { type: "world.entity", action: "remove", id });
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  return sendJson(res, 404, { error: "not found" });
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket, req) => {
  const url = parse(req.url ?? "", true);
  const roomId = typeof url.query?.room === "string" ? url.query.room : "lobby";
  const clientId = typeof url.query?.clientId === "string" ? url.query.clientId : crypto.randomUUID();
  const label = typeof url.query?.label === "string" ? url.query.label : undefined;

  const room = getRoom(roomId);
  room.clients.add(socket);
  room.clientsById.set(clientId, socket);

  const entity: WorldEntity = {
    id: clientId,
    type: "user",
    label,
    position: { x: 0, y: 0, z: 0 },
    updatedAt: Date.now()
  };
  room.entities.set(entity.id, entity);

  socket.send(JSON.stringify({ type: "world.snapshot", room: roomId, entities: Array.from(room.entities.values()) }));
  broadcast(roomId, { type: "world.entity", action: "join", entity });

  socket.on("message", (data) => {
    try {
      const payload = JSON.parse(data.toString()) as Record<string, unknown>;
      const type = String(payload.type ?? "");

      if (type === "entity.update") {
        const id = String(payload.id ?? clientId);
        const position = payload.position as Vec3 | undefined;
        if (!position) return;
        const updated: WorldEntity = {
          id,
          type: typeof payload.kind === "string" ? payload.kind : "user",
          label: typeof payload.label === "string" ? payload.label : undefined,
          position,
          updatedAt: Date.now()
        };
        room.entities.set(id, updated);
        broadcast(roomId, { type: "world.entity", action: "update", entity: updated });
      }

      if (type === "entity.remove") {
        const id = String(payload.id ?? clientId);
        room.entities.delete(id);
        broadcast(roomId, { type: "world.entity", action: "remove", id });
      }
    } catch {
      // ignore bad payloads
    }
  });

  socket.on("close", () => {
    room.clients.delete(socket);
    room.entities.delete(clientId);
    room.clientsById.delete(clientId);
    broadcast(roomId, { type: "world.entity", action: "leave", id: clientId });
  });
});

server.listen(port, () => {
  console.log(`World state service listening on ${port}`);
});
