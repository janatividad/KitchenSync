import { RecipeIngredient } from '../types/kitchen';
import { INGREDIENT_COSTS } from './suppliers';

function getIng(
  cost: typeof INGREDIENT_COSTS[keyof typeof INGREDIENT_COSTS],
  ratio: number
): RecipeIngredient {
  return {
    ingredientId: cost.ingredientId,
    ingredientName: cost.name,
    quantityPerUnit: ratio,
    unit: cost.unit,
    supplierId: cost.supplierId,
    unitPrice: cost.unitPrice,
  };
}

export const RECIPES: Record<string, RecipeIngredient[]> = {
  grilledChicken: [
    getIng(INGREDIENT_COSTS.chickenBreast, 1.10),
    getIng(INGREDIENT_COSTS.salt, 0.015),
    getIng(INGREDIENT_COSTS.blackPepper, 0.008),
    getIng(INGREDIENT_COSTS.sevenSpice, 0.020),
    getIng(INGREDIENT_COSTS.soySauce, 0.060),
    getIng(INGREDIENT_COSTS.vinegar, 0.030),
  ],
  bbqPork: [
    getIng(INGREDIENT_COSTS.groundPork, 1.05),
    getIng(INGREDIENT_COSTS.ketchup, 0.080),
    getIng(INGREDIENT_COSTS.worcestershireSauce, 0.040),
    getIng(INGREDIENT_COSTS.salt, 0.012),
    getIng(INGREDIENT_COSTS.blackPepper, 0.006),
  ],
  bistekBeef: [
    getIng(INGREDIENT_COSTS.beefTenderloin, 1.08),
    getIng(INGREDIENT_COSTS.salt, 0.012),
    getIng(INGREDIENT_COSTS.vinegar, 0.040),
    getIng(INGREDIENT_COSTS.blackPepper, 0.007),
    getIng(INGREDIENT_COSTS.garlicPowder, 0.015),
    getIng(INGREDIENT_COSTS.limeJuice, 0.050),
  ],
  limeRice: [
    getIng(INGREDIENT_COSTS.japaneseRice, 0.70),
    getIng(INGREDIENT_COSTS.limeJuice, 0.035),
    getIng(INGREDIENT_COSTS.cookingOil, 0.025),
    getIng(INGREDIENT_COSTS.salt, 0.010),
  ],
  guacamole: [
    getIng(INGREDIENT_COSTS.avocado, 0.80),
    getIng(INGREDIENT_COSTS.salt, 0.010),
    getIng(INGREDIENT_COSTS.tomato, 0.10),
    getIng(INGREDIENT_COSTS.onion, 0.06),
    getIng(INGREDIENT_COSTS.limeJuice, 0.040),
  ],
  chipotleSauce: [
    getIng(INGREDIENT_COSTS.redChili, 0.20),
    getIng(INGREDIENT_COSTS.onion, 0.12),
    getIng(INGREDIENT_COSTS.garlic, 0.05),
    getIng(INGREDIENT_COSTS.chineseChili, 0.04),
    getIng(INGREDIENT_COSTS.jalapeno, 0.10),
    getIng(INGREDIENT_COSTS.waterBase, 0.55),
  ],
};
export { INGREDIENT_COSTS };
