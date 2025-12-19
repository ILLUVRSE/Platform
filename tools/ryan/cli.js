const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawnSync } = require("child_process");
const {
  findRepoRoot,
  ensureRyanDirs,
  appendAuditLog,
  createCheckpoint,
  runShellCommand,
  runShellCommandCapture,
  runGitCommand,
  getGitStatusFiles,
  createMemoryStore,
  confirmPrompt,
  tailFile
} = require("./lib");
const { buildIndex, loadIndex } = require("./indexer");
const { generateArchitectureMap } = require("./map");

const COMMAND_DENYLIST = [
  { pattern: /\brm\s+-rf\b/i, reason: "rm -rf is not allowed" },
  { pattern: /\bsudo\b/i, reason: "sudo is not allowed" },
  { pattern: /\bmkfs\b/i, reason: "mkfs is not allowed" },
  { pattern: /\bdd\b/i, reason: "dd is not allowed" },
  { pattern: /\bchmod\s+-R\s+777\b/i, reason: "chmod -R 777 is not allowed" },
  { pattern: /\brm\s+-rf?\s+.*\/?\.git\b/i, reason: "deleting .git is not allowed" },
  { pattern: /\brm\s+-rf?\s+\.git\b/i, reason: "deleting .git is not allowed" }
];

const COMMAND_CONFIRM = [
  { pattern: /\bgit\s+push\b/i, reason: "git push requires confirmation" },
  { pattern: /\bgit\s+branch\s+-(d|D)\b/i, reason: "deleting branches requires confirmation" },
  { pattern: /\bgit\s+branch\s+--delete\b/i, reason: "deleting branches requires confirmation" },
  { pattern: /\b\.env\b/i, reason: "modifying env files requires confirmation" },
  { pattern: /\bsecrets?\b/i, reason: "modifying secrets requires confirmation" },
  {
    pattern: /\b(deploy|release)\b.*\b(stop|down|halt|rollback)\b/i,
    reason: "stopping deploy scripts requires confirmation"
  },
  {
    pattern: /\bprod(uction)?\b.*\b(stop|down|halt|rollback)\b/i,
    reason: "stopping production deploy scripts requires confirmation"
  }
];

const SENSITIVE_FILE_PATTERNS = [
  /^\.env(\.|$)/i,
  /\/\.env(\.|$)/i,
  /^secrets\//i,
  /\/secrets\//i,
  /credentials?/i,
  /keystore/i,
  /key(s)?\//i,
  /\.(pem|key|p12|pfx|kdb|jks)$/i
];

function showHelp() {
  console.log(`RYAN local operator

Usage:
  ryan <command> [options]

Commands:
  ask "<prompt>"               Analysis-only mode. No file edits.
  do "<task>"                  Action mode (offline). Supports mock mode.
  memory                         Show memory summary or add notes.
  index                          Build/show repo index.
  map                            Generate architecture map.
  log [--tail N]                 Show recent audit log entries.

Run "ryan <command> --help" for command details.`);
}

function showAskHelp() {
  console.log(`Usage:
  ryan ask "<prompt>" [--allow-shell] [--scan] [--grep <pattern>]

Options:
  --allow-shell   Permit read-only helper tools.
  --scan          Scan repo files (read-only).
  --grep PATTERN  Search repo for a pattern (read-only).

Notes:
  ask mode never modifies repo files.`);
}

function showDoHelp() {
  console.log(`Usage:
  ryan do "<task>" [--dry-run] [--yes] [--checkpoint branch|commit] [--scan] [--grep <pattern>] [--test] [--max-iters N]

Options:
  --dry-run                 Do not run commands or modify files.
  --yes                     Auto-approve confirmation prompts.
  --checkpoint <mode>       Use git checkpoint mode (branch|commit).
  --scan                    Scan repo files.
  --grep PATTERN            Search repo for a pattern.
  --test                    Run repo test command.
  --max-iters N             Max iterations for fix workflows (default: RYAN_FIX_MAX_ITERS or 2).

Notes:
  If no local LLM is configured, mock mode proposes a plan and runs helper tools.`);
}

function showMemoryHelp() {
  console.log(`Usage:
  ryan memory [--add "<note>"]
  ryan memory add "<note>"
  ryan memory list [--limit N]
  ryan memory get <id>
  ryan memory delete <id>

Defaults to showing a summary.`);
}

function showLogHelp() {
  console.log(`Usage:
  ryan log [--tail N]

Defaults to the last 50 entries.`);
}

function showIndexHelp() {
  console.log(`Usage:
  ryan index build
  ryan index show [--services|--ports|--env]

Defaults to showing the full index summary.`);
}

function showMapHelp() {
  console.log(`Usage:
  ryan map generate

Generates docs/architecture_map.md from the repo index.`);
}

function parseAskArgs(args) {
  const result = { allowShell: false, scan: false, grep: null, help: false, prompt: "" };
  const promptParts = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
    if (arg === "--allow-shell") {
      result.allowShell = true;
      continue;
    }
    if (arg === "--scan") {
      result.scan = true;
      continue;
    }
    if (arg === "--grep") {
      result.grep = args[i + 1] ?? null;
      i += 1;
      continue;
    }
    promptParts.push(arg);
  }
  result.prompt = promptParts.join(" ").trim();
  return result;
}

function parseDoArgs(args) {
  const result = {
    dryRun: false,
    autoYes: false,
    checkpoint: null,
    scan: false,
    grep: null,
    test: false,
    maxIters: null,
    help: false,
    task: ""
  };
  const taskParts = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
    if (arg === "--dry-run") {
      result.dryRun = true;
      continue;
    }
    if (arg === "--yes" || arg === "-y") {
      result.autoYes = true;
      continue;
    }
    if (arg === "--checkpoint") {
      result.checkpoint = args[i + 1] ?? null;
      i += 1;
      continue;
    }
    if (arg.startsWith("--checkpoint=")) {
      result.checkpoint = arg.split("=")[1] ?? null;
      continue;
    }
    if (arg === "--scan") {
      result.scan = true;
      continue;
    }
    if (arg === "--grep") {
      result.grep = args[i + 1] ?? null;
      i += 1;
      continue;
    }
    if (arg === "--test") {
      result.test = true;
      continue;
    }
    if (arg === "--max-iters") {
      const value = Number(args[i + 1]);
      if (!Number.isNaN(value)) result.maxIters = value;
      i += 1;
      continue;
    }
    taskParts.push(arg);
  }
  result.task = taskParts.join(" ").trim();
  return result;
}

function parseMemoryArgs(args) {
  const result = { help: false, addNote: null, limit: 100 };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
    if (arg === "--add") {
      result.addNote = args[i + 1] ?? null;
      i += 1;
    }
    if (arg === "--limit") {
      const value = Number(args[i + 1]);
      if (!Number.isNaN(value)) result.limit = value;
      i += 1;
    }
  }
  return result;
}

function parseMemoryAddArgs(args) {
  const contentParts = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") return { help: true };
    contentParts.push(arg);
  }
  return { content: contentParts.join(" ").trim() };
}

function parseMemoryListArgs(args) {
  let limit = 100;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--limit") {
      const value = Number(args[i + 1]);
      if (!Number.isNaN(value)) limit = value;
      i += 1;
    }
  }
  return { limit };
}

function parseLogArgs(args) {
  let tail = 50;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--tail") {
      const value = Number(args[i + 1]);
      if (!Number.isNaN(value)) tail = value;
      i += 1;
    }
  }
  return { tail };
}

function parseIndexShowArgs(args) {
  const result = { help: false, services: false, ports: false, env: false };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") result.help = true;
    if (arg === "--services") result.services = true;
    if (arg === "--ports") result.ports = true;
    if (arg === "--env") result.env = true;
  }
  return result;
}

function evaluateCommandPolicy(command, options = {}) {
  if (!command) return { status: "allow" };
  for (const entry of COMMAND_DENYLIST) {
    if (entry.pattern.test(command)) {
      return { status: "deny", reason: entry.reason };
    }
  }
  if (options.readOnly) {
    return { status: "allow" };
  }
  for (const entry of COMMAND_CONFIRM) {
    if (entry.pattern.test(command)) {
      return { status: "confirm", reason: entry.reason };
    }
  }
  return { status: "allow" };
}

async function confirmPolicy(action, reason, autoYes) {
  if (autoYes) return { status: "confirmed", method: "auto" };
  if (!process.stdin.isTTY) {
    return { status: "denied", reason: "non-interactive session" };
  }
  const ok = await confirmPrompt(`${action} requires confirmation (${reason}). Continue? (y/N) `);
  return ok ? { status: "confirmed", method: "prompt" } : { status: "denied", reason: "user declined" };
}

function findSensitiveFiles(files) {
  if (!files || !files.length) return [];
  return files.filter((file) => SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(file)));
}

async function confirmSensitiveFiles(files, autoYes, context) {
  if (!files.length) return { status: "allow" };
  const label = `Sensitive files ${context}: ${files.join(", ")}`;
  const confirmation = await confirmPolicy(label, "file edit policy", autoYes);
  return confirmation.status === "confirmed"
    ? { status: "confirmed", files, method: confirmation.method }
    : { status: "denied", files, reason: confirmation.reason };
}

function isCommandAvailable(command, args = ["--version"]) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return result.status === 0;
}

function runCommandCapture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    encoding: "utf8",
    input: options.input
  });
  return {
    code: result.status ?? (result.error ? 1 : 0),
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
    error: result.error ? result.error.message : null
  };
}

function detectRipgrep() {
  return isCommandAvailable("rg", ["--version"]);
}

function normalizePaths(files) {
  return files
    .map((file) => file.replace(/^\.\//, ""))
    .filter((file) => file && file !== ".");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isStartPlatformTask(task) {
  if (!task) return false;
  return /start\s+platform/i.test(task.trim());
}

function isFixFailingTestsTask(task) {
  if (!task) return false;
  return /fix\s+failing\s+tests/i.test(task.trim());
}

function isDoctorAutofixTask(task) {
  if (!task) return false;
  const normalized = task.trim();
  if (!normalized) return false;
  return /doctor/i.test(normalized) && /auto\s*-?\s*fix/i.test(normalized);
}

async function checkHttpHealth(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve({ ok: true, statusCode: res.statusCode });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, error: "timeout" });
    });
    req.on("error", (err) => resolve({ ok: false, error: err.message }));
  });
}

function summarizeOutput(text, maxLength = 1200) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function parseStatusForFailures(output) {
  if (!output) return [];
  const lines = output.split(/\r?\n/);
  const failing = [];
  lines.forEach((line) => {
    const match = line.match(/^(\w+):\s+(stopped|unknown)/i);
    if (match) failing.push(match[1]);
  });
  return failing;
}

function extractLikelyFiles(output, rootDir) {
  if (!output) return [];
  const candidates = new Set();
  const regex = /([A-Za-z0-9_./\\-]+\.(ts|tsx|js|jsx|json|md|css|scss|yml|yaml|toml|mjs|cjs))(:\d+(:\d+)?)?/g;
  let match;
  while ((match = regex.exec(output)) !== null) {
    const rawPath = match[1];
    const normalized = rawPath.replace(/\\/g, "/");
    const absolute = path.isAbsolute(normalized)
      ? normalized
      : path.resolve(rootDir, normalized);
    if (fs.existsSync(absolute)) {
      candidates.add(path.relative(rootDir, absolute));
    } else if (!path.isAbsolute(normalized)) {
      candidates.add(normalized);
    }
  }
  return Array.from(candidates).slice(0, 20);
}

function detectTestFixers(output, rootDir) {
  const fixers = [];
  const scripts = readPackageScripts(rootDir);
  if (/eslint|lint/i.test(output)) {
    const lintCommand = scripts.lint
      ? "pnpm lint -- --fix"
      : "pnpm --filter web lint -- --fix";
    fixers.push({ kind: "lint", command: lintCommand, reason: "lint errors detected" });
  }
  if (/snapshot|snapshots|toMatchSnapshot/i.test(output)) {
    const snapshotCommand = "pnpm --filter @illuvrse/tests test -- --update-snapshots";
    fixers.push({ kind: "snapshots", command: snapshotCommand, reason: "snapshot mismatch detected" });
  }
  return fixers;
}

function buildFixPlanSummary(likelyFiles, fixers) {
  const steps = [];
  if (likelyFiles.length) {
    steps.push(`Inspect likely failing files: ${likelyFiles.join(", ")}`);
  }
  if (fixers.length) {
    fixers.forEach((fixer) => {
      steps.push(`Run fixer (${fixer.kind}): ${fixer.command}`);
    });
  } else {
    steps.push("No automated fixers matched; inspect test output manually.");
  }
  steps.push("Re-run tests and re-evaluate.");
  return steps;
}

function parseDoctorReport(output) {
  if (!output) return { ok: false, error: "doctor output empty" };
  try {
    const report = JSON.parse(output);
    if (!report || !Array.isArray(report.checks)) {
      return { ok: false, error: "doctor output missing checks" };
    }
    return { ok: true, report };
  } catch (err) {
    return { ok: false, error: err.message ?? "invalid doctor JSON" };
  }
}

async function runGuardedCommand(command, options, actions, commandsRun) {
  const policy = evaluateCommandPolicy(command);
  if (policy.status === "deny") {
    actions.push({
      action: "guardrail",
      kind: "command",
      status: "denied",
      command,
      reason: policy.reason
    });
    return { status: "denied", error: policy.reason };
  }
  if (policy.status === "confirm") {
    const guard = await confirmPolicy(`Command "${command}"`, policy.reason ?? "policy check", options.autoYes);
    actions.push({
      action: "guardrail",
      kind: "command",
      status: guard.status === "confirmed" ? "confirmed" : "denied",
      command,
      reason: policy.reason,
      method: guard.method
    });
    if (guard.status !== "confirmed") {
      return { status: "denied", error: guard.reason };
    }
  }

  commandsRun.push(command);
  const result = runShellCommandCapture(command, { cwd: options.cwd });
  actions.push({
    action: "command",
    command,
    exitCode: result.code,
    stdout: summarizeOutput(result.stdout),
    stderr: summarizeOutput(result.stderr),
    error: result.error
  });
  return result.code === 0 ? { status: "ok", result } : { status: "failed", result };
}

function scanRepo(rootDir) {
  const useRg = detectRipgrep();
  if (useRg) {
    const command = "rg --files";
    const result = runCommandCapture("rg", ["--files"], { cwd: rootDir });
    if (result.code !== 0) {
      return { ok: false, command, error: result.stderr || result.error || "rg failed" };
    }
    const files = normalizePaths(result.stdout.split(/\r?\n/));
    return { ...summarizeFiles(files), command };
  }
  const command = "find . -type f -not -path './node_modules/*' -not -path './.git/*' -not -path './.ryan/*'";
  const result = runCommandCapture("find", [
    ".",
    "-type",
    "f",
    "-not",
    "-path",
    "./node_modules/*",
    "-not",
    "-path",
    "./.git/*",
    "-not",
    "-path",
    "./.ryan/*"
  ], { cwd: rootDir });
  if (result.code !== 0) {
    return { ok: false, command, error: result.stderr || result.error || "find failed" };
  }
  const files = normalizePaths(result.stdout.split(/\r?\n/));
  return { ...summarizeFiles(files), command };
}

function summarizeFiles(files) {
  const topLevels = new Map();
  files.forEach((file) => {
    const segment = file.split(path.sep)[0];
    if (!segment) return;
    topLevels.set(segment, (topLevels.get(segment) ?? 0) + 1);
  });
  const tops = Array.from(topLevels.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => `${name}: ${count}`);
  return { ok: true, total: files.length, topLevels: tops };
}

function grepRepo(rootDir, pattern) {
  if (!pattern) return { ok: false, error: "pattern required" };
  const useRg = detectRipgrep();
  if (useRg) {
    const command = `rg -n ${pattern}`;
    const result = runCommandCapture("rg", ["-n", pattern], { cwd: rootDir });
    if (result.code > 1) {
      return { ok: false, command, error: result.stderr || result.error || "rg failed" };
    }
    const lines = result.stdout ? result.stdout.split(/\r?\n/) : [];
    return { ok: true, matches: lines.slice(0, 200), total: lines.length, command };
  }
  const command = `grep -R -n ${pattern} .`;
  const result = runCommandCapture("grep", ["-R", "-n", pattern, "."], { cwd: rootDir });
  if (result.code > 1) {
    return { ok: false, command, error: result.stderr || result.error || "grep failed" };
  }
  const lines = result.stdout ? result.stdout.split(/\r?\n/) : [];
  return { ok: true, matches: lines.slice(0, 200), total: lines.length, command };
}

function readPackageScripts(rootDir) {
  try {
    const raw = fs.readFileSync(path.join(rootDir, "package.json"), "utf8");
    const parsed = JSON.parse(raw);
    return parsed.scripts ?? {};
  } catch {
    return {};
  }
}

function resolveTestCommand(rootDir) {
  const scripts = readPackageScripts(rootDir);
  if (scripts.test) return "pnpm test";
  if (scripts["test:smoke"]) return "pnpm test:smoke";
  return "pnpm --filter @illuvrse/tests test";
}

function buildMockPlan(task, options) {
  const steps = [];
  steps.push("Review repo context and relevant files");
  if (options.scan) steps.push("Scan the repo for relevant files");
  if (options.grep) steps.push(`Search for pattern: ${options.grep}`);
  steps.push("Outline minimal changes needed");
  if (options.test) steps.push("Run relevant tests");
  steps.push("Summarize changes and next steps");
  return steps;
}

function getCheckpointMode(requested) {
  const mode = (requested ?? process.env.RYAN_CHECKPOINT_MODE ?? "branch").toLowerCase();
  if (mode !== "branch" && mode !== "commit") return null;
  return mode;
}

function branchExists(rootDir, name) {
  const result = spawnSync("git", ["show-ref", "--verify", "--quiet", `refs/heads/${name}`], {
    cwd: rootDir
  });
  return result.status === 0;
}

function createCheckpointBranch(rootDir, task) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = `ryan/checkpoint/${stamp}`;
  let name = base;
  let counter = 1;
  while (branchExists(rootDir, name)) {
    name = `${base}-${counter}`;
    counter += 1;
  }
  const command = `git branch ${name}`;
  const result = runGitCommand(rootDir, ["branch", name]);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, mode: "branch", ref: name, task, command };
}

function createCheckpointCommit(rootDir, task) {
  const status = runGitCommand(rootDir, ["status", "--porcelain"]);
  if (!status.ok) return { ok: false, error: status.error };
  if (status.output) {
    return { ok: false, error: "working tree is dirty; commit checkpoint skipped" };
  }
  const message = `ryan checkpoint: ${task || "task"}`.slice(0, 200);
  const command = `git commit --allow-empty -m \"${message}\"`;
  const result = runGitCommand(rootDir, ["commit", "--allow-empty", "-m", message]);
  if (!result.ok) return { ok: false, error: result.error };
  const head = runGitCommand(rootDir, ["rev-parse", "HEAD"]);
  if (!head.ok) return { ok: false, error: head.error };
  return { ok: true, mode: "commit", ref: head.output, task, command };
}

function resolveCheckpoint(rootDir, task, requestedMode) {
  const mode = getCheckpointMode(requestedMode);
  if (!mode) return { ok: false, error: "Invalid checkpoint mode. Use branch or commit." };

  if (mode === "commit") {
    const commit = createCheckpointCommit(rootDir, task);
    if (commit.ok) return commit;
    const fallback = createCheckpointBranch(rootDir, task);
    if (fallback.ok) {
      return {
        ...fallback,
        warning: `Commit checkpoint skipped: ${commit.error}. Created branch instead.`
      };
    }
    return { ok: false, error: commit.error };
  }

  return createCheckpointBranch(rootDir, task);
}

function printPlan(plan, mode) {
  console.log(`Plan (${mode}):`);
  plan.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });
}

async function handleAsk(rootDir, args) {
  const parsed = parseAskArgs(args);
  if (parsed.help) {
    showAskHelp();
    return 0;
  }
  if (!parsed.prompt) {
    console.error("Prompt required.");
    showAskHelp();
    return 1;
  }

  const plan = buildMockPlan(parsed.prompt, parsed);
  printPlan(plan, "mock");

  const actions = [];
  const commandsRun = [];
  if (!parsed.allowShell && (parsed.scan || parsed.grep)) {
    console.error("Helper tools blocked. Re-run with --allow-shell to enable read-only commands.");
    actions.push({ action: "helper", status: "blocked", reason: "allow-shell required" });
  }

  if (parsed.allowShell) {
    if (parsed.scan) {
      const scan = scanRepo(rootDir);
      if (scan.command) commandsRun.push(scan.command);
      if (scan.ok) {
        console.log(`Repo scan: ${scan.total} files. Top-level: ${scan.topLevels.join(", ")}`);
        actions.push({ action: "scan", command: scan.command, total: scan.total, topLevels: scan.topLevels });
      } else {
        console.error(`Scan failed: ${scan.error}`);
        actions.push({ action: "scan", command: scan.command, status: "failed", error: scan.error });
      }
    }
    if (parsed.grep) {
      const grep = grepRepo(rootDir, parsed.grep);
      if (grep.command) commandsRun.push(grep.command);
      if (grep.ok) {
        console.log(`Grep matches: ${grep.total}`);
        grep.matches.forEach((line) => console.log(line));
        actions.push({ action: "grep", command: grep.command, pattern: parsed.grep, total: grep.total });
      } else {
        console.error(`Grep failed: ${grep.error}`);
        actions.push({ action: "grep", command: grep.command, status: "failed", error: grep.error });
      }
    }
  }

  const status = actions.some((action) => action.status === "blocked")
    ? "blocked"
    : actions.some((action) => action.status === "failed")
      ? "failed"
      : "ok";

  const store = createMemoryStore(rootDir);
  const entry = store.add_memory("ask", parsed.prompt, "prompt");
  const run = store.record_run({
    mode: "ask",
    task: parsed.prompt,
    summary: plan.join(" | "),
    status
  });
  store.record_action({ run_id: run.id, kind: "plan", detail: { steps: plan } });
  actions.forEach((action) => {
    store.record_action({ run_id: run.id, kind: action.action ?? "action", detail: action });
  });
  store.close();

  appendAuditLog(rootDir, {
    action: "ryan.ask",
    detail: {
      prompt: parsed.prompt,
      memoryId: entry.id,
      runId: run.id,
      mode: "mock",
      allowShell: parsed.allowShell,
      actions,
      commandsRun
    }
  });

  return 0;
}

async function handleDo(rootDir, args) {
  const parsed = parseDoArgs(args);
  if (parsed.help) {
    showDoHelp();
    return 0;
  }
  if (!parsed.task) {
    console.error("Task required.");
    showDoHelp();
    return 1;
  }

  const actions = [];
  const commandsRun = [];
  const filesBefore = getGitStatusFiles(rootDir);
  const plan = buildMockPlan(parsed.task, parsed);
  printPlan(plan, "mock");

  function finalizeRun(status) {
    const filesAfter = getGitStatusFiles(rootDir);
    const beforeSet = new Set(filesBefore.files ?? []);
    const changedFiles = filesAfter.ok ? filesAfter.files.filter((file) => !beforeSet.has(file)) : [];

    const store = createMemoryStore(rootDir);
    const taskEntry = store.add_memory("task", parsed.task, "task");
    const run = store.record_run({
      mode: "do",
      task: parsed.task,
      summary: plan.join(" | "),
      status
    });
    store.record_action({ run_id: run.id, kind: "plan", detail: { steps: plan } });
    actions.forEach((action) => {
      store.record_action({ run_id: run.id, kind: action.action ?? "action", detail: action });
    });
    store.close();

    appendAuditLog(rootDir, {
      action: "ryan.do",
      status,
      detail: {
        task: parsed.task,
        memoryId: taskEntry.id,
        runId: run.id,
        actions,
        commandsRun,
        filesChanged: changedFiles,
        filesBefore: filesBefore.files ?? [],
        filesAfter: filesAfter.files ?? []
      }
    });
  }

  if (parsed.dryRun) {
    finalizeRun("dry-run");
    return 0;
  }

  const sensitiveBefore = findSensitiveFiles(filesBefore.files ?? []);
  if (sensitiveBefore.length) {
    const decision = await confirmSensitiveFiles(sensitiveBefore, parsed.autoYes, "already modified");
    actions.push({
      action: "guardrail",
      kind: "file",
      status: decision.status,
      files: decision.files,
      reason: decision.reason
    });
    if (decision.status === "denied") {
      finalizeRun("denied");
      return 1;
    }
  }

  const checkpointResult = resolveCheckpoint(rootDir, parsed.task, parsed.checkpoint);
  if (!checkpointResult.ok) {
    console.error(`Checkpoint failed: ${checkpointResult.error}`);
    actions.push({ action: "checkpoint", status: "failed", error: checkpointResult.error });
    finalizeRun("checkpoint-failed");
    return 1;
  }

  if (checkpointResult.command) {
    commandsRun.push(checkpointResult.command);
  }
  if (checkpointResult.warning) {
    console.warn(checkpointResult.warning);
    actions.push({ action: "checkpoint", warning: checkpointResult.warning, ref: checkpointResult.ref });
  } else {
    actions.push({ action: "checkpoint", mode: checkpointResult.mode, ref: checkpointResult.ref });
  }

  createCheckpoint(rootDir, { command: parsed.task, reason: "ryan.do" });

  if (isStartPlatformTask(parsed.task)) {
    const upCommand = "./illuvrse up --detach";
    const upResult = await runGuardedCommand(
      upCommand,
      { cwd: rootDir, autoYes: parsed.autoYes },
      actions,
      commandsRun
    );
    const startupFailed = upResult.status !== "ok";

    await sleep(2000);
    const statusCommand = "./illuvrse status";
    const statusResult = await runGuardedCommand(
      statusCommand,
      { cwd: rootDir, autoYes: parsed.autoYes },
      actions,
      commandsRun
    );

    const failingFromStatus = statusResult.result?.stdout ? parseStatusForFailures(statusResult.result.stdout) : [];
    const healthCheck = await checkHttpHealth("http://localhost:3000");
    actions.push({
      action: "health",
      url: "http://localhost:3000",
      ok: healthCheck.ok,
      statusCode: healthCheck.statusCode,
      error: healthCheck.error
    });

    const failingServices = new Set(failingFromStatus);
    if (startupFailed) failingServices.add("web");
    if (!healthCheck.ok) failingServices.add("web");

    if (startupFailed || statusResult.status !== "ok" || failingServices.size > 0) {
      const logsTargets = failingServices.size ? Array.from(failingServices) : ["web"];
      for (const service of logsTargets) {
        const logsCommand = `./illuvrse logs ${service} --tail 200`;
        await runGuardedCommand(
          logsCommand,
          { cwd: rootDir, autoYes: parsed.autoYes },
          actions,
          commandsRun
        );
      }

      const diagnosis = [];
      if (startupFailed) {
        diagnosis.push("illuvrse up failed; check CLI output and dependencies.");
      }
      if (statusResult.status !== "ok") {
        diagnosis.push("illuvrse status failed; check CLI output and environment.");
      }
      if (!healthCheck.ok) {
        diagnosis.push("web service not responding on http://localhost:3000.");
      }
      if (failingServices.size) {
        diagnosis.push(`unhealthy services: ${Array.from(failingServices).join(", ")}`);
      }

      const suggestions = [
        "Run ./illuvrse doctor for prerequisite checks.",
        "Review ./illuvrse logs <service> output for errors.",
        "Verify ports are free and required env files exist."
      ];

      actions.push({
        action: "diagnosis",
        summary: diagnosis.join(" "),
        suggestions
      });
      finalizeRun("failed");
      return 1;
    }

    actions.push({
      action: "diagnosis",
      summary: "Platform started successfully and passed basic health check.",
      suggestions: []
    });
    finalizeRun("ok");
    return 0;
  }

  if (isFixFailingTestsTask(parsed.task)) {
    const maxIters = parsed.maxIters ?? Number(process.env.RYAN_FIX_MAX_ITERS ?? 2);
    const iterations = Number.isNaN(maxIters) ? 2 : Math.max(1, maxIters);
    let attempt = 0;
    let lastOutput = "";

    while (attempt < iterations) {
      attempt += 1;
      const testCommand = "./illuvrse test";
      const testResult = await runGuardedCommand(
        testCommand,
        { cwd: rootDir, autoYes: parsed.autoYes },
        actions,
        commandsRun
      );

      lastOutput = `${testResult.result?.stdout ?? ""}\n${testResult.result?.stderr ?? ""}`.trim();
      if (testResult.status === "ok") {
        actions.push({
          action: "diagnosis",
          summary: `Tests passing after ${attempt} attempt(s).`,
          suggestions: []
        });
        finalizeRun("ok");
        return 0;
      }

      const likelyFiles = extractLikelyFiles(lastOutput, rootDir);
      const fixers = detectTestFixers(lastOutput, rootDir);
      const planSteps = buildFixPlanSummary(likelyFiles, fixers);

      actions.push({
        action: "analysis",
        attempt,
        likelyFiles,
        fixers: fixers.map((fixer) => ({ kind: fixer.kind, command: fixer.command, reason: fixer.reason })),
        plan: planSteps
      });

      console.log(`Attempt ${attempt}/${iterations}: tests failed.`);
      if (likelyFiles.length) {
        console.log(`Likely files: ${likelyFiles.join(", ")}`);
      }
      planSteps.forEach((step, index) => console.log(`${index + 1}. ${step}`));

      if (!fixers.length) {
        actions.push({
          action: "diagnosis",
          summary: "No automated fixes matched; stopping.",
          suggestions: [
            "Inspect test output for failing assertions or config issues.",
            "Open the likely failing files and apply manual fixes."
          ]
        });
        finalizeRun("failed");
        return 1;
      }

      for (const fixer of fixers) {
        const fixResult = await runGuardedCommand(
          fixer.command,
          { cwd: rootDir, autoYes: parsed.autoYes },
          actions,
          commandsRun
        );
        if (fixResult.status !== "ok") {
          actions.push({
            action: "diagnosis",
            summary: `Fixer failed (${fixer.kind}).`,
            suggestions: ["Review fixer output and apply manual changes."]
          });
          finalizeRun("failed");
          return 1;
        }
      }
    }

    actions.push({
      action: "diagnosis",
      summary: `Tests still failing after ${iterations} attempt(s).`,
      suggestions: [
        "Inspect failing output in the audit log.",
        "Investigate likely files and apply manual fixes.",
        "Re-run ./illuvrse test after changes."
      ]
    });
    finalizeRun("failed");
    return 1;
  }

  if (isDoctorAutofixTask(parsed.task)) {
    const doctorCommand = "./illuvrse doctor --json";
    const initialResult = await runGuardedCommand(
      doctorCommand,
      { cwd: rootDir, autoYes: parsed.autoYes },
      actions,
      commandsRun
    );

    if (initialResult.status === "denied") {
      actions.push({ action: "doctor", status: "denied" });
      finalizeRun("denied");
      return 1;
    }

    const parsedInitial = parseDoctorReport(initialResult.result?.stdout);
    if (!parsedInitial.ok) {
      console.error(`Doctor JSON parse failed: ${parsedInitial.error}`);
      actions.push({ action: "doctor", status: "failed", error: parsedInitial.error });
      finalizeRun("failed");
      return 1;
    }

    const beforeReport = parsedInitial.report;
    const fixableChecks = beforeReport.checks.filter(
      (check) =>
        (check.status === "warn" || check.status === "fail") && check.fix && check.fix.safe === true
    );
    const unsafeChecks = beforeReport.checks.filter(
      (check) =>
        (check.status === "warn" || check.status === "fail") && check.fix && check.fix.safe !== true
    );

    const appliedFixes = [];
    const skippedFixes = [];

    unsafeChecks.forEach((check) => {
      actions.push({ action: "fix", status: "skipped", checkId: check.id, reason: "unsafe fix" });
      skippedFixes.push({ checkId: check.id, reason: "unsafe fix" });
    });

    for (const check of fixableChecks) {
      const fix = check.fix ?? {};
      const fixCommands = Array.isArray(fix.commands) ? fix.commands : [];
      const fixFiles = Array.isArray(fix.files) ? fix.files : [];
      if (!fixCommands.length && !fixFiles.length) {
        actions.push({
          action: "fix",
          status: "skipped",
          checkId: check.id,
          reason: "no commands or files"
        });
        skippedFixes.push({ checkId: check.id, reason: "no commands or files" });
        continue;
      }
      const confirmation = await confirmPolicy(
        `Apply safe fix "${check.id}"`,
        "doctor autofix",
        parsed.autoYes
      );
      actions.push({
        action: "guardrail",
        kind: "fix",
        status: confirmation.status,
        checkId: check.id,
        fixId: fix.id,
        reason: confirmation.reason,
        method: confirmation.method
      });
      if (confirmation.status !== "confirmed") {
        skippedFixes.push({ checkId: check.id, reason: confirmation.reason ?? "not confirmed" });
        continue;
      }

      if (fixFiles.length) {
        const sensitive = findSensitiveFiles(fixFiles);
        if (sensitive.length) {
          const decision = await confirmSensitiveFiles(sensitive, parsed.autoYes, "requested by doctor autofix");
          actions.push({
            action: "guardrail",
            kind: "file",
            status: decision.status,
            files: decision.files,
            reason: decision.reason,
            method: decision.method
          });
          if (decision.status !== "confirmed") {
            skippedFixes.push({ checkId: check.id, reason: decision.reason ?? "sensitive file denied" });
            continue;
          }
        }
      }

      let commandFailed = false;
      for (const command of fixCommands) {
        const result = await runGuardedCommand(
          command,
          { cwd: rootDir, autoYes: parsed.autoYes },
          actions,
          commandsRun
        );
        if (result.status !== "ok") {
          commandFailed = true;
          skippedFixes.push({ checkId: check.id, reason: result.error ?? "command failed" });
          break;
        }
      }

      if (commandFailed) {
        continue;
      }

      if (!fixCommands.length && fixFiles.length) {
        const created = [];
        let fileError = null;
        for (const file of fixFiles) {
          const target = path.isAbsolute(file) ? file : path.join(rootDir, file);
          if (fs.existsSync(target)) continue;
          try {
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, "", { flag: "wx" });
            created.push(path.relative(rootDir, target));
          } catch (err) {
            fileError = err;
            actions.push({
              action: "file",
              status: "failed",
              file: path.relative(rootDir, target),
              error: err.message ?? String(err)
            });
            break;
          }
        }
        if (fileError) {
          skippedFixes.push({ checkId: check.id, reason: "file creation failed" });
          continue;
        }
        if (created.length) {
          actions.push({ action: "file", status: "created", files: created });
        }
      }

      appliedFixes.push({ checkId: check.id, fixId: fix.id });
    }

    const afterResult = await runGuardedCommand(
      doctorCommand,
      { cwd: rootDir, autoYes: parsed.autoYes },
      actions,
      commandsRun
    );
    const parsedAfter = parseDoctorReport(afterResult.result?.stdout);
    if (!parsedAfter.ok) {
      console.error(`Doctor JSON parse failed: ${parsedAfter.error}`);
      actions.push({ action: "doctor", status: "failed", error: parsedAfter.error });
      finalizeRun("failed");
      return 1;
    }

    const afterReport = parsedAfter.report;
    const beforeMap = new Map(beforeReport.checks.map((check) => [check.id, check]));
    const fixedChecks = [];
    const remainingFails = [];
    const remainingWarns = [];
    const manualActions = [];

    afterReport.checks.forEach((check) => {
      const before = beforeMap.get(check.id);
      if (before && (before.status === "warn" || before.status === "fail") && check.status === "pass") {
        fixedChecks.push(check.id);
      }
      if (check.status === "fail") {
        remainingFails.push(check.id);
      } else if (check.status === "warn") {
        remainingWarns.push(check.id);
      }
      if ((check.status === "warn" || check.status === "fail") && (!check.fix || check.fix.safe !== true)) {
        manualActions.push(check.id);
      }
    });

    console.log("Doctor autofix summary:");
    console.log(`Applied fixes: ${appliedFixes.length ? appliedFixes.map((fix) => fix.checkId).join(", ") : "none"}`);
    console.log(`Fixed checks: ${fixedChecks.length ? fixedChecks.join(", ") : "none"}`);
    console.log(`Remaining fails: ${remainingFails.length ? remainingFails.join(", ") : "none"}`);
    console.log(`Remaining warns: ${remainingWarns.length ? remainingWarns.join(", ") : "none"}`);
    console.log(`Manual actions: ${manualActions.length ? manualActions.join(", ") : "none"}`);

    actions.push({
      action: "diagnosis",
      summary: "Doctor autofix complete.",
      appliedFixes,
      fixedChecks,
      remainingFails,
      remainingWarns,
      manualActions,
      skippedFixes
    });

    finalizeRun(remainingFails.length ? "failed" : "ok");
    return remainingFails.length ? 1 : 0;
  }

  if (parsed.scan) {
    const scan = scanRepo(rootDir);
    if (scan.command) commandsRun.push(scan.command);
    if (scan.command) {
      const policy = evaluateCommandPolicy(scan.command, { readOnly: true });
      if (policy.status === "deny") {
        actions.push({
          action: "guardrail",
          kind: "command",
          status: "denied",
          command: scan.command,
          reason: policy.reason
        });
        finalizeRun("denied");
        return 1;
      }
      if (policy.status === "confirm") {
        const guard = await confirmPolicy(
          `Command "${scan.command}"`,
          policy.reason ?? "policy check",
          parsed.autoYes
        );
        actions.push({
          action: "guardrail",
          kind: "command",
          status: guard.status === "confirmed" ? "confirmed" : "denied",
          command: scan.command,
          reason: policy.reason,
          method: guard.method
        });
        if (guard.status !== "confirmed") {
          finalizeRun("denied");
          return 1;
        }
      }
    }
    if (scan.ok) {
      console.log(`Repo scan: ${scan.total} files. Top-level: ${scan.topLevels.join(", ")}`);
      actions.push({ action: "scan", command: scan.command, total: scan.total, topLevels: scan.topLevels });
    } else {
      console.error(`Scan failed: ${scan.error}`);
      actions.push({ action: "scan", command: scan.command, status: "failed", error: scan.error });
    }
  }

  if (parsed.grep) {
    const grep = grepRepo(rootDir, parsed.grep);
    if (grep.command) commandsRun.push(grep.command);
    if (grep.command) {
      const policy = evaluateCommandPolicy(grep.command, { readOnly: true });
      if (policy.status === "deny") {
        actions.push({
          action: "guardrail",
          kind: "command",
          status: "denied",
          command: grep.command,
          reason: policy.reason
        });
        finalizeRun("denied");
        return 1;
      }
      if (policy.status === "confirm") {
        const guard = await confirmPolicy(
          `Command "${grep.command}"`,
          policy.reason ?? "policy check",
          parsed.autoYes
        );
        actions.push({
          action: "guardrail",
          kind: "command",
          status: guard.status === "confirmed" ? "confirmed" : "denied",
          command: grep.command,
          reason: policy.reason,
          method: guard.method
        });
        if (guard.status !== "confirmed") {
          finalizeRun("denied");
          return 1;
        }
      }
    }
    if (grep.ok) {
      console.log(`Grep matches: ${grep.total}`);
      grep.matches.forEach((line) => console.log(line));
      actions.push({ action: "grep", command: grep.command, pattern: parsed.grep, total: grep.total });
    } else {
      console.error(`Grep failed: ${grep.error}`);
      actions.push({ action: "grep", command: grep.command, status: "failed", error: grep.error });
    }
  }

  if (parsed.test) {
    const testCommand = resolveTestCommand(rootDir);
    commandsRun.push(testCommand);
    const policy = evaluateCommandPolicy(testCommand);
    if (policy.status === "deny") {
      actions.push({
        action: "guardrail",
        kind: "command",
        status: "denied",
        command: testCommand,
        reason: policy.reason
      });
      finalizeRun("denied");
      return 1;
    }
    if (policy.status === "confirm") {
      const guard = await confirmPolicy(
        `Command "${testCommand}"`,
        policy.reason ?? "policy check",
        parsed.autoYes
      );
      actions.push({
        action: "guardrail",
        kind: "command",
        status: guard.status === "confirmed" ? "confirmed" : "denied",
        command: testCommand,
        reason: policy.reason,
        method: guard.method
      });
      if (guard.status !== "confirmed") {
        finalizeRun("denied");
        return 1;
      }
    }
    const exitCode = await runShellCommand(testCommand, { cwd: rootDir });
    actions.push({ action: "test", command: testCommand, exitCode });
  }

  const filesAfter = getGitStatusFiles(rootDir);
  const beforeSet = new Set(filesBefore.files ?? []);
  const changedFiles = filesAfter.ok ? filesAfter.files.filter((file) => !beforeSet.has(file)) : [];
  const sensitiveAfter = findSensitiveFiles(changedFiles);
  if (sensitiveAfter.length) {
    const decision = await confirmSensitiveFiles(sensitiveAfter, parsed.autoYes, "modified during run");
    actions.push({
      action: "guardrail",
      kind: "file",
      status: decision.status,
      files: decision.files,
      reason: decision.reason,
      method: decision.method
    });
    if (decision.status === "denied") {
      finalizeRun("denied");
      return 1;
    }
  }

  const status = actions.some((action) => action.status === "failed" || action.exitCode > 0) ? "failed" : "ok";
  finalizeRun(status);
  return status === "ok" ? 0 : 1;
}

async function handleMemory(rootDir, args) {
  const subcommand = args[0];
  if (!subcommand || subcommand.startsWith("--")) {
    const parsed = parseMemoryArgs(args);
    if (parsed.help) {
      showMemoryHelp();
      return 0;
    }
    const store = createMemoryStore(rootDir);
    if (parsed.addNote) {
      const entry = store.add_memory("note", parsed.addNote, "note");
      console.log(`${entry.id} note: ${entry.content}`);
      appendAuditLog(rootDir, {
        action: "ryan.memory.add",
        detail: { id: entry.id, type: entry.type }
      });
    }
    const count = store.count_memories();
    const recent = store.list_memories(5);
    console.log(`Memory entries: ${count}`);
    recent.forEach((item) => {
      console.log(`${item.id} ${item.type} ${item.created_at}: ${item.content}`);
    });
    store.close();
    return 0;
  }

  if (subcommand === "add") {
    const parsed = parseMemoryAddArgs(args.slice(1));
    if (parsed.help) {
      showMemoryHelp();
      return 0;
    }
    if (!parsed.content) {
      console.error("Memory note required.");
      showMemoryHelp();
      return 1;
    }
    const store = createMemoryStore(rootDir);
    const entry = store.add_memory("note", parsed.content, "note");
    appendAuditLog(rootDir, {
      action: "ryan.memory.add",
      detail: { id: entry.id, type: entry.type }
    });
    console.log(`${entry.id} ${entry.type}: ${entry.content}`);
    store.close();
    return 0;
  }

  if (subcommand === "list") {
    const parsed = parseMemoryListArgs(args.slice(1));
    if (parsed.help) {
      showMemoryHelp();
      return 0;
    }
    const store = createMemoryStore(rootDir);
    const items = store.list_memories(parsed.limit);
    items.forEach((item) => {
      console.log(`${item.id} ${item.type} ${item.created_at}: ${item.content}`);
    });
    appendAuditLog(rootDir, {
      action: "ryan.memory.list",
      detail: { count: items.length }
    });
    store.close();
    return 0;
  }

  if (subcommand === "get") {
    if (args.includes("--help") || args.includes("-h")) {
      showMemoryHelp();
      return 0;
    }
    const id = args[1];
    if (!id) {
      console.error("Memory id required.");
      showMemoryHelp();
      return 1;
    }
    const store = createMemoryStore(rootDir);
    const item = store.get_memory(id);
    if (!item) {
      console.error("Memory not found.");
      store.close();
      return 1;
    }
    console.log(`${item.id} ${item.type} ${item.created_at}: ${item.content}`);
    appendAuditLog(rootDir, {
      action: "ryan.memory.get",
      detail: { id }
    });
    store.close();
    return 0;
  }

  if (subcommand === "delete") {
    if (args.includes("--help") || args.includes("-h")) {
      showMemoryHelp();
      return 0;
    }
    const id = args[1];
    if (!id) {
      console.error("Memory id required.");
      showMemoryHelp();
      return 1;
    }
    const store = createMemoryStore(rootDir);
    store.delete_memory(id);
    appendAuditLog(rootDir, {
      action: "ryan.memory.delete",
      detail: { id }
    });
    console.log(`Deleted ${id}.`);
    store.close();
    return 0;
  }

  console.error(`Unknown memory subcommand: ${subcommand}`);
  showMemoryHelp();
  return 1;
}

async function handleLog(rootDir, args) {
  const parsed = parseLogArgs(args);
  if (parsed.help) {
    showLogHelp();
    return 0;
  }
  const { auditLogPath } = ensureRyanDirs(rootDir);
  const lines = tailFile(auditLogPath, parsed.tail);
  lines.forEach((line) => console.log(line));
  appendAuditLog(rootDir, {
    action: "ryan.log",
    detail: { tail: parsed.tail }
  });
  return 0;
}

async function handleIndex(rootDir, args) {
  const subcommand = args[0];
  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    showIndexHelp();
    return 0;
  }

  if (subcommand === "build") {
    if (args.includes("--help") || args.includes("-h")) {
      showIndexHelp();
      return 0;
    }
    const actions = [];
    const result = buildIndex(rootDir);
    const summary = {
      services: {
        compose: result.index.services.compose.reduce(
          (count, entry) => count + entry.services.length,
          0
        ),
        scripts: result.index.services.scripts.length,
        directories: result.index.services.directories.length
      },
      ports: result.index.ports.length,
      envVars: result.index.env.vars.length,
      entrypoints: result.index.entrypoints.length,
      routes: result.index.routes.length
    };
    actions.push({ action: "index.build", path: result.path, summary });

    const store = createMemoryStore(rootDir);
    const run = store.record_run({
      mode: "index",
      task: "build",
      summary: `services=${summary.services.compose + summary.services.scripts} ports=${summary.ports} env=${summary.envVars}`,
      status: "ok"
    });
    store.record_action({ run_id: run.id, kind: "index", detail: summary });
    store.close();

    appendAuditLog(rootDir, {
      action: "ryan.index.build",
      detail: { path: result.path, summary }
    });

    console.log(`Index written to ${path.relative(rootDir, result.path)}`);
    console.log(
      `Services: ${summary.services.compose + summary.services.scripts} | Ports: ${summary.ports} | Env vars: ${summary.envVars} | Routes: ${summary.routes}`
    );
    return 0;
  }

  if (subcommand === "show") {
    const parsed = parseIndexShowArgs(args.slice(1));
    if (parsed.help) {
      showIndexHelp();
      return 0;
    }
    const index = loadIndex(rootDir);
    if (!index) {
      console.error("Index not found. Run: ryan index build");
      return 1;
    }

    const showAll = !parsed.services && !parsed.ports && !parsed.env;

    if (parsed.services || showAll) {
      const composeServices = index.services.compose.flatMap((entry) =>
        entry.services.map((service) => service.name)
      );
      console.log(`Services (compose): ${composeServices.length ? composeServices.join(", ") : "none"}`);
      console.log(`Services (scripts): ${index.services.scripts.map((svc) => svc.name).join(", ") || "none"}`);
      console.log(`Services (dirs): ${index.services.directories.join(", ") || "none"}`);
    }

    if (parsed.ports || showAll) {
      const portList = index.ports.map((entry) => entry.port);
      console.log(`Ports: ${portList.length ? Array.from(new Set(portList)).join(", ") : "none"}`);
    }

    if (parsed.env || showAll) {
      const envList = index.env.vars.map((entry) => entry.name);
      console.log(`Env vars: ${envList.length ? envList.join(", ") : "none"}`);
      if (index.env.files.length) {
        console.log(`Env files: ${index.env.files.join(", ")}`);
      }
    }

    const store = createMemoryStore(rootDir);
    const run = store.record_run({
      mode: "index",
      task: "show",
      summary: `services=${index.services.scripts.length} ports=${index.ports.length} env=${index.env.vars.length}`,
      status: "ok"
    });
    store.record_action({
      run_id: run.id,
      kind: "index",
      detail: { services: parsed.services, ports: parsed.ports, env: parsed.env }
    });
    store.close();

    appendAuditLog(rootDir, {
      action: "ryan.index.show",
      detail: { services: parsed.services, ports: parsed.ports, env: parsed.env }
    });
    return 0;
  }

  console.error(`Unknown index subcommand: ${subcommand}`);
  showIndexHelp();
  return 1;
}

async function handleMap(rootDir, args) {
  const subcommand = args[0];
  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    showMapHelp();
    return 0;
  }

  if (subcommand === "generate") {
    if (args.includes("--help") || args.includes("-h")) {
      showMapHelp();
      return 0;
    }
    const index = loadIndex(rootDir);
    if (!index) {
      console.error("Index not found. Run: ryan index build");
      return 1;
    }

    const result = generateArchitectureMap(rootDir, index);
    const summary = {
      services: index.services.scripts.length + index.services.compose.length,
      ports: index.ports.length,
      envVars: index.env.vars.length,
      routes: index.routes.length
    };

    const store = createMemoryStore(rootDir);
    const run = store.record_run({
      mode: "map",
      task: "generate",
      summary: `services=${summary.services} ports=${summary.ports} env=${summary.envVars}`,
      status: "ok"
    });
    store.record_action({ run_id: run.id, kind: "map", detail: summary });
    store.close();

    appendAuditLog(rootDir, {
      action: "ryan.map.generate",
      detail: { path: result.path, summary }
    });

    console.log(`Architecture map updated at ${path.relative(rootDir, result.path)}`);
    return 0;
  }

  console.error(`Unknown map subcommand: ${subcommand}`);
  showMapHelp();
  return 1;
}

async function main(argv) {
  const rootDir = findRepoRoot(process.cwd());
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    showHelp();
    return 0;
  }

  try {
    switch (command) {
      case "ask":
        return await handleAsk(rootDir, rest);
      case "do":
        return await handleDo(rootDir, rest);
      case "memory":
        return await handleMemory(rootDir, rest);
      case "index":
        return await handleIndex(rootDir, rest);
      case "map":
        return await handleMap(rootDir, rest);
      case "log":
        return await handleLog(rootDir, rest);
      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        return 1;
    }
  } catch (err) {
    console.error(err.message ?? err);
    appendAuditLog(rootDir, {
      action: `ryan.${command}`,
      status: "error",
      detail: { message: err.message ?? String(err) }
    });
    return 1;
  }
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
