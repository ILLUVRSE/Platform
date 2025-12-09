/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { validateAceAgentManifest } from "@illuvrse/contracts";
import { Card, PageSection, Pill, ProofCard, StatBadge } from "@illuvrse/ui";
import { AgentManagerClient } from "@illuvrse/agent-manager";
import { computeStageErrors, summarizeDiff, stageComplete, type StageFormState } from "./utils";

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

const stageAnchors = [
  { key: "identity", label: "Identity", desc: "id, name, version, runtime image" },
  { key: "capabilities", label: "Capabilities", desc: "toggles and presets" },
  { key: "runtime", label: "Triggers & models", desc: "trigger + llm/tts bindings" },
  { key: "avatar", label: "Avatar & activation", desc: "activation line + assets/voice" },
  { key: "review", label: "Review & export", desc: "JSON, SHA, policy, register" }
];

type Verdict = { verdict: string; severity?: string; rules?: { id: string; result: string; message?: string }[] } | null;

export default function AceCreatePage() {
  const [id, setId] = useState("agent.story-weaver.001");
  const [name, setName] = useState("StoryWeaver");
  const [version, setVersion] = useState("0.1.0");
  const [description, setDescription] = useState("Generator + catalog agent for StorySphere previews");
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

  const manifest: AceAgentManifest = useMemo(() => {
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
      archetype: "Oracle",
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
      resources: { cpu, memory },
      runtime: { container: { image: runtimeImage } },
      metadata: { publishToLiveLoop: publishLiveLoop },
      avatar: {
        appearance: { assets: avatarAssets ? avatarAssets.split(",").map((s) => s.trim()).filter(Boolean) : [] },
        voice: { activationLine: avatarActivation, sampleUrl: avatarVoiceUrl || undefined },
        personality: { traits: ["Curious", "Protective"], archetype: "Guide" }
      }
    };
  }, [id, name, version, description, capabilities, runtimeImage, trigger, llmId, ttsId, publishLiveLoop, avatarActivation, avatarAssets, avatarVoiceUrl]);

  // Load draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        setId(draft.id ?? id);
        setName(draft.name ?? name);
        setVersion(draft.version ?? version);
        setDescription(draft.description ?? description);
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
      }
    } catch {
      // ignore bad drafts
    }
    // If Playground manifest exists and no draft loaded, hydrate from it
    try {
      const fromPlayground = localStorage.getItem(PLAYGROUND_KEY);
      if (fromPlayground) {
        const parsed = JSON.parse(fromPlayground);
        applyManifestFields(parsed);
        setCurrentStep(stageAnchors.findIndex((s) => s.key === "review"));
        showToast("Loaded manifest from Playground", "success");
      }
    } catch {
      // ignore
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
          avatarVoiceUrl
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

  function applyManifestFields(m: AceAgentManifest) {
    setId(m.id);
    setName(m.name);
    setVersion(m.version);
    setDescription(m.description ?? "");
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
      memory
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
      ["id", "name", "version", "runtimeImage", "capabilities", "trigger", "llmId", "ttsId", "cpu", "memory"].forEach((k) => {
        if (nextErrors[k]) merged[k] = nextErrors[k];
        else if (stageKey === "identity" && (k === "id" || k === "name" || k === "version" || k === "runtimeImage")) delete merged[k];
        else if (stageKey === "capabilities" && k === "capabilities") delete merged[k];
        else if (stageKey === "runtime" && (k === "trigger" || k === "llmId" || k === "ttsId" || k === "cpu" || k === "memory")) delete merged[k];
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
      memory
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

  function sendToPlayground() {
    try {
      localStorage.setItem(PLAYGROUND_KEY, manifestJson);
    } catch {
      showToast("Failed to write manifest to localStorage", "error");
      return;
    }
    document.cookie = `${PLAYGROUND_KEY}=${encodeURIComponent(manifestJson)}; path=/; max-age=600`;
    const payloadBytes = new TextEncoder().encode(manifestJson).length;
    showToast(`Sent to Playground (${payloadBytes} bytes stored)`, "success");
    if (playgroundNewTab) {
      window.open("/playground", "_blank");
    } else {
      window.location.href = "/playground";
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

  return (
    <div className="space-y-10">
      {toast && (
        <div
          className={`fixed right-6 top-6 z-40 rounded-xl border px-4 py-3 text-sm shadow-card ${toast.type === "success" ? "border-teal-500/60 bg-slate-900/80 text-teal-100" : "border-rose-500/70 bg-rose-900/70 text-rose-50"}`}
        >
          {toast.message}
        </div>
      )}
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <Pill className="bg-teal-50 text-teal-700">ACE Creation Wizard</Pill>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900">Identity → Capabilities → Runtime/Models → Avatar → Review</h1>
            <p className="text-lg text-slate-700">
              Build an ACE manifest with live JSON + SHA preview, autosave drafts, policy/proof checks, and one-click handoff to the Playground or Agent Manager.
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={playgroundNewTab} onChange={(e) => setPlaygroundNewTab(e.target.checked)} />
              Open Playground in new tab (keep wizard open)
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={validateAndCheck}
                className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
              >
                Validate & Run Checks
              </button>
              <button
                type="button"
                onClick={sendToPlayground}
                className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-cream transition hover:border-teal-500/70 hover:text-teal-200"
              >
                Send to Playground
              </button>
              <button
                type="button"
                onClick={registerWithAgentManager}
                className="rounded-full border border-teal-500/60 px-5 py-3 text-sm font-semibold text-teal-200 transition hover:bg-teal-500/10"
              >
                Register with AgentManager
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <StatBadge label="Draft" value="Autosave ON" variant="success" />
              <StatBadge label="SHA" value={sha ? `${sha.slice(0, 8)}…` : "computing"} variant="neutral" />
              <StatBadge label="Policy" value={policy?.verdict ?? "not run"} variant={policy?.severity === "high" ? "warning" : "neutral"} />
            </div>
            {registerStatus && <div className="text-xs text-slate-700">{registerStatus}</div>}
            {registerBlockedReason && <div className="text-xs text-amber-700">{registerBlockedReason}</div>}
            {agentManagerSummary && <div className="text-xs text-teal-800">{agentManagerSummary}</div>}
          </div>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Proof snapshot</div>
            <ProofCard
              sha={proof?.sha256 ?? sha}
              signer={proof?.signer ?? "kernel-multisig"}
              timestamp={proof?.timestamp ?? "pending"}
              ledgerLink={proof?.ledgerUrl}
              policyVerdict={proof?.policyVerdict ?? policy?.verdict}
              error={!proof && !sha ? "No proof yet" : undefined}
            />
            {registeredOnce && <div className="text-[11px] text-teal-800">Registered badge: last register succeeded.</div>}
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
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition ${
                currentStep === idx ? "border-teal-500/70 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-300"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                  currentStep === idx ? "bg-teal-500 text-slate-900" : "bg-teal-100 text-teal-700"
                }`}
              >
                {idx + 1}
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <span>{stage.label}</span>
                  {stageIsValid(stage.key) && <span className="rounded-full bg-teal-50 px-2 py-[2px] text-[11px] font-semibold text-teal-700">✓</span>}
                  {!stageIsValid(stage.key) && <span className="rounded-full bg-rose-100 px-2 py-[2px] text-[11px] font-semibold text-rose-700">Incomplete</span>}
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
            className="rounded-full border border-slate-600 px-4 py-2 text-sm font-semibold text-cream transition hover:border-teal-500/70 hover:text-teal-200 disabled:opacity-40"
            disabled={currentStep === 0}
          >
            Previous step
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95 disabled:opacity-40"
            disabled={currentStep === stageAnchors.length - 1 || !stageIsValid(stageAnchors[currentStep].key)}
          >
            Next step
          </button>
        </div>
      </section>

      <PageSection eyebrow="Identity" title="Basics" id="identity">
        <Card
          title="Identity"
          body={
            <div className="space-y-3 text-sm">
              <label className="space-y-1 block">
                <div className="text-slate-800/80">Agent ID</div>
                <input className="w-full rounded-lg border border-slate-300 bg-white p-2" value={id} onChange={(e) => setId(e.target.value)} />
                {fieldErrors.id && <div className="field-error text-xs text-rose-600">{fieldErrors.id}</div>}
                <div className="text-[11px] text-slate-500">Allowed: lowercase letters, numbers, dots, underscores, hyphens.</div>
              </label>
              <label className="space-y-1 block">
                <div className="text-slate-800/80">Name</div>
                <input className="w-full rounded-lg border border-slate-300 bg-white p-2" value={name} onChange={(e) => setName(e.target.value)} />
                {fieldErrors.name && <div className="field-error text-xs text-rose-600">{fieldErrors.name}</div>}
              </label>
              <div className="flex gap-3">
                <label className="space-y-1 flex-1">
                  <div className="text-slate-800/80">Version</div>
                  <input className="w-full rounded-lg border border-slate-300 bg-white p-2" value={version} onChange={(e) => setVersion(e.target.value)} />
                  {fieldErrors.version && <div className="field-error text-xs text-rose-600">{fieldErrors.version}</div>}
                </label>
                <label className="space-y-1 flex-1">
                  <div className="text-slate-800/80">Runtime image</div>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white p-2"
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
                <textarea className="w-full rounded-lg border border-slate-300 bg-white p-2" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
            </div>
          }
        />
      </PageSection>

      <PageSection eyebrow="Capabilities" title="Pick what this agent can do" id="capabilities">
        <Card
            title="Capabilities"
            body={
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {allCapabilities.map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => toggleCapability(cap)}
                      className={`rounded-full px-3 py-1 text-sm transition ${capabilities.includes(cap) ? "bg-teal-100 text-teal-800 border border-teal-200" : "bg-slate-100 text-slate-800 border border-slate-200"}`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              {fieldErrors.capabilities && <div className="text-xs text-rose-300">{fieldErrors.capabilities}</div>}
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-200/70">Presets</div>
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
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-cream transition hover:border-teal-500/70"
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

      <PageSection eyebrow="Runtime/Models" title="Triggers, model bindings, and LiveLoop" id="runtime">
        <Card
          title="Runtime & bindings"
          body={
            <div className="space-y-3 text-sm">
              <label className="space-y-1 block">
                <div className="text-slate-800/80">Trigger (cron:*, event:*, or path)</div>
                <input className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
                {fieldErrors.trigger && <div className="text-xs text-rose-300">{fieldErrors.trigger}</div>}
                <div className="text-[11px] text-slate-500">Examples: cron:*/5 * * * * · event:job.requested · /hook/generate</div>
              </label>
              <div className="flex gap-3">
                <label className="space-y-1 flex-1">
                  <div className="text-slate-800/80">LLM ID</div>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white p-2"
                    value={llmId}
                    onChange={(e) => setLlmId(e.target.value)}
                  >
                    {llmOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.llmId && <div className="text-xs text-rose-300">{fieldErrors.llmId}</div>}
                </label>
                <label className="space-y-1 flex-1">
                  <div className="text-slate-800/80">TTS ID</div>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white p-2"
                    value={ttsId}
                    onChange={(e) => setTtsId(e.target.value)}
                  >
                    {ttsOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.ttsId && <div className="text-xs text-rose-300">{fieldErrors.ttsId}</div>}
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 block">
                  <div className="text-slate-800/80">CPU</div>
                  <input className="w-full rounded-lg border border-slate-300 bg-white p-2" value={cpu} onChange={(e) => setCpu(e.target.value)} placeholder="500m" />
                  {fieldErrors.cpu && <div className="text-xs text-rose-600">{fieldErrors.cpu}</div>}
                  <div className="text-[11px] text-slate-400">Use Kubernetes units (e.g., 500m, 1 for full core).</div>
                </label>
                <label className="space-y-1 block">
                  <div className="text-slate-800/80">Memory</div>
                  <input className="w-full rounded-lg border border-slate-300 bg-white p-2" value={memory} onChange={(e) => setMemory(e.target.value)} placeholder="1Gi" />
                  {fieldErrors.memory && <div className="text-xs text-rose-600">{fieldErrors.memory}</div>}
                  <div className="text-[11px] text-slate-400">Examples: 512Mi, 1Gi.</div>
                </label>
              </div>
              <div className="flex flex-wrap gap-2 text-[12px] text-slate-200">
                {resourcePresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="rounded-full border border-slate-700 px-3 py-1 transition hover:border-teal-500/70"
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
                <a href="/developers#ace-spec" className="text-teal-700 underline underline-offset-4">
                  ACE spec docs
                </a>
              </div>
            </div>
          }
        />
      </PageSection>

      <PageSection eyebrow="Avatar" title="Voice & activation" id="avatar">
        <Card
          title="Activation & assets"
          body={
            <div className="space-y-3 text-sm">
              <label className="space-y-1 block">
                <div className="text-slate-200/80">Activation line</div>
                <textarea className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" rows={2} value={avatarActivation} onChange={(e) => setAvatarActivation(e.target.value)} />
              </label>
              <label className="space-y-1 block">
                <div className="text-slate-200/80">Appearance assets (comma-separated URLs)</div>
                <textarea
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2"
                  rows={2}
                  value={avatarAssets}
                  onChange={(e) => setAvatarAssets(e.target.value)}
                  placeholder="s3://avatars/demo1, https://cdn.example.com/avatar2.png"
                />
                <button
                  type="button"
                  className="rounded-lg border border-slate-700 px-3 py-1 text-[12px] font-semibold text-cream transition hover:border-teal-500/70"
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
                <div className="text-slate-200/80">Voice sample URL</div>
                <input className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" value={avatarVoiceUrl} onChange={(e) => setAvatarVoiceUrl(e.target.value)} />
              </label>
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Preview</div>
                <div className="text-sm text-cream">{avatarActivation || "No activation line set"}</div>
                <div className="mt-2 text-xs text-slate-200/80">
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

      <PageSection eyebrow="Review" title="Manifest, hash, and proofs" id="review">
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Manifest JSON" body={<pre className="max-h-96 overflow-auto rounded-xl bg-slate-900/80 p-3 text-[12px] leading-relaxed text-cream">{manifestJson}</pre>} />
          <Card
            title="Hash & actions"
            body={
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">SHA-256</div>
                  <div className="break-all font-mono text-[12px] text-cream">{sha || "computing..."}</div>
                </div>
                {error ? <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-2 text-rose-100">{error}</div> : <div className="text-teal-200">Valid manifest</div>}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-cream transition hover:border-teal-500/70"
                  >
                    Download JSON
                  </button>
                  <button
                    type="button"
                    onClick={sendToPlayground}
                    className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:opacity-95"
                  >
                    Send to Playground
                  </button>
                  <button
                    type="button"
                    onClick={validateAndCheck}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-cream transition hover:border-teal-500/70"
                  >
                    Validate & Run Checks
                  </button>
                </div>
              </div>
            }
          />
          <Card
            title="Policy & signature"
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
                  <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Policy</div>
                    <div className="text-cream">{policy.verdict}</div>
                    <div className="text-xs text-slate-200/70">Severity: {policy.severity ?? "n/a"}</div>
                    <ul className="mt-2 space-y-1 text-xs text-slate-200/80">
                      {policy.rules?.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-2">
                          <span>{r.id}</span>
                          <span className="font-semibold text-teal-300">{r.result}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 text-xs text-slate-300/70">
                      Need guidance?{" "}
                      <a href="/developers#api" className="text-teal-300 underline underline-offset-4">
                        See API & policy docs
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-200/70">Run checks to see policy verdict and proof.</div>
                )}
              </div>
            }
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card
            title="Stage summary"
            body={
              <div className="space-y-2 text-sm">
                {stageAnchors.map((stage) => (
                  <div key={stage.key} className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">{stage.label}</div>
                      <div className="text-[12px] text-slate-300/80">{stage.desc}</div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        stageIsValid(stage.key) ? "bg-teal-600/30 text-teal-100" : "bg-rose-600/20 text-rose-100"
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

      <PageSection eyebrow="Import/Export" title="Load or paste a manifest" id="import">
        <Card
          title="Paste JSON and validate"
          body={
            <div className="space-y-3 text-sm">
              <textarea
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 p-3 font-mono text-[12px] leading-relaxed text-cream"
                rows={6}
                placeholder='{"id":"agent.demo","name":"Demo","version":"0.1","capabilities":["generator"],"runtime":{"container":{"image":"img"}}}'
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
              />
              <div>
                <label className="text-xs text-slate-300/80">
                  Upload manifest file:
                  <input
                    type="file"
                    accept="application/json"
                    className="mt-1 block text-xs text-slate-200"
                    onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
                  />
                </label>
                {uploadError && <div className="text-xs text-rose-300">{uploadError}</div>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleImport}
                  className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:opacity-95"
                >
                  Load into wizard
                </button>
                <button
                  type="button"
                  onClick={() => setImportJson("")}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-cream transition hover:border-teal-500/70"
                >
                  Clear
                </button>
              </div>
              {pendingImport ? (
                <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-50">
                  <div className="font-semibold text-cream">Confirm import?</div>
                  <ul className="mt-2 space-y-1">
                    {pendingImport.summary.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={confirmPendingImport}
                      className="rounded-lg bg-amber-400 px-3 py-2 text-[12px] font-semibold text-slate-900 transition hover:opacity-90"
                    >
                      Apply import
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingImport(null)}
                      className="rounded-lg border border-amber-400/60 px-3 py-2 text-[12px] font-semibold text-amber-100 transition hover:border-amber-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
              <p className="text-xs text-slate-300/70">
                {`On load, fields populate and validation run automatically. Drafts autosave to localStorage key "${STORAGE_KEY}", Playground handoff uses "${PLAYGROUND_KEY}".`}
              </p>
            </div>
          }
        />
      </PageSection>
    </div>
  );
}
