'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Recipe, Ingredient } from '@/lib/types';
import { scanRecipeImage, generateRecipeThumbnail } from '@/app/actions';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { clsx } from 'clsx';
import { parseQuantity } from '@/lib/utils';

export default function NewRecipePage() {
  const router = useRouter();
  const addRecipe = useStore((state) => state.addRecipe);
  const recipes = useStore((state) => state.recipes);
  const updateRecipe = useStore((state) => state.updateRecipe);
  const user = useStore((state) => state.user);
  const storeLoading = useStore((state) => state.loading);
  const apiKey = useStore((state) => state.apiKey);
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [title, setTitle] = useState('');
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { item: '', quantity: null, unit: '', note: '' },
  ]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [thumbnailPrompt, setThumbnailPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsAuth = !user && !storeLoading;

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    if (!apiKey) {
      setError('Add your OpenAI API key in Settings before scanning.');
      return;
    }
    
    setScanning(true);
    const files = Array.from(e.target.files);
    const formData = new FormData();
    files.forEach((f) => formData.append('file', f));
    formData.append('apiKey', apiKey);

    // Create a local preview from first file
    const reader = new FileReader();
    reader.onloadend = () => {
        setImageUrl(reader.result as string);
    }
    reader.readAsDataURL(files[0]);

    try {
      const result = await scanRecipeImage(formData);
      if (result.data) {
        setTitle(result.data.title);
        const mappedIngredients = result.data.ingredients.map((ing: any) => ({
          item: ing.item || ing.name || '',
          quantity: parseQuantity(ing.quantity) ?? parseQuantity(ing.amount) ?? null,
          unit: ing.unit || '',
          note: ing.note || '',
        }));
        setIngredients(mappedIngredients);
        setInstructions(result.data.instructions);
        setServings(result.data.servings);
      } else {
        alert('Could not scan recipe. ' + (result.error || ''));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to scan image. Check your API key and try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!user) {
      setError('Please sign in to save recipes.');
      setLoading(false);
      return;
    }
    if (!title.trim()) {
      setError('Recipe title is required.');
      setLoading(false);
      return;
    }
    const filteredIngredients = ingredients.filter((i) => i.item.trim() !== '');
    const filteredInstructions = instructions.filter((i) => i.trim() !== '');
    if (!filteredIngredients.length) {
      setError('Add at least one ingredient.');
      setLoading(false);
      return;
    }
    if (!filteredInstructions.length) {
      setError('Add at least one instruction.');
      setLoading(false);
      return;
    }
    const now = new Date().toISOString();
    const base: Recipe = {
      id: editId || Math.random().toString(36).substring(7),
      title,
      ingredients: filteredIngredients,
      instructions: filteredInstructions,
      servings,
      imageUrl,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      favorite,
      createdAt: editId ? recipes.find((r) => r.id === editId)?.createdAt || now : now,
      updatedAt: now,
    };
    try {
      if (editId) {
        await updateRecipe(base);
      } else {
        await addRecipe(base);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Could not save recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = (files: FileList | null) => {
    if (!files?.length) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(files[0]);
  };

  const handleGenerateThumbnail = async () => {
    setThumbnailError(null);
    if (!apiKey) {
      setThumbnailError('Add your OpenAI API key in Settings before generating a thumbnail.');
      return;
    }
    setGenerating(true);
    const stylishPrompt =
      thumbnailPrompt.trim() ||
      `A cozy, natural light photo of ${title || 'a family recipe'} plated on rustic dishware, styled like a warm cooking magazine cover.`;
    try {
      const result = await generateRecipeThumbnail({ prompt: stylishPrompt, apiKey });
      if (result.imageUrl) {
        setImageUrl(result.imageUrl);
      } else {
        setThumbnailError(result.error || 'Image generation returned no artwork.');
      }
    } catch (err) {
      console.error(err);
      setThumbnailError('Image generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!editId) return;
    const existing = recipes.find((r) => r.id === editId);
    if (!existing) return;
    setTitle(existing.title);
    setServings(existing.servings);
    setIngredients(existing.ingredients.length ? existing.ingredients : [{ item: '', quantity: null, unit: '', note: '' }]);
    setInstructions(existing.instructions.length ? existing.instructions : ['']);
    setImageUrl(existing.imageUrl || '');
    setTagsInput((existing.tags || []).join(', '));
    setFavorite(!!existing.favorite);
  }, [editId, recipes]);

  const addIngredient = () => {
    setIngredients([...ingredients, { item: '', quantity: null, unit: '', note: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: field === 'quantity' ? (value ? Number(value) : null) : value,
    };
    setIngredients(newIngredients);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  if (needsAuth) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center space-y-4">
        <h1 className="text-3xl font-serif font-bold text-secondary">Sign in to save recipes</h1>
        <p className="text-stone-600">
          Create an account first so we can sync your recipes across devices.
        </p>
        <button
          onClick={() => router.push('/auth')}
          className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-primary text-white font-semibold hover:bg-secondary shadow-sm"
        >
          Go to account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-serif font-bold text-secondary mb-8">Add New Recipe</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 mb-8">
        <h2 className="text-xl font-serif font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" /> Scan from Image
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Upload a photo of a recipe card or cookbook page, and we'll fill in the details for you.
        </p>
        <div className="flex items-center gap-4">
            <input 
                type="file" 
                accept="image/*"
                capture="environment"
                onChange={handleScan}
                className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-secondary
                cursor-pointer"
                disabled={scanning}
            />
            {scanning && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
        </div>
        {imageUrl && (
            <div className="mt-4 relative h-48 w-full">
                <img src={imageUrl} alt="Preview" className="h-full object-contain rounded-md border border-stone-200" />
            </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 mb-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-semibold text-stone-900">Thumbnail & Cover</h2>
            <p className="text-sm text-stone-500">Upload a hero photo or generate one with AI to represent this recipe.</p>
          </div>
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="text-sm text-red-500 hover:text-red-600 transition-colors"
            >
              Clear thumbnail
            </button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-[200px,1fr]">
          <div className="h-48 w-full rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden relative">
            {imageUrl ? (
              <img src={imageUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-stone-400">
                <Upload className="w-5 h-5" />
                <span className="text-xs">Preview</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-stone-700 block mb-1">Upload custom image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleThumbnailUpload(e.target.files)}
                className="block w-full text-sm text-stone-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-stone-200 file:text-stone-700
                  hover:file:bg-stone-300 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-700 block mb-1">Generate with AI</label>
              <textarea
                value={thumbnailPrompt}
                onChange={(e) => setThumbnailPrompt(e.target.value)}
                placeholder="Describe the mood, plateware, lighting, etc."
                className="w-full h-24 rounded-2xl border border-stone-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:ring-primary/40 focus:outline-none"
              />
              <p className="text-xs text-stone-400 mt-1">
                Prompt fallback uses the recipe title so feel free to customize before generating.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  disabled={generating}
                  onClick={handleGenerateThumbnail}
                  className="inline-flex items-center px-4 py-2 rounded-full bg-primary text-white font-semibold shadow-sm hover:bg-secondary transition-colors disabled:opacity-60"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Generating…
                    </>
                  ) : (
                    'Generate image'
                  )}
                </button>
                <span className="text-xs text-stone-500">Uses your OpenAI key (set in Settings)</span>
              </div>
              {thumbnailError && <p className="text-xs text-red-500 mt-2">{thumbnailError}</p>}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-stone-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-primary focus:border-primary"
            placeholder="e.g., Mom's Lasagna"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
          <input
            type="number"
            required
            value={servings}
            onChange={(e) => setServings(parseInt(e.target.value))}
            className="w-32 px-4 py-2 border border-stone-300 rounded-md focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., weeknight, vegetarian, family"
              className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-primary focus:border-primary"
            />
            <p className="text-xs text-stone-500 mt-1">Separate with commas to help filtering.</p>
          </div>
          <div className="flex items-end gap-2">
            <input
              id="favorite-toggle"
              type="checkbox"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
              className="h-5 w-5 rounded border-stone-300 text-primary focus:ring-primary"
            />
            <label htmlFor="favorite-toggle" className="text-sm font-medium text-gray-700">
              Mark as favorite
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
          <div className="space-y-3">
            {ingredients.map((ing, index) => (
              <div key={index} className="flex gap-2 items-start">
                <input
                  type="text"
                  placeholder="Qty"
                  value={ing.quantity ?? ''}
                  onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                  className="w-20 px-3 py-2 border border-stone-300 rounded-md"
                />
                 <input
                  type="text"
                  placeholder="Unit"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  className="w-24 px-3 py-2 border border-stone-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Item name"
                  value={ing.item}
                  onChange={(e) => updateIngredient(index, 'item', e.target.value)}
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={ing.note || ''}
                  onChange={(e) => updateIngredient(index, 'note', e.target.value)}
                  className="w-36 px-3 py-2 border border-stone-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredient}
              className="flex items-center gap-2 text-sm text-primary hover:text-secondary font-medium"
            >
              <Plus className="w-4 h-4" /> Add Ingredient
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
          <div className="space-y-3">
            {instructions.map((inst, index) => (
              <div key={index} className="flex gap-2 items-start">
                <span className="mt-3 text-sm text-gray-400 w-6">{index + 1}.</span>
                <textarea
                  value={inst}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-md"
                  rows={2}
                  placeholder="Describe this step..."
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
             <button
              type="button"
              onClick={addInstruction}
              className="flex items-center gap-2 text-sm text-primary hover:text-secondary font-medium"
            >
              <Plus className="w-4 h-4" /> Add Step
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="pt-6 border-t border-stone-200 flex justify-end">
            <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary text-white rounded-full hover:bg-secondary transition-colors font-medium shadow-sm"
            >
                {loading ? 'Saving...' : 'Save Recipe'}
            </button>
        </div>
      </form>
    </div>
  );
}
