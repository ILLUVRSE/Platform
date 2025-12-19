const fs = require("fs");
const path = require("path");

const MANUAL_START = "<!-- MANUAL:START -->";
const MANUAL_END = "<!-- MANUAL:END -->";

function sanitizeId(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function extractManualSection(text) {
  if (!text) return { content: "\n", found: false };
  const startIndex = text.indexOf(MANUAL_START);
  const endIndex = text.indexOf(MANUAL_END);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return { content: "\n", found: false };
  }
  const content = text.slice(startIndex + MANUAL_START.length, endIndex);
  return { content, found: true };
}

function inferRole(name, hint, type) {
  const combined = `${name} ${hint ?? ""}`.toLowerCase();
  if (/(postgres|mysql|mongo|redis|db|database|cache)/.test(combined)) return "database/cache";
  if (/(api|backend|server|graphql)/.test(combined)) return "api/backend";
  if (/(worker|queue|job|bull|cron)/.test(combined)) return "worker/queue";
  if (/(web|frontend|ui|next|react)/.test(combined)) return "web/frontend";
  if (type === "directory") return "component";
  if (type === "script" && /dev/.test(combined)) return "dev server";
  return "service";
}

function scopeFromFile(file) {
  if (!file) return "root";
  const normalized = file.replace(/\\/g, "/");
  if (!normalized || normalized === ".env") return "root";
  const parts = normalized.split("/").filter(Boolean);
  if (!parts.length) return "root";
  if (["apps", "packages", "services"].includes(parts[0]) && parts.length > 1) {
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0];
}

function collectServices(index) {
  const services = [];
  const seen = new Set();

  index.services.compose.forEach((entry) => {
    entry.services.forEach((service) => {
      const key = `compose:${service.name}`;
      if (seen.has(key)) return;
      seen.add(key);
      services.push({
        name: service.name,
        type: "compose",
        role: inferRole(service.name, `${service.image ?? ""} ${service.command ?? ""}`, "compose"),
        source: entry.file
      });
    });
  });

  index.services.scripts.forEach((service) => {
    const key = `script:${service.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    services.push({
      name: service.name,
      type: "script",
      role: inferRole(service.name, service.command, "script"),
      source: service.package
    });
  });

  index.services.directories.forEach((dir) => {
    const key = `directory:${dir}`;
    if (seen.has(key)) return;
    seen.add(key);
    services.push({
      name: dir,
      type: "directory",
      role: inferRole(dir, dir, "directory"),
      source: dir
    });
  });

  return services;
}

function buildPortsTable(ports) {
  if (!ports.length) return "_No ports detected._";
  const header = ["| Port | Source | File | Context |", "| --- | --- | --- | --- |"];
  const rows = ports.map((entry) => {
    const context = entry.context ? entry.context.replace(/\|/g, "/") : "";
    return `| ${entry.port} | ${entry.source ?? ""} | ${entry.file ?? ""} | ${context} |`;
  });
  return [...header, ...rows].join("\n");
}

function buildStartupOrder(services) {
  if (!services.length) return "_No services detected._";
  const weights = {
    "database/cache": 1,
    "api/backend": 2,
    "worker/queue": 3,
    "web/frontend": 4,
    service: 5,
    component: 6,
    "dev server": 7
  };
  const ordered = [...services].sort((a, b) => {
    const weightA = weights[a.role] ?? 9;
    const weightB = weights[b.role] ?? 9;
    if (weightA !== weightB) return weightA - weightB;
    return a.name.localeCompare(b.name);
  });
  return ordered.map((service, index) => `${index + 1}. ${service.name} (${service.role})`).join("\n");
}

function buildEnvGroups(index) {
  const groups = new Map();
  index.env.vars.forEach((entry) => {
    const files = Array.isArray(entry.files) ? entry.files : [];
    if (!files.length) {
      const group = groups.get("root") ?? new Set();
      group.add(entry.name);
      groups.set("root", group);
      return;
    }
    files.forEach((file) => {
      const scope = scopeFromFile(file);
      const group = groups.get(scope) ?? new Set();
      group.add(entry.name);
      groups.set(scope, group);
    });
  });
  return groups;
}

function buildEnvSection(groups) {
  if (!groups.size) return "_No env vars detected._";
  const sections = [];
  Array.from(groups.keys())
    .sort()
    .forEach((scope) => {
      const vars = Array.from(groups.get(scope)).sort();
      sections.push(`### ${scope}`);
      vars.forEach((name) => sections.push(`- ${name}`));
    });
  return sections.join("\n");
}

function deriveDependencyTarget(name, serviceNames) {
  const match = name.match(/^(.*)_(URL|HOST|ENDPOINT|SERVICE)$/);
  if (!match) return null;
  const targetRaw = match[1];
  const normalizedTarget = sanitizeId(targetRaw);
  if (!normalizedTarget) return null;
  const direct = serviceNames.find((service) => sanitizeId(service) === normalizedTarget);
  return direct ?? targetRaw;
}

function buildMermaidDiagram(services, envGroups) {
  const lines = ["```mermaid", "graph TD"];
  const serviceNames = services.map((service) => service.name);
  const nodes = new Map();
  const edges = new Set();

  services.forEach((service) => {
    const id = `svc_${sanitizeId(service.name)}`;
    if (!id) return;
    nodes.set(id, service.name);
  });

  envGroups.forEach((vars, scope) => {
    const groupId = `grp_${sanitizeId(scope)}`;
    if (!groupId) return;
    nodes.set(groupId, scope);
    Array.from(vars).forEach((name) => {
      const target = deriveDependencyTarget(name, serviceNames);
      if (!target) return;
      const targetId = nodes.has(`svc_${sanitizeId(target)}`)
        ? `svc_${sanitizeId(target)}`
        : `ext_${sanitizeId(target)}`;
      nodes.set(targetId, target);
      edges.add(`${groupId} --> ${targetId}`);
    });
  });

  if (!nodes.size) {
    lines.push("  empty[\"No nodes detected\"]");
  } else {
    nodes.forEach((label, id) => {
      lines.push(`  ${id}["${label}"]`);
    });
    if (edges.size) {
      edges.forEach((edge) => lines.push(`  ${edge}`));
    } else {
      lines.push("  note[\"No dependencies detected\"]");
    }
  }

  lines.push("```");
  return lines.join("\n");
}

function renderServicesTable(services) {
  if (!services.length) return "_No services detected._";
  const header = ["| Service | Type | Role | Source |", "| --- | --- | --- | --- |"];
  const rows = services.map(
    (service) => `| ${service.name} | ${service.type} | ${service.role} | ${service.source} |`
  );
  return [...header, ...rows].join("\n");
}

function generateArchitectureMap(rootDir, index) {
  const docPath = path.join(rootDir, "docs", "architecture_map.md");
  let manualContent = "\n";
  if (fs.existsSync(docPath)) {
    const existing = fs.readFileSync(docPath, "utf8");
    const extracted = extractManualSection(existing);
    manualContent = extracted.content;
  }

  const services = collectServices(index);
  const envGroups = buildEnvGroups(index);
  const portsTable = buildPortsTable(index.ports ?? []);
  const startupOrder = buildStartupOrder(services);
  const envSection = buildEnvSection(envGroups);
  const mermaidDiagram = buildMermaidDiagram(services, envGroups);

  const manualSection = `${MANUAL_START}${manualContent}${MANUAL_END}`;

  const content = [
    "# Architecture Map",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Services",
    "",
    renderServicesTable(services),
    "",
    "## Ports",
    "",
    portsTable,
    "",
    "## Startup Order (best-effort)",
    "",
    startupOrder,
    "",
    "## Environment Variables (best-effort)",
    "",
    envSection,
    "",
    "## Dependency Diagram",
    "",
    mermaidDiagram,
    "",
    "## Manual Notes",
    manualSection,
    ""
  ].join("\n");

  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(docPath, content);
  return { path: docPath, content };
}

module.exports = {
  generateArchitectureMap,
  extractManualSection
};
