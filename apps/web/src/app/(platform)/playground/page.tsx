import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ILLUVRSE Playground",
  description: "Tokyo-meets-Venice Business Park with hive towers that link into ILLUVRSE surfaces.",
};

export default function PlaygroundPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">ILLUVRSE Playground</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">ILLUVRSE Business Park</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          A Tokyo-meets-Venice campus where every tower routes into an ILLUVRSE surface. Navigate the park, enter
          a building, and open its workspace in a new tab. Wumpa Island Rift now lives in{" "}
          <a className="font-semibold text-teal-600 hover:text-teal-700" href="/games/wumpa-island/index.html">
            GameGrid
          </a>
          .
        </p>
      </section>

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[78vh] w-[100vw] overflow-hidden border-y border-slate-200 bg-slate-900">
        <iframe
          title="ILLUVRSE Playground"
          src="/playground/index.html"
          className="h-full w-full"
          allowFullScreen
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-card">
        <p>Controls: WASD to move, drag to look, press E or Enter to enter a building, click kiosks to select agents.</p>
      </section>
    </div>
  );
}
