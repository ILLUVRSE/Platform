const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { buildIndex } = require("../indexer");

test("indexer builds index file with expected sections", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ryan-indexer-"));

  fs.writeFileSync(
    path.join(rootDir, "docker-compose.yml"),
    `version: "3"
services:
  web:
    image: node:18
    command: node server.js
    ports:
      - "3000:3000"
`
  );

  fs.writeFileSync(
    path.join(rootDir, "package.json"),
    JSON.stringify(
      {
        name: "indexer-test",
        scripts: {
          dev: "node server.js",
          start: "node server.js"
        }
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(rootDir, "server.js"),
    `const port = process.env.PORT || 3000;
app.listen(port);
app.get('/health', () => {});
`
  );

  fs.mkdirSync(path.join(rootDir, "src", "app", "api", "health"), { recursive: true });
  fs.writeFileSync(path.join(rootDir, "src", "app", "api", "health", "route.ts"), "export async function GET() {}");

  fs.writeFileSync(path.join(rootDir, ".env"), "API_KEY=abc\nPORT=3001\n");

  const result = buildIndex(rootDir, { useRipgrep: false });
  assert.ok(fs.existsSync(result.path));

  const index = result.index;
  assert.ok(index.services.compose.length > 0);
  assert.ok(index.services.compose[0].services.find((svc) => svc.name === "web"));
  assert.ok(index.services.scripts.find((svc) => svc.name === "dev"));

  assert.ok(index.ports.some((entry) => entry.port === 3000));
  assert.ok(index.env.vars.some((entry) => entry.name === "API_KEY"));
  assert.ok(index.entrypoints.some((entry) => entry.value === "server.js" || entry.file === "server.js"));
  assert.ok(index.routes.some((route) => route.path === "/api/health"));
});
