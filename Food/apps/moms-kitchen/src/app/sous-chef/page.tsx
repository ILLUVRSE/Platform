'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { ChatInterface } from '@/components/ChatInterface';
import { ChefHat, Sparkles } from 'lucide-react';
import { Recipe } from '@/lib/types';
import { useInitStore } from '@/lib/useInitStore';

export default function SousChefPage() {
  useInitStore();
  const recipes = useStore((state) => state.recipes);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [preset, setPreset] = useState<string>('');
  const [tip, setTip] = useState<string>('');

  const syntheticAll: Recipe | null = useMemo(() => {
    if (!recipes.length) return null;
    return {
      id: 'all',
      title: 'All Recipes',
      servings: 4,
      ingredients: recipes.flatMap((r) => r.ingredients),
      instructions: recipes.flatMap((r) => [`From ${r.title}:`, ...r.instructions]),
    };
  }, [recipes]);

  const selectedRecipes = useMemo(() => {
    if (selectedIds.length === 0) return syntheticAll ? [syntheticAll] : [];
    if (selectedIds.includes('all') && syntheticAll) return [syntheticAll];
    return recipes.filter((r) => selectedIds.includes(r.id));
  }, [selectedIds, recipes, syntheticAll]);

  if (!recipes.length) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-3">
        <ChefHat className="w-10 h-10 text-primary mx-auto" />
        <h1 className="text-3xl font-serif font-bold text-secondary">Sous Chef</h1>
        <p className="text-stone-600">Add a recipe first so Sous Chef can walk you through.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-serif font-bold text-secondary">Sous Chef</h1>
          </div>
          <p className="text-stone-600 text-sm mb-4">
            Choose a recipe (or all of them) and Sous Chef will walk you through, answer questions,
            and suggest tips.
          </p>
          <label className="block text-sm font-semibold text-stone-700 mb-1">Recipe context</label>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedIds.includes('all')}
                onChange={(e) => setSelectedIds(e.target.checked ? ['all'] : [])}
              />
              All recipes
            </label>
            {recipes.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(r.id) || selectedIds.includes('all')}
                  onChange={(e) => {
                    if (selectedIds.includes('all')) {
                      setSelectedIds(e.target.checked ? ['all'] : [r.id]);
                      return;
                    }
                    setSelectedIds((prev) =>
                      e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                    );
                  }}
                />
                {r.title}
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-stone-700">Quick prompts</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              'Teach me step by step like a pro chef',
              'Suggest substitutions for allergens',
              'Give me timing and doneness cues',
              'How to plate this beautifully?',
            ].map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className="px-3 py-1.5 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="text-xs text-stone-500">
            Selected: {preset || 'None'}. You can paste this into chat below.
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-stone-700">Chef’s tip</h2>
          <textarea
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm"
            rows={3}
            placeholder="Add a note (e.g., oven runs hot, use cast iron, avoid overmixing)..."
          />
          <p className="text-xs text-stone-500">
            This note will be your own reminder; paste into chat if you want Sous Chef to consider it.
          </p>
        </div>
      </div>
      <div className="lg:col-span-2">
        {selectedRecipes.length > 0 && <ChatInterface recipes={selectedRecipes} sessionKey={selectedIds.join('-') || 'all'} />}
      </div>
    </div>
  );
}
