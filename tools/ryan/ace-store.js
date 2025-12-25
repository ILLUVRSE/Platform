const fs = require("fs");
const path = require("path");
const { ensureRyanDirs } = require("./lib");

const STORE_VERSION = 1;
const MAX_ENTRIES = 100;

function aceDir(rootDir) {
  const { baseDir } = ensureRyanDirs(rootDir);
  const dir = path.join(baseDir, "ace");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function registryPath(rootDir) {
  return path.join(aceDir(rootDir), "registry.json");
}

function handoffPath(rootDir) {
  return path.join(aceDir(rootDir), "handoff.json");
}

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function loadRegistry(rootDir) {
  const fallback = { version: STORE_VERSION, updatedAt: 0, manifests: [] };
  const data = loadJson(registryPath(rootDir), fallback);
  return {
    version: STORE_VERSION,
    updatedAt: Number(data.updatedAt) || 0,
    manifests: Array.isArray(data.manifests) ? data.manifests : []
  };
}

function saveRegistry(rootDir, registry) {
  const payload = {
    version: STORE_VERSION,
    updatedAt: Date.now(),
    manifests: registry.manifests.slice(0, MAX_ENTRIES)
  };
  saveJson(registryPath(rootDir), payload);
  return payload;
}

function listRegistry(rootDir) {
  return loadRegistry(rootDir).manifests;
}

function getRegistryEntry(rootDir, id) {
  const registry = loadRegistry(rootDir);
  return registry.manifests.find((entry) => entry.id === id) || null;
}

function upsertManifest(rootDir, manifest, source) {
  const registry = loadRegistry(rootDir);
  const entry = {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    updatedAt: Date.now(),
    source,
    manifest
  };
  const existingIndex = registry.manifests.findIndex((item) => item.id === manifest.id);
  if (existingIndex >= 0) registry.manifests.splice(existingIndex, 1);
  registry.manifests.unshift(entry);
  saveRegistry(rootDir, registry);
  return entry;
}

function readHandoff(rootDir) {
  const data = loadJson(handoffPath(rootDir), null);
  if (!data || !data.manifest) return null;
  return data;
}

function setHandoff(rootDir, manifest, source) {
  const payload = {
    version: STORE_VERSION,
    updatedAt: Date.now(),
    source,
    manifest
  };
  saveJson(handoffPath(rootDir), payload);
  return payload;
}

function setHandoffFromRegistry(rootDir, id, source) {
  const entry = getRegistryEntry(rootDir, id);
  if (!entry) return null;
  return setHandoff(rootDir, entry.manifest, source || entry.source);
}

module.exports = {
  listRegistry,
  getRegistryEntry,
  upsertManifest,
  readHandoff,
  setHandoff,
  setHandoffFromRegistry
};
