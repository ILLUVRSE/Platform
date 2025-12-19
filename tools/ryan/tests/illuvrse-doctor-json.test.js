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

test("illuvrse doctor --json returns structured output", async () => {
  const result = await runWithCapturedLogs(["doctor", "--json"]);
  const output = result.logs.join("\n").trim();
  assert.ok(output.length > 0);

  let report;
  assert.doesNotThrow(() => {
    report = JSON.parse(output);
  });

  assert.equal(typeof report.ok, "boolean");
  assert.ok(Array.isArray(report.checks));
  report.checks.forEach((check) => {
    assert.equal(typeof check.id, "string");
    assert.ok(check.id.length > 0);
    assert.equal(typeof check.summary, "string");
    assert.ok(Array.isArray(check.details));
    if (check.status === "warn" || check.status === "fail") {
      assert.ok(check.fix && typeof check.fix.id === "string");
    }
  });

  const hasFail = report.checks.some((check) => check.status === "fail");
  assert.equal(report.ok, !hasFail);
});
