import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { applyKitchenAction } from '../src/lib/kitchenLogic';
import { categorizeItem, formatQuantity } from '../src/lib/utils';
import { GroceryItem, Recipe } from '../src/lib/types';

describe('kitchen logic', () => {
  const baseRecipe: Recipe = {
    id: 'r1',
    title: 'Test Pie',
    ingredients: [{ item: 'flour', quantity: 1, unit: 'cup' }],
    instructions: ['Mix.'],
    servings: 4,
  };

  const baseItem: GroceryItem = {
    id: 'g1',
    item: 'tomato',
    quantity: 2,
    unit: 'pcs',
    category: 'produce',
    checked: false,
  };

  test('adds and removes recipes', () => {
    const withRecipe = applyKitchenAction({ recipes: [], groceryList: [], planner: [] }, { type: 'addRecipe', payload: baseRecipe });
    assert.equal(withRecipe.recipes.length, 1);
    const removed = applyKitchenAction(withRecipe, { type: 'deleteRecipe', payload: 'r1' });
    assert.equal(removed.recipes.length, 0);
  });

  test('rejects invalid recipes', () => {
    assert.throws(
      () =>
        applyKitchenAction(
          { recipes: [], groceryList: [], planner: [] },
          {
            type: 'addRecipe',
            payload: { ...baseRecipe, title: '', ingredients: [], instructions: [] },
          }
        ),
      /title is required/i
    );
  });

  test('adds grocery items and toggles them', () => {
    const added = applyKitchenAction({ recipes: [], groceryList: [], planner: [] }, { type: 'addToGroceryList', payload: [baseItem] });
    assert.equal(added.groceryList[0].category, 'produce');

    const toggled = applyKitchenAction(added, { type: 'toggleGroceryItem', payload: 'g1' });
    assert.equal(toggled.groceryList[0].checked, true);

    const cleared = applyKitchenAction(toggled, { type: 'clearChecked' });
    assert.equal(cleared.groceryList.length, 0);
  });

  test('dedupes grocery items by item + unit', () => {
    const existing = { ...baseItem, quantity: 1 };
    const incoming = { ...baseItem, id: 'g2', quantity: 2 };
    const result = applyKitchenAction(
      { recipes: [], groceryList: [existing], planner: [] },
      { type: 'addToGroceryList', payload: [incoming] }
    );
    assert.equal(result.groceryList.length, 1);
    assert.equal(result.groceryList[0].quantity, 3);
  });

  test('planner entries', () => {
    const base = { recipes: [], groceryList: [], planner: [] as any[] };
    const added = applyKitchenAction(base, { type: 'addPlannerEntry', payload: { id: 'p1', recipeId: 'r1', date: '2024-01-01' } });
    assert.equal(added.planner.length, 1);
    const removed = applyKitchenAction(added, { type: 'removePlannerEntry', payload: 'p1' });
    assert.equal(removed.planner.length, 0);
  });
});

describe('helpers', () => {
  test('categorizes groceries', () => {
    assert.equal(categorizeItem('Fresh spinach'), 'produce');
    assert.equal(categorizeItem('Butter stick'), 'dairy');
    assert.equal(categorizeItem('Random widget'), 'other');
  });

  test('formats quantities with scaling', () => {
    assert.equal(formatQuantity(2, 1), '2');
    assert.equal(formatQuantity(0.333, 1), '0.33');
    assert.equal(formatQuantity(1, 0.5), '0.5');
    assert.equal(formatQuantity(null, 2), '');
  });
});
