'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';
import { useInitStore } from '@/lib/useInitStore';
import { Plus, ChefHat, Sparkles, BookOpen, ListChecks, CalendarDays, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { RecipeThumbnail } from '@/components/RecipeThumbnail';

export default function Home() {
  useInitStore();
  const recipes = useStore((state) => state.recipes);
  const user = useStore((state) => state.user);
  const planner = useStore((state) => state.planner);
  const groceryList = useStore((state) => state.groceryList);
  const history = useStore((state) => state.history);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'newest' | 'alpha' | 'recentlyCooked'>('priority');
  const subtitle = useMemo(() => {
    if (!user) return "Sign in to sync your family's favorites.";
    if (recipes.length === 0) return 'Add your first recipe or scan in an old card.';
    return 'Keep Mom’s favorites organized with a warm, modern touch.';
  }, [user, recipes.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    recipes.forEach((r) => (r.tags || []).forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const lastCookedLookup = useMemo(() => {
    return history.reduce<Record<string, number>>((acc, entry) => {
      const ts = new Date(entry.cookedAt).getTime();
      acc[entry.recipeId] = Math.max(acc[entry.recipeId] || 0, ts);
      return acc;
    }, {});
  }, [history]);

  const filtered = useMemo(() => {
    const matches = recipes.filter((r) => {
      if (favoriteOnly && !r.favorite) return false;
      if (tagFilter && !(r.tags || []).includes(tagFilter)) return false;
      if (!query) return true;
      const hay = `${r.title} ${(r.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    });

    return matches.sort((a, b) => {
      switch (sortBy) {
        case 'newest': {
          const aDate = a.updatedAt || a.createdAt || '';
          const bDate = b.updatedAt || b.createdAt || '';
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }
        case 'alpha':
          return a.title.localeCompare(b.title);
        case 'recentlyCooked': {
          const aCooked = lastCookedLookup[a.id] || 0;
          const bCooked = lastCookedLookup[b.id] || 0;
          return bCooked - aCooked;
        }
        default:
          return Number(b.favorite) - Number(a.favorite);
      }
    });
  }, [recipes, query, favoriteOnly, tagFilter, sortBy, lastCookedLookup]);

  const weekStats = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const isInWeek = (dateStr: string | undefined) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };
    return {
      planned: planner.filter((p) => isInWeek(p.date)).length,
      cooked: history.filter((h) => isInWeek(h.cookedAt)).length,
    };
  }, [planner, history]);

  const statCards = useMemo(
    () => [
      {
        label: 'Recipes',
        value: recipes.length,
        hint: `${recipes.filter((r) => r.favorite).length} favorites`,
        icon: <BookOpen className="w-4 h-4" />,
      },
      {
        label: 'This week',
        value: weekStats.planned,
        hint: 'Meals planned',
        icon: <CalendarDays className="w-4 h-4" />,
      },
      {
        label: 'Cooked lately',
        value: weekStats.cooked,
        hint: 'Marked cooked',
        icon: <ChefHat className="w-4 h-4" />,
      },
      {
        label: 'Grocery items',
        value: groceryList.filter((i) => !i.checked).length,
        hint: 'Unchecked',
        icon: <ListChecks className="w-4 h-4" />,
      },
    ],
    [recipes, weekStats, groceryList]
  );

  return (
    <div className="space-y-10">
      {!mounted && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-8 text-stone-500">
          Loading Mom&apos;s Kitchen…
        </div>
      )}
      {mounted && (
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-100 via-white to-rose-100 border border-stone-200 shadow-sm p-8">
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(255,214,165,0.35),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,153,153,0.35),transparent_30%)]" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-amber-200 text-sm font-semibold text-amber-700 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Mom&apos;s Kitchen 2.0
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-secondary leading-tight">
              A cozy, HGTV-inspired recipe library
            </h1>
            <p className="text-lg text-stone-600">{subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/recipes/new"
                className="inline-flex items-center px-5 py-3 bg-primary text-white rounded-full hover:bg-secondary transition-colors shadow-md font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Recipe
              </Link>
              {!user && (
                <Link
                  href="/auth"
                  className="inline-flex items-center px-4 py-3 rounded-full border border-stone-200 bg-white text-stone-700 hover:border-primary hover:text-primary font-semibold shadow-sm"
                >
                  <ChefHat className="w-5 h-5 mr-2" />
                  Sign in
                </Link>
              )}
            </div>
          </div>
          <div className="hidden lg:flex relative">
            <div className="h-44 w-44 rounded-2xl bg-white shadow-xl border border-stone-200 rotate-3 flex flex-col items-center justify-center text-center p-4">
              <ChefHat className="w-10 h-10 text-primary mb-2" />
              <p className="text-stone-700 font-semibold">Warm, bright, and organized.</p>
              <span className="text-xs text-stone-500 mt-1">Just like Mom liked it.</span>
            </div>
          </div>
        </div>
      </section>
      )}

      {mounted && (
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5 flex flex-wrap gap-3 items-center">
        <label className="sr-only" htmlFor="recipe-search">Search recipes</label>
        <input
          id="recipe-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or tag"
          className="flex-1 min-w-[200px] px-4 py-2 border border-stone-300 rounded-full focus:ring-primary focus:border-primary"
        />
        <div className="flex items-center gap-2">
          <input
            id="favorite-only"
            type="checkbox"
            checked={favoriteOnly}
            onChange={(e) => setFavoriteOnly(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
          />
          <label htmlFor="favorite-only" className="text-sm text-stone-700">
            Favorites only
          </label>
        </div>
        <label className="text-sm text-stone-600" htmlFor="tag-filter">Tag</label>
        <select
          id="tag-filter"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="px-3 py-2 border border-stone-300 rounded-full text-sm"
        >
          <option value="">All</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <SlidersHorizontal className="w-4 h-4" />
          <label className="text-sm text-stone-600" htmlFor="sort-by">Sort</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-stone-300 rounded-full text-sm"
          >
            <option value="priority">Favorites first</option>
            <option value="newest">Newest updated</option>
            <option value="alpha">A → Z</option>
            <option value="recentlyCooked">Recently cooked</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'moms-kitchen-recipes.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-3 py-2 rounded-full border border-stone-200 text-sm hover:border-primary hover:text-primary"
        >
          Export
        </button>
        <label className="px-3 py-2 rounded-full border border-stone-200 text-sm hover:border-primary hover:text-primary cursor-pointer">
          Import
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              try {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) {
                  // @ts-ignore
                  useStore.getState().setRecipes(parsed);
                  alert('Recipes imported');
                }
              } catch {
                alert('Invalid file');
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setFavoriteOnly(false);
            setTagFilter('');
            setSortBy('priority');
          }}
          className="text-xs px-3 py-2 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
        >
          Reset filters
        </button>
      </div>
      )}

      {mounted && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white border border-stone-200 rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-secondary flex items-center justify-center">
                {card.icon}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-400">{card.label}</p>
                <p className="text-xl font-semibold text-stone-800">{card.value}</p>
                <p className="text-xs text-stone-500">{card.hint}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {mounted && history.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-2">Recently cooked</h3>
          <div className="flex flex-wrap gap-2 text-sm text-stone-600">
            {history
              .slice(-5)
              .reverse()
              .map((h) => {
                const rec = recipes.find((r) => r.id === h.recipeId);
                return (
                  <Link
                    key={`${h.recipeId}-${h.cookedAt}`}
                    href={`/recipes/${h.recipeId}`}
                    className="px-3 py-1 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
                  >
                    {rec?.title || 'Recipe'}
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {user ? (
        filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300 shadow-sm">
            <ChefHat className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-semibold text-stone-700 mb-2">
              No recipes yet
            </h3>
            <p className="text-stone-500 mb-6">Start by adding your favorite family recipes.</p>
            <Link
              href="/recipes/new"
              className="text-primary hover:text-secondary font-semibold underline"
            >
              Create your first recipe
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group block bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all ring-1 ring-transparent hover:ring-primary/20"
              >
                <RecipeThumbnail recipe={recipe} />
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-xl font-bold text-stone-800 group-hover:text-primary transition-colors">
                      {recipe.title}
                    </h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-secondary border border-amber-100">
                      {recipe.favorite ? 'Favorite' : recipe.isSample ? 'Starter card' : 'Saved recipe'}
                    </span>
                  </div>
                  {recipe.tags?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {recipe.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-[11px] rounded-full bg-stone-100 text-stone-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-center text-sm text-stone-500 gap-3">
                    <span>{recipe.ingredients.length} ingredients</span>
                    <span>•</span>
                    <span>{recipe.servings} servings</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-10 text-center space-y-4">
          <h3 className="text-2xl font-serif font-bold text-secondary">Sign in to get started</h3>
          <p className="text-stone-600">
            Create an account to save recipes and grocery lists across devices.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/auth"
              className="inline-flex items-center px-5 py-3 rounded-full bg-primary text-white font-semibold hover:bg-secondary shadow-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Go to Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
