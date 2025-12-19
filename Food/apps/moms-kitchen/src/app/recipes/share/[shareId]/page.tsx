'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Recipe } from '@/lib/types';
import Link from 'next/link';
import { ChefHat, Printer } from 'lucide-react';

export default function SharedRecipePage() {
  const { shareId } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/public/recipes/${shareId}?pin=${pin || ''}`);
        if (!res.ok) throw new Error('Recipe not found or PIN required');
        const data = await res.json();
        setRecipe(data.recipe);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Recipe not found');
      }
    };
    load();
  }, [shareId, pin]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
        <p className="text-xl font-serif font-bold text-secondary">Oops</p>
        <p className="text-stone-600">{error}</p>
        <div className="flex gap-2 justify-center">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="px-3 py-2 border border-stone-300 rounded-md"
          />
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 rounded-full bg-primary text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 print:max-w-full print:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-primary" />
          <div>
            <p className="text-xs text-stone-500 uppercase">Shared from Mom's Kitchen</p>
            <h1 className="text-3xl font-serif font-bold text-secondary">{recipe.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-200 text-sm hover:border-primary hover:text-primary"
          >
            View in app
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-200 text-sm hover:border-primary hover:text-primary print:hidden"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {recipe.imageUrl && (
        <div className="h-64 rounded-xl overflow-hidden border border-stone-200">
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xl font-serif font-semibold mb-3">Ingredients</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex gap-2 text-stone-700">
                <span className="w-32 font-semibold text-secondary">
                  {ing.quantity ?? ''} {ing.unit}
                </span>
                <span>{ing.item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-serif font-semibold mb-3">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-stone-700 leading-relaxed">
            {recipe.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          nav,
          footer,
          .print\\:hidden {
            display: none !important;
          }
          .border,
          .shadow-sm,
          .shadow-2xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
