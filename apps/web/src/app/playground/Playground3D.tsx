"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Float, Stars } from "@react-three/drei";
import { XR, Controllers, VRButton } from "@react-three/xr";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { tutorialManifests } from "./TutorialManifests";

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

function AgentNode({ manifest, position, onSelect, selected, statusText, statusRaw }: NodeProps & { statusText?: string; statusRaw?: string }) {
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
        <div className="rounded-xl bg-slate-900/80 px-3 py-2 text-center text-[11px] text-cream shadow-card">
          <div className="font-semibold">{manifest.name}</div>
          <div className="text-slate-300/80">{manifest.capabilities.join(", ")}</div>
          {statusText ? (
            <div
              className={`mt-1 rounded-full px-2 py-[2px] text-[10px] ${
                statusRaw?.startsWith("completed")
                  ? "bg-teal-600/30 text-teal-100"
                  : statusRaw?.startsWith("running")
                    ? "bg-gold-500/30 text-gold-100"
                    : statusRaw?.startsWith("failed")
                      ? "bg-rose-600/30 text-rose-100"
                      : "bg-slate-700 text-slate-200"
              }`}
            >
              {statusText}
            </div>
          ) : null}
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
  const [statusMap, setStatusMap] = useState<Record<string, { text: string; status: string }>>({});

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
        const data = JSON.parse(event.data) as { agentId: string; status: string; message?: string; policyVerdict?: string; proofSha?: string };
        const text = data.message ? `${data.status} · ${data.message}` : data.status;
        setStatusMap((prev) => ({ ...prev, [data.agentId]: { text, status: data.status } }));
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
    if (!status) return "bg-slate-700 text-slate-200";
    if (status.startsWith("queued")) return "bg-slate-700 text-slate-200";
    if (status.startsWith("running")) return "bg-gold-500/30 text-gold-100";
    if (status.startsWith("completed")) return "bg-teal-600/30 text-teal-100";
    if (status.startsWith("failed")) return "bg-rose-600/30 text-rose-100";
    return "bg-slate-700 text-slate-200";
  }

  const selectionText = selected ? `${selected.name} · ${selected.capabilities.join(", ")} · ${selected.runtime.container.image}` : "Select a node to load its manifest";

  return (
    <div className="space-y-3">
      {toast ? <div className="rounded-lg border border-teal-500/60 bg-slate-900/70 p-2 text-xs text-teal-100">{toast}</div> : null}
      <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200">
        {selectionText}
        {selected && <span className="ml-2 text-[11px] text-teal-200">(manifest stored to Playground)</span>}
        {selected && (
          <span className={`ml-2 rounded-full px-2 py-[2px] text-[11px] ${statusColor(statusLabel)}`}>Status: {statusLabel}</span>
        )}
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
            onClick={async () => {
              try {
                const res = await fetch("/api/agent/exec", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ agentId: selected.id, action: "generate.preview", payload: { prompt: "Demo prompt from Playground" } })
                });
                if (res.ok) {
                  setToast("Generate preview enqueued");
                } else {
                  setToast("Failed to enqueue preview");
                }
              } catch {
                setToast("Failed to enqueue preview");
              }
            }}
            className="rounded-full border border-gold-500/60 px-3 py-1 text-[12px] font-semibold text-gold-300 transition hover:bg-gold-500/10"
          >
            Generate preview (exec)
          </button>
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
              />
            ))}
            {xrEnabled ? <Controllers /> : null}
          </XR>
          {!xrEnabled && <OrbitControls enablePan enableZoom enableRotate />}
        </Canvas>
      </div>
      <div className="text-[12px] text-slate-300/80">
        Tip: click a node to load its manifest into Playground storage; reload to view full proofs and details in the flat Manifest viewer.
      </div>
    </div>
  );
}
