const fs = require("fs");
const path = require("path");
const net = require("net");
const { spawn, spawnSync } = require("child_process");
const {
  findRepoRoot,
  ensureRyanDirs,
  appendAuditLog,
  loadState,
  saveState,
  runShellCommand,
  tailFile
} = require("./lib");

const COMPOSE_FILES = ["docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml"];

function showHelp() {
  console.log(`ILLUVRSE local control

Usage:
  illuvrse <command> [options]

Commands:
  up [--service web] [--detach]   Start local services.
  down [--service web|--all]      Stop tracked services.
  status                          Show tracked service status.
  doctor                          Check local prerequisites.
  logs [service] [--tail N]       Show recent service logs.
  test                            Run platform tests.

Run "illuvrse <command> --help" for command details.`);
}

function showUpHelp() {
  console.log(`Usage:
  illuvrse up [--service web] [--detach]

Starts the local web app. Use --detach to run in background.`);
}

function showDownHelp() {
  console.log(`Usage:
  illuvrse down [--service web] [--all]

Stops services started with --detach.`);
}

function showStatusHelp() {
  console.log(`Usage:
  illuvrse status`);
}

function showDoctorHelp() {
  console.log(`Usage:
  illuvrse doctor [--json]

Checks required binaries, env files, and port availability.`);
}

function showLogsHelp() {
  console.log(`Usage:
  illuvrse logs [service] [--tail N]

Defaults to the last 200 lines.`);
}

function showTestHelp() {
  console.log(`Usage:
  illuvrse test`);
}

function parseDoctorArgs(args) {
  let json = false;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--json") json = true;
  }
  return { json };
}

function parseUpArgs(args) {
  let service = "web";
  let detach = false;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--service") {
      service = args[i + 1] ?? service;
      i += 1;
      continue;
    }
    if (arg === "--detach") {
      detach = true;
    }
  }
  return { service, detach };
}

function parseDownArgs(args) {
  let service = "web";
  let all = false;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--service") {
      service = args[i + 1] ?? service;
      i += 1;
      continue;
    }
    if (arg === "--all") all = true;
  }
  return { service, all };
}

function parseLogsArgs(args) {
  let tail = 200;
  let service = null;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--tail") {
      const value = Number(args[i + 1]);
      if (!Number.isNaN(value)) tail = value;
      i += 1;
      continue;
    }
    if (!arg.startsWith("-") && !service) {
      service = arg;
    }
  }
  return { service, tail };
}

function buildFix({ id, safe, commands = [], files = [], notes = "" }) {
  return { id, safe, commands, files, notes };
}

function runDetached(command, cwd, logPath) {
  const outFd = fs.openSync(logPath, "a");
  const child = spawn(command, {
    cwd,
    shell: true,
    detached: true,
    stdio: ["ignore", outFd, outFd]
  });
  child.unref();
  fs.closeSync(outFd);
  return child.pid;
}

function runCommand(cmd, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd ?? process.cwd(),
      stdio: "inherit"
    });
    child.on("error", () => resolve(1));
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

function checkBinary(name, args) {
  const result = spawnSync(name, args, { encoding: "utf8" });
  if (result.error) {
    return { ok: false, output: result.error.message };
  }
  if (result.status === 0) {
    return { ok: true, output: (result.stdout || "").trim() };
  }
  return { ok: false, output: (result.stderr || result.stdout || "").trim() };
}

function findComposeFile(rootDir) {
  for (const file of COMPOSE_FILES) {
    const candidate = path.join(rootDir, file);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function detectDockerCompose(rootDir) {
  const composeFile = findComposeFile(rootDir);
  if (!composeFile) {
    return { available: false, file: null, reason: "no compose file" };
  }

  const docker = spawnSync("docker", ["compose", "version"], { encoding: "utf8" });
  if (docker.status === 0) {
    return { available: true, file: composeFile, command: "docker", args: ["compose"] };
  }

  const legacy = spawnSync("docker-compose", ["--version"], { encoding: "utf8" });
  if (legacy.status === 0) {
    return { available: true, file: composeFile, command: "docker-compose", args: [] };
  }

  return { available: false, file: composeFile, reason: "docker compose not available" };
}

function composeArgs(compose, extraArgs) {
  const args = [...(compose.args ?? [])];
  if (compose.file) args.push("-f", compose.file);
  return [...args, ...extraArgs];
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

function resolveCommands(scripts) {
  let devCommand = "pnpm --filter web dev";
  if (scripts.dev) devCommand = "pnpm dev";
  else if (scripts["start:platform"]) devCommand = "pnpm start:platform";

  let testCommand = "pnpm --filter @illuvrse/tests test";
  if (scripts.test) testCommand = "pnpm test";
  else if (scripts["test:smoke"]) testCommand = "pnpm test:smoke";

  return { devCommand, testCommand };
}

function buildServices(commands) {
  return {
    web: {
      command: commands.devCommand,
      logFile: "web.log",
      port: 3000
    }
  };
}

function getRuntime(rootDir) {
  const scripts = readPackageScripts(rootDir);
  const commands = resolveCommands(scripts);
  const services = buildServices(commands);
  const compose = detectDockerCompose(rootDir);
  return { scripts, commands, services, compose };
}

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve({ port, inUse: true });
      } else {
        resolve({ port, inUse: true, error: err.message });
      }
    });
    server.once("listening", () => {
      server.close(() => resolve({ port, inUse: false }));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function handleUp(rootDir, args) {
  const parsed = parseUpArgs(args);
  if (parsed.help) {
    showUpHelp();
    return 0;
  }

  const runtime = getRuntime(rootDir);
  if (runtime.compose.available) {
    const extra = ["up"];
    if (parsed.detach) extra.push("-d");
    appendAuditLog(rootDir, {
      action: "illuvrse.up",
      detail: { mode: "docker-compose", detach: parsed.detach }
    });
    return runCommand(runtime.compose.command, composeArgs(runtime.compose, extra), { cwd: rootDir });
  }

  const service = runtime.services[parsed.service];
  if (!service) {
    console.error(`Unknown service: ${parsed.service}`);
    showUpHelp();
    return 1;
  }

  if (!parsed.detach) {
    appendAuditLog(rootDir, {
      action: "illuvrse.up",
      detail: { service: parsed.service, mode: "foreground" }
    });
    return runShellCommand(service.command, { cwd: rootDir });
  }

  const { logsDir } = ensureRyanDirs(rootDir);
  const logPath = path.join(logsDir, service.logFile);
  const pid = runDetached(service.command, rootDir, logPath);

  const state = loadState(rootDir);
  state.services[parsed.service] = {
    pid,
    command: service.command,
    logPath,
    startedAt: new Date().toISOString()
  };
  saveState(rootDir, state);

  appendAuditLog(rootDir, {
    action: "illuvrse.up",
    detail: { service: parsed.service, mode: "detached", pid }
  });

  console.log(`Started ${parsed.service} (pid ${pid}). Logs: ${path.relative(rootDir, logPath)}`);
  return 0;
}

async function handleDown(rootDir, args) {
  const parsed = parseDownArgs(args);
  if (parsed.help) {
    showDownHelp();
    return 0;
  }

  const runtime = getRuntime(rootDir);
  if (runtime.compose.available) {
    appendAuditLog(rootDir, { action: "illuvrse.down", detail: { mode: "docker-compose" } });
    return runCommand(runtime.compose.command, composeArgs(runtime.compose, ["down"]), { cwd: rootDir });
  }

  const state = loadState(rootDir);
  const targets = parsed.all ? Object.keys(state.services) : [parsed.service];
  if (!targets.length) {
    console.log("No tracked services running.");
    return 0;
  }

  let stopped = 0;
  targets.forEach((name) => {
    const service = state.services[name];
    if (!service?.pid) return;
    try {
      process.kill(service.pid);
      delete state.services[name];
      stopped += 1;
      appendAuditLog(rootDir, {
        action: "illuvrse.down",
        detail: { service: name, pid: service.pid }
      });
    } catch (err) {
      console.error(`Failed to stop ${name}: ${err.message}`);
    }
  });

  saveState(rootDir, state);
  if (!stopped) {
    console.log("No tracked services running.");
  } else {
    console.log(`Stopped ${stopped} service(s).`);
  }
  return 0;
}

async function handleStatus(rootDir, args) {
  if (args.includes("--help") || args.includes("-h")) {
    showStatusHelp();
    return 0;
  }

  const runtime = getRuntime(rootDir);
  if (runtime.compose.available) {
    appendAuditLog(rootDir, { action: "illuvrse.status", detail: { mode: "docker-compose" } });
    return runCommand(runtime.compose.command, composeArgs(runtime.compose, ["ps"]), { cwd: rootDir });
  }

  const state = loadState(rootDir);
  const entries = Object.entries(runtime.services);
  if (!entries.length) {
    console.log("No services configured.");
    return 0;
  }

  for (const [name, serviceConfig] of entries) {
    const tracked = state.services[name];
    let running = false;
    if (tracked?.pid) {
      try {
        process.kill(tracked.pid, 0);
        running = true;
      } catch {
        running = false;
      }
    }
    let portStatus = "unknown";
    if (serviceConfig.port) {
      const portCheck = await checkPort(serviceConfig.port);
      portStatus = portCheck.inUse ? "open" : "closed";
    }
    const statusLabel = tracked
      ? running
        ? "running"
        : "stopped"
      : portStatus === "open"
        ? "unknown"
        : "stopped";
    const pidLabel = tracked?.pid ? `pid ${tracked.pid}` : "untracked";
    console.log(`${name}: ${statusLabel} (${pidLabel}, port ${serviceConfig.port ?? "n/a"} ${portStatus})`);
  }

  appendAuditLog(rootDir, { action: "illuvrse.status", detail: { mode: "local" } });
  return 0;
}

async function handleDoctor(rootDir, args) {
  const parsed = parseDoctorArgs(args);
  if (parsed.help) {
    showDoctorHelp();
    return 0;
  }

  const runtime = getRuntime(rootDir);
  const checks = [];
  const fixes = [];

  const nodeVersion = process.version;
  checks.push({
    id: "node_version",
    label: "node",
    status: "ok",
    detail: nodeVersion,
    summary: "Node.js available",
    details: [nodeVersion],
    fix: null,
    fixText: null
  });

  const pnpm = checkBinary("pnpm", ["--version"]);
  const pnpmMissing = !pnpm.ok;
  checks.push({
    id: "pnpm_present",
    label: "pnpm",
    status: pnpmMissing ? "fail" : "ok",
    detail: pnpm.output || "missing",
    summary: pnpmMissing ? "pnpm missing" : "pnpm available",
    details: [pnpm.output || "missing"],
    fix: pnpmMissing
      ? buildFix({
          id: "install_pnpm",
          safe: false,
          commands: ["npm install -g pnpm"],
          files: [],
          notes: "Install pnpm (https://pnpm.io/installation)."
        })
      : null,
    fixText: pnpmMissing ? "Install pnpm (https://pnpm.io/installation)." : null
  });

  const git = checkBinary("git", ["--version"]);
  const gitMissing = !git.ok;
  checks.push({
    id: "git_present",
    label: "git",
    status: gitMissing ? "fail" : "ok",
    detail: git.output || "missing",
    summary: gitMissing ? "git missing" : "git available",
    details: [git.output || "missing"],
    fix: gitMissing
      ? buildFix({
          id: "install_git",
          safe: false,
          commands: [],
          files: [],
          notes: "Install git (https://git-scm.com/downloads)."
        })
      : null,
    fixText: gitMissing ? "Install git (https://git-scm.com/downloads)." : null
  });

  if (runtime.compose.file) {
    if (runtime.compose.available) {
      checks.push({
        id: "docker_compose",
        label: "docker compose",
        status: "ok",
        detail: `using ${path.basename(runtime.compose.file)}`,
        summary: "docker compose available",
        details: [`using ${path.basename(runtime.compose.file)}`],
        fix: null,
        fixText: null
      });
    } else {
      checks.push({
        id: "docker_compose",
        label: "docker compose",
        status: "fail",
        detail: "missing",
        summary: "docker compose missing",
        details: ["missing"],
        fix: buildFix({
          id: "install_docker",
          safe: false,
          commands: [],
          files: [],
          notes: "Install Docker Desktop or docker-compose to use containers."
        }),
        fixText: "Install Docker Desktop or docker-compose to use containers."
      });
    }
  } else {
    checks.push({
      id: "docker_compose",
      label: "docker compose",
      status: "ok",
      detail: "no compose file detected",
      summary: "no compose file detected",
      details: ["no compose file detected"],
      fix: null,
      fixText: null
    });
  }

  const envCandidates = [".env", ".env.local", ".env.development.local"];
  const envPresent = envCandidates.filter((file) => fs.existsSync(path.join(rootDir, file)));
  const envExample = fs.existsSync(path.join(rootDir, ".env.example"));
  const envMissing = envPresent.length === 0;
  const envFixText = envMissing
    ? envExample
      ? "Copy .env.example to .env and fill required values."
      : "Create a .env or .env.local file with required values."
    : null;
  checks.push({
    id: "env_files",
    label: "env files",
    status: envMissing ? "fail" : "ok",
    detail: envPresent.length ? envPresent.join(", ") : "none",
    summary: envMissing ? "env files missing" : "env files present",
    details: envPresent.length ? envPresent : ["none"],
    fix: envMissing
      ? buildFix({
          id: "create_env",
          safe: true,
          commands: envExample ? ["cp .env.example .env"] : [],
          files: [".env"],
          notes: envFixText ?? "Create a .env or .env.local file with required values."
        })
      : null,
    fixText: envFixText
  });

  const portsToCheck = Array.from(
    new Set(
      Object.values(runtime.services)
        .map((service) => service.port)
        .filter(Boolean)
    )
  ).sort((a, b) => a - b);
  const portChecks = await Promise.all(portsToCheck.map((port) => checkPort(port)));
  portChecks.forEach((portCheck) => {
    const status = portCheck.inUse ? "warn" : "ok";
    const detail = portCheck.inUse ? "in use" : "available";
    const details = [detail];
    if (portCheck.error) details.push(portCheck.error);
    const fixText = portCheck.inUse
      ? `Stop the process using port ${portCheck.port} (try: lsof -i :${portCheck.port}) or change the port.`
      : null;
    checks.push({
      id: `port_${portCheck.port}`,
      label: `port ${portCheck.port}`,
      status,
      detail,
      summary: `port ${portCheck.port} ${portCheck.inUse ? "in use" : "available"}`,
      details,
      fix: portCheck.inUse
        ? buildFix({
            id: "free_port",
            safe: false,
            commands: [`lsof -i :${portCheck.port}`],
            files: [],
            notes: fixText ?? ""
          })
        : null,
      fixText
    });
  });

  if (parsed.json) {
    const report = {
      ok: !checks.some((check) => check.status === "fail"),
      checks: checks.map((check) => ({
        id: check.id,
        status: check.status === "ok" ? "pass" : check.status,
        summary: check.summary ?? check.label,
        details: Array.isArray(check.details)
          ? check.details
          : check.detail
            ? [check.detail]
            : [],
        fix:
          check.status === "ok"
            ? null
            : check.fix ??
              buildFix({
                id: "manual_fix",
                safe: false,
                commands: [],
                files: [],
                notes: "Manual fix required."
              })
      }))
    };
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("Doctor report:");
    checks.forEach((check) => {
      console.log(`- ${check.label}: ${check.status} ${check.detail ? `(${check.detail})` : ""}`.trim());
      if (check.fixText && check.status !== "ok") fixes.push(check.fixText);
    });

    if (fixes.length) {
      console.log("\nFixes:");
      fixes.forEach((fix) => console.log(`- ${fix}`));
    }
  }

  appendAuditLog(rootDir, {
    action: "illuvrse.doctor",
    detail: {
      pnpm: pnpm.ok,
      git: git.ok,
      env: envPresent.length > 0,
      compose: runtime.compose.available
    }
  });

  const hasFailures = checks.some((check) => check.status === "fail");
  return hasFailures ? 1 : 0;
}

async function handleLogs(rootDir, args) {
  const parsed = parseLogsArgs(args);
  if (parsed.help) {
    showLogsHelp();
    return 0;
  }

  const runtime = getRuntime(rootDir);
  if (runtime.compose.available) {
    const extra = ["logs", "--tail", String(parsed.tail)];
    if (parsed.service) extra.push(parsed.service);
    appendAuditLog(rootDir, {
      action: "illuvrse.logs",
      detail: { mode: "docker-compose", service: parsed.service ?? "all" }
    });
    return runCommand(runtime.compose.command, composeArgs(runtime.compose, extra), { cwd: rootDir });
  }

  const serviceName = parsed.service ?? "web";
  const state = loadState(rootDir);
  const service = state.services[serviceName];
  const { logsDir } = ensureRyanDirs(rootDir);
  const logPath = service?.logPath ?? path.join(logsDir, `${serviceName}.log`);

  const lines = tailFile(logPath, parsed.tail);
  if (!lines.length) {
    console.log("No logs found.");
    return 0;
  }
  lines.forEach((line) => console.log(line));
  appendAuditLog(rootDir, {
    action: "illuvrse.logs",
    detail: { service: serviceName, tail: parsed.tail }
  });
  return 0;
}

async function handleTest(rootDir, args) {
  if (args.includes("--help") || args.includes("-h")) {
    showTestHelp();
    return 0;
  }
  const runtime = getRuntime(rootDir);
  appendAuditLog(rootDir, { action: "illuvrse.test", detail: { command: runtime.commands.testCommand } });
  return runShellCommand(runtime.commands.testCommand, { cwd: rootDir });
}

async function main(argv) {
  const rootDir = findRepoRoot(process.cwd());
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    showHelp();
    return 0;
  }

  switch (command) {
    case "up":
      return handleUp(rootDir, rest);
    case "down":
      return handleDown(rootDir, rest);
    case "status":
      return handleStatus(rootDir, rest);
    case "doctor":
      return handleDoctor(rootDir, rest);
    case "logs":
      return handleLogs(rootDir, rest);
    case "test":
      return handleTest(rootDir, rest);
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      return 1;
  }
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
