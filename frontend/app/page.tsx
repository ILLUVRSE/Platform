"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const cards = [
  {
    title: "StorySphere",
    body: "Prompt → MP4 production",
    href: "/storysphere",
    cta: "Open generator",
  },
  {
    title: "LiveLoop",
    body: "Continuous channel of your stories",
    href: "/livelLoop",
    cta: "Open channel",
  },
  {
    title: "Library",
    body: "Browse and manage your media",
    href: "/library",
    cta: "Open library",
  },
  {
    title: "GameGrid",
    body: "Play web games in PIP-ready mode",
    href: "/gamegrid",
    cta: "Open GameGrid",
  },
];

const steps = [
  { title: "Write", desc: "Ollama crafts a tight script from your prompt." },
  { title: "Render", desc: "ComfyUI turns the scene into a cinematic frame." },
  {
    title: "Speak & Package",
    desc: "ElevenLabs + FFmpeg synth speech and package a 7s MP4.",
  },
];

const liveLoopItems = [
  { title: "Lighthouse Storm", tag: "Ready", duration: "7s" },
  { title: "Nebula Drift", tag: "Queued", duration: "12s" },
  { title: "Midnight Market", tag: "Ready", duration: "9s" },
  { title: "Aurora Bloom", tag: "Ready", duration: "5s" },
];

const libraryItems = [
  { title: "Job 26 preview", meta: "7s · MP4", link: "/library" },
  { title: "Nebula Drift", meta: "12s · MP4", link: "/library" },
  { title: "Midnight Market", meta: "9s · MP4", link: "/library" },
  { title: "Aurora Bloom", meta: "5s · MP4", link: "/library" },
];

const templates = [
  "A lonely lighthouse at dusk",
  "A neon city chase in rain",
  "Quiet forest morning, painterly",
  "Surreal underwater concert",
];

export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [prompt, setPrompt] = useState("A lonely lighthouse at dusk");
  const [style, setStyle] = useState("cinematic");
  const [duration, setDuration] = useState(7);

  const launchCreate = () => setShowModal(true);
  const submitPrompt = () => {
    // Keep lightweight: send user to /create to finish details
    router.push(`/create?prompt=${encodeURIComponent(prompt)}&style=${style}&duration=${duration}`);
    setShowModal(false);
  };

  return (
    <div className="space-y-12">
      <section className="grid lg:grid-cols-2 gap-8 bg-[var(--color-surface)]/70 border border-white/10 rounded-2xl p-8 shadow-lg">
        <div className="space-y-6">
          <p className="uppercase tracking-[0.25em] text-xs text-white/60">
            Illuvrse
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold">
            Your personal studio for stories, loops, and play.
          </h1>
          <p className="text-lg text-white/80">
            Turn a prompt into a short cinematic MP4 — hosted in your library
            and streamed on a LiveLoop.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={launchCreate}
              className="px-5 py-3 rounded-full bg-[var(--color-gold)] text-black font-semibold shadow-md hover:opacity-90 transition"
            >
              Create a Story
            </button>
            <Link
              href="/library"
              className="px-5 py-3 rounded-full border border-white/20 hover:bg-white/5 transition"
            >
              View Library
            </Link>
          </div>
          <div className="flex gap-3 items-center text-sm text-white/70">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Backend
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> ComfyUI
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> ElevenLabs
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center relative">
          <div className="absolute top-3 right-3 text-xs bg-white/10 px-2 py-1 rounded-full border border-white/15">
            Preview
          </div>
          <div className="w-full aspect-video bg-gradient-to-br from-black/60 to-[var(--color-primary)] flex items-center justify-center text-white/80">
            <div className="text-center space-y-2">
              <div className="text-sm uppercase tracking-[0.2em] text-white/60">
                Autoplay muted
              </div>
              <div className="text-2xl font-semibold">7s preview</div>
              <div className="text-xs text-white/50">
                Show a cached StorySphere render here
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-[var(--color-accent)]/40 transition flex flex-col gap-3"
          >
            <div className="text-sm uppercase tracking-[0.15em] text-white/50">
              {card.title}
            </div>
            <p className="text-white/80 flex-1">{card.body}</p>
            <div className="text-[var(--color-accent)] font-semibold group-hover:underline">
              {card.cta} →
            </div>
          </Link>
        ))}
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        {steps.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-2"
          >
            <div className="text-sm uppercase tracking-[0.2em] text-white/60">
              {step.title}
            </div>
            <p className="text-white/80 text-sm">{step.desc}</p>
            <button className="text-[var(--color-accent)] text-sm hover:underline">
              See example →
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold">LiveLoop</h2>
          <Link
            href="/livelLoop"
            className="text-sm px-3 py-2 rounded-full border border-white/20 hover:bg-white/5"
          >
            Watch channel
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0">
            {liveLoopItems.map((item) => (
              <div
                key={item.title}
                className="border border-white/5 bg-white/[0.03] p-4 space-y-2"
              >
                <div className="rounded-lg bg-black/30 aspect-video flex items-center justify-center text-white/60">
                  {item.title}
                </div>
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span>{item.duration}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15">
                    {item.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold">Library</h2>
          <Link
            href="/library"
            className="text-sm px-3 py-2 rounded-full border border-white/20 hover:bg-white/5"
          >
            View all
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {libraryItems.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 space-y-2 hover:border-[var(--color-accent)]/40 transition"
            >
              <div className="rounded-lg bg-black/30 aspect-video flex items-center justify-center text-white/60">
                {item.title}
              </div>
              <div className="text-sm font-semibold text-white/90">
                {item.title}
              </div>
              <div className="text-xs text-white/60">{item.meta}</div>
              <div className="flex gap-2 text-xs">
                <Link
                  href={item.link}
                  className="px-2 py-1 rounded-full bg-white/10 border border-white/15 hover:bg-white/15"
                >
                  Play
                </Link>
                <Link
                  href="/create"
                  className="px-2 py-1 rounded-full border border-white/15 hover:bg-white/10"
                >
                  Regenerate
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-serif font-bold">Quick Create</h2>
          <div className="text-sm text-white/60">
            New here? Try “A lonely lighthouse at dusk” → 7s preview.
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
            placeholder="Describe your scene..."
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-full px-4 py-2 text-sm"
            >
              <option value="cinematic">Cinematic</option>
              <option value="documentary">Documentary</option>
              <option value="short">Short</option>
            </select>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="bg-black/30 border border-white/10 rounded-full px-4 py-2 text-sm"
            >
              {[7, 15, 30, 60].map((d) => (
                <option key={d} value={d}>
                  {d}s
                </option>
              ))}
            </select>
            <div className="flex gap-2 flex-wrap">
              {templates.map((t) => (
                <button
                  key={t}
                  onClick={() => setPrompt(t)}
                  className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={submitPrompt}
              className="px-5 py-3 rounded-full bg-[var(--color-gold)] text-black font-semibold shadow-md hover:opacity-90 transition"
            >
              Create
            </button>
            <Link
              href="/create"
              className="px-5 py-3 rounded-full border border-white/20 hover:bg-white/5 transition"
            >
              Open full form
            </Link>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Create a Story</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
              placeholder="Describe your scene..."
            />
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-white/60">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded px-3 py-2"
                >
                  <option value="cinematic">Cinematic</option>
                  <option value="documentary">Documentary</option>
                  <option value="short">Short</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-white/60">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="bg-black/30 border border-white/10 rounded px-3 py-2"
                >
                  {[7, 15, 30, 60].map((d) => (
                    <option key={d} value={d}>
                      {d}s
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-white/60">Template</label>
                <select
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded px-3 py-2"
                  value=""
                >
                  <option value="" disabled>
                    Pick one
                  </option>
                  {templates.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={submitPrompt}
                className="px-5 py-2 rounded-full bg-[var(--color-gold)] text-black font-semibold shadow-md hover:opacity-90 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
