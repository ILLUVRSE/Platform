'use client';

import { Recipe } from '@food/lib/types';
import { Sparkles, Utensils } from 'lucide-react';

type Theme = {
  gradient: string;
  overlay: string;
  accent: string;
};

const THEMES: Theme[] = [
  {
    gradient: 'linear-gradient(135deg, #fff3e0 0%, #ffe0e5 40%, #dbeafe 100%)',
    overlay:
      'radial-gradient(circle at 12% 18%, rgba(255,255,255,0.55), transparent 28%), radial-gradient(circle at 80% 4%, rgba(255,255,255,0.4), transparent 28%), linear-gradient(120deg, rgba(255,255,255,0.16) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.16) 75%, transparent 75%, transparent)',
    accent: '#52796F',
  },
  {
    gradient: 'linear-gradient(135deg, #ecf7ff 0%, #e7f7ed 45%, #fff1e6 100%)',
    overlay:
      'radial-gradient(circle at 16% 26%, rgba(255,255,255,0.6), transparent 26%), radial-gradient(circle at 72% 6%, rgba(255,255,255,0.35), transparent 26%), linear-gradient(135deg, rgba(255,255,255,0.14) 20%, transparent 20%, transparent 40%, rgba(255,255,255,0.14) 40%, rgba(255,255,255,0.14) 60%, transparent 60%, transparent 80%, rgba(255,255,255,0.14) 80%, rgba(255,255,255,0.14) 100%)',
    accent: '#E6B8A2',
  },
  {
    gradient: 'linear-gradient(135deg, #fdf2f8 0%, #e0f2fe 50%, #ecfeff 100%)',
    overlay:
      'radial-gradient(circle at 10% 18%, rgba(255,255,255,0.55), transparent 30%), radial-gradient(circle at 88% 12%, rgba(255,255,255,0.42), transparent 28%), linear-gradient(160deg, rgba(255,255,255,0.18) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.18) 75%, transparent 75%, transparent)',
    accent: '#84A98C',
  },
  {
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 35%, #f5f3ff 100%)',
    overlay:
      'radial-gradient(circle at 18% 28%, rgba(255,255,255,0.6), transparent 24%), radial-gradient(circle at 78% -4%, rgba(255,255,255,0.4), transparent 25%), linear-gradient(140deg, rgba(255,255,255,0.16) 22%, transparent 22%, transparent 44%, rgba(255,255,255,0.16) 44%, rgba(255,255,255,0.16) 66%, transparent 66%, transparent 88%, rgba(255,255,255,0.16) 88%, rgba(255,255,255,0.16) 100%)',
    accent: '#F59E0B',
  },
];

const BADGES = [
  'Recipe box favorite',
  'Sunday supper ready',
  'Weeknight hero',
  'Family classic',
  'Cozy comfort pick',
];

function hashSeed(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickTheme(seed: number) {
  return THEMES[seed % THEMES.length];
}

export function RecipeThumbnail({ recipe }: { recipe: Recipe }) {
  const seed = hashSeed(recipe.id + recipe.title);
  const theme = pickTheme(seed);
  const badge = BADGES[seed % BADGES.length];
  const initial = recipe.title.slice(0, 1).toUpperCase();

  if (recipe.imageUrl) {
    return (
      <div className="relative h-52 overflow-hidden">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 text-xs font-semibold text-secondary shadow-sm backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          {badge}
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-white/85 text-[11px] font-semibold text-secondary shadow-sm backdrop-blur-sm">
            {recipe.ingredients.length} ingredients
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-secondary/80 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
            {recipe.servings} servings
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-52 overflow-hidden"
      style={{
        backgroundImage: `${theme.overlay}, ${theme.gradient}`,
        backgroundSize: '180% 180%, cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-white/0" />
      <div className="absolute -left-8 -bottom-10 h-32 w-32 rounded-full bg-white/30 blur-3xl" />
      <div className="absolute right-3 top-6 h-16 w-16 rounded-full border border-white/50 bg-white/20 rotate-12" />

      <div className="relative h-full flex flex-col justify-between p-4 text-secondary">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/80 border border-white/70 shadow-inner flex items-center justify-center text-secondary font-serif text-xl font-bold backdrop-blur-sm">
              {initial}
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-secondary/70">Recipe card</p>
              <p className="text-sm font-semibold text-secondary/90">From Mom&apos;s box</p>
            </div>
          </div>
          <div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold shadow-sm border border-white/60 bg-white/80 backdrop-blur-sm"
            style={{ color: theme.accent }}
          >
            <Utensils className="w-4 h-4" />
            {badge}
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-secondary/70">Ingredients</p>
            <p className="text-lg font-semibold text-secondary">{recipe.ingredients.length}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-white/80 text-secondary text-xs font-semibold shadow-sm border border-white/70 backdrop-blur-sm">
              {recipe.servings} servings
            </div>
            <div className="px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm border border-white/60 bg-secondary/90 text-white backdrop-blur-sm">
              Cozy & bright
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
