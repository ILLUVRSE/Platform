import { Card, PageSection, Pill, StatBadge } from "@illuvrse/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-slate-700 text-cream">Settings</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Studio + operator settings</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-200/90">
          End-user settings live here; operator controls mirror the Control-Panel: maintenance
          toggle, kernel target, agent endpoints, and notes.
        </p>
      </section>

      <PageSection eyebrow="Studio" title="Local preferences">
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Storage mode" body={<p>Local-first with optional cloud sync.</p>} />
          <Card title="Default duration" body={<p>7s previews; 24s finals.</p>} />
          <Card title="Captions" body={<p>Auto-enable captions for new renders.</p>} />
        </div>
      </PageSection>

      <PageSection eyebrow="Operator" title="Control-Panel mirror">
        <div className="grid gap-4 md:grid-cols-3">
          <StatBadge label="Maintenance" value="Off" variant="success" />
          <StatBadge label="Kernel target" value="prod" variant="neutral" />
          <StatBadge label="Notes" value="Ready for canary" variant="warning" />
        </div>
      </PageSection>
    </div>
  );
}
