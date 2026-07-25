export type MenuItem = {
  id: string;
  name: string;
  unit: 'kg' | 'L';
  minimumStock: number;
};

export type BranchItemRequest = {
  menuItemId: string;
  currentStock: number;
  requestedQuantity: number;
};

export type Branch = {
  id: string;
  name: string;
  isCentralKitchen: boolean;
  inventory: BranchItemRequest[];
};

export type PrepRecommendation = {
  menuItemId: string;
  networkStock: number;
  totalRequested: number;
  peakBuffer: number;
  aiRecommendedPrep: number;
  approvedPrep: number;
};

export type RecipeIngredient = {
  ingredientId: string;
  ingredientName: string;
  quantityPerUnit: number;
  unit: 'kg' | 'L';
  supplierId: string;
  unitPrice: number;
};

export type ShortageAlert = {
  menuItemId: string;
  menuItemName: string;
  totalRequested: number;
  recommendedPrep: number;
  urgency: 'Critical' | 'High' | 'Moderate';
  explanation: string;
};

export type IngredientRequirement = {
  ingredientId: string;
  ingredientName: string;
  requiredQty: number;
  unit: 'kg' | 'L';
  supplierId: string;
  unitPrice: number;
  estCost: number;
  usedFor: string[]; // names of prepared menu items
};
