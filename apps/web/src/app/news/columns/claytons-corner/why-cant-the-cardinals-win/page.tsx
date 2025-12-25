import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

const pageTitle = "Why Can't the Cardinals Win?";
const pageDescription =
  'Clayton breaks down the quiet issues holding St. Louis back: run prevention, late-inning clarity, and a lineup that drifts into streaks.';
const heroImage =
  'https://images.unsplash.com/photo-1508804185872-c9573e5334f3?auto=format&fit=crop&w=1800&q=80';
const inlineImage =
  'https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1600&q=80';

export const metadata: Metadata = {
  title: `${pageTitle} • Clayton's Corner`,
  description: pageDescription,
  alternates: {
    canonical: '/news/columns/claytons-corner/why-cant-the-cardinals-win',
  },
  openGraph: {
    title: `${pageTitle} • Clayton's Corner`,
    description: pageDescription,
    url: '/news/columns/claytons-corner/why-cant-the-cardinals-win',
    images: [{ url: heroImage, alt: pageTitle }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${pageTitle} • Clayton's Corner`,
    description: pageDescription,
    images: [heroImage],
  },
};

const keyFactors = [
  {
    title: 'Run prevention is leaking',
    detail:
      'The infield range and first-step reads are a half-beat late, turning clean innings into stressful ones.',
  },
  {
    title: 'The lineup lives on streaks',
    detail:
      'Too many hitters are chasing early-count contact, leaving the middle of the order empty in tight games.',
  },
  {
    title: 'Late innings lack a script',
    detail:
      'When the bullpen is asked for four or five outs, roles blur and leverage decisions get noisy.',
  },
];

const swingIdeas = [
  'Commit to a defensive alignment that values range over raw arm strength.',
  'Stretch the lineup by emphasizing on-base at the top and contact at the bottom.',
  'Shorten rotation turns for the weakest slot and give the bullpen a cleaner bridge.',
  'Push the bench into more high-leverage spots to keep starters fresh.',
];

export default function ClaytonsCornerCardinalsColumn() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)', color: 'var(--text)' }}>
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
          <Link href="/news/videos" className="text-lg font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
            ILLUVRSE Sports
          </Link>
          <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]" style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}>
            Clayton&apos;s Corner
          </span>
        </div>
      </header>

      <article className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
          <span>Column</span>
          <span className="rounded-full border px-3 py-1" style={{ borderColor: 'var(--border)' }}>
            MLB
          </span>
          <span className="rounded-full border px-3 py-1" style={{ borderColor: 'var(--border)' }}>
            St. Louis
          </span>
          <span className="rounded-full border px-3 py-1" style={{ borderColor: 'var(--border)' }}>
            7 min read
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <h1 className="text-4xl font-black leading-tight md:text-5xl" style={{ color: 'var(--forest)' }}>
            {pageTitle}
          </h1>
          <p className="text-base md:text-lg" style={{ color: 'var(--text)' }}>
            St. Louis keeps flashing enough talent to win the division, yet the same problems pull them back to the middle.
            The Cardinals are not broken, but they are unfocused in the places that decide close series.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
            <span>By Clayton</span>
            <span>Oct 2024</span>
            <span>Busch Stadium lens</span>
          </div>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-3xl border" style={{ borderColor: 'var(--border)' }}>
          <div className="relative aspect-[16/9] w-full">
            <Image src={heroImage} alt="Baseball field under stadium lights" fill sizes="100vw" className="object-cover" />
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6 text-base leading-7" style={{ color: 'var(--text)' }}>
            <p>
              Every week, the Cardinals look like a team that should stack wins. They are deep enough, smart enough,
              and experienced enough to press an edge. Then the inning that should be quiet turns messy, the rally dies on
              a chase, or the bullpen has to stretch one inning too far. It is not one fatal flaw. It is a collection of
              small losses.
            </p>
            <p>
              When a team lives on the margins, the margin is everything. St. Louis keeps spending those margins on
              defense that feels safe instead of dynamic and an offense that swings early instead of building pressure.
              The roster is full of capable hitters, but the approach is too often single swing, single pitch.
            </p>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--forest)' }}>
              The defense does not travel
            </h2>
            <p>
              The infield arms are real, yet range has not matched the reputation. When ground balls leak through, it
              multiplies the workload for a staff that already lives in traffic. The Cardinals are better when they trade
              a little arm strength for better angles and cleaner first steps.
            </p>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--forest)' }}>
              The lineup is powerful, but predictable
            </h2>
            <p>
              St. Louis can score in chunks, but the rhythm feels choppy. They are hunting fastballs early and leaving
              too many counts shallow. The best version of this lineup is one that wins two and three run innings, not
              just the four run outburst.
            </p>
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
              <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                Clayton&apos;s read
              </p>
              <p className="mt-2 text-base" style={{ color: 'var(--text)' }}>
                The Cardinals are a playoff team on paper, but the paper does not show how many small outs are left on
                the field each night.
              </p>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                Key factors
              </p>
              <div className="mt-3 space-y-3">
                {keyFactors.map((factor) => (
                  <div key={factor.title}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
                      {factor.title}
                    </p>
                    <p className="text-sm leading-6" style={{ color: 'var(--text)' }}>
                      {factor.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                Series watch
              </p>
              <div className="mt-3 space-y-2 text-sm" style={{ color: 'var(--text)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: 'var(--forest)' }}>
                    Cardinals vs. Cubs
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                    division tone
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: 'var(--forest)' }}>
                    Cardinals at Brewers
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                    bullpen test
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <figure className="mt-10 overflow-hidden rounded-3xl border" style={{ borderColor: 'var(--border)' }}>
          <div className="relative aspect-[3/2] w-full">
            <Image src={inlineImage} alt="Baseball on the infield dirt" fill sizes="100vw" className="object-cover" />
          </div>
          <figcaption className="border-t px-4 py-3 text-xs uppercase tracking-[0.2em]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            St. Louis needs steadier execution in the infield to keep innings clean.
          </figcaption>
        </figure>

        <div className="mt-10 space-y-6 text-base leading-7" style={{ color: 'var(--text)' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--forest)' }}>
            The rotation has to set the tone
          </h2>
          <p>
            The Cardinals are at their best when the starter controls the pace and the bullpen can plan the final six
            outs. When the rotation struggles to reach the sixth, every reliever is used in the wrong spot and matchups
            become reactive. That is where games swing away.
          </p>
          <p>
            A softer landing for the weakest rotation slot would help. The team has options, but it takes a clear decision
            to shorten a start and protect the final innings. Right now the hesitation shows.
          </p>

          <h2 className="text-2xl font-bold" style={{ color: 'var(--forest)' }}>
            What has to change next
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            {swingIdeas.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>

          <p>
            The Cardinals are not far. They are just stuck in the zone where talent keeps you close, but clarity wins the
            series. The fixes are not dramatic. They are specific. Pick a defensive identity, extend the lineup, and
            protect the late innings with conviction. If St. Louis does those three things, this looks less like a
            mystery and more like a map.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
              More from Clayton&apos;s Corner
            </p>
            <p className="text-base font-semibold" style={{ color: 'var(--forest)' }}>
              Weekly reads on the teams shaping the season.
            </p>
          </div>
          <Link
            href="/news/videos"
            className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition hover:-translate-y-[1px]"
            style={{ borderColor: 'var(--forest)', color: 'var(--forest)', background: 'rgba(62,95,80,0.08)' }}
          >
            Back to Sports →
          </Link>
        </div>
      </article>
    </main>
  );
}
