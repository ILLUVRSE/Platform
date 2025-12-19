'use client';

import { useEffect, useMemo, useState } from 'react';
import { useInitStore } from '@/lib/useInitStore';
import { useStore } from '@/lib/store';
import { Trash2, CheckSquare, Square, ShoppingCart, Wallet, Filter, BarChart2, ListChecks } from 'lucide-react';
import { categorizeItem, formatQuantity } from '@/lib/utils';
import { GroceryCategory, GroceryItem } from '@/lib/types';
import { useToastStore } from '@/lib/toastStore';

const CATEGORY_OPTIONS: GroceryCategory[] = ['produce', 'dairy', 'bakery', 'meat', 'pantry', 'frozen', 'beverages', 'household', 'other'];

export default function GroceryListPage() {
  useInitStore();
  const {
    groceryList,
    toggleGroceryItem,
    removeGroceryItem,
    clearGroceryList,
    clearCheckedItems,
    addToGroceryList,
    user,
    loading,
    initialized,
  } = useStore();
  const [mounted, setMounted] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newQuantity, setNewQuantity] = useState<string>('');
  const [newUnit, setNewUnit] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<GroceryCategory | ''>('');
  const pushToast = useToastStore((s) => s.push);

  const itemSuggestions = useMemo(() => {
    const set = new Set<string>();
    groceryList.forEach((item) => {
      const trimmed = item.item.trim();
      if (trimmed) set.add(trimmed);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [groceryList]);

  const unitSuggestions = useMemo(() => {
    const set = new Set<string>();
    groceryList.forEach((item) => {
      const trimmed = item.unit.trim();
      if (trimmed) set.add(trimmed);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [groceryList]);

  const safeAction = async (fn: () => Promise<void>, successMessage?: string) => {
    try {
      await fn();
      if (successMessage) {
        setFeedback({ type: 'success', message: successMessage });
        pushToast({ message: successMessage, type: 'success' });
      }
    } catch (error) {
      const msg = 'Something went wrong. Please try again.';
      setFeedback({ type: 'error', message: msg });
      pushToast({ message: msg, type: 'error' });
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const uncheckedItems = useMemo(() => groceryList.filter((item) => !item.checked), [groceryList]);
  const checkedItems = useMemo(() => groceryList.filter((item) => item.checked), [groceryList]);

  const visibleUnchecked = useMemo(
    () => (categoryFilter ? uncheckedItems.filter((item) => item.category === categoryFilter) : uncheckedItems),
    [uncheckedItems, categoryFilter]
  );

  const grouped = useMemo(() => {
    return visibleUnchecked.reduce<Record<string, GroceryItem[]>>((acc, item) => {
      const cat = item.category || 'other';
      acc[cat] = acc[cat] ? [...acc[cat], item] : [item];
      return acc;
    }, {});
  }, [visibleUnchecked]);

  const estimatedRemaining = useMemo(
    () => visibleUnchecked.reduce((sum, item) => sum + (item.price || 0), 0),
    [visibleUnchecked]
  );

  const estimatedPurchased = useMemo(
    () => checkedItems.reduce((sum, item) => sum + (item.price || 0), 0),
    [checkedItems]
  );

  const categoryCounts = useMemo(() => {
    return uncheckedItems.reduce<Record<GroceryCategory, number>>((acc, item) => {
      const key = item.category || 'other';
      acc[key as GroceryCategory] = (acc[key as GroceryCategory] || 0) + 1;
      return acc;
    }, {} as Record<GroceryCategory, number>);
  }, [uncheckedItems]);

  const largestCategory = useMemo(() => {
    const [name, count] = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0] || [];
    return name ? { name, count } : null;
  }, [categoryCounts]);

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const payload: GroceryItem = {
      id: Math.random().toString(36).substring(7),
      item: newItem,
      quantity: newQuantity ? Number(newQuantity) : null,
      unit: newUnit,
      note: newNote,
      brand: newBrand,
      price: newPrice ? Number(newPrice) : null,
      category: categorizeItem(newItem),
      checked: false,
    };
    await safeAction(() => addToGroceryList([payload]), 'Item added to grocery list');
    setNewItem('');
    setNewQuantity('');
    setNewUnit('');
    setNewNote('');
    setNewBrand('');
    setNewPrice('');
  };

  if (!mounted) return null;

  if (!initialized || loading) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-stone-200 p-10 text-center space-y-4">
        <h1 className="text-2xl font-serif font-bold text-secondary">Loading your groceries…</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-stone-200 p-10 text-center space-y-4">
        <h1 className="text-3xl font-serif font-bold text-secondary">Sign in to see your list</h1>
        <p className="text-stone-600">
          Grocery items sync to your account. Sign in to keep them across devices.
        </p>
        <a
          href="/auth"
          className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-primary text-white font-semibold hover:bg-secondary shadow-sm"
        >
          Go to Account
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {feedback && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          {feedback.message}
        </div>
      )}
      <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-secondary flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" /> Grocery List
          </h1>
          <p className="text-stone-500 mt-2">
            {uncheckedItems.length} items to buy • suggestions remember what you&apos;ve added before.
          </p>
        </div>

        {groceryList.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (confirm('Remove checked items?')) safeAction(() => clearCheckedItems());
              }}
              className="text-stone-500 hover:text-stone-700 text-sm font-medium flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Clear Checked
            </button>
            <button
              onClick={() => {
                if (confirm('Clear all items?')) safeAction(() => clearGroceryList());
              }}
              className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 text-primary flex items-center justify-center">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-400">Active items</p>
            <p className="text-xl font-semibold text-stone-800">{visibleUnchecked.length}</p>
            <p className="text-xs text-stone-500">
              {largestCategory ? `${largestCategory.count} in ${largestCategory.name}` : 'Organized by aisle'}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-400">Est. remaining</p>
            <p className="text-xl font-semibold text-stone-800">${estimatedRemaining.toFixed(2)}</p>
            <p className="text-xs text-stone-500">
              {estimatedRemaining > 0 ? 'Based on entered prices' : 'Add prices to track budget'}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-400">Purchased</p>
            <p className="text-xl font-semibold text-stone-800">{checkedItems.length}</p>
            <p className="text-xs text-stone-500">
              Spent about ${estimatedPurchased.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <Filter className="w-4 h-4" />
          <label className="text-sm text-stone-600" htmlFor="category-filter">Aisle</label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter((e.target.value as GroceryCategory) || '')}
            className="px-3 py-2 border border-stone-300 rounded-full text-sm"
          >
            <option value="">All aisles</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {categoryFilter && (
            <button
              type="button"
              onClick={() => setCategoryFilter('')}
              className="text-xs px-3 py-1.5 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-xs text-stone-500">
          Estimations use prices you add on each line. Filters don&apos;t remove items—just hide other aisles.
        </p>
      </div>

      <form
        onSubmit={handleAddCustom}
        className="mb-8 bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-3"
      >
        <p className="text-xs text-stone-500">
          Smart add: start typing to reuse past items and units. Categories still auto-detect.
        </p>
        <div className="flex flex-wrap gap-3">
          <input
            className="flex-1 min-w-[140px] px-3 py-2 border border-stone-300 rounded-md"
            placeholder="Add item"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            list="grocery-item-suggestions"
            autoComplete="off"
          />
          <datalist id="grocery-item-suggestions">
            {itemSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <input
            className="w-24 px-3 py-2 border border-stone-300 rounded-md"
            placeholder="Qty"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            type="number"
            step="0.1"
          />
          <input
            className="w-24 px-3 py-2 border border-stone-300 rounded-md"
            placeholder="Unit"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            list="grocery-unit-suggestions"
            autoComplete="off"
          />
          <datalist id="grocery-unit-suggestions">
            {unitSuggestions.map((unit) => (
              <option key={unit} value={unit} />
            ))}
          </datalist>
          <input
            className="flex-1 min-w-[150px] px-3 py-2 border border-stone-300 rounded-md"
            placeholder="Notes"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <input
            className="w-32 px-3 py-2 border border-stone-300 rounded-md"
            placeholder="Brand"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
          />
          <input
            className="w-24 px-3 py-2 border border-stone-300 rounded-md"
            placeholder="$"
            type="number"
            step="0.01"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-secondary shadow-sm"
          >
            Add
          </button>
        </div>
      </form>

      {groceryList.length === 0 ? (
        <div className="text-center py-20 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          <p className="text-stone-500">Your list is empty. Add ingredients from your recipes!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* To Buy */}
          {visibleUnchecked.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                  <div className="px-4 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wider bg-stone-50 border-b border-stone-200">
                    {cat}
                  </div>
                  <ul className="divide-y divide-stone-100">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center p-4 hover:bg-stone-50 transition-colors group"
                      >
                        <button
                          onClick={() => safeAction(() => toggleGroceryItem(item.id))}
                          className="flex items-center flex-1 gap-4 text-left"
                        >
                          <Square className="w-5 h-5 text-stone-400 group-hover:text-primary" />
                          <div className="flex flex-col">
                            <span className="text-lg text-stone-800 font-medium">{item.item}</span>
                            <span className="text-xs text-stone-500">
                              {[item.brand, formatQuantity(item.quantity), item.unit, item.note]
                                .filter(Boolean)
                                .join(' ')}
                              {item.price ? ` • $${item.price.toFixed(2)}` : ''}
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={() => safeAction(() => removeGroceryItem(item.id))}
                          aria-label={`Remove ${item.item}`}
                          className="p-2 text-stone-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-500">
              {categoryFilter ? (
                <>
                  No items in this aisle.
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('')}
                    className="ml-2 text-primary font-semibold hover:text-secondary"
                  >
                    Show all
                  </button>
                </>
              ) : (
                'All unchecked items are done!'
              )}
            </div>
          )}

          {/* Completed */}
          {checkedItems.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 ml-2">
                Checked Off
              </h3>
              <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden opacity-75">
                <ul className="divide-y divide-stone-200/50">
                  {checkedItems.map((item) => (
                    <li key={item.id} className="flex items-center p-4">
                      <button
                        onClick={() => safeAction(() => toggleGroceryItem(item.id))}
                        className="flex items-center flex-1 gap-4 text-left"
                      >
                        <CheckSquare className="w-5 h-5 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-lg text-stone-500 line-through decoration-stone-400">
                            {item.item}
                          </span>
                          <span className="text-xs text-stone-400">
                            {[item.brand, formatQuantity(item.quantity), item.unit, item.note]
                              .filter(Boolean)
                              .join(' ')}
                            {item.price ? ` • $${item.price.toFixed(2)}` : ''}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={() => safeAction(() => removeGroceryItem(item.id))}
                        aria-label={`Remove ${item.item}`}
                        className="p-2 text-stone-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3">
                <p className="text-xs text-stone-500 mb-2">Buy again</p>
                <div className="flex flex-wrap gap-2">
                  {checkedItems.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        safeAction(() =>
                          addToGroceryList([
                            {
                              ...item,
                              id: Math.random().toString(36).substring(7),
                              checked: false,
                            },
                          ])
                        )
                      }
                      className="px-3 py-1.5 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary text-xs"
                    >
                      {item.item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
