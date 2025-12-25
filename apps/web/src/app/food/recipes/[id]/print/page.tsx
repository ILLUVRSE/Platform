'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@food/lib/store';
import { Recipe } from '@food/lib/types';

export default function RecipePrintPage() {
  const { id } = useParams();
  const recipes = useStore((state) => state.recipes);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const found = recipes.find((r) => r.id === id);
    if (found) setRecipe(found);
  }, [id, recipes]);

  useEffect(() => {
    if (recipe) {
      const t = setTimeout(() => window.print(), 200);
      return () => clearTimeout(t);
    }
  }, [recipe]);

  if (!recipe) return <div className="p-8">Recipe not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6 bg-white">
      <h1 className="text-4xl font-serif font-bold text-secondary">{recipe.title}</h1>
      {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full rounded-lg border" />}
      <div>
        <h2 className="text-2xl font-serif font-semibold mb-2">Ingredients</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex gap-2 text-stone-700">
              <span className="w-32 font-semibold">
                {ing.quantity ?? ''} {ing.unit}
              </span>
              <span>{ing.item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-2xl font-serif font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-stone-700 leading-relaxed">
          {recipe.instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
