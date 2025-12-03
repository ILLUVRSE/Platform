import Link from "next/link";

const cards = [
  {
    title: "StorySphere",
    body: "Prompt-to-MP4 generator powered by Ollama, ElevenLabs, and ComfyUI.",
    href: "/storysphere",
    cta: "Open generator",
  },
  {
    title: "LiveLoop",
    body: "Roku-style channel grid with inline player for your queue.",
    href: "/livelLoop",
    cta: "Open channel",
  },
  {
    title: "Library",
    body: "Browse your rendered media and uploads in MinIO.",
    href: "/library",
    cta: "Open library",
  },
  {
    title: "Arcade",
    body: "Play lightweight web games in PIP-ready mode.",
    href: "/arcade",
    cta: "Open arcade",
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="bg-[var(--color-surface)]/70 border border-white/10 rounded-2xl p-8 shadow-lg">
        <p className="uppercase tracking-[0.25em] text-xs text-white/60 mb-3">
          Illuvrse
        </p>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">
          Your personal studio for stories, loops, and play.
        </h1>
        <p className="text-lg text-white/80 max-w-3xl mb-6">
          Generate scenes with StorySphere, keep everything in your own library,
          and stream or play from one place. Designed to run locally and stay
          fast.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/storysphere"
            className="px-5 py-3 rounded-full bg-[var(--color-gold)] text-black font-semibold shadow-md hover:opacity-90 transition"
          >
            Launch StorySphere
          </Link>
          <Link
            href="/library"
            className="px-5 py-3 rounded-full border border-white/20 hover:bg-white/5 transition"
          >
            View Library
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
}
