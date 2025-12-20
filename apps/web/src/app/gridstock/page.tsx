import Link from "next/link";
import { Card, PageSection, Pill, StatBadge } from "@illuvrse/ui";

const terminalModules = [
  {
    title: "Live dashboards",
    body: "Multi-pane layouts for watchlists, heatmaps, and alerts you can pin per desk."
  },
  {
    title: "Charting",
    body: "Indicators, overlays, and scenario lines with exportable snapshots."
  },
  {
    title: "News tape",
    body: "Headline stream tied to tickers, themes, and saved theses."
  },
  {
    title: "Portfolio board",
    body: "Track positions, risk bands, and upcoming catalysts in one view."
  }
];

const researchFlow = [
  {
    title: "Thesis builder",
    body: "Capture the why, the risk, and the trigger before you trade."
  },
  {
    title: "Scenario cards",
    body: "Map bull, base, and bear outcomes with confidence levels."
  },
  {
    title: "Signal journal",
    body: "Log what moved and what you learned for tighter feedback loops."
  }
];

const signalHighlights = [
  "Macro calendar",
  "Earnings watch",
  "Sector momentum",
  "Custom alerts"
];

export default function GridstockPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <Pill className="bg-teal-50 text-teal-700">Gridstock</Pill>
            <h1 className="text-4xl font-semibold leading-tight">A market terminal built for modern desks.</h1>
            <p className="text-lg text-slate-700">
              Gridstock blends live dashboards, research workflows, and signal tracking so you can
              move from idea to execution with clarity.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#dashboards"
                className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
              >
                Explore dashboards
              </Link>
              <Link
                href="#research"
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
              >
                Review research flow
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {signalHighlights.map((item) => (
                <Pill key={item} className="bg-slate-100 text-slate-700">
                  {item}
                </Pill>
              ))}
            </div>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-card">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Market pulse</div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <div className="text-base font-semibold text-slate-900">US equities</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span>Volatility: steady</span>
                <span>•</span>
                <span>Risk: medium</span>
              </div>
              <div className="mt-3 text-xs text-slate-500">Top movers: Semis, Energy, AI infra.</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatBadge label="Latency" value="98 ms" variant="success" />
              <StatBadge label="Alerts" value="12 live" variant="warning" />
            </div>
          </div>
        </div>
      </section>

      <PageSection id="dashboards" eyebrow="Terminal" title="Modules that fit your desk">
        <div className="grid gap-4 md:grid-cols-2">
          {terminalModules.map((module) => (
            <Card key={module.title} title={module.title} body={<p>{module.body}</p>} />
          ))}
        </div>
      </PageSection>

      <PageSection id="research" eyebrow="Research" title="Ideas with clear risk framing">
        <div className="grid gap-4 md:grid-cols-3">
          {researchFlow.map((item) => (
            <Card key={item.title} title={item.title} body={<p>{item.body}</p>} />
          ))}
        </div>
      </PageSection>

      <PageSection eyebrow="Ops" title="Signal coverage that stays organized">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card
            title="Signal stack"
            body={
              <div className="space-y-3">
                <p>Pin catalysts, merge alerts, and highlight what changed so you can act fast.</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <StatBadge label="Tracked tickers" value="42" variant="neutral" />
                  <StatBadge label="Catalysts" value="9 this week" variant="success" />
                </div>
              </div>
            }
          />
          <Card
            title="Desk checklist"
            body={
              <ul className="list-disc space-y-2 pl-4 text-sm text-slate-700">
                <li>Confirm thesis and risk before orders.</li>
                <li>Log triggers and exit criteria.</li>
                <li>Review post-trade notes nightly.</li>
                <li>Archive learnings by sector.</li>
              </ul>
            }
          />
        </div>
      </PageSection>
    </div>
  );
}
