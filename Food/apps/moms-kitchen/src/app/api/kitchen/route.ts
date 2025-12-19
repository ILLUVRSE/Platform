import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getUserData, saveUserData } from '@/lib/server/db';
import { applyKitchenAction, KitchenAction } from '@/lib/kitchenLogic';
import { GroceryItem, Recipe, PlannerEntry } from '@/lib/types';

type Action =
  | 'load'
  | 'addRecipe'
  | 'updateRecipe'
  | 'deleteRecipe'
  | 'updateRecipeShare'
  | 'addToGroceryList'
  | 'toggleGroceryItem'
  | 'removeGroceryItem'
  | 'clearGroceryList'
  | 'clearChecked'
  | 'addPlannerEntry'
  | 'updatePlannerEntry'
  | 'removePlannerEntry'
  | 'clearPlannerForDate';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await getUserData(user.id);
  return NextResponse.json({ ...data });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, payload } = await req.json();
  const data = await getUserData(user.id);

  const kitchenAction: KitchenAction | null = (() => {
    switch (action as Action) {
      case 'addRecipe':
        return { type: 'addRecipe', payload: payload as Recipe };
      case 'updateRecipe':
        return { type: 'updateRecipe', payload: payload as Recipe };
      case 'deleteRecipe':
        return { type: 'deleteRecipe', payload: payload as string };
      case 'updateRecipeShare':
        return { type: 'updateRecipeShare', payload: payload as { id: string; isPublic: boolean; shareId?: string; sharePin?: string } };
      case 'addToGroceryList':
        return { type: 'addToGroceryList', payload: payload as GroceryItem[] };
      case 'toggleGroceryItem':
        return { type: 'toggleGroceryItem', payload: payload as string };
      case 'removeGroceryItem':
        return { type: 'removeGroceryItem', payload: payload as string };
      case 'clearGroceryList':
        return { type: 'clearGroceryList' };
      case 'clearChecked':
        return { type: 'clearChecked' };
      case 'addPlannerEntry':
        return { type: 'addPlannerEntry', payload: payload as PlannerEntry };
      case 'updatePlannerEntry':
        return { type: 'updatePlannerEntry', payload: payload as PlannerEntry };
      case 'removePlannerEntry':
        return { type: 'removePlannerEntry', payload: payload as string };
      case 'clearPlannerForDate':
        return { type: 'clearPlannerForDate', payload: payload as string };
      default:
        return null;
    }
  })();

  if (kitchenAction) {
    try {
      const updated = applyKitchenAction(data, kitchenAction);
      data.recipes = updated.recipes;
      data.groceryList = updated.groceryList;
      data.planner = updated.planner;
    } catch (err: any) {
      const message = err?.message || 'Invalid data';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  await saveUserData(user.id, data.recipes, data.groceryList, data.planner);
  return NextResponse.json({ ...data });
}
