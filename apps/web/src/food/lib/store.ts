import { create } from 'zustand';
import { GroceryItem, Recipe, User, PlannerEntry } from './types';
import { logEvent } from './telemetry';

const CACHE_KEY = 'mk_cached_data';
const API_KEY_STORAGE = 'mk_api_key';

const SAMPLE_RECIPE: Recipe = {
  id: 'sample-open-grocery',
  title: 'Open Grocery List',
  servings: 2,
  ingredients: [
    { item: 'Milk', quantity: 1, unit: 'qt' },
    { item: 'Eggs', quantity: 6, unit: 'pcs' },
    { item: 'Bread', quantity: 1, unit: 'loaf' },
  ],
  instructions: [
    'Use this starter recipe to practice adding items to your Grocery List.',
    'Ask Sous Chef to add these ingredients, or add your own below.',
    'Replace this sample by creating your first real recipe.',
  ],
  tags: ['sample'],
  isSample: true,
};

type APIAction =
  | { action: 'addRecipe'; payload: Recipe }
  | { action: 'updateRecipe'; payload: Recipe }
  | { action: 'deleteRecipe'; payload: string }
  | { action: 'updateRecipeShare'; payload: { id: string; isPublic: boolean; shareId?: string; sharePin?: string } }
  | { action: 'addToGroceryList'; payload: GroceryItem[] }
  | { action: 'toggleGroceryItem'; payload: string }
  | { action: 'removeGroceryItem'; payload: string }
  | { action: 'clearGroceryList'; payload?: undefined }
  | { action: 'clearChecked'; payload?: undefined }
  | { action: 'addPlannerEntry'; payload: PlannerEntry }
  | { action: 'updatePlannerEntry'; payload: PlannerEntry }
  | { action: 'removePlannerEntry'; payload: string }
  | { action: 'clearPlannerForDate'; payload: string };

interface KitchenStore {
  user: User | null;
  recipes: Recipe[];
  groceryList: GroceryItem[];
  planner: PlannerEntry[];
  plannerUndo: PlannerEntry[][];
  plannerRedo: PlannerEntry[][];
  history: { recipeId: string; cookedAt: string }[];
  loading: boolean;
  initialized: boolean;
  apiKey: string;
  init: () => Promise<void>;
  setApiKey: (key: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addRecipe: (recipe: Recipe) => Promise<void>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  addToGroceryList: (items: GroceryItem[]) => Promise<void>;
  toggleGroceryItem: (id: string) => Promise<void>;
  removeGroceryItem: (id: string) => Promise<void>;
  clearGroceryList: () => Promise<void>;
  clearCheckedItems: () => Promise<void>;
  addPlannerEntry: (entry: PlannerEntry) => Promise<void>;
  updatePlannerEntry: (entry: PlannerEntry) => Promise<void>;
  removePlannerEntry: (id: string) => Promise<void>;
  clearPlannerForDate: (date: string) => Promise<void>;
  addCookHistory: (recipeId: string) => void;
  undoPlanner: () => void;
  redoPlanner: () => void;
  updateRecipeShare: (id: string, isPublic: boolean, sharePin?: string) => Promise<Recipe[]>;
  setRecipes: (recipes: Recipe[]) => void;
}

function persistCache(get: () => KitchenStore) {
  if (typeof window === 'undefined') return;
  const state = get();
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      recipes: state.recipes,
      groceryList: state.groceryList,
      planner: state.planner,
      history: state.history,
    })
  );
}

async function callKitchenAPI(body: APIAction) {
  const res = await fetch('/food/api/kitchen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Kitchen API error (status ${res.status})`);
  }
  return res.json();
}

async function loadKitchenData() {
  const res = await fetch('/food/api/kitchen', { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Unauthorized');
  }
  return res.json();
}

export const useStore = create<KitchenStore>((set, get) => ({
  user: null,
  recipes: [],
  groceryList: [],
  planner: [],
  plannerUndo: [],
  plannerRedo: [],
  history: [],
  loading: false,
  initialized: false,
  apiKey: '',

  setApiKey: (key) => {
    set({ apiKey: key });
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE, key);
    }
  },

  init: async () => {
    if (get().initialized || get().loading) return;
    set({ loading: true });
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            set({
              recipes: parsed.recipes || [],
              groceryList: parsed.groceryList || [],
              planner: parsed.planner || [],
              history: parsed.history || [],
            });
          } catch {
            // ignore bad cache
          }
        }
      }
      const userRes = await fetch('/food/api/auth/me', { credentials: 'include' });
      if (userRes.ok) {
        const { user } = await userRes.json();
        set({ user });
        try {
          const data = await loadKitchenData();
          set({ recipes: data.recipes, groceryList: data.groceryList, planner: data.planner || [] });
          persistCache(get);
          if ((data.recipes || []).length === 0) {
            set((prev) => ({ ...prev, recipes: [SAMPLE_RECIPE] }));
          }
        } catch {
          // ignore load errors until user signs in
        }
      }
      if (typeof window !== 'undefined') {
        const savedKey = localStorage.getItem(API_KEY_STORAGE) || '';
        if (savedKey) set({ apiKey: savedKey });
      }
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    const res = await fetch('/food/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    if (!res.ok) {
      set({ loading: false });
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
    const { user } = await res.json();
    set({ user });
    const data = await loadKitchenData();
    set({ recipes: data.recipes, groceryList: data.groceryList, planner: data.planner || [], loading: false });
    persistCache(get);
  },

  register: async (email, password) => {
    set({ loading: true });
    const res = await fetch('/food/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    if (!res.ok) {
      set({ loading: false });
      const data = await res.json();
      throw new Error(data.error || 'Registration failed');
    }
    const { user } = await res.json();
    set({ user });
    set({ recipes: [], groceryList: [], planner: [], loading: false });
    persistCache(get);
  },

  logout: async () => {
    await fetch('/food/api/auth/logout', { method: 'POST', credentials: 'include' });
    set({ user: null, recipes: [], groceryList: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
  },

  addRecipe: async (recipe) => {
    const data = await callKitchenAPI({ action: 'addRecipe', payload: recipe });
    set({ recipes: data.recipes, planner: data.planner || [] });
    persistCache(get);
    logEvent('addRecipe', { id: recipe.id });
  },

  updateRecipe: async (recipe) => {
    const data = await callKitchenAPI({ action: 'updateRecipe', payload: recipe });
    set({ recipes: data.recipes, planner: data.planner || [] });
    persistCache(get);
    logEvent('updateRecipe', { id: recipe.id });
  },

  deleteRecipe: async (id) => {
    const data = await callKitchenAPI({ action: 'deleteRecipe', payload: id });
    set({ recipes: data.recipes, planner: data.planner || [] });
    persistCache(get);
    logEvent('deleteRecipe', { id });
  },

  addToGroceryList: async (items) => {
    const prev = get().groceryList;
    set({ groceryList: [...prev, ...items] });
    try {
      const data = await callKitchenAPI({ action: 'addToGroceryList', payload: items });
      set({ groceryList: data.groceryList });
      persistCache(get);
      logEvent('addToGrocery', { count: items.length });
    } catch (error) {
      set({ groceryList: prev });
      throw error;
    }
  },

  toggleGroceryItem: async (id) => {
    const prev = get().groceryList;
    set({
      groceryList: prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    });
    try {
      const data = await callKitchenAPI({ action: 'toggleGroceryItem', payload: id });
      set({ groceryList: data.groceryList });
      persistCache(get);
      logEvent('toggleGrocery', { id });
    } catch (error) {
      set({ groceryList: prev });
      throw error;
    }
  },

  removeGroceryItem: async (id) => {
    const prev = get().groceryList;
    set({ groceryList: prev.filter((item) => item.id !== id) });
    try {
      const data = await callKitchenAPI({ action: 'removeGroceryItem', payload: id });
      set({ groceryList: data.groceryList });
      persistCache(get);
      logEvent('removeGrocery', { id });
    } catch (error) {
      set({ groceryList: prev });
      throw error;
    }
  },

  clearGroceryList: async () => {
    const prev = get().groceryList;
    set({ groceryList: [] });
    try {
      const data = await callKitchenAPI({ action: 'clearGroceryList' });
      set({ groceryList: data.groceryList });
      persistCache(get);
      logEvent('clearGrocery');
    } catch (error) {
      set({ groceryList: prev });
      throw error;
    }
  },

  clearCheckedItems: async () => {
    const prev = get().groceryList;
    set({ groceryList: prev.filter((item) => !item.checked) });
    try {
      const data = await callKitchenAPI({ action: 'clearChecked' });
      set({ groceryList: data.groceryList });
      persistCache(get);
      logEvent('clearCheckedGrocery');
    } catch (error) {
      set({ groceryList: prev });
      throw error;
    }
  },

  addPlannerEntry: async (entry) => {
    const prev = get().planner;
    const nowHistory = { recipeId: entry.recipeId, cookedAt: new Date().toISOString() };
    set({
      plannerUndo: [...get().plannerUndo, prev],
      plannerRedo: [],
      planner: [...prev, entry],
      history: [...get().history, nowHistory],
    });
    try {
      const data = await callKitchenAPI({ action: 'addPlannerEntry', payload: entry });
      set({ planner: data.planner || [] });
      persistCache(get);
      logEvent('addPlannerEntry', { recipeId: entry.recipeId, date: entry.date });
    } catch (error) {
      set({ planner: prev, history: get().history.filter((h) => h !== nowHistory) });
      throw error;
    }
  },

  removePlannerEntry: async (id) => {
    const prev = get().planner;
    set({ plannerUndo: [...get().plannerUndo, prev], plannerRedo: [], planner: prev.filter((p) => p.id !== id) });
    try {
      const data = await callKitchenAPI({ action: 'removePlannerEntry', payload: id });
      set({ planner: data.planner || [] });
      persistCache(get);
    } catch (error) {
      set({ planner: prev });
      throw error;
    }
  },

  updatePlannerEntry: async (entry) => {
    const prev = get().planner;
    set({ plannerUndo: [...get().plannerUndo, prev], plannerRedo: [], planner: prev.map((p) => (p.id === entry.id ? entry : p)) });
    try {
      const data = await callKitchenAPI({ action: 'updatePlannerEntry', payload: entry });
      set({ planner: data.planner || [] });
      persistCache(get);
      logEvent('updatePlannerEntry', { recipeId: entry.recipeId, date: entry.date });
    } catch (error) {
      set({ planner: prev });
      throw error;
    }
  },

  clearPlannerForDate: async (date) => {
    const prev = get().planner;
    set({ plannerUndo: [...get().plannerUndo, prev], plannerRedo: [], planner: prev.filter((p) => p.date !== date) });
    try {
      const data = await callKitchenAPI({ action: 'clearPlannerForDate', payload: date });
      set({ planner: data.planner || [] });
      persistCache(get);
      logEvent('clearPlannerDate', { date });
    } catch (error) {
      set({ planner: prev });
      throw error;
    }
  },

  addCookHistory: (recipeId) => {
    const entry = { recipeId, cookedAt: new Date().toISOString() };
    set({ history: [...get().history, entry] });
    persistCache(get);
  },

  undoPlanner: () => {
    const undoStack = get().plannerUndo;
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    const current = get().planner;
    set({
      planner: prev,
      plannerUndo: undoStack.slice(0, -1),
      plannerRedo: [...get().plannerRedo, current],
    });
    persistCache(get);
  },

  redoPlanner: () => {
    const redoStack = get().plannerRedo;
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    const current = get().planner;
    set({
      planner: next,
      plannerRedo: redoStack.slice(0, -1),
      plannerUndo: [...get().plannerUndo, current],
    });
    persistCache(get);
  },

  updateRecipeShare: async (id, isPublic, sharePin) => {
    const current = get().recipes.find((r) => r.id === id);
    const shareId = current?.shareId || Math.random().toString(36).substring(2, 9);
    const data = await callKitchenAPI({
      action: 'updateRecipeShare',
      payload: { id, isPublic, shareId, sharePin },
    });
    set({ recipes: data.recipes });
    persistCache(get);
    return data.recipes;
  },

  setRecipes: (recipes) => {
    set({ recipes });
    persistCache(get);
  },
})); 
