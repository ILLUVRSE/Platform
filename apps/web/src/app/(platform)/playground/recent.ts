import type { AceAgentManifest } from "@illuvrse/contracts";

const RECENT_KEY = "ace-playground-recent";

export function rememberManifest(manifest: AceAgentManifest) {
  try {
    const json = localStorage.getItem(RECENT_KEY);
    const current = json ? (JSON.parse(json) as AceAgentManifest[]) : [];
    const next = [manifest, ...current.filter((m) => m.id !== manifest.id)].slice(0, 3);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function loadRecent(): AceAgentManifest[] {
  try {
    const json = localStorage.getItem(RECENT_KEY);
    if (!json) return [];
    return JSON.parse(json) as AceAgentManifest[];
  } catch {
    return [];
  }
}

export function clearRecent() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore
  }
}
