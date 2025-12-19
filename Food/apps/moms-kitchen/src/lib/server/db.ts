import { promises as fs } from 'fs';
import path from 'path';
import { DatabaseShape, GroceryItem, Recipe, Session, User, PlannerEntry } from '../types';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
// Legacy location (was mistakenly nested)
const LEGACY_DATA_DIR = path.join(ROOT, 'apps', 'moms-kitchen', 'data');
const LEGACY_DB_PATH = path.join(LEGACY_DATA_DIR, 'db.json');
const USE_REMOTE = !!process.env.DATABASE_URL;

const DEFAULT_DB: DatabaseShape = {
  users: [],
  sessions: [],
  recipes: {},
  grocery: {},
  planner: {},
};

async function ensureDB() {
  if (USE_REMOTE) {
    await ensureRemote();
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const newExists = await fs
    .access(DB_PATH)
    .then(() => true)
    .catch(() => false);

  if (!newExists) {
    // migrate from legacy path if it exists
    const legacyExists = await fs
      .access(LEGACY_DB_PATH)
      .then(() => true)
      .catch(() => false);
    if (legacyExists) {
      const legacy = await fs.readFile(LEGACY_DB_PATH, 'utf-8');
      await fs.writeFile(DB_PATH, legacy, 'utf-8');
    } else {
      await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
    }
  }
}

export async function readDB(): Promise<DatabaseShape> {
  await ensureDB();
  if (USE_REMOTE) {
    return readRemoteDB();
  }
  const raw = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(raw) as DatabaseShape;
}

export async function writeDB(db: DatabaseShape) {
  if (USE_REMOTE) {
    await writeRemoteDB(db);
    return;
  }
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export async function findUserByEmail(email: string) {
  const db = await readDB();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id: string) {
  const db = await readDB();
  return db.users.find((u) => u.id === id);
}

export async function addUser(user: User & { passwordHash: string }) {
  const db = await readDB();
  db.users.push(user);
  await writeDB(db);
}

export async function upsertSession(session: Session) {
  const db = await readDB();
  const existingIndex = db.sessions.findIndex((s) => s.userId === session.userId);
  if (existingIndex >= 0) {
    db.sessions[existingIndex] = session;
  } else {
    db.sessions.push(session);
  }
  await writeDB(db);
}

export async function removeSession(token: string) {
  const db = await readDB();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  await writeDB(db);
}

export async function getSession(token: string) {
  const db = await readDB();
  return db.sessions.find((s) => s.token === token);
}

export async function getUserData(userId: string) {
  const db = await readDB();
  return {
    recipes: db.recipes[userId] || [],
    groceryList: db.grocery[userId] || [],
    planner: db.planner[userId] || [],
  };
}

export async function deleteUser(userId: string) {
  const db = await readDB();
  db.users = db.users.filter((u) => u.id !== userId);
  db.sessions = db.sessions.filter((s) => s.userId !== userId);
  delete db.recipes[userId];
  delete db.grocery[userId];
  delete db.planner[userId];
  await writeDB(db);
}

export async function saveUserData(
  userId: string,
  recipes: Recipe[],
  groceryList: GroceryItem[],
  planner: PlannerEntry[] = []
) {
  const db = await readDB();
  db.recipes[userId] = recipes;
  db.grocery[userId] = groceryList;
  db.planner[userId] = planner;
  await writeDB(db);
}

// Remote persistence via libsql (Turso-compatible)
type RemoteClient = {
  execute: (arg: any) => Promise<any>;
};

let remoteClient: RemoteClient | null = null;

async function getRemoteClient(): Promise<RemoteClient | null> {
  if (!USE_REMOTE) return null;
  if (remoteClient) return remoteClient;
  try {
    // Use runtime eval to avoid bundler resolution when remote is disabled
    const dynamicImport = new Function('m', 'return import(m);');
    // @ts-ignore
    const mod: any = await dynamicImport('@libsql/client');
    remoteClient = mod.createClient({
      url: process.env.DATABASE_URL as string,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    return remoteClient;
  } catch (err) {
    throw new Error('Remote DB requested but @libsql/client is not installed. Add it to dependencies.');
  }
}

async function ensureRemote() {
  const client = await getRemoteClient();
  if (!client) return;
  await client.execute('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)');
}

async function readRemoteDB(): Promise<DatabaseShape> {
  const client = await getRemoteClient();
  if (!client) throw new Error('Remote DB unavailable');
  await ensureRemote();
  const res = await client.execute({ sql: 'SELECT v FROM kv WHERE k = ?', args: ['db'] });
  const row = res.rows?.[0];
  if (!row) {
    await writeRemoteDB(DEFAULT_DB);
    return DEFAULT_DB;
  }
  const data = row.v as string;
  return JSON.parse(data) as DatabaseShape;
}

async function writeRemoteDB(db: DatabaseShape) {
  const client = await getRemoteClient();
  if (!client) throw new Error('Remote DB unavailable');
  await ensureRemote();
  await client.execute({
    sql: 'REPLACE INTO kv (k, v) VALUES (?, ?)',
    args: ['db', JSON.stringify(db)],
  });
}
