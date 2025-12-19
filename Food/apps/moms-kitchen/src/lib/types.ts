export type GroceryCategory =
  | 'produce'
  | 'dairy'
  | 'bakery'
  | 'meat'
  | 'pantry'
  | 'frozen'
  | 'beverages'
  | 'household'
  | 'other';

export interface Ingredient {
  item: string;
  quantity: number | null;
  unit: string;
  note?: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions: string[];
  servings: number;
  imageUrl?: string;
  tags?: string[];
  favorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
  shareId?: string;
  sharePin?: string;
  isPublic?: boolean;
  isSample?: boolean;
}

export interface GroceryItem {
  id: string;
  item: string;
  quantity: number | null;
  unit: string;
  note?: string;
  brand?: string;
  price?: number | null;
  category: GroceryCategory;
  checked: boolean;
}

export interface PlannerEntry {
  id: string;
  recipeId: string;
  date: string; // ISO date for the day
  note?: string;
  prepMinutes?: number;
  reminder?: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
}

export interface DatabaseShape {
  users: (User & { passwordHash: string })[];
  sessions: Session[];
  recipes: Record<string, Recipe[]>;
  grocery: Record<string, GroceryItem[]>;
  planner: Record<string, PlannerEntry[]>;
}
