import type { AceAgentManifest } from "@illuvrse/contracts";

export type StageFormState = {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: AceAgentManifest["capabilities"];
  runtimeImage: string;
  trigger: string;
  llmId: string;
  ttsId: string;
  cpu: string;
  memory: string;
};

const idPattern = /^[a-z0-9\-._]+$/;

export function computeStageErrors(stageKey: string, data: StageFormState) {
  const nextErrors: Record<string, string> = {};
  if (stageKey === "identity") {
    if (!data.id.trim()) nextErrors.id = "Required";
    else if (!idPattern.test(data.id.trim())) nextErrors.id = "Use lowercase letters, numbers, dots, underscores, or hyphens";
    if (!data.name.trim()) nextErrors.name = "Required";
    if (!data.version.trim()) nextErrors.version = "Required";
    if (!data.runtimeImage.trim()) nextErrors.runtimeImage = "Required";
  }
  if (stageKey === "capabilities") {
    if (!data.capabilities.length) nextErrors.capabilities = "Pick at least one capability";
  }
  if (stageKey === "runtime") {
    if (!data.trigger.trim()) nextErrors.trigger = "Required";
    if (!data.llmId.trim()) nextErrors.llmId = "Required";
    if (!data.ttsId.trim()) nextErrors.ttsId = "Required";
    if (!data.cpu.trim()) nextErrors.cpu = "Required";
    if (!data.memory.trim()) nextErrors.memory = "Required";
  }
  return nextErrors;
}

export function summarizeDiff(current: AceAgentManifest, next: AceAgentManifest): string[] {
  const changes: string[] = [];
  if (current.id !== next.id) changes.push(`id: ${current.id} → ${next.id}`);
  if (current.name !== next.name) changes.push(`name: ${current.name} → ${next.name}`);
  if (current.version !== next.version) changes.push(`version: ${current.version} → ${next.version}`);
  if ((current.capabilities ?? []).join(",") !== (next.capabilities ?? []).join(",")) changes.push("capabilities updated");
  if (current.runtime.container.image !== next.runtime.container.image) changes.push("runtime image updated");
  if (JSON.stringify(current.triggers) !== JSON.stringify(next.triggers)) changes.push("triggers updated");
  if (current.modelBindings?.llm?.id !== next.modelBindings?.llm?.id) changes.push("LLM binding updated");
  if (current.modelBindings?.tts?.id !== next.modelBindings?.tts?.id) changes.push("TTS binding updated");
  if (current.resources?.cpu !== next.resources?.cpu || current.resources?.memory !== next.resources?.memory) changes.push("resources updated");
  return changes.length ? changes : ["No differences detected"];
}

export function stageComplete(stageKey: string, data: StageFormState) {
  return Object.keys(computeStageErrors(stageKey, data)).length === 0;
}

export function parseAvatarAssets(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function validateAvatarFields(rawAssets: string, voiceUrl: string) {
  const errors: Record<string, string> = {};
  const assets = parseAvatarAssets(rawAssets);
  if (!assets.length) {
    errors.avatarAssets = "Add at least one avatar asset URL";
  } else if (assets.some((url) => !/^(https?:\/\/|s3:\/\/)/.test(url))) {
    errors.avatarAssets = "Use http(s) or s3 URLs for assets";
  }
  if (voiceUrl && !voiceUrl.startsWith("http")) {
    errors.avatarVoiceUrl = "Voice sample must be an http(s) URL";
  }
  return errors;
}

export function normalizeCpu(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed.endsWith("m")) return trimmed;
  const num = Number(trimmed);
  if (!Number.isNaN(num) && num > 0 && num < 10 && trimmed.includes(".")) {
    return `${Math.round(num * 1000)}m`;
  }
  return trimmed;
}

export function normalizeMemory(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.toUpperCase().replace("MIB", "Mi").replace("GIB", "Gi");
}
