'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { categorizeItem } from '@/lib/utils';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { useToastStore } from '@/lib/toastStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function formatLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function MealPlannerPage() {
  const recipes = useStore((state) => state.recipes);
  const planner = useStore((state) => state.planner);
  const addPlannerEntry = useStore((state) => state.addPlannerEntry);
  const updatePlannerEntry = useStore((state) => state.updatePlannerEntry);
  const removePlannerEntry = useStore((state) => state.removePlannerEntry);
  const clearPlannerForDate = useStore((state) => state.clearPlannerForDate);
  const addToGroceryList = useStore((state) => state.addToGroceryList);
  const undoPlanner = useStore((state) => state.undoPlanner);
  const redoPlanner = useStore((state) => state.redoPlanner);
  const pushToast = useToastStore((s) => s.push);

  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  const entriesByDate = useMemo(() => {
    return planner.reduce<Record<string, typeof planner>>((acc, entry) => {
      acc[entry.date] = acc[entry.date] ? [...acc[entry.date], entry] : [entry];
      return acc;
    }, {});
  }, [planner]);

  const plannedIngredients = useMemo(() => {
    const lookup = new Map(recipes.map((r) => [r.id, r]));
    const sums: Record<string, { item: string; unit: string; quantity: number | null; note?: string }> = {};
    planner.forEach((entry) => {
      const recipe = lookup.get(entry.recipeId);
      if (!recipe) return;
      recipe.ingredients.forEach((ing) => {
        const key = `${ing.item.toLowerCase()}|${ing.unit}`;
        const existing = sums[key];
        const quantity = typeof ing.quantity === 'number' ? ing.quantity : null;
        if (existing) {
          existing.quantity =
            existing.quantity !== null && quantity !== null ? existing.quantity + quantity : existing.quantity ?? quantity;
        } else {
          sums[key] = { item: ing.item, unit: ing.unit, quantity, note: `From ${recipe.title}` };
        }
      });
    });
    return Object.values(sums);
  }, [planner, recipes]);

  const handleAddWeekToGrocery = async () => {
    if (!plannedIngredients.length) return;
    const items = plannedIngredients.map((ing) => ({
      id: Math.random().toString(36).substring(7),
      item: ing.item,
      quantity: ing.quantity,
      unit: ing.unit,
      note: ing.note,
      category: categorizeItem(ing.item),
      checked: false,
    }));
    await addToGroceryList(items);
    pushToast({ message: 'Planned ingredients added to grocery list', type: 'success' });
  };

  const handleDownloadICS = () => {
    window.location.href = '/api/planner/ics';
  };

  const handleAdd = async (date: string) => {
    if (!selectedRecipe) return;
    await addPlannerEntry({
      id: Math.random().toString(36).substring(7),
      recipeId: selectedRecipe,
      date,
      prepMinutes: 0,
      reminder: '',
    });
    pushToast({ message: 'Added to planner', type: 'success' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-secondary">Meal Planner</h1>
            <p className="text-stone-500">Drop recipes into your week and auto-plan shopping.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddWeekToGrocery}
            disabled={!plannedIngredients.length}
            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold shadow-sm hover:bg-secondary disabled:opacity-50"
          >
            Add week to grocery list
          </button>
          <button
            onClick={handleDownloadICS}
            className="px-4 py-2 rounded-full border border-stone-200 text-sm font-semibold hover:border-primary hover:text-primary"
          >
            Export calendar (.ics)
          </button>
          <button
            onClick={() => window.open('/planner/print', '_blank')}
            className="px-4 py-2 rounded-full border border-stone-200 text-sm font-semibold hover:border-primary hover:text-primary"
          >
            Print/PDF
          </button>
          <button
            onClick={undoPlanner}
            className="px-3 py-1.5 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary"
          >
            Undo
          </button>
          <button
            onClick={redoPlanner}
            className="px-3 py-1.5 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary"
          >
            Redo
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setCurrentWeekStart((prev) => {
                const d = new Date(prev);
                d.setDate(d.getDate() - 7);
                return startOfWeek(d);
              })
            }
            className="px-3 py-1.5 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary"
          >
            ← Prev
          </button>
          <button
            onClick={() => setCurrentWeekStart(startOfWeek(new Date()))}
            className="px-3 py-1.5 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary"
          >
            This week
          </button>
          <button
            onClick={() =>
              setCurrentWeekStart((prev) => {
                const d = new Date(prev);
                d.setDate(d.getDate() + 7);
                return startOfWeek(d);
              })
            }
            className="px-3 py-1.5 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={selectedRecipe}
          onChange={(e) => setSelectedRecipe(e.target.value)}
          className="px-3 py-2 border border-stone-300 rounded-md"
        >
          <option value="">Select recipe</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        <span className="text-sm text-stone-500">Tap a day to add. Use arrow keys to change week, Enter to add.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map((dateObj, i) => {
          const key = formatDateKey(dateObj);
          const entries = entriesByDate[key] || [];
          return (
            <div
              key={key}
              className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3 hover:border-primary/60 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggingId) {
                  const entry = planner.find((p) => p.id === draggingId);
                  if (entry) updatePlannerEntry({ ...entry, date: key });
                  setDraggingId(null);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-stone-400">{DAYS[i]}</p>
                  <p className="font-semibold text-stone-800">{formatLabel(dateObj)}</p>
                  <label className="inline-flex items-center gap-1 text-xs text-stone-500 mt-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-stone-300 text-primary"
                      onChange={() =>
                        pushToast({
                          message: 'Marked busy night (visual only)',
                          type: 'info',
                        })
                      }
                    />
                    Busy night
                  </label>
                </div>
                <button
                  onClick={() => {
                    if (selectedRecipe) handleAdd(key);
                  }}
                  className="p-2 rounded-full bg-primary text-white hover:bg-secondary disabled:opacity-50"
                  disabled={!selectedRecipe}
                  title="Add recipe to this day"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {entries.length === 0 ? (
                <p className="text-xs text-stone-400">No meals planned</p>
              ) : (
                <ul className="space-y-2">
                  {entries.map((entry) => {
                    const recipe = recipes.find((r) => r.id === entry.recipeId);
                    return (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-stone-50 border border-stone-200"
                        draggable
                        onDragStart={() => setDraggingId(entry.id)}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-stone-800">
                            {recipe?.title || 'Recipe removed'}
                          </p>
                          <input
                            value={entry.note || ''}
                            onChange={(e) =>
                              updatePlannerEntry({ ...entry, note: e.target.value })
                            }
                            placeholder="Add note"
                            className="mt-1 w-full text-xs px-2 py-1 border border-stone-200 rounded-md"
                          />
                          <div className="flex gap-2 mt-1">
                            <input
                              type="number"
                              value={entry.prepMinutes ?? 0}
                              onChange={(e) =>
                                updatePlannerEntry({ ...entry, prepMinutes: Number(e.target.value) })
                              }
                              className="w-20 text-xs px-2 py-1 border border-stone-200 rounded-md"
                              placeholder="Prep min"
                            />
                            <input
                              value={entry.reminder || ''}
                              onChange={(e) =>
                                updatePlannerEntry({ ...entry, reminder: e.target.value })
                              }
                              className="flex-1 text-xs px-2 py-1 border border-stone-200 rounded-md"
                              placeholder="Reminder (e.g., thaw night before)"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removePlannerEntry(entry.id)}
                          className="text-stone-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            addPlannerEntry({
                              ...entry,
                              id: Math.random().toString(36).substring(7),
                              date: formatDateKey(new Date(new Date(entry.date).getTime() + 86400000)),
                            })
                          }
                          className="text-stone-400 hover:text-primary text-xs ml-2"
                        >
                          Duplicate
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {entries.length > 0 && (
                <button
                  onClick={() => clearPlannerForDate(key)}
                  className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear day
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
