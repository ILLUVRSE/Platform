const test = require("node:test");
const assert = require("node:assert/strict");
const { isDestructiveCommand } = require("../lib");

test("detects destructive commands", () => {
  assert.equal(isDestructiveCommand("rm -rf /tmp"), true);
  assert.equal(isDestructiveCommand("git reset --hard HEAD~1"), true);
  assert.equal(isDestructiveCommand("git clean -fd"), true);
  assert.equal(isDestructiveCommand("git push origin main"), true);
});

test("allows non-destructive commands", () => {
  assert.equal(isDestructiveCommand("ls -la"), false);
  assert.equal(isDestructiveCommand("git status"), false);
  assert.equal(isDestructiveCommand("pnpm dev"), false);
});
