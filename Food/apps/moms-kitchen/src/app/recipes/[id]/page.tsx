'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Recipe, GroceryItem } from '@/lib/types';
import { ArrowLeft, ShoppingBasket, Users, Trash2, Share2, Printer, Play, Pause, PenLine, Star } from 'lucide-react';
import Link from 'next/link';
import { ChatInterface } from '@/components/ChatInterface';
import { categorizeItem, formatQuantity } from '@/lib/utils';
import { useRouter as useNavigation } from 'next/navigation';
import { useToastStore } from '@/lib/toastStore';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const nav = useNavigation();
  const recipes = useStore((state) => state.recipes);
  const addToGroceryList = useStore((state) => state.addToGroceryList);
  const deleteRecipe = useStore((state) => state.deleteRecipe);
  const addPlannerEntry = useStore((state) => state.addPlannerEntry);
  const updateRecipeShare = useStore((state) => state.updateRecipeShare);
  const updateRecipe = useStore((state) => state.updateRecipe);
  const addCookHistory = useStore((state) => state.addCookHistory);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [scale, setScale] = useState(1); // 1 = original, 2 = double, 0.5 = half, etc.
  const [mounted, setMounted] = useState(false);
  const [cookMode, setCookMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharePin, setSharePin] = useState('');
  const pushToast = useToastStore((s) => s.push);

  useEffect(() => {
    setMounted(true);
    const found = recipes.find((r) => r.id === id);
    if (found) {
      setRecipe(found);
      setSharePin(found.sharePin || '');
    }
  }, [id, recipes]);

  useEffect(() => {
    if (!timerRunning || timer <= 0) return;
    const t = setInterval(() => setTimer((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [timerRunning, timer]);

  if (!mounted) return null;
  if (!recipe) return <div className="text-center py-20">Recipe not found</div>;

  const scaledServings = Math.round(recipe.servings * scale);

  const handleAddToGrocery = async () => {
    const items: GroceryItem[] = recipe.ingredients.map((ing) => ({
      id: Math.random().toString(36).substring(7),
      item: ing.item,
      quantity: ing.quantity !== null ? ing.quantity * scale : null,
      unit: ing.unit,
      note: ing.note,
      category: categorizeItem(ing.item),
      checked: false,
    }));
    await addToGroceryList(items);
    pushToast({ message: 'Added ingredients to grocery list', type: 'success' });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      await deleteRecipe(recipe.id);
      router.push('/');
    }
  };

  const handleShareToggle = () => {
    if (!recipe) return;
    updateRecipeShare(recipe.id, !recipe.isPublic, sharePin || undefined).then((updatedRecipes) => {
      const newRec = updatedRecipes.find((r) => r.id === recipe.id);
      if (newRec) {
        setRecipe(newRec);
        setSharePin(newRec.sharePin || '');
      }
    });
  };

  const handleFavoriteToggle = async () => {
    if (!recipe) return;
    const next = { ...recipe, favorite: !recipe.favorite };
    await updateRecipe(next);
    setRecipe(next);
  };

  const shareUrl =
    recipe.shareId && typeof window !== 'undefined'
      ? `${window.location.origin}/recipes/share/${recipe.shareId}`
      : null;

  const handleCookNext = () => setCurrentStep((prev) => Math.min(prev + 1, recipe.instructions.length - 1));
  const handleCookPrev = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleAddToPlanner = async () => {
    const today = new Date();
    await addPlannerEntry({
      id: Math.random().toString(36).substring(7),
      recipeId: recipe.id,
      date: today.toISOString().slice(0, 10),
    });
    nav.push('/meal-planner');
  };

  const handleMarkCooked = () => {
    addCookHistory(recipe.id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center text-stone-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Recipes
            </Link>
             <div className="flex items-center gap-3">
                <button
                  onClick={handleShareToggle}
                  className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
                >
                  <Share2 className="w-4 h-4" />
                  {recipe.isPublic ? 'Public' : 'Share'}
                </button>
                <input
                  value={sharePin}
                  onChange={(e) => setSharePin(e.target.value)}
                  placeholder="Optional PIN"
                  className="px-2 py-1 border border-stone-200 rounded-md text-sm w-28"
                />
                <button
                  onClick={handleMarkCooked}
                  className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
                >
                  Cooked
                </button>
                <button
                  onClick={handleFavoriteToggle}
                  aria-label={recipe.favorite ? 'Remove from favorites' : 'Mark as favorite'}
                  className={`inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border ${
                    recipe.favorite ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-stone-200 text-stone-700'
                  } hover:border-primary hover:text-primary`}
                >
                  <Star className="w-4 h-4 fill-current" />
                  {recipe.favorite ? 'Favorited' : 'Favorite'}
                </button>
                <Link
                  href={`/recipes/new?edit=${recipe.id}`}
                  className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
                >
                  <PenLine className="w-4 h-4" /> Edit
                </Link>
                <Link
                  href={`/recipes/${recipe.id}/print`}
                  className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
                >
                  <Printer className="w-4 h-4" /> Print
                </Link>
                {shareUrl && (
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(shareUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
                  >
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  aria-label="Delete recipe"
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
             </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
             {recipe.imageUrl && (
                <div className="h-64 w-full bg-stone-100 relative">
                     <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                </div>
             )}
            <div className="p-8">
                <h1 className="text-4xl font-serif font-bold text-secondary mb-4">{recipe.title}</h1>
                {recipe.tags?.length ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                
                <div className="flex flex-wrap gap-4 items-center mb-8 py-4 border-y border-stone-100">
                    <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-full border border-stone-200">
                        <Users className="w-4 h-4 text-stone-500" />
                        <span className="font-medium text-stone-700">{scaledServings} Servings</span>
                    </div>
                    <button
                      onClick={() => setCookMode((prev) => !prev)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary"
                    >
                      <Play className="w-4 h-4" /> {cookMode ? 'Exit Cook Mode' : 'Cook mode'}
                    </button>
                    <button
                      onClick={handleAddToPlanner}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary"
                    >
                      Add to week
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-stone-500 font-medium">Scale:</span>
                        <div className="flex bg-stone-50 rounded-lg p-1 border border-stone-200">
                            <button 
                                onClick={() => setScale(0.5)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${scale === 0.5 ? 'bg-white shadow-sm font-semibold text-primary' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                0.5x
                            </button>
                            <button 
                                onClick={() => setScale(1)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${scale === 1 ? 'bg-white shadow-sm font-semibold text-primary' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                1x
                            </button>
                            <button 
                                onClick={() => setScale(2)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${scale === 2 ? 'bg-white shadow-sm font-semibold text-primary' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                2x
                            </button>
                             <button 
                                onClick={() => setScale(4)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${scale === 4 ? 'bg-white shadow-sm font-semibold text-primary' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                4x
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                         <h2 className="text-2xl font-serif font-bold text-stone-800">Ingredients</h2>
                         <button 
                            onClick={handleAddToGrocery}
                            className="inline-flex items-center text-sm font-medium text-primary hover:text-secondary"
                        >
                            <ShoppingBasket className="w-4 h-4 mr-1" /> Add to List
                         </button>
                    </div>
                    <ul className="space-y-3">
                        {recipe.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-start pb-3 border-b border-stone-100 last:border-0">
                                <span className="font-bold text-secondary w-24 text-right mr-4 flex-shrink-0">
                                    {formatQuantity(ing.quantity, scale)} {ing.unit}
                                </span>
                                <span className="text-stone-700">{ing.item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-serif font-bold text-stone-800 mb-4">Instructions</h2>
                    {cookMode ? (
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-stone-500">
                            Step {currentStep + 1} of {recipe.instructions.length}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setTimer((t) => t + 60)}
                              className="px-3 py-1 rounded-full border border-stone-200 text-sm"
                            >
                              +1m timer
                            </button>
                            <button
                              onClick={() => setTimerRunning((r) => !r)}
                              className="px-3 py-1 rounded-full border border-stone-200 text-sm"
                            >
                              {timerRunning ? <Pause className="w-4 h-4 inline" /> : <Play className="w-4 h-4 inline" />} Timer {timer}s
                            </button>
                          </div>
                        </div>
                        <p className="text-lg leading-relaxed text-stone-800">{recipe.instructions[currentStep]}</p>
                        <div className="flex justify-between">
                          <button
                            onClick={handleCookPrev}
                            className="px-4 py-2 rounded-full border border-stone-200 text-sm disabled:opacity-50"
                            disabled={currentStep === 0}
                          >
                            Previous
                          </button>
                          <button
                            onClick={handleCookNext}
                            className="px-4 py-2 rounded-full border border-stone-200 text-sm disabled:opacity-50"
                            disabled={currentStep === recipe.instructions.length - 1}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                          {recipe.instructions.map((step, i) => (
                              <div key={i} className="flex gap-4">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-100 text-stone-500 font-serif font-bold flex items-center justify-center">
                                      {i + 1}
                                  </div>
                                  <p className="text-stone-700 leading-relaxed mt-1">{step}</p>
                              </div>
                          ))}
                      </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Sidebar - Sous Chef */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
            <ChatInterface recipes={[recipe]} sessionKey={recipe.id} />
        </div>
      </div>
    </div>
  );
}
