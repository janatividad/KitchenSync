import { Branch, IngredientRequirement } from '../types/kitchen';
import { MENU_ITEMS } from '../data/menuItems';
import { RECIPES } from '../data/recipes';

// Status: Good, Low, Critical based on minimum stock
export function calculateBranchStatus(currentStock: number, minimumStock: number): 'Good' | 'Low' | 'Critical' {
  if (currentStock < minimumStock * 0.4) {
    return 'Critical';
  }
  if (currentStock < minimumStock) {
    return 'Low';
  }
  return 'Good';
}

// Sum of current stock of a menu item across all branches
export function calculateNetworkStock(branches: Branch[], menuItemId: string): number {
  return branches.reduce((sum, branch) => {
    const item = branch.inventory.find(i => i.menuItemId === menuItemId);
    return sum + (item ? item.currentStock : 0);
  }, 0);
}

// Sum of requests for a menu item across all branches
export function calculateTotalRequests(branches: Branch[], menuItemId: string): number {
  return branches.reduce((sum, branch) => {
    const item = branch.inventory.find(i => i.menuItemId === menuItemId);
    return sum + (item ? item.requestedQuantity : 0);
  }, 0);
}

// Calculate 15% peak-day buffer
export function calculatePeakBuffer(totalRequested: number): number {
  return Math.round(totalRequested * 0.15 * 10) / 10;
}

// Calculate AI recommended prep (requested + buffer)
export function calculateRecommendedPrep(totalRequested: number, peakBuffer: number): number {
  return Math.round((totalRequested + peakBuffer) * 10) / 10;
}

// Proportional allocation logic
export function calculateBranchAllocations(
  branchRequest: number,
  totalBranchRequest: number,
  approvedPrep: number
): number {
  if (totalBranchRequest <= 0) return 0;
  const allocation = (branchRequest / totalBranchRequest) * approvedPrep;
  return Math.round(allocation * 10) / 10;
}

// Convert prepared menu item quantities to raw ingredient requirements
export function calculateIngredientRequirements(
  approvedPreps: { menuItemId: string; approvedQty: number }[]
): IngredientRequirement[] {
  const reqMap: Record<string, IngredientRequirement> = {};

  approvedPreps.forEach(({ menuItemId, approvedQty }) => {
    if (approvedQty <= 0) return;

    const ingredients = RECIPES[menuItemId];
    if (!ingredients) return;

    const menuItemName = MENU_ITEMS.find(m => m.id === menuItemId)?.name || menuItemId;

    ingredients.forEach(ing => {
      const qtyNeeded = approvedQty * ing.quantityPerUnit;

      if (reqMap[ing.ingredientId]) {
        reqMap[ing.ingredientId].requiredQty += qtyNeeded;
        if (!reqMap[ing.ingredientId].usedFor.includes(menuItemName)) {
          reqMap[ing.ingredientId].usedFor.push(menuItemName);
        }
      } else {
        reqMap[ing.ingredientId] = {
          ingredientId: ing.ingredientId,
          ingredientName: ing.ingredientName,
          requiredQty: qtyNeeded,
          unit: ing.unit,
          supplierId: ing.supplierId,
          unitPrice: ing.unitPrice,
          estCost: 0, // calculated later
          usedFor: [menuItemName],
        };
      }
    });
  });

  // Calculate costs and round quantities
  return Object.values(reqMap).map(req => {
    const roundedQty = Math.round(req.requiredQty * 100) / 100;
    const estCost = Math.round(roundedQty * req.unitPrice);
    return {
      ...req,
      requiredQty: roundedQty,
      estCost,
    };
  });
}
