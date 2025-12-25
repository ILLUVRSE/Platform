'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@food/lib/store';
import { format } from 'date-fns';

export default function PlannerPrintPage() {
  const planner = useStore((state) => state.planner);
  const recipes = useStore((state) => state.recipes);
  const [ready, setReady] = useState(false);

  const entriesByDate = useMemo(() => {
    return planner.reduce<Record<string, typeof planner>>((acc, entry) => {
      acc[entry.date] = acc[entry.date] ? [...acc[entry.date], entry] : [entry];
      return acc;
    }, {});
  }, [planner]);

  useEffect(() => {
    if (planner.length) {
      const t = setTimeout(() => window.print(), 200);
      setReady(true);
      return () => clearTimeout(t);
    }
  }, [planner]);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6 bg-white">
      <h1 className="text-3xl font-serif font-bold text-secondary">Meal Planner</h1>
      {Object.entries(entriesByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, entries]) => (
          <div key={date} className="border border-stone-200 rounded-lg p-4 space-y-2">
            <h2 className="text-xl font-semibold text-stone-800">
              {format(new Date(date), 'EEE, MMM d')}
            </h2>
            <ul className="space-y-1">
              {entries.map((entry) => {
                const rec = recipes.find((r) => r.id === entry.recipeId);
                return (
                  <li key={entry.id} className="text-stone-700 text-sm">
                    {rec?.title || 'Recipe'} {entry.note ? `– ${entry.note}` : ''}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      {!planner.length && <p>No entries to print.</p>}
      {!ready && <p className="text-stone-500 text-sm">Preparing print…</p>}
    </div>
  );
}
