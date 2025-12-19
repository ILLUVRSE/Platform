const test = require("node:test");
const assert = require("node:assert/strict");
const { main } = require("../illuvrse");

async function runWithCapturedLogs(args) {
  const logs = [];
  const errors = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (message) => logs.push(String(message ?? ""));
  console.error = (message) => errors.push(String(message ?? ""));
  try {
    const code = await main(args);
    return { code, logs, errors };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

test("illuvrse --help prints usage", async () => {
  const result = await runWithCapturedLogs(["--help"]);
  assert.equal(result.code, 0);
  assert.match(result.logs.join("\n"), /Usage:/);
  assert.match(result.logs.join("\n"), /illuvrse <command>/);
});

test("illuvrse doctor --help prints usage", async () => {
  const result = await runWithCapturedLogs(["doctor", "--help"]);
  assert.equal(result.code, 0);
  assert.match(result.logs.join("\n"), /illuvrse doctor/);
});
