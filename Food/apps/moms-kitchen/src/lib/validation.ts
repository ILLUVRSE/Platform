import { Recipe } from './types';

export function validateRecipe(recipe: Recipe) {
  if (!recipe.title || !recipe.title.trim()) {
    throw new Error('Recipe title is required.');
  }
  if (!recipe.servings || recipe.servings <= 0) {
    throw new Error('Servings must be greater than zero.');
  }
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    throw new Error('Add at least one ingredient.');
  }
  if (!Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
    throw new Error('Add at least one instruction step.');
  }

  recipe.ingredients.forEach((ing, idx) => {
    if (!ing.item || !ing.item.trim()) {
      throw new Error(`Ingredient #${idx + 1} is missing a name.`);
    }
    if (ing.quantity !== null && typeof ing.quantity === 'number' && Number.isNaN(ing.quantity)) {
      throw new Error(`Ingredient "${ing.item}" has an invalid quantity.`);
    }
  });

  recipe.instructions.forEach((step, idx) => {
    if (!step || !step.trim()) {
      throw new Error(`Instruction #${idx + 1} is empty.`);
    }
  });
}
