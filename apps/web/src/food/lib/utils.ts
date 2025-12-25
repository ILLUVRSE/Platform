import { GroceryCategory } from './types';

const CATEGORY_MAP: Record<GroceryCategory, string[]> = {
  produce: ['lettuce', 'tomato', 'onion', 'garlic', 'apple', 'banana', 'spinach', 'potato', 'carrot', 'cilantro', 'parsley', 'pepper'],
  dairy: ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'half-and-half', 'mozzarella', 'cheddar'],
  bakery: ['bread', 'bun', 'bagel', 'tortilla', 'pita'],
  meat: ['chicken', 'beef', 'pork', 'steak', 'bacon', 'ham', 'sausage', 'fish', 'salmon'],
  pantry: ['oil', 'salt', 'pepper', 'flour', 'sugar', 'rice', 'pasta', 'spice', 'herb', 'vinegar', 'broth'],
  frozen: ['frozen', 'ice cream', 'peas', 'corn', 'berries'],
  beverages: ['coffee', 'tea', 'juice', 'soda', 'wine', 'beer'],
  household: ['foil', 'soap', 'detergent', 'towel', 'bag'],
  other: [],
};

export function categorizeItem(name: string): GroceryCategory {
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP) as [GroceryCategory, string[]][]) {
    if (keywords.some((word) => lower.includes(word))) {
      return category;
    }
  }
  return 'other';
}

export function formatQuantity(quantity: number | null, scale = 1) {
  if (quantity === null || Number.isNaN(quantity)) return '';
  const scaled = quantity * scale;
  const rounded = Math.round(scaled * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return parseFloat(rounded.toFixed(2)).toString();
}

export function parseQuantity(value: string | null | undefined): number | null {
  if (!value) return null;
  const fractionMatch = value.trim().match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const whole = parseFloat(fractionMatch[1]);
    const num = parseFloat(fractionMatch[2]);
    const den = parseFloat(fractionMatch[3]) || 1;
    return whole + num / den;
  }
  const simpleFraction = value.trim().match(/^(\d+)\/(\d+)$/);
  if (simpleFraction) {
    const num = parseFloat(simpleFraction[1]);
    const den = parseFloat(simpleFraction[2]) || 1;
    return num / den;
  }
  const asNumber = parseFloat(value);
  return Number.isNaN(asNumber) ? null : asNumber;
}
