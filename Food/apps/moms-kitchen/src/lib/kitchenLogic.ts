import { GroceryItem, PlannerEntry, Recipe } from './types';
import { validateRecipe } from './validation';

export type KitchenAction =
  | { type: 'addRecipe'; payload: Recipe }
  | { type: 'updateRecipe'; payload: Recipe }
  | { type: 'deleteRecipe'; payload: string }
  | { type: 'updateRecipeShare'; payload: { id: string; isPublic: boolean; shareId?: string; sharePin?: string } }
  | { type: 'addToGroceryList'; payload: GroceryItem[] }
  | { type: 'toggleGroceryItem'; payload: string }
  | { type: 'removeGroceryItem'; payload: string }
  | { type: 'clearGroceryList' }
  | { type: 'clearChecked' }
  | { type: 'addPlannerEntry'; payload: PlannerEntry }
  | { type: 'updatePlannerEntry'; payload: PlannerEntry }
  | { type: 'removePlannerEntry'; payload: string }
  | { type: 'clearPlannerForDate'; payload: string };

export interface KitchenData {
  recipes: Recipe[];
  groceryList: GroceryItem[];
  planner: PlannerEntry[];
}

function dedupeGroceryList(existing: GroceryItem[], incoming: GroceryItem[]) {
  const map = new Map<string, GroceryItem>();

  const upsert = (item: GroceryItem) => {
    const key = `${item.item.toLowerCase()}|${(item.unit || '').toLowerCase()}`;
    const current = map.get(key);
    if (!current) {
      map.set(key, { ...item });
      return;
    }

    const mergedQuantity =
      current.quantity !== null && item.quantity !== null
        ? current.quantity + item.quantity
        : current.quantity ?? item.quantity ?? null;

    map.set(key, {
      ...current,
      quantity: mergedQuantity,
      note: current.note || item.note,
      brand: current.brand || item.brand,
      price: current.price ?? item.price ?? null,
      checked: current.checked && item.checked,
    });
  };

  [...existing, ...incoming].forEach((item) => upsert(item));
  return Array.from(map.values());
}

export function applyKitchenAction(data: KitchenData, action: KitchenAction): KitchenData {
  switch (action.type) {
    case 'addRecipe':
      validateRecipe(action.payload);
      return { ...data, recipes: [...data.recipes, action.payload] };
    case 'updateRecipe':
      validateRecipe(action.payload);
      return {
        ...data,
        recipes: data.recipes.map((r) => (r.id === action.payload.id ? action.payload : r)),
      };
    case 'deleteRecipe':
      return { ...data, recipes: data.recipes.filter((r) => r.id !== action.payload) };
    case 'updateRecipeShare':
      return {
        ...data,
        recipes: data.recipes.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        ),
      };
    case 'addToGroceryList': {
      const normalized = action.payload.map((item) => ({
        ...item,
        category: item.category || 'other',
      }));
      return { ...data, groceryList: dedupeGroceryList(data.groceryList, normalized) };
    }
    case 'toggleGroceryItem':
      return {
        ...data,
        groceryList: data.groceryList.map((item) =>
          item.id === action.payload ? { ...item, checked: !item.checked } : item
        ),
      };
    case 'removeGroceryItem':
      return { ...data, groceryList: data.groceryList.filter((item) => item.id !== action.payload) };
    case 'clearGroceryList':
      return { ...data, groceryList: [] };
    case 'clearChecked':
      return { ...data, groceryList: data.groceryList.filter((item) => !item.checked) };
    case 'addPlannerEntry':
      return { ...data, planner: [...data.planner, action.payload] };
    case 'updatePlannerEntry':
      return {
        ...data,
        planner: data.planner.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };
    case 'removePlannerEntry':
      return { ...data, planner: data.planner.filter((p) => p.id !== action.payload) };
    case 'clearPlannerForDate':
      return { ...data, planner: data.planner.filter((p) => p.date !== action.payload) };
    default:
      return data;
  }
}
