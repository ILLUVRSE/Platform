import Link from "next/link";
import { Card, PageSection, Pill, StatBadge } from "@illuvrse/ui";

const kitchenStations = [
  {
    title: "Recipe studio",
    body: "Draft, test, and version family recipes with smart substitutions, timers, and serving math."
  },
  {
    title: "Pantry sync",
    body: "Track staples, expirations, and reorders so your menu plans stay realistic."
  },
  {
    title: "Cook mode",
    body: "Step-by-step guidance with voice prompts, hands-free timers, and pause points."
  }
];

const menuFlow = [
  {
    title: "Weekly menu",
    body: "Mix favorites with new ideas and lock in prep time targets."
  },
  {
    title: "Batch day",
    body: "Group tasks by heat source, prep order, and dish overlap."
  },
  {
    title: "Shopping list",
    body: "Auto-merge ingredients with pantry inventory and substitutions."
  },
  {
    title: "Family notes",
    body: "Save ratings, allergies, and portion preferences per person."
  }
];

const highlights = [
  "AI-assisted substitutions",
  "Nutrition tags",
  "Family servings",
  "Leftover reuse"
];

export default function FoodPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <Pill className="bg-amber-50 text-amber-700">Mom Kitech</Pill>
            <h1 className="text-4xl font-semibold leading-tight">Home kitchen planning with real-world prep.</h1>
            <p className="text-lg text-slate-700">
              Build recipes, map your pantry, and plan menus with calm, step-by-step guidance. Mom
              Kitech keeps your kitchen organized so weeknight cooking feels manageable.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#recipes"
                className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
              >
                Open recipe studio
              </Link>
              <Link
                href="#menu"
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
              >
                Plan a weekly menu
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {highlights.map((item) => (
                <Pill key={item} className="bg-slate-100 text-slate-700">
                  {item}
                </Pill>
              ))}
            </div>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-card">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Today</div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <div className="text-base font-semibold text-slate-900">Weeknight veggie bowls</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span>Prep: 18 min</span>
                <span>•</span>
                <span>Serves 4</span>
              </div>
              <div className="mt-3 text-xs text-slate-500">Next step: roast veggies, start rice.</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatBadge label="Pantry" value="72% stocked" variant="neutral" />
              <StatBadge label="Timers" value="3 running" variant="warning" />
            </div>
          </div>
        </div>
      </section>

      <PageSection id="recipes" eyebrow="Kitchen stations" title="Capture, test, and refine recipes">
        <div className="grid gap-4 md:grid-cols-3">
          {kitchenStations.map((station) => (
            <Card key={station.title} title={station.title} body={<p>{station.body}</p>} />
          ))}
        </div>
      </PageSection>

      <PageSection id="menu" eyebrow="Menu flow" title="Plan the week in one pass">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {menuFlow.map((item) => (
            <Card key={item.title} title={item.title} body={<p>{item.body}</p>} />
          ))}
        </div>
      </PageSection>

      <PageSection eyebrow="Family dashboard" title="Cooking confidence for the whole house">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card
            title="Week overview"
            body={
              <div className="space-y-3">
                <p>Keep weeknights light with planned leftovers, batch prep, and kid-friendly swaps.</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <StatBadge label="Active recipes" value="18" variant="success" />
                  <StatBadge label="Menu slots" value="5 filled" variant="neutral" />
                </div>
              </div>
            }
          />
          <Card
            title="Prep checklist"
            body={
              <ul className="list-disc space-y-2 pl-4 text-sm text-slate-700">
                <li>Chop and store veggies for two meals.</li>
                <li>Cook grains for quick reheat.</li>
                <li>Portion snacks and lunches.</li>
                <li>Save leftover notes for Friday remix.</li>
              </ul>
            }
          />
        </div>
      </PageSection>
    </div>
  );
}
