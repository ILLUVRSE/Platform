/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { validateAceAgentManifest } from "@illuvrse/contracts";
import { Card, PageSection, Pill, ProofCard } from "@illuvrse/ui";
import { AgentManagerClient } from "@illuvrse/agent-manager";
import {
  computeStageErrors,
  summarizeDiff,
  stageComplete,
  parseAvatarAssets,
  validateAvatarFields,
  normalizeCpu,
  normalizeMemory,
  type StageFormState
} from "./utils";
import { HandoffDiff } from "./HandoffDiff";

const STORAGE_KEY = "ace-wizard-draft";
const PLAYGROUND_KEY = "ace-playground-manifest";
const PROOF_KEY = "ace-last-proof";
const idPattern = /^[a-z0-9\-._]+$/;
const llmOptions = ["gpt-4o-mini", "gpt-4o", "claude-3-5-sonnet"];
const ttsOptions = ["eleven.v1", "azure.neural", "openai.tts-1"];
const runtimeImages = [
  "illuvrse/agent-storyweaver:dev",
  "illuvrse/agent-generator:dev",
  "illuvrse/agent-catalog:dev",
  "illuvrse/agent-scheduler:dev",
  "illuvrse/agent-proof:dev",
  "illuvrse/agent-liveloop:dev"
];
const resourcePresets = [
  { name: "Dev", cpu: "500m", memory: "512Mi" },
  { name: "Staging", cpu: "1", memory: "1Gi" },
  { name: "Production", cpu: "2", memory: "2Gi" }
];
const allCapabilities: AceAgentManifest["capabilities"] = [
  "generator",
  "catalog",
  "scheduler",
  "liveloop",
  "proof",
  "moderator",
  "monitor",
  "assistant"
];
const archetypeOptions = ["Oracle", "Guide", "Guardian", "Architect", "Scout", "Spark"];
const traitOptions = [
  "Curious",
  "Protective",
  "Playful",
  "Analytical",
  "Bold",
  "Empathic",
  "Whimsical",
  "Steady"
];

const stageAnchors = [
  { key: "identity", label: "Identity", desc: "id, name, version, runtime image" },
  { key: "capabilities", label: "Capabilities", desc: "toggles and presets" },
  { key: "runtime", label: "Triggers & models", desc: "trigger + llm/tts bindings" },
  { key: "avatar", label: "Avatar & activation", desc: "activation line + assets/voice" },
  { key: "review", label: "Review & export", desc: "JSON, SHA, policy, register" }
];

const aceTheme: CSSProperties = {
  "--ace-ink": "#132b25",
  "--ace-forest": "#1f6e5d",
  "--ace-mint": "#cfeee0",
  "--ace-sky": "#bfe6f1",
  "--ace-sun": "#f3c77a",
  "--ace-cream": "#f7f3eb",
  "--ace-panel": "#f5f1e8",
  "--ace-border": "#d8d2c6",
  "--ace-foam": "#ffffff"
};

const inputClass =
  "w-full rounded-2xl border border-[color:var(--ace-border)] bg-white/90 px-4 py-2 text-slate-900 shadow-sm focus:border-[color:var(--ace-forest)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ace-forest)]/20";
const inputMonoClass = `${inputClass} font-mono text-[12px]`;
const chipBaseClass =
  "rounded-full border px-3 py-1 text-xs font-semibold transition hover:border-[color:var(--ace-forest)]";
const sectionClass =
  "relative overflow-hidden border-[color:var(--ace-border)] bg-[linear-gradient(145deg,var(--ace-panel),#ffffff)]";

type Verdict = { verdict: string; severity?: string; rules?: { id: string; result: string; message?: string }[] } | null;

function bumpVersion(v: string) {
  const parts = v.split(".").map((p) => Number(p));
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    parts[2] += 1;
    return parts.join(".");
  }
  return v;
}

function parseJsonField<T>(raw: string, label: string, validator?: (value: unknown) => string | null) {
  if (!raw.trim()) return { value: undefined as T | undefined, error: null as string | null };
  try {
    const parsed = JSON.parse(raw);
    const error = validator ? validator(parsed) : null;
    if (error) return { value: undefined, error };
    return { value: parsed as T, error: null };
  } catch (err) {
    return { value: undefined, error: `${label} JSON invalid: ${(err as Error).message}` };
  }
}

export default function AceCreatePage() {
  const [id, setId] = useState("agent.story-weaver.001");
  const [name, setName] = useState("StoryWeaver");
  const [version, setVersion] = useState("0.1.0");
  const [description, setDescription] = useState("Generator + catalog agent for StorySphere previews");
  const [archetype, setArchetype] = useState("Oracle");
  const [capabilities, setCapabilities] = useState<AceAgentManifest["capabilities"]>(["generator", "catalog"]);
  const [runtimeImage, setRuntimeImage] = useState("illuvrse/agent-storyweaver:dev");
  const [trigger, setTrigger] = useState("event:job.requested");
  const [llmId, setLlmId] = useState("gpt-4o-mini");
  const [ttsId, setTtsId] = useState("eleven.v1");
  const [cpu, setCpu] = useState("500m");
  const [memory, setMemory] = useState("1Gi");
  const [publishLiveLoop, setPublishLiveLoop] = useState(false);
  const [avatarActivation, setAvatarActivation] = useState("Initialization complete. I'm ready to move with you.");
  const [avatarAssets, setAvatarAssets] = useState<string>("s3://avatars/demo");
  const [avatarVoiceUrl, setAvatarVoiceUrl] = useState<string>("https://cdn.example.com/voice-sample.wav");
  const [avatarProfileId, setAvatarProfileId] = useState<string>("");
  const [avatarTraits, setAvatarTraits] = useState<string[]>(["Curious", "Protective"]);
  const [toolsJson, setToolsJson] = useState<string>("");
  const [memoryJson, setMemoryJson] = useState<string>("");
  const [presenceJson, setPresenceJson] = useState<string>("");

  const [sha, setSha] = useState<string>("");
  const [manifestJson, setManifestJson] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<Verdict>(null);
  const [proof, setProof] = useState<any>(null);
  const [proofLatencyMs, setProofLatencyMs] = useState<number | null>(null);
  const [importJson, setImportJson] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [registerStatus, setRegisterStatus] = useState<string | null>(null);
  const [agentManagerSummary, setAgentManagerSummary] = useState<string | null>(null);
  const [registerBlockedReason, setRegisterBlockedReason] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingImport, setPendingImport] = useState<{ manifest: AceAgentManifest; summary: string[] } | null>(null);
  const [registeredOnce, setRegisteredOnce] = useState(false);
  const [playgroundNewTab, setPlaygroundNewTab] = useState(false);

  const toolsParsed = useMemo(
    () =>
      parseJsonField<AceAgentManifest["tools"]>(
        toolsJson,
        "Tools",
        (value) => (Array.isArray(value) ? null : "Tools must be a JSON array")
      ),
    [toolsJson]
  );
  const memoryParsed = useMemo(
    () =>
      parseJsonField<AceAgentManifest["memory"]>(
        memoryJson,
        "Memory",
        (value) => (value && typeof value === "object" && !Array.isArray(value) ? null : "Memory must be a JSON object")
      ),
    [memoryJson]
  );
  const presenceParsed = useMemo(
    () =>
      parseJsonField<AceAgentManifest["presence"]>(
        presenceJson,
        "Presence",
        (value) => (value && typeof value === "object" && !Array.isArray(value) ? null : "Presence must be a JSON object")
      ),
    [presenceJson]
  );

  const manifest: AceAgentManifest = useMemo(() => {
    const cpuValue = normalizeCpu(cpu);
    const memValue = normalizeMemory(memory);
    const triggerObj =
      trigger.startsWith("cron:") ?
        { type: "cron", cron: trigger.replace("cron:", "") } :
        trigger.startsWith("event:") ?
          { type: "event", event: trigger.replace("event:", "") } :
          { type: "http", path: trigger || "/hook/generate", method: "POST" };

    return {
      id,
      name,
      version,
      description,
      archetype,
      capabilities,
      triggers: [triggerObj as AceAgentManifest["triggers"][number]],
      modelBindings: {
        llm: { id: llmId, provider: "openai" },
        tts: { id: ttsId, voice: "calm", provider: "elevenlabs" }
      },
      permissions: {
        storage: { write: ["previews/", "final/"] },
        network: { outbound: true }
      },
      tools: toolsParsed.value,
      resources: { cpu: cpuValue, memory: memValue },
      memory: memoryParsed.value,
      presence: presenceParsed.value,
      runtime: { container: { image: runtimeImage } },
      metadata: { publishToLiveLoop: publishLiveLoop },
      avatar: {
        profileId: avatarProfileId || undefined,
        appearance: { assets: parseAvatarAssets(avatarAssets) },
        voice: { activationLine: avatarActivation, sampleUrl: avatarVoiceUrl || undefined },
        personality: { traits: avatarTraits, archetype }
      }
    };
  }, [
    id,
    name,
    version,
    description,
    archetype,
    capabilities,
    runtimeImage,
    trigger,
    llmId,
    ttsId,
    publishLiveLoop,
    avatarActivation,
    avatarAssets,
    avatarVoiceUrl,
    avatarProfileId,
    avatarTraits,
    toolsParsed.value,
    memoryParsed.value,
    presenceParsed.value
  ]);

  // Load draft from localStorage
  useEffect(() => {
    let hydrated = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        setId(draft.id ?? id);
        setName(draft.name ?? name);
        setVersion(draft.version ?? version);
        setDescription(draft.description ?? description);
        setArchetype(draft.archetype ?? archetype);
        setCapabilities(draft.capabilities ?? capabilities);
        setRuntimeImage(draft.runtimeImage ?? runtimeImage);
        setTrigger(draft.trigger ?? trigger);
        setLlmId(draft.llmId ?? llmId);
        setTtsId(draft.ttsId ?? ttsId);
        setCpu(draft.cpu ?? cpu);
        setMemory(draft.memory ?? memory);
        setPublishLiveLoop(Boolean(draft.publishLiveLoop));
        setAvatarActivation(draft.avatarActivation ?? avatarActivation);
        setAvatarAssets(draft.avatarAssets ?? avatarAssets);
        setAvatarVoiceUrl(draft.avatarVoiceUrl ?? avatarVoiceUrl);
        setAvatarProfileId(draft.avatarProfileId ?? avatarProfileId);
        setAvatarTraits(Array.isArray(draft.avatarTraits) ? draft.avatarTraits : avatarTraits);
        setToolsJson(draft.toolsJson ?? toolsJson);
        setMemoryJson(draft.memoryJson ?? memoryJson);
        setPresenceJson(draft.presenceJson ?? presenceJson);
        hydrated = true;
      }
    } catch {
      // ignore bad drafts
    }
    // If Playground manifest exists and no draft loaded, hydrate from it
    try {
      if (!hydrated) {
        const fromPlayground = localStorage.getItem(PLAYGROUND_KEY);
        if (fromPlayground) {
          const parsed = JSON.parse(fromPlayground);
          applyManifestFields(parsed);
          setCurrentStep(stageAnchors.findIndex((s) => s.key === "review"));
          showToast("Loaded manifest from Playground", "success");
          hydrated = true;
        }
      }
    } catch {
      // ignore
    }
    if (!hydrated) {
      fetch("/api/ace/handoff")
        .then((res) => res.json())
        .then((data) => {
          const manifest = data?.handoff?.manifest as AceAgentManifest | undefined;
          if (!manifest) return;
          applyManifestFields(manifest);
          setCurrentStep(stageAnchors.findIndex((s) => s.key === "review"));
          showToast("Loaded manifest from local handoff", "success");
        })
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load registered badge
  useEffect(() => {
    try {
      const flag = localStorage.getItem("ace-registered-flag");
      if (flag === "true") setRegisteredOnce(true);
    } catch {
      // ignore
    }
  }, []);

  // Load last proof snapshot
  useEffect(() => {
    try {
      const rawProof = localStorage.getItem(PROOF_KEY);
      if (rawProof) {
        const parsed = JSON.parse(rawProof);
        setProof(parsed.proof ?? parsed);
        setProofLatencyMs(parsed.latencyMs ?? null);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const next = { ...manifest, signing: undefined as never };
    const json = JSON.stringify(next, null, 2);
    setManifestJson(json);
    computeSha(json).then(setSha).catch(() => setSha(""));
    setError(null);
    // Autosave draft
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          id,
          name,
          version,
          description,
          archetype,
          capabilities,
          runtimeImage,
          trigger,
          llmId,
          ttsId,
          cpu,
          memory,
          publishLiveLoop,
          avatarActivation,
          avatarAssets,
          avatarVoiceUrl,
          avatarProfileId,
          avatarTraits,
          toolsJson,
          memoryJson,
          presenceJson
        })
      );
    } catch {
      // ignore
    }
  }, [manifest]);

  async function computeSha(json: string) {
    const data = new TextEncoder().encode(json);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function handleFileUpload(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      setImportJson(text);
      const parsed = JSON.parse(text);
      validateAceAgentManifest(parsed);
      setPendingImport({ manifest: parsed, summary: summarizeDiff(manifest, parsed) });
      setError(null);
      setUploadError(null);
    } catch (err) {
      setUploadError((err as Error).message);
    }
  }

  function toggleCapability(cap: AceAgentManifest["capabilities"][number]) {
    setCapabilities((prev) => (prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]));
  }

  function toggleTrait(trait: string) {
    setAvatarTraits((prev) => (prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]));
  }

  function normalizeAgentId(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-._]/g, "")
      .replace(/-+/g, "-")
      .replace(/\.+/g, ".");
  }

  function handleFormatId() {
    const base = id.trim() ? id : name;
    const normalized = normalizeAgentId(base);
    if (normalized) {
      setId(normalized);
      showToast("ID formatted", "success");
    } else {
      showToast("ID format failed", "error");
    }
  }

  function applyManifestFields(m: AceAgentManifest) {
    setId(m.id);
    setName(m.name);
    setVersion(m.version);
    setDescription(m.description ?? "");
    setArchetype(m.archetype ?? m.avatar?.personality?.archetype ?? archetype);
    setCapabilities(m.capabilities ?? []);
    setRuntimeImage(m.runtime?.container?.image ?? runtimeImage);
    const trig = m.triggers?.[0];
    if (trig?.type === "cron") setTrigger(`cron:${trig.cron}`);
    else if (trig?.type === "event") setTrigger(`event:${trig.event}`);
    else if (trig?.type === "http") setTrigger(trig.path);
    setLlmId(m.modelBindings?.llm?.id ?? llmId);
    setTtsId(m.modelBindings?.tts?.id ?? ttsId);
    setCpu(m.resources?.cpu ?? cpu);
    setMemory(m.resources?.memory ?? memory);
    setPublishLiveLoop(Boolean(m.metadata?.publishToLiveLoop));
    setAvatarActivation(m.avatar?.voice?.activationLine ?? avatarActivation);
    setAvatarAssets((m.avatar?.appearance?.assets ?? []).join(", "));
    setAvatarVoiceUrl(m.avatar?.voice?.sampleUrl ?? avatarVoiceUrl);
    setAvatarProfileId(m.avatar?.profileId ?? avatarProfileId);
    setAvatarTraits(
      Array.isArray(m.avatar?.personality?.traits) ? m.avatar?.personality?.traits : avatarTraits
    );
    setToolsJson(m.tools ? JSON.stringify(m.tools, null, 2) : "");
    setMemoryJson(m.memory ? JSON.stringify(m.memory, null, 2) : "");
    setPresenceJson(m.presence ? JSON.stringify(m.presence, null, 2) : "");
  }

  async function handleImport() {
    try {
      const parsed = JSON.parse(importJson);
      validateAceAgentManifest(parsed);
      setPendingImport({ manifest: parsed, summary: summarizeDiff(manifest, parsed) });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleDownload() {
    const blob = new Blob([manifestJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id || "ace-agent"}.manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copySha() {
    if (!sha) return;
    try {
      await navigator.clipboard.writeText(sha);
      showToast("SHA copied to clipboard", "success");
    } catch {
      showToast("Clipboard copy failed", "error");
    }
  }

  function applyPreset(preset: Partial<AceAgentManifest> & { name: string }) {
    applyManifestFields({
      ...manifest,
      ...preset,
      capabilities: preset.capabilities ?? manifest.capabilities,
      runtime: preset.runtime ?? manifest.runtime,
      triggers: preset.triggers ?? manifest.triggers,
      modelBindings: preset.modelBindings ?? manifest.modelBindings,
      permissions: preset.permissions ?? manifest.permissions
    });
  }

  function confirmPendingImport() {
    if (!pendingImport) return;
    applyManifestFields(pendingImport.manifest);
    setPendingImport(null);
    setError(null);
    showToast("Imported manifest applied", "success");
  }

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function persistProofSnapshot(latencyMs?: number, proofData?: any) {
    try {
      localStorage.setItem(PROOF_KEY, JSON.stringify({ proof: proofData ?? proof, latencyMs }));
    } catch {
      // ignore
    }
  }

  function stageErrors(stageKey: string) {
    const data: StageFormState = {
      id,
      name,
      version,
      description,
      capabilities,
      runtimeImage,
      trigger,
      llmId,
      ttsId,
      cpu,
      memory,
      avatarAssets,
      avatarVoiceUrl
    };
    return computeStageErrors(stageKey, data);
  }

  function scrollToStage(key: string) {
    const el = document.getElementById(key);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstError = el.querySelector(".field-error");
      if (firstError) {
        (firstError as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function validateStage(stageKey: string): boolean {
    const nextErrors = stageErrors(stageKey);
    setFieldErrors((prev) => {
      const merged = { ...prev };
      // clear stage-specific keys before merging
      ["id", "name", "version", "runtimeImage", "capabilities", "trigger", "llmId", "ttsId", "cpu", "memory", "avatarAssets", "avatarVoiceUrl"].forEach((k) => {
        if (nextErrors[k]) merged[k] = nextErrors[k];
        else if (stageKey === "identity" && (k === "id" || k === "name" || k === "version" || k === "runtimeImage")) delete merged[k];
        else if (stageKey === "capabilities" && k === "capabilities") delete merged[k];
        else if (stageKey === "runtime" && (k === "trigger" || k === "llmId" || k === "ttsId" || k === "cpu" || k === "memory")) delete merged[k];
        else if (stageKey === "avatar" && (k === "avatarAssets" || k === "avatarVoiceUrl")) delete merged[k];
      });
      return merged;
    });
    return Object.keys(nextErrors).length === 0;
  }

  function stageIsValid(stageKey: string) {
    const data: StageFormState = {
      id,
      name,
      version,
      description,
      capabilities,
      runtimeImage,
      trigger,
      llmId,
      ttsId,
      cpu,
      memory,
      avatarAssets,
      avatarVoiceUrl
    };
    return stageComplete(stageKey, data);
  }

  function goToStep(nextIndex: number) {
    if (nextIndex === currentStep) return;
    if (nextIndex > currentStep) {
      for (let i = currentStep; i < nextIndex; i++) {
        const valid = validateStage(stageAnchors[i].key);
        if (!valid) {
          setCurrentStep(i);
          return;
        }
      }
    }
    setCurrentStep(nextIndex);
    scrollToStage(stageAnchors[nextIndex].key);
  }

  function goNext() {
    const ok = validateStage(stageAnchors[currentStep].key);
    if (!ok) return;
    if (currentStep < stageAnchors.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      scrollToStage(stageAnchors[next].key);
    }
  }

  function goPrev() {
    if (currentStep === 0) return;
    const prev = currentStep - 1;
    setCurrentStep(prev);
    scrollToStage(stageAnchors[prev].key);
  }

  function duplicateAsNewAgent() {
    setId((prev) => `${prev}-copy`);
    setVersion((prev) => bumpVersion(prev));
    showToast("Duplicated as new agent id with bumped version", "success");
  }

  async function sendToPlayground() {
    let diffSummary: string[] = [];
    try {
      const existingRaw = localStorage.getItem(PLAYGROUND_KEY);
      if (existingRaw) {
        const existing = JSON.parse(existingRaw) as AceAgentManifest;
        diffSummary = summarizeDiff(existing, manifest);
      }
    } catch {
      diffSummary = [];
    }
    try {
      localStorage.setItem(PLAYGROUND_KEY, manifestJson);
    } catch {
      showToast("Failed to write manifest to localStorage", "error");
      return;
    }
    document.cookie = `${PLAYGROUND_KEY}=${encodeURIComponent(manifestJson)}; path=/; max-age=600`;
    let registryNote = "";
    try {
      const res = await fetch("/api/ace/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifest, source: "ace", setHandoff: true })
      });
      if (!res.ok) {
        registryNote = " · registry sync failed";
      } else {
        registryNote = " · synced to registry";
      }
    } catch {
      registryNote = " · registry sync failed";
    }
    const payloadBytes = new TextEncoder().encode(manifestJson).length;
    const diffNote = diffSummary.length ? ` · Diff: ${diffSummary.slice(0, 2).join("; ")}` : "";
    showToast(`Sent to Playground (${payloadBytes} bytes stored)${diffNote}${registryNote}`, "success");
    if (playgroundNewTab) {
      window.open("/playground?source=ace", "_blank");
    } else {
      window.location.href = "/playground?source=ace";
    }
  }

  async function registerWithAgentManager() {
    setRegisterStatus("Registering…");
    setRegisterBlockedReason(null);
    try {
      validateAceAgentManifest(manifest);
    } catch (err) {
      setRegisterStatus(`Validation failed: ${(err as Error).message}`);
      showToast(`Validation failed: ${(err as Error).message}`, "error");
      return;
    }

    if (policy && policy.severity && policy.severity !== "low") {
      setRegisterBlockedReason(`Blocked by policy severity: ${policy.severity}. Resolve Sentinel findings before registering.`);
      setRegisterStatus(null);
      showToast(`Register blocked: ${policy.severity} severity`, "error");
      return;
    }

    if (!manifest.triggers?.length) {
      setRegisterBlockedReason("Add at least one trigger before registering.");
      setRegisterStatus(null);
      showToast("Trigger required before register", "error");
      return;
    }
    if (!manifest.permissions?.storage?.write?.length) {
      setRegisterBlockedReason("Add storage permissions before registering.");
      setRegisterStatus(null);
      showToast("Storage permission required", "error");
      return;
    }

    try {
      const start = performance.now();
      const signRes = await fetch("/api/kernel/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sha256: sha, manifest })
      });
      if (!signRes.ok) {
        let msg = `Kernel sign failed (${signRes.status})`;
        try {
          const errJson = await signRes.json();
          msg = errJson.error ?? msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      const signed = await signRes.json();
      const latencyMs = Math.round(performance.now() - start);
      setProofLatencyMs(latencyMs);
      if (signed?.signature) {
        setProof(signed);
        persistProofSnapshot(latencyMs, signed);
      }

      const client = new AgentManagerClient("http://localhost:4040");
      await client.register({ ...manifest, signing: { proof: signed } } as unknown as Record<string, unknown>);
      const agents = await client.listAgents();
      setAgentManagerSummary(`Registered. Agents: ${agents.agents.length}`);
      setRegisterStatus("Registered with AgentManager");
      setRegisteredOnce(true);
      try {
        localStorage.setItem("ace-registered-flag", "true");
      } catch {
        // ignore
      }
      showToast("Registered with Agent Manager", "success");
    } catch (err) {
      setRegisterStatus(`Failed: ${(err as Error).message}`);
      showToast((err as Error).message, "error");
      // simple retry/backoff once
      setTimeout(async () => {
        try {
          const client = new AgentManagerClient("http://localhost:4040");
          await client.register({ ...manifest, signing: { proof } } as unknown as Record<string, unknown>);
          const agents = await client.listAgents();
          setAgentManagerSummary(`Registered on retry. Agents: ${agents.agents.length}`);
          setRegisterStatus("Registered with AgentManager");
          setRegisteredOnce(true);
          showToast("Registered on retry", "success");
        } catch {
          // keep failure state
        }
      }, 1200);
    }
  }

  async function validateAndCheck() {
    const nextErrors: Record<string, string> = {};
    if (!id.trim()) nextErrors.id = "Required";
    else if (!idPattern.test(id.trim())) nextErrors.id = "Use lowercase letters, numbers, dots, underscores, or hyphens";
    if (!name.trim()) nextErrors.name = "Required";
    if (!version.trim()) nextErrors.version = "Required";
    if (!runtimeImage.trim()) nextErrors.runtimeImage = "Required";
    if (!capabilities.length) nextErrors.capabilities = "Pick at least one capability";
    if (!trigger.trim()) nextErrors.trigger = "Required";
    if (!llmId.trim()) nextErrors.llmId = "Required";
    if (!ttsId.trim()) nextErrors.ttsId = "Required";
    if (!cpu.trim()) nextErrors.cpu = "Required";
    if (!memory.trim()) nextErrors.memory = "Required";
    const avatarErrors = validateAvatarFields(avatarAssets, avatarVoiceUrl);
    Object.assign(nextErrors, avatarErrors);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      validateAceAgentManifest(manifest);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      return;
    }

    // Advance to Review step after successful validation
    setCurrentStep(stageAnchors.findIndex((s) => s.key === "review"));
    scrollToStage("review");

    try {
      const policyRes = await fetch("/api/sentinel/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifest })
      });
      setPolicy(policyRes.ok ? await policyRes.json() : null);
    } catch {
      setPolicy(null);
    }

    try {
      const proofRes = await fetch("/api/kernel/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sha256: sha, signature: "stub-signature" })
      });
      const proofData = proofRes.ok ? await proofRes.json() : null;
      setProof(proofData);
      if (proofData) persistProofSnapshot(proofLatencyMs ?? undefined, proofData);
    } catch {
      setProof(null);
    }
  }

  const completedStages = stageAnchors.filter((stage) => stageIsValid(stage.key)).length;
  const progressPercent = Math.round((completedStages / stageAnchors.length) * 100);
  const capabilitiesStepIndex = Math.max(
    0,
    stageAnchors.findIndex((stage) => stage.key === "capabilities")
  );

  return (
    <div className="space-y-10" style={aceTheme}>
      {toast && (
        <div
          className={`fixed right-6 top-6 z-40 rounded-xl border px-4 py-3 text-sm shadow-card ${toast.type === "success" ? "border-teal-200 bg-white text-teal-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}
        >
          {toast.message}
        </div>
      )}
      <section className="relative overflow-hidden rounded-[36px] border border-[color:var(--ace-border)] bg-[linear-gradient(135deg,var(--ace-cream),#ffffff)] px-8 py-10 shadow-card">
        <div className="pointer-events-none absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--ace-sky),transparent_70%)] opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,var(--ace-mint),transparent_70%)] opacity-80 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-6 h-10 w-10 -translate-x-1/2 rotate-45 rounded-[6px] border border-[color:var(--ace-sun)]/70 bg-[color:var(--ace-sun)]/30" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            <Pill className="bg-teal-50 text-teal-700">ACE Creation Wizard</Pill>
            <h1 className="text-4xl font-semibold leading-tight text-[color:var(--ace-ink)] animate-rise">
              Build your agent persona, sign it, and send it live.
            </h1>
            <p className="text-lg text-slate-700 animate-rise animate-rise-delay-1">
              A playful creation zone for ID, capabilities, runtime, and avatar activation, with
              live JSON, SHA-256, policy checks, and instant handoff to Playground.
            </p>
            <div className="rounded-2xl border border-[color:var(--ace-border)] bg-white/80 p-4 shadow-sm animate-rise animate-rise-delay-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>Build progress</span>
                <span>
                  {completedStages}/{stageAnchors.length} stages
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[color:var(--ace-mint)]/70">
                <div
                  className="h-2 rounded-full bg-[linear-gradient(90deg,var(--ace-forest),var(--ace-sun))]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">Autosave ON</span>
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                  SHA {sha ? `${sha.slice(0, 8)}…` : "computing"}
                </span>
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                  Policy {policy?.verdict ?? "not run"}
                </span>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={playgroundNewTab}
                onChange={(e) => setPlaygroundNewTab(e.target.checked)}
              />
              Open Playground in new tab (keep wizard open)
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={validateAndCheck}
                className="rounded-full bg-[color:var(--ace-forest)] px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:opacity-90"
              >
                Validate & Run Checks
              </button>
              <button
                type="button"
                onClick={sendToPlayground}
                className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[color:var(--ace-forest)] hover:text-[color:var(--ace-forest)]"
              >
                Send to Playground
              </button>
              <button
                type="button"
                onClick={registerWithAgentManager}
                className="rounded-full border border-[color:var(--ace-forest)]/70 bg-white/80 px-5 py-3 text-sm font-semibold text-[color:var(--ace-forest)] transition hover:bg-[color:var(--ace-mint)]"
              >
                Register with AgentManager
              </button>
              <button
                type="button"
                onClick={duplicateAsNewAgent}
                className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[color:var(--ace-forest)]"
              >
                Duplicate as new agent
              </button>
              <button
                type="button"
                onClick={() => goToStep(capabilitiesStepIndex)}
                className="rounded-full border border-[color:var(--ace-border)] bg-[color:var(--ace-mint)]/60 px-4 py-2 text-xs font-semibold text-[color:var(--ace-forest)] transition hover:border-[color:var(--ace-forest)]"
              >
                Jump to presets
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              {registerStatus && <span className="rounded-full bg-white px-3 py-1 shadow-sm">{registerStatus}</span>}
              {registerBlockedReason && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 shadow-sm">
                  {registerBlockedReason}
                </span>
              )}
              {agentManagerSummary && (
                <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-800 shadow-sm">
                  {agentManagerSummary}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-[color:var(--ace-border)] bg-white/90 p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,var(--ace-sun),transparent_60%),radial-gradient(circle_at_70%_80%,var(--ace-sky),transparent_60%)] shadow-inner">
                    <div className="absolute -top-2 right-3 h-4 w-4 rotate-45 rounded-sm bg-[color:var(--ace-sun)] shadow-sm" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Agent</div>
                    <div className="text-xl font-semibold text-[color:var(--ace-ink)]">
                      {name || "Untitled Agent"}
                    </div>
                    <div className="text-xs text-slate-600">{id || "agent.placeholder"}</div>
                  </div>
                </div>
                <span className="rounded-full border border-[color:var(--ace-forest)]/40 bg-[color:var(--ace-mint)] px-3 py-1 text-xs font-semibold text-[color:var(--ace-forest)]">
                  {archetype}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {avatarTraits.length ? (
                  avatarTraits.map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full border border-[color:var(--ace-border)] bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {trait}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                    Add traits to define the vibe.
                  </span>
                )}
              </div>
              <div className="mt-3 rounded-2xl bg-[color:var(--ace-panel)] p-3 text-xs text-slate-700">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Activation line
                </div>
                <div className="mt-1 text-sm text-slate-800">
                  {avatarActivation || "No activation line set"}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                  {capabilities.length ? `${capabilities.length} capabilities` : "No capabilities"}
                </span>
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                  {publishLiveLoop ? "LiveLoop ready" : "LiveLoop off"}
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--ace-border)] bg-white/90 p-5 shadow-card">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Proof snapshot</div>
              <div className="mt-3">
                <ProofCard
                  sha={proof?.sha256 ?? sha}
                  signer={proof?.signer ?? "kernel-multisig"}
                  timestamp={proof?.timestamp ?? "pending"}
                  ledgerLink={proof?.ledgerUrl}
                  policyVerdict={proof?.policyVerdict ?? policy?.verdict}
                  error={!proof && !sha ? "No proof yet" : undefined}
                />
              </div>
              {registeredOnce && (
                <div className="mt-2 text-[11px] text-teal-800">
                  Registered badge: last register succeeded.
                </div>
              )}
            </div>
          </div>
        </div>
        {policy && policy.severity && policy.severity !== "low" ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Policy severity: {policy.severity}. Review rules and trim permissions if possible.
          </div>
        ) : null}
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {stageAnchors.map((stage, idx) => (
            <a
              key={stage.key}
              href={`#${stage.key}`}
              onClick={() => goToStep(idx)}
              aria-current={currentStep === idx ? "step" : undefined}
              className={`flex cursor-pointer items-start gap-3 rounded-3xl border px-4 py-4 transition ${
                currentStep === idx
                  ? "border-[color:var(--ace-forest)]/70 bg-[color:var(--ace-mint)]/60 shadow-sm"
                  : "border-[color:var(--ace-border)] bg-white/80 hover:border-[color:var(--ace-forest)]/60"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${
                  currentStep === idx ? "bg-[color:var(--ace-forest)] text-white" : "bg-white text-[color:var(--ace-forest)]"
                }`}
              >
                {idx + 1}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <span>{stage.label}</span>
                  {stageIsValid(stage.key) ? (
                    <span className="rounded-full bg-white px-2 py-[2px] text-[11px] font-semibold text-teal-700">
                      Complete
                    </span>
                  ) : (
                    <span className="rounded-full bg-rose-100 px-2 py-[2px] text-[11px] font-semibold text-rose-700">
                      Incomplete
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-700">{stage.desc}</div>
              </div>
            </a>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[color:var(--ace-forest)] hover:text-[color:var(--ace-forest)] disabled:opacity-40"
            disabled={currentStep === 0}
          >
            Previous step
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-[color:var(--ace-forest)] px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:opacity-90 disabled:opacity-40"
            disabled={currentStep === stageAnchors.length - 1 || !stageIsValid(stageAnchors[currentStep].key)}
          >
            Next step
          </button>
        </div>
      </section>

      <PageSection eyebrow="Identity" title="Basics" id="identity" className={sectionClass}>
        <Card
          title="Identity"
          className="border-[color:var(--ace-border)] bg-white/90"
          body={
            <div className="space-y-3 text-sm">
              <label className="space-y-1 block">
                <div className="text-slate-800/80">Agent ID</div>
                <div className="flex flex-wrap gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleFormatId}
                    className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[color:var(--ace-forest)]"
                  >
                    Auto-format
                  </button>
                </div>
                {fieldErrors.id && <div className="field-error text-xs text-rose-600">{fieldErrors.id}</div>}
                <div className="text-[11px] text-slate-500">
                  Allowed: lowercase letters, numbers, dots, underscores, hyphens.
                </div>
              </label>
              <label className="space-y-1 block">
                <div className="text-slate-800/80">Name</div>
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
                {fieldErrors.name && <div className="field-error text-xs text-rose-600">{fieldErrors.name}</div>}
              </label>
              <div className="flex gap-3">
                <label className="space-y-1 flex-1">
                  <div className="text-slate-800/80">Version</div>
                  <input className={inputClass} value={version} onChange={(e) => setVersion(e.target.value)} />
                  {fieldErrors.version && <div className="field-error text-xs text-rose-600">{fieldErrors.version}</div>}
                </label>
                <label className="space-y-1 flex-1">
                  <div className="text-slate-800/80">Runtime image</div>
                  <select
                    className={inputClass}
                    value={runtimeImage}
                    onChange={(e) => setRuntimeImage(e.target.value)}
                  >
                    {[runtimeImage, ...runtimeImages.filter((img) => img !== runtimeImage)]?.map((img) => (
                      <option key={img} value={img}>
                        {img}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.runtimeImage && <div className="field-error text-xs text-rose-600">{fieldErrors.runtimeImage}</div>}
                </label>
              </div>
              <label className="space-y-1 block">
                <div className="text-slate-800/80">Description</div>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <div className="rounded-2xl border border-[color:var(--ace-border)] bg-[color:var(--ace-panel)] p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Archetype</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {archetypeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setArchetype(option)}
                      className={`${chipBaseClass} ${
                        archetype === option
                          ? "border-[color:var(--ace-forest)] bg-[color:var(--ace-forest)] text-white"
                          : "border-[color:var(--ace-border)] bg-white/80 text-slate-700"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Personality and operator role baseline for this agent.
                </div>
              </div>
            </div>
          }
        />
      </PageSection>

      <PageSection
        eyebrow="Capabilities"
        title="Pick what this agent can do"
        id="capabilities"
        className={sectionClass}
      >
        <Card
            title="Capabilities"
            className="border-[color:var(--ace-border)] bg-white/90"
            body={
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {allCapabilities.map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => toggleCapability(cap)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition ${
                        capabilities.includes(cap)
                          ? "border-[color:var(--ace-forest)] bg-[color:var(--ace-mint)] text-[color:var(--ace-forest)]"
                          : "border-[color:var(--ace-border)] bg-white/80 text-slate-700"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          capabilities.includes(cap)
                            ? "bg-[color:var(--ace-sun)]"
                            : "bg-[color:var(--ace-border)]"
                        }`}
                      />
                      <span className="capitalize">{cap}</span>
                    </button>
                  ))}
                </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCapabilities([...allCapabilities])}
                  className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-[color:var(--ace-forest)]"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setCapabilities([])}
                  className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-[color:var(--ace-forest)]"
                >
                  Clear
                </button>
              </div>
              {fieldErrors.capabilities && <div className="text-xs text-rose-600">{fieldErrors.capabilities}</div>}
              <div className="rounded-2xl border border-[color:var(--ace-border)] bg-[color:var(--ace-panel)] p-4">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Presets</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      name: "Generator",
                      capabilities: ["generator"],
                      triggers: [{ type: "event", event: "job.requested" }],
                      runtime: { container: { image: "illuvrse/agent-generator:dev" } },
                      modelBindings: { llm: { id: "gpt-4o-mini", provider: "openai" }, tts: { id: "eleven.v1", voice: "calm", provider: "elevenlabs" } }
                    },
                    {
                      name: "Catalog",
                      capabilities: ["catalog"],
                      triggers: [{ type: "event", event: "asset.uploaded" }],
                      runtime: { container: { image: "illuvrse/agent-catalog:dev" } },
                      modelBindings: { llm: { id: "gpt-4o-mini", provider: "openai" }, tts: { id: "eleven.v1", voice: "calm", provider: "elevenlabs" } }
                    },
                    {
                      name: "Scheduler",
                      capabilities: ["scheduler", "liveloop"],
                      triggers: [{ type: "cron", cron: "*/30 * * * *" }],
                      runtime: { container: { image: "illuvrse/agent-scheduler:dev" } },
                      modelBindings: { llm: { id: "gpt-4o", provider: "openai" }, tts: { id: "eleven.v1", voice: "calm", provider: "elevenlabs" } }
                    },
                    {
                      name: "Proof",
                      capabilities: ["proof"],
                      triggers: [{ type: "event", event: "asset.ready" }],
                      runtime: { container: { image: "illuvrse/agent-proof:dev" } },
                      modelBindings: { llm: { id: "gpt-4o-mini", provider: "openai" }, tts: { id: "eleven.v1", voice: "calm", provider: "elevenlabs" } }
                    },
                    {
                      name: "LiveLoop publisher",
                      capabilities: ["generator", "liveloop"],
                      triggers: [{ type: "event", event: "liveloop.publish" }],
                      runtime: { container: { image: "illuvrse/agent-liveloop:dev" } },
                      modelBindings: { llm: { id: "gpt-4o", provider: "openai" }, tts: { id: "azure.neural", voice: "warm", provider: "azure" } },
                      metadata: { publishToLiveLoop: true }
                    }
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset as AceAgentManifest)}
                      className={`${chipBaseClass} border-[color:var(--ace-border)] bg-white/80 text-slate-700`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          }
        />
      </PageSection>

      <PageSection
        eyebrow="Runtime/Models"
        title="Triggers, model bindings, and LiveLoop"
        id="runtime"
        className={sectionClass}
      >
        <Card
          title="Runtime & bindings"
          className="border-[color:var(--ace-border)] bg-white/90"
          body={
            <div className="space-y-3 text-sm">
              <label className="space-y-1 block">
                <div className="text-slate-800/80">Trigger (cron:*, event:*, or path)</div>
                <input className={inputClass} value={trigger} onChange={(e) => setTrigger(e.target.value)} />
                {fieldErrors.trigger && <div className="text-xs text-rose-600">{fieldErrors.trigger}</div>}
                <div className="text-[11px] text-slate-500">Examples: cron:*/5 * * * * · event:job.requested · /hook/generate</div>
              </label>
              <div className="flex flex-wrap gap-2 text-[12px] text-slate-600">
                {["event:job.requested", "event:asset.uploaded", "cron:*/30 * * * *", "/hook/generate"].map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTrigger(value)}
                      className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-[color:var(--ace-forest)]"
                    >
                      {value}
                    </button>
                  )
                )}
              </div>
              <div className="flex gap-3">
                <label className="space-y-1 flex-1">
                  <div className="text-slate-800/80">LLM ID</div>
                  <select
                    className={inputClass}
                    value={llmId}
                    onChange={(e) => setLlmId(e.target.value)}
                  >
                    {llmOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.llmId && <div className="text-xs text-rose-600">{fieldErrors.llmId}</div>}
                </label>
                <label className="space-y-1 flex-1">
                  <div className="text-slate-800/80">TTS ID</div>
                  <select
                    className={inputClass}
                    value={ttsId}
                    onChange={(e) => setTtsId(e.target.value)}
                  >
                    {ttsOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.ttsId && <div className="text-xs text-rose-600">{fieldErrors.ttsId}</div>}
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 block">
                  <div className="text-slate-800/80">CPU</div>
                  <input
                    className={inputClass}
                    value={cpu}
                    onChange={(e) => setCpu(e.target.value)}
                    onBlur={(e) => setCpu(normalizeCpu(e.target.value))}
                    placeholder="500m"
                  />
                  {fieldErrors.cpu && <div className="text-xs text-rose-600">{fieldErrors.cpu}</div>}
                  <div className="text-[11px] text-slate-400">Use Kubernetes units (e.g., 500m, 1 for full core).</div>
                </label>
                <label className="space-y-1 block">
                  <div className="text-slate-800/80">Memory</div>
                  <input
                    className={inputClass}
                    value={memory}
                    onChange={(e) => setMemory(e.target.value)}
                    onBlur={(e) => setMemory(normalizeMemory(e.target.value))}
                    placeholder="1Gi"
                  />
                  {fieldErrors.memory && <div className="text-xs text-rose-600">{fieldErrors.memory}</div>}
                  <div className="text-[11px] text-slate-400">Examples: 512Mi, 1Gi.</div>
                </label>
              </div>
              <div className="flex flex-wrap gap-2 text-[12px] text-slate-600">
                {resourcePresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-3 py-1 text-slate-700 transition hover:border-[color:var(--ace-forest)]"
                    onClick={() => {
                      setCpu(preset.cpu);
                      setMemory(preset.memory);
                      showToast(`${preset.name} resources applied (${preset.cpu}, ${preset.memory})`, "success");
                    }}
                  >
                    {preset.name}: {preset.cpu}/{preset.memory}
                  </button>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={publishLiveLoop} onChange={(e) => setPublishLiveLoop(e.target.checked)} />
                Publish to LiveLoop
              </label>
              <div className="text-xs text-slate-500">
                Need syntax?{" "}
                <a
                  href="/developers#ace-spec"
                  className="text-[color:var(--ace-forest)] underline underline-offset-4"
                >
                  ACE spec docs
                </a>
              </div>
            </div>
          }
        />
      </PageSection>

      <PageSection eyebrow="Avatar" title="Voice & activation" id="avatar" className={sectionClass}>
        <Card
          title="Activation & assets"
          className="border-[color:var(--ace-border)] bg-white/90"
          body={
            <div className="space-y-3 text-sm">
              <label className="space-y-1 block">
                <div className="text-slate-700">Activation line</div>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={avatarActivation}
                  onChange={(e) => setAvatarActivation(e.target.value)}
                />
              </label>
              <div className="rounded-2xl border border-[color:var(--ace-border)] bg-[color:var(--ace-panel)] p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Traits</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {traitOptions.map((trait) => (
                    <button
                      key={trait}
                      type="button"
                      onClick={() => toggleTrait(trait)}
                      className={`${chipBaseClass} ${
                        avatarTraits.includes(trait)
                          ? "border-[color:var(--ace-forest)] bg-[color:var(--ace-forest)] text-white"
                          : "border-[color:var(--ace-border)] bg-white/80 text-slate-700"
                      }`}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Pick 2-4 traits to flavor personality metadata.
                </div>
              </div>
              <label className="space-y-1 block">
                <div className="text-slate-700">Appearance assets (comma-separated URLs)</div>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={avatarAssets}
                  onChange={(e) => setAvatarAssets(e.target.value)}
                  placeholder="s3://avatars/demo1, https://cdn.example.com/avatar2.png"
                />
                {fieldErrors.avatarAssets && <div className="field-error text-xs text-rose-600">{fieldErrors.avatarAssets}</div>}
                <button
                  type="button"
                  className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-3 py-1 text-[12px] font-semibold text-slate-700 transition hover:border-[color:var(--ace-forest)]"
                  onClick={() => {
                    setAvatarAssets(
                      avatarAssets
                        .split(/[\n,]/)
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .join(", ")
                    );
                  }}
                >
                  Split lines into asset list
                </button>
              </label>
              <label className="space-y-1 block">
                <div className="text-slate-700">Voice sample URL</div>
                <input
                  className={inputClass}
                  value={avatarVoiceUrl}
                  onChange={(e) => setAvatarVoiceUrl(e.target.value)}
                />
                {fieldErrors.avatarVoiceUrl && <div className="field-error text-xs text-rose-600">{fieldErrors.avatarVoiceUrl}</div>}
              </label>
              <label className="space-y-1 block">
                <div className="text-slate-700">Avatar profile ID (registry)</div>
                <input
                  className={inputClass}
                  value={avatarProfileId}
                  onChange={(e) => setAvatarProfileId(e.target.value)}
                  placeholder="avatar.ops.001"
                />
              </label>
              <div className="rounded-2xl border border-[color:var(--ace-border)] bg-[color:var(--ace-panel)] p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Preview</div>
                <div className="text-sm text-slate-900">{avatarActivation || "No activation line set"}</div>
                <div className="mt-2 text-xs text-slate-600">
                  <div>Assets: {avatarAssets || "none"}</div>
                  <div className="flex items-center gap-2">
                    <span>Voice sample: {avatarVoiceUrl || "none"}</span>
                    {avatarVoiceUrl ? (
                      <audio controls className="h-8">
                        <source src={avatarVoiceUrl} />
                      </audio>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </PageSection>

      <PageSection eyebrow="Review" title="Manifest, hash, and proofs" id="review" className={sectionClass}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            title="Manifest JSON"
            className="border-[color:var(--ace-border)] bg-white/90"
            body={
              <pre className="max-h-96 overflow-auto rounded-2xl bg-[color:var(--ace-panel)] p-3 text-[12px] leading-relaxed text-slate-900">
                {manifestJson}
              </pre>
            }
          />
          <Card
            title="Agent OS config"
            className="border-[color:var(--ace-border)] bg-white/90"
            body={
              <div className="space-y-3 text-sm">
                <label className="space-y-1 block">
                  <div className="text-slate-700">Tools (JSON array)</div>
                  <textarea
                    className={inputMonoClass}
                    rows={4}
                    value={toolsJson}
                    onChange={(e) => setToolsJson(e.target.value)}
                    placeholder='[{"id":"tool.generate","actions":["generate.preview"]}]'
                  />
                  {toolsParsed.error ? <div className="text-xs text-rose-600">{toolsParsed.error}</div> : null}
                </label>
                <label className="space-y-1 block">
                  <div className="text-slate-700">Memory policy (JSON object)</div>
                  <textarea
                    className={inputMonoClass}
                    rows={4}
                    value={memoryJson}
                    onChange={(e) => setMemoryJson(e.target.value)}
                    placeholder='{"shortTerm":{"ttlDays":7,"maxEntries":200},"longTerm":{"enabled":true,"vectorStore":"pgvector"}}'
                  />
                  {memoryParsed.error ? <div className="text-xs text-rose-600">{memoryParsed.error}</div> : null}
                </label>
                <label className="space-y-1 block">
                  <div className="text-slate-700">Presence (JSON object)</div>
                  <textarea
                    className={inputMonoClass}
                    rows={3}
                    value={presenceJson}
                    onChange={(e) => setPresenceJson(e.target.value)}
                    placeholder='{"realm":"illuvrse","room":"ops","priority":"normal"}'
                  />
                  {presenceParsed.error ? <div className="text-xs text-rose-600">{presenceParsed.error}</div> : null}
                </label>
              </div>
            }
          />
          <Card
            title="Hash & actions"
            className="border-[color:var(--ace-border)] bg-white/90"
            body={
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">SHA-256</div>
                  <div className="break-all font-mono text-[12px] text-slate-900">{sha || "computing..."}</div>
                </div>
                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-2 text-rose-700">
                    {error}
                  </div>
                ) : (
                  <div className="text-[color:var(--ace-forest)]">Valid manifest</div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[color:var(--ace-forest)]"
                  >
                    Download JSON
                  </button>
                  <button
                    type="button"
                    onClick={copySha}
                    className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[color:var(--ace-forest)]"
                  >
                    Copy SHA
                  </button>
                  <button
                    type="button"
                    onClick={sendToPlayground}
                    className="rounded-full bg-[color:var(--ace-forest)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                  >
                    Send to Playground
                  </button>
                  <button
                    type="button"
                    onClick={validateAndCheck}
                    className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[color:var(--ace-forest)]"
                  >
                    Validate & Run Checks
                  </button>
                </div>
              </div>
            }
          />
          <Card
            title="Policy & signature"
            className="border-[color:var(--ace-border)] bg-white/90"
            body={
              <div className="space-y-3 text-sm">
                <ProofCard
                  sha={proof?.sha256 ?? sha}
                  signer={proof?.signer ?? "kernel-multisig"}
                  timestamp={proof?.timestamp ?? "pending"}
                  ledgerLink={proof?.ledgerUrl}
                  policyVerdict={proof?.policyVerdict ?? policy?.verdict}
                  error={!proof && !sha ? "No proof yet" : undefined}
                />
                {proofLatencyMs ? <div className="text-[11px] text-slate-400">Kernel sign latency: {proofLatencyMs} ms</div> : null}
                {policy ? (
                  <div className="rounded-2xl border border-[color:var(--ace-border)] bg-[color:var(--ace-panel)] p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Policy</div>
                    <div className="text-slate-900">{policy.verdict}</div>
                    <div className="text-xs text-slate-500">Severity: {policy.severity ?? "n/a"}</div>
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      {policy.rules?.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-2">
                          <span>{r.id}</span>
                          <span className="font-semibold text-[color:var(--ace-forest)]">{r.result}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 text-xs text-slate-500">
                      Need guidance?{" "}
                      <a
                        href="/developers#api"
                        className="text-[color:var(--ace-forest)] underline underline-offset-4"
                      >
                        See API & policy docs
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">Run checks to see policy verdict and proof.</div>
                )}
              </div>
            }
          />
        </div>
        {/* @ts-expect-error Client Component */}
        <HandoffDiff current={manifest} storageKey={PLAYGROUND_KEY} />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card
            title="Stage summary"
            className="border-[color:var(--ace-border)] bg-white/90"
            body={
              <div className="space-y-2 text-sm">
                {stageAnchors.map((stage) => (
                  <div
                    key={stage.key}
                    className="flex items-center justify-between rounded-2xl border border-[color:var(--ace-border)] bg-white/80 px-3 py-2"
                  >
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{stage.label}</div>
                      <div className="text-[12px] text-slate-600">{stage.desc}</div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        stageIsValid(stage.key)
                          ? "bg-[color:var(--ace-mint)] text-[color:var(--ace-forest)]"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {stageIsValid(stage.key) ? "Complete" : "Incomplete"}
                    </span>
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </PageSection>

      <PageSection
        eyebrow="Import/Export"
        title="Load or paste a manifest"
        id="import"
        className={sectionClass}
      >
        <Card
          title="Paste JSON and validate"
          className="border-[color:var(--ace-border)] bg-white/90"
          body={
            <div className="space-y-3 text-sm">
              <textarea
                className={`${inputMonoClass} leading-relaxed`}
                rows={6}
                placeholder='{"id":"agent.demo","name":"Demo","version":"0.1","capabilities":["generator"],"runtime":{"container":{"image":"img"}}}'
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
              />
              <div>
                <label className="text-xs text-slate-600">
                  Upload manifest file:
                  <input
                    type="file"
                    accept="application/json"
                    className="mt-1 block text-xs text-slate-700"
                    onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
                  />
                </label>
                {uploadError && <div className="text-xs text-rose-600">{uploadError}</div>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleImport}
                  className="rounded-full bg-[color:var(--ace-forest)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Load into wizard
                </button>
                <button
                  type="button"
                  onClick={() => setImportJson("")}
                  className="rounded-full border border-[color:var(--ace-border)] bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[color:var(--ace-forest)]"
                >
                  Clear
                </button>
              </div>
              {pendingImport ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <div className="font-semibold text-amber-900">Confirm import?</div>
                  <ul className="mt-2 space-y-1">
                    {pendingImport.summary.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={confirmPendingImport}
                      className="rounded-full bg-amber-400 px-3 py-2 text-[12px] font-semibold text-slate-900 transition hover:opacity-90"
                    >
                      Apply import
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingImport(null)}
                      className="rounded-full border border-amber-400/60 px-3 py-2 text-[12px] font-semibold text-amber-700 transition hover:border-amber-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
              <p className="text-xs text-slate-600">
                {`On load, fields populate and validation run automatically. Drafts autosave to localStorage key "${STORAGE_KEY}", Playground handoff uses "${PLAYGROUND_KEY}".`}
              </p>
            </div>
          }
        />
      </PageSection>
    </div>
  );
}
