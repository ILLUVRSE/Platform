const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { ensureRyanDirs } = require("../lib");

const COMPOSE_FILES = ["docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml"];
const IGNORE_DIRS = new Set([".git", "node_modules", ".ryan", "dist", "build", "out", ".next", "coverage", "tmp", "temp"]);
const TEXT_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
  ".toml",
  ".ini",
  ".conf",
  ".cfg",
  ".md"
]);
const ENTRYPOINT_BASENAMES = new Set([
  "server.js",
  "server.ts",
  "index.js",
  "index.ts",
  "app.js",
  "app.ts",
  "main.js",
  "main.ts"
]);
const ROUTE_FILE_EXTS = new Set([".js", ".jsx", ".ts", ".tsx"]);

function detectRipgrep() {
  const result = spawnSync("rg", ["--version"], { encoding: "utf8" });
  return result.status === 0;
}

function listFilesWithRg(rootDir) {
  const args = [
    "--files",
    "-g",
    "!.git/**",
    "-g",
    "!node_modules/**",
    "-g",
    "!.ryan/**",
    "-g",
    "!dist/**",
    "-g",
    "!build/**",
    "-g",
    "!out/**",
    "-g",
    "!.next/**",
    "-g",
    "!coverage/**"
  ];
  const result = spawnSync("rg", args, { cwd: rootDir, encoding: "utf8" });
  if (result.status !== 0) {
    return { ok: false, error: result.stderr || result.stdout || "rg failed", files: [] };
  }
  const files = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((file) => path.join(rootDir, file));
  return { ok: true, files };
}

function listFilesWithWalk(rootDir) {
  const files = [];
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        if (entry.name !== ".env" && !entry.name.startsWith(".env.")) {
          continue;
        }
      }
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        stack.push(full);
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
  }
  return { ok: true, files };
}

function isEnvFile(filePath) {
  const base = path.basename(filePath);
  return base === ".env" || base.startsWith(".env.");
}

function shouldScanFile(filePath) {
  if (isEnvFile(filePath)) return true;
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

function readTextFile(filePath, maxBytes) {
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return null;
  }
  if (stat.size > maxBytes) return null;
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
  if (raw.includes("\u0000")) return null;
  return raw;
}

function parseComposeFile(filePath) {
  const services = [];
  let currentService = null;
  let inServices = false;
  let inPorts = false;
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const indent = line.match(/^\s*/)?.[0]?.length ?? 0;
    const trimmed = line.trim();
    if (trimmed.startsWith("services:")) {
      inServices = true;
      currentService = null;
      inPorts = false;
      continue;
    }
    if (!inServices) continue;

    if (indent === 2 && trimmed.endsWith(":")) {
      const name = trimmed.slice(0, -1).trim();
      currentService = { name, image: null, command: null, entrypoint: null, ports: [] };
      services.push(currentService);
      inPorts = false;
      continue;
    }
    if (!currentService) continue;
    if (indent <= 2) {
      currentService = null;
      inPorts = false;
      continue;
    }

    if (trimmed.startsWith("image:")) {
      currentService.image = trimmed.slice("image:".length).trim();
    } else if (trimmed.startsWith("command:")) {
      currentService.command = trimmed.slice("command:".length).trim();
    } else if (trimmed.startsWith("entrypoint:")) {
      currentService.entrypoint = trimmed.slice("entrypoint:".length).trim();
    } else if (trimmed.startsWith("ports:")) {
      inPorts = true;
    } else if (inPorts && trimmed.startsWith("-")) {
      const rawPort = trimmed.replace(/^-/, "").trim().replace(/"/g, "");
      const match = rawPort.match(/(\d{2,5})\s*:\s*(\d{2,5})/);
      if (match) {
        currentService.ports.push(Number(match[1]));
      } else {
        const single = rawPort.match(/(\d{2,5})/);
        if (single) currentService.ports.push(Number(single[1]));
      }
    }
  }
  return services;
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const match = trimmed.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=/);
  return match ? match[1] : null;
}

function addEnvVar(envMap, name, file, context) {
  if (!name) return;
  const entry = envMap.get(name) ?? { name, files: new Set(), contexts: [] };
  entry.files.add(file);
  if (context && entry.contexts.length < 3) {
    entry.contexts.push(context);
  }
  envMap.set(name, entry);
}

function addPort(portMap, port, file, context, source) {
  if (!port || Number.isNaN(port)) return;
  if (port < 1 || port > 65535) return;
  const key = `${port}:${file}:${source}`;
  if (portMap.has(key)) return;
  portMap.set(key, { port, file, context, source });
}

function addRoute(routeMap, route) {
  const key = `${route.method}:${route.path}:${route.file}`;
  if (routeMap.has(key)) return;
  routeMap.set(key, route);
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function deriveRouteFromAppRouteFile(relPath) {
  const normalized = toPosix(relPath);
  const ext = path.extname(normalized);
  if (!ROUTE_FILE_EXTS.has(ext)) return null;
  const routeSuffix = `/route${ext}`;
  const pageSuffix = `/page${ext}`;
  if (!normalized.includes("/app/")) return null;
  if (!normalized.endsWith(routeSuffix) && !normalized.endsWith(pageSuffix)) return null;
  const appIndex = normalized.indexOf("/app/");
  let routePath = normalized.slice(appIndex + "/app".length);
  if (routePath.endsWith(routeSuffix)) {
    routePath = routePath.slice(0, -routeSuffix.length);
  } else if (routePath.endsWith(pageSuffix)) {
    routePath = routePath.slice(0, -pageSuffix.length);
  }
  if (!routePath) return "/";
  if (!routePath.startsWith("/")) {
    routePath = `/${routePath}`;
  }
  return routePath;
}

function deriveRouteFromPages(relPath) {
  const normalized = toPosix(relPath);
  const ext = path.extname(normalized);
  if (!ROUTE_FILE_EXTS.has(ext)) return null;
  if (!normalized.includes("/pages/")) return null;
  const pagesIndex = normalized.indexOf("/pages/");
  let routePath = normalized.slice(pagesIndex + "/pages".length);
  routePath = routePath.replace(ext, "");
  routePath = routePath.replace(/\/index$/, "") || "/";
  return routePath;
}

function collectKnownDirectories(rootDir) {
  const known = ["apps", "packages", "services", "web", "api", "server", "backend", "frontend"];
  const directories = [];
  let entries = [];
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch {
    return directories;
  }
  const topDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  for (const dir of known) {
    if (!topDirs.includes(dir)) continue;
    if (dir === "apps" || dir === "packages" || dir === "services") {
      const childDir = path.join(rootDir, dir);
      const children = fs
        .readdirSync(childDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(dir, entry.name));
      directories.push(...children);
    } else {
      directories.push(dir);
    }
  }
  return Array.from(new Set(directories)).sort();
}

function shouldIncludeScript(name) {
  return /^(dev|start|serve|preview)(:|$)/i.test(name) || /:(dev|start|serve)$/i.test(name) || /web|api|server|backend|frontend/i.test(name);
}

function buildIndex(rootDir, options = {}) {
  const useRipgrep = options.useRipgrep ?? detectRipgrep();
  const maxBytes = options.maxBytes ?? 1024 * 1024;
  const { baseDir } = ensureRyanDirs(rootDir);
  const indexPath = path.join(baseDir, "index.json");

  const filesResult = useRipgrep ? listFilesWithRg(rootDir) : listFilesWithWalk(rootDir);
  const files = filesResult.ok ? filesResult.files : [];

  const composeEntries = [];
  for (const filename of COMPOSE_FILES) {
    const filePath = path.join(rootDir, filename);
    if (fs.existsSync(filePath)) {
      const services = parseComposeFile(filePath);
      composeEntries.push({
        file: filename,
        services: services.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
  }

  const scriptServices = [];
  const entrypoints = [];
  const envVars = new Map();
  const envFiles = [];
  const dotenvFiles = [];
  const ports = new Map();
  const routes = new Map();

  const seenPackages = new Set();
  const relFiles = files.map((file) => path.relative(rootDir, file));

  for (const relPath of relFiles) {
    const base = path.basename(relPath);
    const routeFromApp = deriveRouteFromAppRouteFile(relPath);
    if (routeFromApp) {
      addRoute(routes, { method: "ROUTE", path: routeFromApp, file: relPath, source: "app" });
    }
    const routeFromPages = deriveRouteFromPages(relPath);
    if (routeFromPages) {
      addRoute(routes, { method: "PAGE", path: routeFromPages, file: relPath, source: "pages" });
    }
    if (ENTRYPOINT_BASENAMES.has(base)) {
      entrypoints.push({ type: "file", value: relPath, file: relPath, source: "filename" });
    }
    if (base === "package.json" && !seenPackages.has(relPath)) {
      seenPackages.add(relPath);
      let pkg;
      try {
        pkg = JSON.parse(fs.readFileSync(path.join(rootDir, relPath), "utf8"));
      } catch {
        continue;
      }
      const scripts = pkg.scripts ?? {};
      Object.entries(scripts).forEach(([name, command]) => {
        if (shouldIncludeScript(name)) {
          scriptServices.push({ name, command, package: relPath });
        }
        entrypoints.push({
          type: "script",
          value: command,
          file: relPath,
          source: `script:${name}`
        });
      });
      if (pkg.main) {
        entrypoints.push({ type: "main", value: pkg.main, file: relPath, source: "package.json" });
      }
      if (pkg.bin) {
        if (typeof pkg.bin === "string") {
          entrypoints.push({ type: "bin", value: pkg.bin, file: relPath, source: "package.json" });
        } else if (typeof pkg.bin === "object") {
          Object.values(pkg.bin).forEach((value) => {
            entrypoints.push({ type: "bin", value, file: relPath, source: "package.json" });
          });
        }
      }
    }
  }

  for (const relPath of relFiles) {
    if (!shouldScanFile(relPath)) continue;
    const filePath = path.join(rootDir, relPath);
    if (isEnvFile(filePath)) {
      envFiles.push(relPath);
      const content = readTextFile(filePath, maxBytes);
      if (!content) continue;
      content.split(/\r?\n/).forEach((line) => {
        const name = parseEnvLine(line);
        if (name) addEnvVar(envVars, name, relPath, line.trim().slice(0, 200));
        const portMatch = line.match(/\bPORT\s*=\s*(\d{2,5})\b/);
        if (portMatch) {
          addPort(ports, Number(portMatch[1]), relPath, line.trim().slice(0, 200), "env");
        }
      });
      continue;
    }

    const content = readTextFile(filePath, maxBytes);
    if (!content) continue;
    const lines = content.split(/\r?\n/);
    const hasDotenv = content.includes("dotenv") && content.includes("config");
    if (hasDotenv) {
      dotenvFiles.push({ file: relPath, context: "dotenv config" });
    }
    for (const line of lines) {
      let match;
      const envPatterns = [
        /process\.env\.([A-Z0-9_]+)/g,
        /process\.env\[['"]([A-Z0-9_]+)['"]\]/g,
        /import\.meta\.env\.([A-Z0-9_]+)/g,
        /Deno\.env\.get\(['"]([A-Z0-9_]+)['"]\)/g
      ];
      for (const pattern of envPatterns) {
        while ((match = pattern.exec(line)) !== null) {
          addEnvVar(envVars, match[1], relPath, line.trim().slice(0, 200));
        }
      }

      const portPatterns = [
        /\bPORT\s*=\s*(\d{2,5})\b/g,
        /\blisten\s*\(\s*(\d{2,5})/g,
        /\bport\s*[:=]\s*(\d{2,5})\b/gi,
        /\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0)\s*:\s*(\d{2,5})\b/g
      ];
      for (const pattern of portPatterns) {
        while ((match = pattern.exec(line)) !== null) {
          addPort(ports, Number(match[1]), relPath, line.trim().slice(0, 200), "scan");
        }
      }

      const routePattern = /\b(?:app|router)\.(get|post|put|patch|delete|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
      while ((match = routePattern.exec(line)) !== null) {
        addRoute(routes, {
          method: match[1].toUpperCase(),
          path: match[2],
          file: relPath,
          source: "code"
        });
      }
    }
  }

  composeEntries.forEach((entry) => {
    entry.services.forEach((service) => {
      if (service.command) {
        entrypoints.push({
          type: "compose-command",
          value: service.command,
          file: entry.file,
          source: `compose:${service.name}`
        });
      }
      if (service.entrypoint) {
        entrypoints.push({
          type: "compose-entrypoint",
          value: service.entrypoint,
          file: entry.file,
          source: `compose:${service.name}`
        });
      }
      service.ports.forEach((port) => {
        addPort(ports, port, entry.file, `service ${service.name}`, "compose");
      });
    });
  });

  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    root: rootDir,
    services: {
      compose: composeEntries,
      scripts: scriptServices.sort((a, b) => a.name.localeCompare(b.name)),
      directories: collectKnownDirectories(rootDir)
    },
    ports: Array.from(ports.values()).sort((a, b) => a.port - b.port || a.file.localeCompare(b.file)),
    env: {
      vars: Array.from(envVars.values())
        .map((entry) => ({
          name: entry.name,
          files: Array.from(entry.files).sort(),
          contexts: entry.contexts
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      files: Array.from(new Set(envFiles)).sort(),
      dotenv: dotenvFiles
    },
    entrypoints: entrypoints
      .map((entry) => ({ ...entry, file: entry.file ? toPosix(entry.file) : entry.file }))
      .sort((a, b) => (a.value ?? "").localeCompare(b.value ?? "")),
    routes: Array.from(routes.values()).sort((a, b) => a.path.localeCompare(b.path))
  };

  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  return { index, path: indexPath };
}

function loadIndex(rootDir) {
  const { baseDir } = ensureRyanDirs(rootDir);
  const indexPath = path.join(baseDir, "index.json");
  if (!fs.existsSync(indexPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(indexPath, "utf8"));
  } catch {
    return null;
  }
}

module.exports = {
  buildIndex,
  loadIndex
};
