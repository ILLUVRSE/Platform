"use client";

import { useRef, useState } from "react";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { validateAceAgentManifest } from "@illuvrse/contracts";
import { useRouter } from "next/navigation";
import { rememberManifest } from "./recent";

type Props = {
  onLoad?: (manifest: AceAgentManifest) => void;
};

export function ManifestUpload({ onLoad }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AceAgentManifest;
      validateAceAgentManifest(parsed);
      const json = JSON.stringify(parsed, null, 2);
      try {
        localStorage.setItem("ace-playground-manifest", json);
        rememberManifest(parsed);
      } catch {
        // ignore storage failures
      }
      document.cookie = `ace-playground-manifest=${encodeURIComponent(json)}; path=/; max-age=900`;
      setError(null);
      setSuccess(`${file.name} loaded into Playground`);
      onLoad?.(parsed);
      router.refresh();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setSuccess(null);
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-800 transition hover:border-teal-500/70"
        >
          Upload manifest JSON
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="text-[12px] text-slate-500">Kernel-signed ACE manifest JSON</span>
      </div>
      <div
        className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700 transition hover:border-teal-500/60 hover:bg-slate-100"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        Drop manifest JSON here or click to browse
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-[12px] text-teal-700">{success}</div> : null}
    </div>
  );
}
