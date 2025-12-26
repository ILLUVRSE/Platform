"use client";

import { useState } from "react";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { Card, Pill, StatBadge } from "@illuvrse/ui";

const PLAYGROUND_KEY = "ace-playground-manifest";

export const tutorialManifests: { manifest: AceAgentManifest; blurb: string; stage: string }[] = [
  {
    stage: "StoryWeaver",
    blurb: "Generator + catalog agent that drafts beats and files previews.",
    manifest: {
      id: "agent.storyweaver.tutorial.001",
      name: "StoryWeaver",
      version: "0.1.0",
      description: "Generator + catalog agent to draft narrative beats for StorySphere.",
      archetype: "Oracle",
      capabilities: ["generator", "catalog"],
      triggers: [{ type: "event", event: "job.requested" }],
      modelBindings: {
        llm: { id: "gpt-4o-mini", provider: "openai" },
        tts: { id: "eleven.v1", provider: "elevenlabs", voice: "calm" }
      },
      permissions: { storage: { write: ["previews/", "catalog/"] }, network: { outbound: true } },
      resources: { cpu: "500m", memory: "1Gi" },
      runtime: { container: { image: "illuvrse/agent-storyweaver:demo" } },
      metadata: { publishToLiveLoop: false },
      avatar: {
        appearance: { assets: ["s3://avatars/storyweaver"], stylePreset: "stylized" },
        voice: { activationLine: "Initialization complete. Ready to weave a new tale." },
        personality: { traits: ["Curious", "Protective"], archetype: "Guide" }
      }
    }
  },
  {
    stage: "LiveLoop Scheduler",
    blurb: "Cron publisher that sequences playlists into LiveLoop slots.",
    manifest: {
      id: "agent.liveloop.scheduler.001",
      name: "LoopScheduler",
      version: "0.1.0",
      description: "Schedules LiveLoop drops on a cadence with proofs.",
      archetype: "Strategist",
      capabilities: ["scheduler", "liveloop"],
      triggers: [{ type: "cron", cron: "*/30 * * * *" }],
      modelBindings: {
        llm: { id: "gpt-4o", provider: "openai" },
        tts: { id: "azure.neural", provider: "azure", voice: "warm" }
      },
      permissions: { storage: { write: ["liveloop/"] }, network: { outbound: true } },
      resources: { cpu: "1", memory: "1Gi" },
      runtime: { container: { image: "illuvrse/agent-liveloop:demo" } },
      metadata: { publishToLiveLoop: true }
    }
  },
  {
    stage: "Proof Guardian",
    blurb: "Watches assets and attaches Kernel/Sentinel proofs before publish.",
    manifest: {
      id: "agent.proof.guardian.001",
      name: "ProofGuardian",
      version: "0.1.0",
      description: "Policy + proof gate before assets go live.",
      archetype: "Guardian",
      capabilities: ["proof", "moderator", "monitor"],
      triggers: [{ type: "event", event: "asset.ready" }],
      modelBindings: {
        llm: { id: "gpt-4o-mini", provider: "openai" },
        tts: { id: "eleven.v1", provider: "elevenlabs", voice: "neutral" }
      },
      permissions: { storage: { read: ["previews/"], write: ["final/"] }, network: { outbound: true } },
      resources: { cpu: "800m", memory: "1Gi" },
      runtime: { container: { image: "illuvrse/agent-proof:demo" } },
      metadata: { publishToLiveLoop: false }
    }
  },
  {
    stage: "Asset Curator",
    blurb: "Tags/uploads and builds smart playlists for StorySphere.",
    manifest: {
      id: "agent.asset.curator.001",
      name: "AssetCurator",
      version: "0.1.0",
      description: "Auto-tags uploads and curates playlists.",
      archetype: "Explorer",
      capabilities: ["catalog", "monitor"],
      triggers: [{ type: "event", event: "asset.uploaded" }],
      modelBindings: {
        llm: { id: "gpt-4o-mini", provider: "openai" },
        tts: { id: "eleven.v1", provider: "elevenlabs", voice: "soft" }
      },
      permissions: { storage: { read: ["uploads/"], write: ["catalog/"] }, network: { outbound: true } },
      resources: { cpu: "600m", memory: "1Gi" },
      runtime: { container: { image: "illuvrse/agent-catalog:demo" } },
      metadata: { publishToLiveLoop: false }
    }
  },
  {
    stage: "Voice Stylist",
    blurb: "Assigns TTS styles/voices and updates activation lines.",
    manifest: {
      id: "agent.voice.stylist.001",
      name: "VoiceStylist",
      version: "0.1.0",
      description: "Curates voice selections and activation lines for assets.",
      archetype: "Performer",
      capabilities: ["assistant", "generator"],
      triggers: [{ type: "event", event: "voice.requested" }],
      modelBindings: {
        llm: { id: "gpt-4o-mini", provider: "openai" },
        tts: { id: "openai.tts-1", provider: "openai", voice: "alloy" }
      },
      permissions: { storage: { write: ["voice/"] }, network: { outbound: true } },
      resources: { cpu: "500m", memory: "512Mi" },
      runtime: { container: { image: "illuvrse/agent-voice:demo" } },
      avatar: {
        voice: { activationLine: "Your voice profile is ready." },
        personality: { traits: ["Warm", "Helpful"], archetype: "Guide" }
      }
    }
  },
  {
    stage: "Engagement Monitor",
    blurb: "Listens for LiveLoop metrics and suggests next drops.",
    manifest: {
      id: "agent.engagement.monitor.001",
      name: "EngageMonitor",
      version: "0.1.0",
      description: "Monitors LiveLoop performance and recommends swaps.",
      archetype: "Strategist",
      capabilities: ["monitor", "scheduler"],
      triggers: [{ type: "event", event: "liveloop.metrics" }],
      modelBindings: {
        llm: { id: "gpt-4o-mini", provider: "openai" },
        tts: { id: "eleven.v1", provider: "elevenlabs", voice: "crisp" }
      },
      permissions: { network: { outbound: true } },
      resources: { cpu: "700m", memory: "1Gi" },
      runtime: { container: { image: "illuvrse/agent-monitor:demo" } },
      metadata: { publishToLiveLoop: false }
    }
  }
];

export function TutorialManifests({ onLoaded }: { onLoaded?: (manifest: AceAgentManifest) => void }) {
  const [message, setMessage] = useState<string | null>(null);

  function apply(manifest: AceAgentManifest) {
    const json = JSON.stringify(manifest, null, 2);
    try {
      localStorage.setItem(PLAYGROUND_KEY, json);
    } catch {
      // ignore
    }
    document.cookie = `${PLAYGROUND_KEY}=${encodeURIComponent(json)}; path=/; max-age=600`;
    setMessage(`Loaded ${manifest.name} into Playground`);
    onLoaded?.(manifest);
    setTimeout(() => setMessage(null), 3000);
    // reload to let server component pick up cookie
    window.location.reload();
  }

  return (
    <div className="space-y-3" id="tutorial-manifests">
      {message ? <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{message}</div> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {tutorialManifests.map(({ manifest, blurb, stage }) => (
          <Card
            key={manifest.id}
            title={manifest.name}
            body={
              <div className="space-y-2 text-sm text-slate-700">
                <Pill className="bg-slate-100 text-slate-700">{stage}</Pill>
                <p>{blurb}</p>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <StatBadge label="Trigger" value={manifest.triggers?.[0]?.type ?? "n/a"} variant="neutral" />
                  <StatBadge label="Caps" value={manifest.capabilities.join(", ")} variant="neutral" />
                </div>
                <button
                  type="button"
                  onClick={() => apply(manifest)}
                  className="rounded-full bg-teal-600 px-3 py-2 text-[12px] font-semibold text-white shadow-card transition hover:opacity-95"
                >
                  Load in Playground
                </button>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}
