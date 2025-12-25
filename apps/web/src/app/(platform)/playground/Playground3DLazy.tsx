"use client";

import dynamic from "next/dynamic";
import type { AceAgentManifest } from "@illuvrse/contracts";

const Playground3D = dynamic(
  async () => {
    try {
      const mod = await import("./Playground3D");
      return { default: mod.Playground3D };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const Fallback = () => (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          3D preview unavailable in this build. ({message})<br />
          The rest of Playground remains functional. We can re-enable 3D once the React 19 + react-three stack is aligned.
        </div>
      );
      return { default: Fallback };
    }
  },
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">Loading 3D preview...</div>
    )
  }
);

export function Playground3DLazy({ handoffManifest }: { handoffManifest?: AceAgentManifest | null }) {
  return <Playground3D handoffManifest={handoffManifest} />;
}
