/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { validateAceAgentManifest } from "@illuvrse/contracts";
import { Card, PageSection, Pill, ProofCard } from "@illuvrse/ui";
import { AgentManagerClient } from "@illuvrse/agent-manager";

const STORAGE_KEY = "ace-wizard-draft";
const PLAYGROUND_KEY = "ace-playground-manifest";
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
  const [publishLiveLoop, setPublishLiveLoop] = useState(false);
  const [avatarActivation, setAvatarActivation] = useState("Initialization complete. I’m ready to move with you.");
  const [avatarAssets, setAvatarAssets] = useState<string>("s3://avatars/demo");
  const [avatarVoiceUrl, setAvatarVoiceUrl] = useState<string>("https://cdn.example.com/voice-sample.wav");

  const [sha, setSha] = useState<string>("");
  const [manifestJson, setManifestJson] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<Verdict>(null);
  const [proof, setProof] = useState<any>(null);
  const [importJson, setImportJson] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [registerStatus, setRegisterStatus] = useState<string | null>(null);
  const [agentManagerSummary, setAgentManagerSummary] = useState<string | null>(null);

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
      resources: { cpu: "500m", memory: "1Gi" },
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
        setPublishLiveLoop(Boolean(draft.publishLiveLoop));
        setAvatarActivation(draft.avatarActivation ?? avatarActivation);
      }
    } catch {
      // ignore bad drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          publishLiveLoop,
          avatarActivation
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
      applyManifestFields(parsed);
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
    setPublishLiveLoop(Boolean(m.metadata?.publishToLiveLoop));
    setAvatarActivation(m.avatar?.voice?.activationLine ?? avatarActivation);
    setAvatarAssets((m.avatar?.appearance?.assets ?? []).join(", "));
    setAvatarVoiceUrl(m.avatar?.voice?.sampleUrl ?? avatarVoiceUrl);
  }

  async function handleImport() {
    try {
      const parsed = JSON.parse(importJson);
      validateAceAgentManifest(parsed);
      applyManifestFields(parsed);
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

  function sendToPlayground() {
    try {
      localStorage.setItem(PLAYGROUND_KEY, manifestJson);
    } catch {
      // ignore
    }
    // Also set a short-lived cookie so the playground (server) can read it
    document.cookie = `${PLAYGROUND_KEY}=${encodeURIComponent(manifestJson)}; path=/; max-age=600`;
    window.location.href = "/playground";
  }

  async function registerWithAgentManager() {
    setRegisterStatus("Registering…");
    try {
      validateAceAgentManifest(manifest);
    } catch (err) {
      setRegisterStatus(`Validation failed: ${(err as Error).message}`);
      return;
    }

    try {
      const signRes = await fetch("/api/kernel/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sha256: sha, manifest })
      });
      const signed = signRes.ok ? await signRes.json() : null;
      if (signed?.signature) {
        setProof(signed);
      }

      const client = new AgentManagerClient("http://localhost:4040");
      await client.register({ ...manifest, signing: { proof: signed } } as unknown as Record<string, unknown>);
      const agents = await client.listAgents();
      setAgentManagerSummary(`Registered. Agents: ${agents.agents.length}`);
      setRegisterStatus("Registered with AgentManager");
    } catch (err) {
      setRegisterStatus(`Failed: ${(err as Error).message}`);
    }
  }

  async function validateAndCheck() {
    const nextErrors: Record<string, string> = {};
    if (!id.trim()) nextErrors.id = "Required";
    if (!name.trim()) nextErrors.name = "Required";
    if (!version.trim()) nextErrors.version = "Required";
    if (!runtimeImage.trim()) nextErrors.runtimeImage = "Required";
    if (!capabilities.length) nextErrors.capabilities = "Pick at least one capability";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      validateAceAgentManifest(manifest);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      return;
    }

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
        body: JSON.stringify({ sha256: sha, signature: "stub" })
      });
      setProof(proofRes.ok ? await proofRes.json() : null);
    } catch {
      setProof(null);
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-teal-600/20 text-teal-200">ACE Builder</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Creation Wizard</h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-200/90">
          Identity → Capabilities → Runtime → Avatar → Proof. Draft your manifest, validate, and push to the playground.
        </p>
        {policy && policy.severity && policy.severity !== "low" ? (
          <div className="mt-4 rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100">
            Policy severity: {policy.severity}. Review rules and trim permissions if possible.
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={validateAndCheck}
            className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
          >
            Validate & Run Checks
          </button>
          <a
            href="/playground"
            className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-cream transition hover:border-teal-500/70 hover:text-teal-200"
          >
            Open Playground
          </a>
          <button
            type="button"
            onClick={registerWithAgentManager}
            className="rounded-full border border-teal-500/60 px-5 py-3 text-sm font-semibold text-teal-200 transition hover:bg-teal-500/10"
          >
            Register with AgentManager
          </button>
          {registerStatus && <div className="text-xs text-slate-200/80">{registerStatus}</div>}
          {agentManagerSummary && <div className="text-xs text-teal-300">{agentManagerSummary}</div>}
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {["Identity", "Capabilities", "Runtime/Models", "Avatar/Review"].map((step, idx) => (
            <div key={step} className="flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/50 px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600/30 text-sm font-semibold text-teal-200">{idx + 1}</div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Step {idx + 1}</div>
                <div className="text-sm text-cream">{step}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PageSection eyebrow="Identity" title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Identity"
            body={
              <div className="space-y-3 text-sm">
              <label className="space-y-1 block">
                <div className="text-slate-200/80">Agent ID</div>
                <input className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" value={id} onChange={(e) => setId(e.target.value)} />
                {fieldErrors.id && <div className="text-xs text-rose-300">{fieldErrors.id}</div>}
              </label>
              <label className="space-y-1 block">
                <div className="text-slate-200/80">Name</div>
                <input className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" value={name} onChange={(e) => setName(e.target.value)} />
                {fieldErrors.name && <div className="text-xs text-rose-300">{fieldErrors.name}</div>}
              </label>
              <div className="flex gap-3">
                <label className="space-y-1 flex-1">
                  <div className="text-slate-200/80">Version</div>
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" value={version} onChange={(e) => setVersion(e.target.value)} />
                  {fieldErrors.version && <div className="text-xs text-rose-300">{fieldErrors.version}</div>}
                </label>
                <label className="space-y-1 flex-1">
                  <div className="text-slate-200/80">Runtime image</div>
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" value={runtimeImage} onChange={(e) => setRuntimeImage(e.target.value)} />
                  {fieldErrors.runtimeImage && <div className="text-xs text-rose-300">{fieldErrors.runtimeImage}</div>}
                </label>
              </div>
                <label className="space-y-1 block">
                  <div className="text-slate-200/80">Description</div>
                  <textarea className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
              </div>
            }
          />
          <Card
          title="Triggers & Models"
          body={
            <div className="space-y-3 text-sm">
              <label className="space-y-1 block">
                <div className="text-slate-200/80">Trigger (cron:*, event:*, or path)</div>
                <input className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
              </label>
              <div className="flex gap-3">
                <label className="space-y-1 flex-1">
                  <div className="text-slate-200/80">LLM ID</div>
                    <input className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" value={llmId} onChange={(e) => setLlmId(e.target.value)} />
                  </label>
                  <label className="space-y-1 flex-1">
                    <div className="text-slate-200/80">TTS ID</div>
                    <input className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" value={ttsId} onChange={(e) => setTtsId(e.target.value)} />
                  </label>
              </div>
              <label className="inline-flex items-center gap-2 text-slate-200/80">
                <input type="checkbox" checked={publishLiveLoop} onChange={(e) => setPublishLiveLoop(e.target.checked)} />
                Auto-publish to LiveLoop
              </label>
              <div className="text-xs text-slate-300/70">
                Need syntax?{" "}
                <a href="/developers#ace-spec" className="text-teal-300 underline underline-offset-4">
                  ACE spec docs
                </a>
              </div>
            </div>
          }
        />
        </div>
      </PageSection>

      <PageSection eyebrow="Capabilities" title="Pick what this agent can do">
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
                    className={`rounded-full px-3 py-1 text-sm transition ${
                      capabilities.includes(cap) ? "bg-teal-600 text-slate-900" : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
              {fieldErrors.capabilities && <div className="text-xs text-rose-300">{fieldErrors.capabilities}</div>}
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70 mb-2">Presets</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      name: "Generator",
                      capabilities: ["generator"],
                      triggers: [{ type: "event", event: "job.requested" }]
                    },
                    {
                      name: "Catalog",
                      capabilities: ["catalog"],
                      triggers: [{ type: "event", event: "asset.uploaded" }]
                    },
                    {
                      name: "Scheduler",
                      capabilities: ["scheduler", "liveloop"],
                      triggers: [{ type: "cron", cron: "*/30 * * * *" }]
                    },
                    {
                      name: "Proof",
                      capabilities: ["proof"],
                      triggers: [{ type: "event", event: "asset.ready" }]
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

      <PageSection eyebrow="Avatar" title="Voice & activation">
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
                <input className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" value={avatarAssets} onChange={(e) => setAvatarAssets(e.target.value)} />
              </label>
              <label className="space-y-1 block">
                <div className="text-slate-200/80">Voice sample URL</div>
                <input className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2" value={avatarVoiceUrl} onChange={(e) => setAvatarVoiceUrl(e.target.value)} />
              </label>
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Preview</div>
                <div className="text-cream text-sm">{avatarActivation || "No activation line set"}</div>
                <div className="mt-2 text-xs text-slate-200/80">
                  <div>Assets: {avatarAssets || "none"}</div>
                  <div>Voice sample: {avatarVoiceUrl || "none"}</div>
                </div>
              </div>
            </div>
          }
        />
      </PageSection>

      <PageSection eyebrow="Review" title="Manifest, hash, and proofs">
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            title="Manifest JSON"
            body={<pre className="max-h-96 overflow-auto rounded-xl bg-slate-900/80 p-3 text-[12px] leading-relaxed text-cream">{manifestJson}</pre>}
          />
          <Card
            title="Hash & errors"
            body={
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">SHA-256</div>
                  <div className="font-mono text-[12px] break-all text-cream">{sha || "computing..."}</div>
                </div>
                {error ? <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-2 text-rose-100">{error}</div> : <div className="text-teal-200">Valid manifest</div>}
                <div className="flex gap-2">
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
                  policyVerdict={proof?.policyVerdict}
                  error={!proof && !sha ? "No proof yet" : undefined}
                />
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
      </PageSection>

      <PageSection eyebrow="Import/Export" title="Load or paste a manifest">
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
              <p className="text-xs text-slate-300/70">On load, fields populate and validation runs automatically.</p>
            </div>
          }
        />
      </PageSection>
    </div>
  );
}
