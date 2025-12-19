"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Float, Stars } from "@react-three/drei";
import { XR, Controllers, VRButton } from "@react-three/xr";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { tutorialManifests } from "./TutorialManifests";
import { rememberManifest } from "./recent";

type NodeProps = {
  manifest: AceAgentManifest;
  position: [number, number, number];
  onSelect: (manifest: AceAgentManifest) => void;
  selected: boolean;
};

const capabilityColors: Record<string, string> = {
  generator: "#7EE0C4",
  catalog: "#FFD166",
  scheduler: "#9BB0FF",
  liveloop: "#FF9BCE",
  proof: "#7CB7FF",
  moderator: "#FF7F7F",
  monitor: "#C6A9FF",
  assistant: "#8DE3FF"
};
const APPROVER_KEY = "illuvrse-approver";

function CapabilityOrbit({ caps, selected }: { caps: string[]; selected: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });
  return (
    <group ref={ref} scale={selected ? 1.1 : 1}>
      {caps.slice(0, 4).map((cap, idx) => {
        const angle = (idx / Math.max(1, caps.length)) * Math.PI * 2;
        const radius = 1.2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={cap + idx} position={[x, 0, z]} scale={0.16}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color={capabilityColors[cap] ?? "#7EE0C4"} emissiveIntensity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

function AgentNode({ manifest, position, onSelect, selected, statusText, statusRaw, proofSha, policyVerdict }: NodeProps & { statusText?: string; statusRaw?: string; proofSha?: string; policyVerdict?: string }) {
  const color = useMemo(() => {
    const cap = manifest.capabilities[0] ?? "generator";
    return capabilityColors[cap] ?? "#7EE0C4";
  }, [manifest.capabilities]);

  return (
    <Float floatIntensity={1} speed={2} position={position}>
      <mesh onClick={() => onSelect(manifest)} scale={selected ? 1.1 : 1}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 1 : 0.4} metalness={0.1} roughness={0.2} />
      </mesh>
      <CapabilityOrbit caps={manifest.capabilities} selected={selected} />
      <Html distanceFactor={12}>
        <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-center text-[11px] text-slate-900 shadow-card">
          <div className="font-semibold">{manifest.name}</div>
          <div className="text-slate-500">{manifest.capabilities.join(", ")}</div>
          {statusText ? (
            <div
              className={`mt-1 rounded-full px-2 py-[2px] text-[10px] ${
                statusRaw?.startsWith("completed")
                  ? "bg-teal-100 text-teal-800"
                  : statusRaw?.startsWith("running")
                    ? "bg-amber-100 text-amber-800"
                    : statusRaw?.startsWith("failed")
                      ? "bg-rose-100 text-rose-800"
                      : "bg-slate-200 text-slate-800"
              }`}
            >
              {statusText}
            </div>
          ) : null}
          <div className="mt-1 flex flex-wrap justify-center gap-1">
            {policyVerdict ? <span className="rounded-full bg-slate-100 px-2 py-[1px] text-[10px] text-slate-700">policy: {policyVerdict}</span> : null}
            {proofSha ? <span className="rounded-full bg-slate-100 px-2 py-[1px] text-[10px] text-slate-700">proof: {proofSha.slice(0, 6)}…</span> : null}
          </div>
        </div>
      </Html>
    </Float>
  );
}

export function Playground3D() {
  const [selected, setSelected] = useState<AceAgentManifest | null>(null);
  const [xrSupported, setXrSupported] = useState(false);
  const [xrEnabled, setXrEnabled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState<string>("idle");
  const [approvedBy, setApprovedBy] = useState<string>("Ryan Lueckenotte");
  const [statusMap, setStatusMap] = useState<Record<string, { text: string; status: string; action?: string; proofSha?: string; policyVerdict?: string; timestamp?: number }>>({});
  const [historyMap, setHistoryMap] = useState<
    Record<string, { status: string; action?: string; message?: string; proofSha?: string; policyVerdict?: string; timestamp?: number }[]>
  >({});
  const [filterAction, setFilterAction] = useState<string>("all");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(APPROVER_KEY);
      if (stored) setApprovedBy(stored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(APPROVER_KEY, approvedBy);
    } catch {
      // ignore
    }
  }, [approvedBy]);

  useEffect(() => {
    let mounted = true;
    if ("xr" in navigator) {
      (navigator as any).xr?.isSessionSupported?.("immersive-vr").then((ok: boolean) => {
        if (mounted) setXrSupported(ok);
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-select if Playground manifest matches a tutorial node
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ace-playground-manifest");
      if (!raw) return;
      const parsed = JSON.parse(raw) as AceAgentManifest;
      const match = tutorialManifests.find((m) => m.manifest.id === parsed.id);
      if (match) {
        setSelected(match.manifest);
        setStatusLabel("loaded from Playground");
        setToast(`Selected ${match.manifest.name} from Playground manifest`);
        setTimeout(() => setToast(null), 2500);
      }
    } catch {
      // ignore
    }
  }, []);

  const positions: [number, number, number][] = [
    [-3, 0.4, -2],
    [3, 0.6, -1],
    [-2, 0.5, 2],
    [2.5, 0.7, 2],
    [0, 0.4, -3.5],
    [0, 0.6, 3.5]
  ];

  function handleSelect(manifest: AceAgentManifest) {
    const json = JSON.stringify(manifest, null, 2);
    try {
      localStorage.setItem("ace-playground-manifest", json);
      rememberManifest(manifest);
    } catch {
      // ignore
    }
    document.cookie = `ace-playground-manifest=${encodeURIComponent(json)}; path=/; max-age=600`;
    setSelected(manifest);
    setToast(`Loaded ${manifest.name} into Playground storage`);
    setTimeout(() => setToast(null), 2500);
    setStatusLabel("idle");
  }

  useEffect(() => {
    const evt = new EventSource("/api/agent/stream");
    evt.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          agentId: string;
          status: string;
          message?: string;
          policyVerdict?: string;
          proofSha?: string;
          action?: string;
          timestamp?: number;
        };
        const text = data.message ? `${data.status} · ${data.message}` : data.status;
        setStatusMap((prev) => ({ ...prev, [data.agentId]: { text, status: data.status, action: data.action, proofSha: data.proofSha, policyVerdict: data.policyVerdict, timestamp: data.timestamp } }));
        setHistoryMap((prev) => {
          const next = [...(prev[data.agentId] ?? [])];
          next.unshift({
            status: data.status,
            action: data.action,
            message: data.message,
            proofSha: data.proofSha,
            policyVerdict: data.policyVerdict,
            timestamp: data.timestamp ?? Date.now()
          });
          return { ...prev, [data.agentId]: next.slice(0, 12) };
        });
        if (selected?.id === data.agentId) {
          setStatusLabel(text);
        }
      } catch {
        // ignore
      }
    };
    return () => {
      evt.close();
    };
  }, [selected]);

  function statusColor(status?: string) {
    if (!status) return "bg-slate-200 text-slate-800";
    if (status.startsWith("queued")) return "bg-slate-200 text-slate-800";
    if (status.startsWith("running")) return "bg-amber-100 text-amber-800";
    if (status.startsWith("completed")) return "bg-teal-100 text-teal-800";
    if (status.startsWith("failed")) return "bg-rose-100 text-rose-800";
    return "bg-slate-200 text-slate-800";
  }

  async function runAction(action: string, payload?: Record<string, unknown>) {
    if (!selected) return;
    try {
      const res = await fetch("/api/agent/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selected.id, action, payload, manifest: selected, approvedBy, requestedBy: "Playground" })
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        const message = typeof data?.message === "string" ? data.message : `${action} enqueued`;
        setToast(message);
      } else {
        const message = typeof data?.error === "string" ? data.error : `Failed to enqueue ${action} (${res.status})`;
        setToast(message);
      }
    } catch (err) {
      setToast(`Failed to enqueue ${action}: ${(err as Error).message}`);
    }
  }

  function formatTime(ts?: number) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  const selectionText = selected ? `${selected.name} · ${selected.capabilities.join(", ")} · ${selected.runtime.container.image}` : "Select a node to load its manifest";

  return (
    <div className="space-y-3">
      {toast ? <div className="rounded-lg border border-teal-200 bg-teal-50 p-2 text-xs text-teal-800">{toast}</div> : null}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-card">
        {selectionText}
        {selected && <span className="ml-2 text-[11px] text-teal-700">(manifest stored to Playground)</span>}
        {selected && (
          <span className={`ml-2 rounded-full px-2 py-[2px] text-[11px] ${statusColor(statusLabel)}`}>Status: {statusLabel}</span>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] text-slate-700 shadow-card">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Operator approval</div>
        <input
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
          value={approvedBy}
          onChange={(e) => setApprovedBy(e.target.value)}
          placeholder="Approver name"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-200/80">
        {xrSupported ? (
          <>
            <button
              type="button"
              onClick={() => setXrEnabled((prev) => !prev)}
              className="rounded-full border border-slate-700 px-3 py-1 text-[12px] font-semibold text-cream transition hover:border-teal-500/70"
            >
              {xrEnabled ? "Exit VR mode" : "Enter VR mode"}
            </button>
            {xrEnabled && <VRButton />}
          </>
        ) : (
          <span className="rounded-full border border-slate-800 px-3 py-1 text-[12px] text-slate-400">VR not supported in this browser</span>
        )}
        {selected ? (
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem(
                  "ace-wizard-draft",
                  JSON.stringify({
                    id: selected.id,
                    name: selected.name,
                    version: selected.version,
                    description: selected.description,
                    capabilities: selected.capabilities,
                    runtimeImage: selected.runtime.container.image,
                    trigger:
                      selected.triggers?.[0]?.type === "cron"
                        ? `cron:${selected.triggers[0].cron}`
                        : selected.triggers?.[0]?.type === "event"
                          ? `event:${selected.triggers[0].event}`
                          : selected.triggers?.[0]?.type === "http"
                            ? selected.triggers[0].path ?? "/hook/generate"
                            : "",
                    llmId: selected.modelBindings?.llm?.id ?? "",
                    ttsId: selected.modelBindings?.tts?.id ?? "",
                    publishLiveLoop: Boolean(selected.metadata?.publishToLiveLoop),
                    avatarActivation: selected.avatar?.voice?.activationLine ?? "",
                    avatarAssets: (selected.avatar?.appearance?.assets ?? []).join(", "),
                    avatarVoiceUrl: selected.avatar?.voice?.sampleUrl ?? "",
                    cpu: selected.resources?.cpu ?? "",
                    memory: selected.resources?.memory ?? ""
                  })
                );
              } catch {
                // ignore
              }
              window.location.href = "/ace/create#review";
            }}
            className="rounded-full border border-teal-500/60 px-3 py-1 text-[12px] font-semibold text-teal-200 transition hover:bg-teal-500/10"
          >
            Open in ACE wizard
          </button>
        ) : null}
        {selected ? (
          <button
            type="button"
            onClick={() => runAction("generate.preview", { prompt: "Demo prompt from Playground" })}
            className="rounded-full border border-amber-300 px-3 py-1 text-[12px] font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Generate preview (exec)
          </button>
        ) : null}
        {selected ? (
          <>
            <button
              type="button"
              onClick={() => runAction("publish.manifest", { destination: "marketplace" })}
              className="rounded-full border border-teal-300 px-3 py-1 text-[12px] font-semibold text-teal-800 transition hover:bg-teal-100"
            >
              Publish (stub)
            </button>
            <button
              type="button"
              onClick={() => runAction("verify.proofs")}
              className="rounded-full border border-slate-300 px-3 py-1 text-[12px] font-semibold text-slate-800 transition hover:border-teal-500/70"
            >
              Verify (stub)
            </button>
          </>
        ) : null}
      </div>
      <div className="h-[420px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80">
        <Canvas camera={{ position: [0, 4, 8], fov: 50 }}>
          <color attach="background" args={["#0b1220"]} />
          <XR enabled={xrEnabled}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 8, 5]} intensity={1} />
            <Stars radius={40} depth={50} count={1200} factor={4} fade />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
              <cylinderGeometry args={[6, 6, 0.6, 64]} />
              <meshStandardMaterial color="#0f172a" roughness={1} metalness={0.2} />
            </mesh>
            {tutorialManifests.map((item, idx) => (
              <AgentNode
                key={item.manifest.id}
                manifest={item.manifest}
                position={positions[idx % positions.length]}
                onSelect={handleSelect}
                selected={selected?.id === item.manifest.id}
                statusText={statusMap[item.manifest.id]?.text}
                statusRaw={statusMap[item.manifest.id]?.status}
                proofSha={statusMap[item.manifest.id]?.proofSha}
                policyVerdict={statusMap[item.manifest.id]?.policyVerdict}
              />
            ))}
            {xrEnabled ? <Controllers /> : null}
          </XR>
          {!xrEnabled && <OrbitControls enablePan enableZoom enableRotate />}
        </Canvas>
      </div>
      {selected ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-[12px] text-slate-800 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Recent actions</span>
            <span className="text-slate-500">{selected.id}</span>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span>Filter:</span>
            {["all", "generate.preview", "publish.manifest", "verify.proofs"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterAction(f)}
                className={`rounded-full border px-2 py-[2px] ${filterAction === f ? "border-teal-400 text-teal-800" : "border-slate-200 text-slate-600"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            {(historyMap[selected.id] ?? []).filter((entry) => filterAction === "all" || entry.action === filterAction).map((entry, idx) => (
              <div key={`${entry.status}-${idx}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <div className="font-semibold text-slate-900">
                    {entry.status} {entry.action ? `· ${entry.action}` : ""}
                  </div>
                  {entry.message ? <div className="text-slate-600">{entry.message}</div> : null}
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                    {entry.proofSha ? <span className="rounded-full bg-white px-2 py-[2px]">proof: {entry.proofSha}</span> : null}
                    {entry.policyVerdict ? <span className="rounded-full bg-white px-2 py-[2px]">policy: {entry.policyVerdict}</span> : null}
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">{formatTime(entry.timestamp)}</div>
              </div>
            ))}
            {(historyMap[selected.id] ?? []).length === 0 ? <div className="text-slate-500">No events yet — run an action to see updates.</div> : null}
          </div>
        </div>
      ) : null}
      <div className="text-[12px] text-slate-600">
        Tip: click a node to load its manifest into Playground storage; reload to view full proofs and details in the flat Manifest viewer.
      </div>
    </div>
  );
}
