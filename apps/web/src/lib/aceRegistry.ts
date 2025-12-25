import "server-only";

import fs from "fs";
import path from "path";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { validateAceAgentManifest } from "@illuvrse/contracts";

type AceRegistryEntry = {
  id: string;
  name: string;
  version: string;
  updatedAt: number;
  source?: string;
  manifest: AceAgentManifest;
};

type AceRegistry = {
  version: number;
  updatedAt: number;
  manifests: AceRegistryEntry[];
};

type AceHandoff = {
  version: number;
  updatedAt: number;
  source?: string;
  manifest: AceAgentManifest;
};

const STORE_VERSION = 1;
const MAX_ENTRIES = 100;

function resolveRepoRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(current, ".git")) || fs.existsSync(path.join(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return startDir;
}

function aceStoreDir() {
  const root = resolveRepoRoot();
  const dir = path.join(root, ".ryan", "ace");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function registryPath() {
  return path.join(aceStoreDir(), "registry.json");
}

function handoffPath() {
  return path.join(aceStoreDir(), "handoff.json");
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function loadRegistry(): AceRegistry {
  const fallback: AceRegistry = { version: STORE_VERSION, updatedAt: 0, manifests: [] };
  const data = readJson<AceRegistry>(registryPath(), fallback);
  return {
    version: STORE_VERSION,
    updatedAt: Number(data.updatedAt) || 0,
    manifests: Array.isArray(data.manifests) ? data.manifests : []
  };
}

function saveRegistry(registry: AceRegistry) {
  const payload = {
    version: STORE_VERSION,
    updatedAt: Date.now(),
    manifests: registry.manifests.slice(0, MAX_ENTRIES)
  };
  writeJson(registryPath(), payload);
}

export function listRegistryEntries() {
  return loadRegistry().manifests;
}

export function getRegistryEntry(id: string) {
  const registry = loadRegistry();
  return registry.manifests.find((entry) => entry.id === id) ?? null;
}

export function getRegistryManifestById(id: string) {
  const entry = getRegistryEntry(id);
  if (!entry) return null;
  try {
    validateAceAgentManifest(entry.manifest);
    return entry.manifest;
  } catch {
    return null;
  }
}

export function upsertRegistryManifest(manifest: AceAgentManifest, source?: string) {
  validateAceAgentManifest(manifest);
  const registry = loadRegistry();
  const nextEntry: AceRegistryEntry = {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    updatedAt: Date.now(),
    source,
    manifest
  };
  const existingIndex = registry.manifests.findIndex((entry) => entry.id === manifest.id);
  if (existingIndex >= 0) {
    registry.manifests.splice(existingIndex, 1);
  }
  registry.manifests.unshift(nextEntry);
  saveRegistry(registry);
  return nextEntry;
}

export function readHandoff(): AceHandoff | null {
  const fallback: AceHandoff | null = null;
  const data = readJson<AceHandoff | null>(handoffPath(), fallback);
  if (!data || !data.manifest) return null;
  try {
    validateAceAgentManifest(data.manifest);
  } catch {
    return null;
  }
  return data;
}

export function setHandoffManifest(manifest: AceAgentManifest, source?: string) {
  validateAceAgentManifest(manifest);
  const payload: AceHandoff = {
    version: STORE_VERSION,
    updatedAt: Date.now(),
    source,
    manifest
  };
  writeJson(handoffPath(), payload);
  return payload;
}

export function setHandoffFromRegistry(id: string, source?: string) {
  const entry = getRegistryEntry(id);
  if (!entry) return null;
  return setHandoffManifest(entry.manifest, source ?? entry.source);
}
