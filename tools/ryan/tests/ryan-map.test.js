const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { main } = require("../cli");

function ensureSqlite(t) {
  try {
    require("better-sqlite3");
    return true;
  } catch (err) {
    t.skip(`better-sqlite3 unavailable: ${err.message}`);
    return false;
  }
}

test("map generate creates architecture map and preserves manual section", async (t) => {
  if (!ensureSqlite(t)) return;
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ryan-map-"));
  const ryanDir = path.join(rootDir, ".ryan");
  fs.mkdirSync(ryanDir, { recursive: true });

  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    root: rootDir,
    services: {
      compose: [],
      scripts: [{ name: "dev", command: "pnpm dev", package: "package.json" }],
      directories: ["apps/web"]
    },
    ports: [{ port: 3000, file: "apps/web/server.js", context: "listen(3000)", source: "scan" }],
    env: {
      vars: [{ name: "API_URL", files: ["apps/web/.env"], contexts: ["API_URL=http://localhost:3000"] }],
      files: [".env"],
      dotenv: []
    },
    entrypoints: [],
    routes: [{ method: "GET", path: "/api/health", file: "apps/web/src/app/api/health/route.ts", source: "app" }]
  };
  fs.writeFileSync(path.join(ryanDir, "index.json"), JSON.stringify(index, null, 2));

  const originalCwd = process.cwd();
  process.chdir(rootDir);
  try {
    const code = await main(["map", "generate"]);
    assert.equal(code, 0);
  } finally {
    process.chdir(originalCwd);
  }

  const mapPath = path.join(rootDir, "docs", "architecture_map.md");
  assert.ok(fs.existsSync(mapPath));
  const content = fs.readFileSync(mapPath, "utf8");
  assert.match(content, /# Architecture Map/);
  assert.match(content, /## Services/);
  assert.match(content, /## Ports/);
  assert.match(content, /## Startup Order/);
  assert.match(content, /## Environment Variables/);
  assert.match(content, /## Dependency Diagram/);

  const manualNote = "KEEP THIS NOTE";
  const updated = content.replace(
    /<!-- MANUAL:START -->[\s\S]*?<!-- MANUAL:END -->/,
    `<!-- MANUAL:START -->\n${manualNote}\n<!-- MANUAL:END -->`
  );
  fs.writeFileSync(mapPath, updated);

  process.chdir(rootDir);
  try {
    const code = await main(["map", "generate"]);
    assert.equal(code, 0);
  } finally {
    process.chdir(originalCwd);
  }

  const contentAfter = fs.readFileSync(mapPath, "utf8");
  assert.match(contentAfter, new RegExp(manualNote));
});
