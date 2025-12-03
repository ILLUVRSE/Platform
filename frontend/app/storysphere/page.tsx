"use client";

import Link from "next/link";

export default function StorySpherePage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="uppercase text-xs tracking-[0.3em] text-white/60">
          StorySphere
        </p>
        <h1 className="text-3xl font-serif font-bold">Prompt → MP4</h1>
        <p className="text-white/75">
          Use the Next.js generator flow or jump straight into the ComfyUI
          canvas at <code>http://127.0.0.1:8188/</code>.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/create"
            className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-semibold shadow"
          >
            Open Generator Form
          </Link>
          <a
            href="http://127.0.0.1:8188/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5 transition"
          >
            Open ComfyUI (new tab)
          </a>
        </div>
      </header>

      <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
        <iframe
          src="http://127.0.0.1:8188/"
          title="ComfyUI"
          className="w-full min-h-[70vh]"
        />
      </div>
    </div>
  );
}
