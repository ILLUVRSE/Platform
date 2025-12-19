const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const readline = require("readline");
const { spawn, spawnSync } = require("child_process");

const IDENTITY = "ryan.lueckenotte@gmail.com";

function findRepoRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(current, ".git"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return startDir;
    current = parent;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureRyanDirs(rootDir) {
  const baseDir = path.join(rootDir, ".ryan");
  const checkpointsDir = path.join(baseDir, "checkpoints");
  const logsDir = path.join(baseDir, "logs");
  ensureDir(baseDir);
  ensureDir(checkpointsDir);
  ensureDir(logsDir);
  return {
    baseDir,
    checkpointsDir,
    logsDir,
    auditLogPath: path.join(baseDir, "audit.log"),
    memoryDbPath: path.join(baseDir, "memory.db"),
    statePath: path.join(baseDir, "illuvrse-state.json")
  };
}

function appendAuditLog(rootDir, entry) {
  const { auditLogPath } = ensureRyanDirs(rootDir);
  const record = {
    timestamp: new Date().toISOString(),
    actor: IDENTITY,
    ...entry
  };
  fs.appendFileSync(auditLogPath, `${JSON.stringify(record)}${os.EOL}`);
  return record;
}

const DESTRUCTIVE_PATTERNS = [
  /\brm\s+-[^\n]*\b(rf|fr)\b/i,
  /\brm\s+-[^\n]*\br\b/i,
  /\brm\s+-[^\n]*\b--recursive\b/i,
  /\brm\s+-[^\n]*\b--force\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+checkout\s+--\b/i,
  /\bgit\s+clean\s+-[^\n]*\b(f|fd|xdf)\b/i,
  /\bgit\s+push\b/i,
  /\bgit\s+branch\s+-D\b/i,
  /\bgit\s+stash\s+(drop|clear)\b/i,
  /\bdel\s+\/f\b/i,
  /\brmdir\s+\/s\b/i
];

function isDestructiveCommand(command) {
  const normalized = command.trim();
  if (!normalized) return false;
  return DESTRUCTIVE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function confirmPrompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function confirmDestructive(command, autoYes) {
  if (!isDestructiveCommand(command)) return true;
  if (autoYes) return true;
  if (!process.stdin.isTTY) return false;
  return confirmPrompt(`Command looks destructive: "${command}". Continue? (y/N) `);
}

function runGitCommand(rootDir, args) {
  const result = spawnSync("git", args, { cwd: rootDir, encoding: "utf8" });
  if (result.status !== 0) {
    return { ok: false, error: (result.stderr || result.stdout || "git error").trim() };
  }
  return { ok: true, output: (result.stdout || "").trim() };
}

function getGitStatusFiles(rootDir) {
  const result = runGitCommand(rootDir, ["status", "--porcelain"]);
  if (!result.ok) {
    return { ok: false, error: result.error, files: [] };
  }
  const files = result.output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(3))
    .map((entry) => {
      const renameIndex = entry.lastIndexOf(" -> ");
      if (renameIndex !== -1) return entry.slice(renameIndex + 4);
      return entry;
    });
  return { ok: true, files };
}

function createCheckpoint(rootDir, details) {
  const { checkpointsDir } = ensureRyanDirs(rootDir);
  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID();
  const safeStamp = timestamp.replace(/[:.]/g, "-");
  const filename = `${safeStamp}-${id}.json`;
  const filePath = path.join(checkpointsDir, filename);

  const checkpoint = {
    id,
    timestamp,
    command: details?.command ?? null,
    reason: details?.reason ?? null,
    cwd: rootDir,
    git: {}
  };

  const head = runGitCommand(rootDir, ["rev-parse", "HEAD"]);
  if (head.ok) {
    checkpoint.git.head = head.output;
  } else {
    checkpoint.git.headError = head.error;
  }

  const status = runGitCommand(rootDir, ["status", "--porcelain"]);
  if (status.ok) {
    checkpoint.git.status = status.output;
  } else {
    checkpoint.git.statusError = status.error;
  }

  const diff = runGitCommand(rootDir, ["diff"]);
  if (diff.ok) {
    checkpoint.git.diff = diff.output;
  } else {
    checkpoint.git.diffError = diff.error;
  }

  const diffCached = runGitCommand(rootDir, ["diff", "--cached"]);
  if (diffCached.ok) {
    checkpoint.git.diffCached = diffCached.output;
  } else {
    checkpoint.git.diffCachedError = diffCached.error;
  }

  fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2));
  return { id, path: filePath, checkpoint };
}

function runShellCommand(command, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: options.cwd ?? process.cwd(),
      shell: true,
      stdio: "inherit",
      env: { ...process.env, ...(options.env ?? {}) }
    });
    child.on("error", () => resolve(1));
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

function runShellCommandCapture(command, options = {}) {
  const result = spawnSync(command, {
    cwd: options.cwd ?? process.cwd(),
    shell: true,
    encoding: "utf8",
    env: { ...process.env, ...(options.env ?? {}) }
  });
  return {
    code: result.status ?? 0,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
    error: result.error ? result.error.message : null
  };
}

function tailFile(filePath, lineCount) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (!lineCount || lineCount >= lines.length) return lines;
  return lines.slice(lines.length - lineCount);
}

function loadState(rootDir) {
  const { statePath } = ensureRyanDirs(rootDir);
  if (!fs.existsSync(statePath)) return { services: {} };
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return { services: {}, error: String(err) };
  }
}

function saveState(rootDir, state) {
  const { statePath } = ensureRyanDirs(rootDir);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function createMemoryStore(rootDir, options = {}) {
  const { memoryDbPath } = ensureRyanDirs(rootDir);
  const dbPath = options.dbPath ?? memoryDbPath;
  let Database;
  try {
    Database = require("better-sqlite3");
  } catch (err) {
    const error = new Error(
      "better-sqlite3 is required for local memory. Run pnpm install to add dependencies."
    );
    error.cause = err;
    throw error;
  }

  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS identity (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT
    );
    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      mode TEXT NOT NULL,
      task TEXT,
      summary TEXT,
      status TEXT
    );
    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER,
      created_at TEXT NOT NULL,
      kind TEXT NOT NULL,
      detail TEXT
    );
  `);

  const seedIdentity = db.prepare("INSERT OR IGNORE INTO identity (key, value) VALUES (?, ?)");
  seedIdentity.run("identifier", IDENTITY);
  seedIdentity.run("display_name", "Ryan Lueckenotte");

  const insertMemory = db.prepare(
    "INSERT INTO memories (created_at, type, content, tags) VALUES (?, ?, ?, ?)"
  );
  const listMemories = db.prepare(
    "SELECT id, created_at, type, content, tags FROM memories ORDER BY created_at DESC LIMIT ?"
  );
  const getMemory = db.prepare("SELECT id, created_at, type, content, tags FROM memories WHERE id = ?");
  const deleteMemory = db.prepare("DELETE FROM memories WHERE id = ?");
  const countMemories = db.prepare("SELECT COUNT(*) as count FROM memories");

  const insertRun = db.prepare(
    "INSERT INTO runs (created_at, mode, task, summary, status) VALUES (?, ?, ?, ?, ?)"
  );
  const insertAction = db.prepare(
    "INSERT INTO actions (run_id, created_at, kind, detail) VALUES (?, ?, ?, ?)"
  );

  function normalizeTags(tags) {
    if (Array.isArray(tags)) return tags.join(",");
    if (tags === null || tags === undefined) return null;
    return String(tags);
  }

  return {
    add_memory: (type, content, tags = null) => {
      const createdAt = new Date().toISOString();
      const normalizedTags = normalizeTags(tags);
      const info = insertMemory.run(createdAt, type, content, normalizedTags);
      return { id: Number(info.lastInsertRowid), created_at: createdAt, type, content, tags: normalizedTags };
    },
    list_memories: (limit = 100) => listMemories.all(limit),
    get_memory: (id) => getMemory.get(id),
    delete_memory: (id) => deleteMemory.run(id),
    count_memories: () => countMemories.get()?.count ?? 0,
    record_run: ({ mode, task, summary, status }) => {
      const createdAt = new Date().toISOString();
      const info = insertRun.run(createdAt, mode, task ?? null, summary ?? null, status ?? null);
      return {
        id: Number(info.lastInsertRowid),
        created_at: createdAt,
        mode,
        task,
        summary,
        status
      };
    },
    record_action: ({ run_id, kind, detail }) => {
      const createdAt = new Date().toISOString();
      const payload = typeof detail === "string" ? detail : JSON.stringify(detail ?? {});
      const info = insertAction.run(run_id ?? null, createdAt, kind, payload);
      return { id: Number(info.lastInsertRowid), created_at: createdAt, run_id, kind, detail: payload };
    },
    close: () => db.close()
  };
}

module.exports = {
  IDENTITY,
  findRepoRoot,
  ensureRyanDirs,
  appendAuditLog,
  isDestructiveCommand,
  confirmPrompt,
  confirmDestructive,
  runGitCommand,
  getGitStatusFiles,
  createCheckpoint,
  runShellCommand,
  runShellCommandCapture,
  tailFile,
  loadState,
  saveState,
  createMemoryStore
};
