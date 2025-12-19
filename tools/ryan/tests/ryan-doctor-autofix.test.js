const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { main } = require("../cli");

function ensureGitRepo(rootDir, t) {
  const gitVersion = spawnSync("git", ["--version"], { encoding: "utf8" });
  if (gitVersion.status !== 0) {
    t.skip("git not available");
    return false;
  }
  const init = spawnSync("git", ["init"], { cwd: rootDir, encoding: "utf8" });
  if (init.status !== 0) {
    t.skip(`git init failed: ${init.stderr || init.stdout}`);
    return false;
  }
  spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: rootDir, encoding: "utf8" });
  spawnSync("git", ["config", "user.name", "Test"], { cwd: rootDir, encoding: "utf8" });
  fs.writeFileSync(path.join(rootDir, "README.md"), "test repo");
  spawnSync("git", ["add", "."], { cwd: rootDir, encoding: "utf8" });
  const commit = spawnSync("git", ["commit", "-m", "init"], { cwd: rootDir, encoding: "utf8" });
  if (commit.status !== 0) {
    t.skip(`git commit failed: ${commit.stderr || commit.stdout}`);
    return false;
  }
  return true;
}

function ensureSqlite(t) {
  try {
    require("better-sqlite3");
    return true;
  } catch (err) {
    t.skip(`better-sqlite3 unavailable: ${err.message}`);
    return false;
  }
}

test("doctor autofix executes safe fixes and skips unsafe", async (t) => {
  if (!ensureSqlite(t)) return;
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ryan-autofix-"));
  if (!ensureGitRepo(rootDir, t)) return;

  const illuvrsePath = path.join(rootDir, "illuvrse");
  const script = `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == "doctor" && "$2" == "--json" ]]; then
  if [[ -f ".doctor_state" ]]; then
    cat <<'JSON'
{
  "ok": false,
  "checks": [
    {
      "id": "safe_check",
      "status": "pass",
      "summary": "safe fix applied",
      "details": ["ok"],
      "fix": null
    },
    {
      "id": "unsafe_check",
      "status": "fail",
      "summary": "unsafe fix required",
      "details": ["blocked"],
      "fix": { "id": "touch_unsafe", "safe": false, "commands": ["touch unsafe.txt"], "files": [], "notes": "do not run" }
    }
  ]
}
JSON
  else
    cat <<'JSON'
{
  "ok": false,
  "checks": [
    {
      "id": "safe_check",
      "status": "fail",
      "summary": "safe fix required",
      "details": ["missing"],
      "fix": { "id": "touch_safe", "safe": true, "commands": ["touch .doctor_state"], "files": [], "notes": "create marker" }
    },
    {
      "id": "unsafe_check",
      "status": "fail",
      "summary": "unsafe fix required",
      "details": ["blocked"],
      "fix": { "id": "touch_unsafe", "safe": false, "commands": ["touch unsafe.txt"], "files": [], "notes": "do not run" }
    }
  ]
}
JSON
  fi
  exit 1
fi
echo "unsupported command" >&2
exit 1
`;
  fs.writeFileSync(illuvrsePath, script);
  fs.chmodSync(illuvrsePath, 0o755);

  const originalCwd = process.cwd();
  process.chdir(rootDir);
  try {
    const code = await main(["do", "doctor + autofix", "--yes"]);
    assert.equal(code, 1);
  } finally {
    process.chdir(originalCwd);
  }

  assert.ok(fs.existsSync(path.join(rootDir, ".doctor_state")));
  assert.ok(!fs.existsSync(path.join(rootDir, "unsafe.txt")));

  const auditPath = path.join(rootDir, ".ryan", "audit.log");
  assert.ok(fs.existsSync(auditPath));
  const auditContents = fs.readFileSync(auditPath, "utf8").trim();
  assert.ok(auditContents.length > 0);
});
