const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createMemoryStore } = require("../lib");

test("memory store add/get/list/remove", (t) => {
  let store;
  try {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ryan-memory-"));
    store = createMemoryStore(rootDir, { dbPath: path.join(rootDir, "memory.db") });
  } catch (err) {
    t.skip(`Memory store unavailable: ${err.message}`);
    return;
  }

  const entry = store.add_memory("note", "hello", "tag");
  assert.equal(entry.type, "note");
  const fetched = store.get_memory(entry.id);
  assert.equal(fetched.content, "hello");

  const list = store.list_memories(10);
  assert.ok(list.find((item) => item.id === entry.id));

  store.delete_memory(entry.id);
  const afterDelete = store.get_memory(entry.id);
  assert.equal(afterDelete, undefined);

  store.close();
});

test("memory store seeds identity", (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ryan-identity-"));
  const dbPath = path.join(rootDir, "memory.db");
  try {
    const store = createMemoryStore(rootDir, { dbPath });
    store.close();
  } catch (err) {
    t.skip(`Memory store unavailable: ${err.message}`);
    return;
  }

  let Database;
  try {
    Database = require("better-sqlite3");
  } catch (err) {
    t.skip(`better-sqlite3 unavailable: ${err.message}`);
    return;
  }

  const db = new Database(dbPath);
  const rows = db.prepare("SELECT key, value FROM identity").all();
  db.close();

  const identity = new Map(rows.map((row) => [row.key, row.value]));
  assert.equal(identity.get("identifier"), "ryan.lueckenotte@gmail.com");
  assert.equal(identity.get("display_name"), "Ryan Lueckenotte");
});
