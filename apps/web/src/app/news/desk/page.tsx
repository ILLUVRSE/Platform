import AutoAgentForm from '@news/components/AutoAgentForm';
import { getSetting } from '@news/lib/settings';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DeskPage() {
  const safeMode = await getSetting('safe_mode');
  const safeModeEnabled = safeMode === 'on';

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-12">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
          Desk
        </p>
        <h1 className="text-4xl font-black" style={{ color: 'var(--forest)' }}>
          ILLUVRSE AI Agent
        </h1>
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          Auto-generate news & feature stories with context-aware prompts. Set your OpenAI API key on
          the{' '}
          <Link href="/news/openai-key" className="font-semibold underline">
            API page
          </Link>
          , then enter a topic below to publish instantly.
        </p>
      </div>

      {safeModeEnabled && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          Safe mode is enabled. AI generation is paused until an admin turns it off.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <AutoAgentForm
          articleType="news"
          label="News"
          description="Drop quick hits and verified dispatches."
          disabled={safeModeEnabled}
          notice={safeModeEnabled ? 'Disabled while safe mode is on.' : undefined}
        />
        <AutoAgentForm
          articleType="feature"
          label="Features"
          description="Craft longform essays, interviews, and deep dives."
          disabled={safeModeEnabled}
          notice={safeModeEnabled ? 'Disabled while safe mode is on.' : undefined}
        />
      </div>
    </main>
  );
}
