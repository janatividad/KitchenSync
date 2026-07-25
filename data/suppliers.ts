export type Supplier = {
  id: string;
  name: string;
};

export const SUPPLIERS: Supplier[] = [
  { id: 'tokyoPoultry', name: 'Tokyo Poultry Farm' },
  { id: 'kantoMeat', name: 'Kanto Meat Wholesale' },
  { id: 'showaSeasonings', name: 'Showa Seasonings' },
  { id: 'tokyoSauce', name: 'Tokyo Sauce & Condiment Supply' },
  { id: 'niigataRice', name: 'Niigata Rice Corporation' },
  { id: 'toyosuFresh', name: 'Toyosu Fresh Produce' },
];

export type IngredientCost = {
  ingredientId: string;
  name: string;
  unit: 'kg' | 'L';
  supplierId: string;
  unitPrice: number; // JPY
};

export const INGREDIENT_COSTS: Record<string, IngredientCost> = {
  chickenBreast: { ingredientId: 'chickenBreast', name: 'Chicken Breast', unit: 'kg', supplierId: 'tokyoPoultry', unitPrice: 900 },
  salt: { ingredientId: 'salt', name: 'Salt', unit: 'kg', supplierId: 'showaSeasonings', unitPrice: 200 },
  blackPepper: { ingredientId: 'blackPepper', name: 'Black Pepper', unit: 'kg', supplierId: 'showaSeasonings', unitPrice: 1500 },
  sevenSpice: { ingredientId: 'sevenSpice', name: 'Seven-Spice Blend', unit: 'kg', supplierId: 'showaSeasonings', unitPrice: 2500 },
  soySauce: { ingredientId: 'soySauce', name: 'Soy Sauce', unit: 'L', supplierId: 'tokyoSauce', unitPrice: 400 },
  vinegar: { ingredientId: 'vinegar', name: 'Vinegar', unit: 'L', supplierId: 'tokyoSauce', unitPrice: 300 },
  groundPork: { ingredientId: 'groundPork', name: 'Ground Pork', unit: 'kg', supplierId: 'kantoMeat', unitPrice: 1200 },
  ketchup: { ingredientId: 'ketchup', name: 'Ketchup', unit: 'kg', supplierId: 'tokyoSauce', unitPrice: 500 },
  worcestershireSauce: { ingredientId: 'worcestershireSauce', name: 'Worcestershire Sauce', unit: 'L', supplierId: 'tokyoSauce', unitPrice: 600 },
  beefTenderloin: { ingredientId: 'beefTenderloin', name: 'Beef Tenderloin', unit: 'kg', supplierId: 'kantoMeat', unitPrice: 3500 },
  garlicPowder: { ingredientId: 'garlicPowder', name: 'Garlic Powder', unit: 'kg', supplierId: 'showaSeasonings', unitPrice: 1800 },
  limeJuice: { ingredientId: 'limeJuice', name: 'Lime Juice', unit: 'L', supplierId: 'toyosuFresh', unitPrice: 1200 },
  japaneseRice: { ingredientId: 'japaneseRice', name: 'Japanese Rice', unit: 'kg', supplierId: 'niigataRice', unitPrice: 450 },
  cookingOil: { ingredientId: 'cookingOil', name: 'Cooking Oil', unit: 'L', supplierId: 'tokyoSauce', unitPrice: 500 },
  avocado: { ingredientId: 'avocado', name: 'Avocado', unit: 'kg', supplierId: 'toyosuFresh', unitPrice: 1000 },
  tomato: { ingredientId: 'tomato', name: 'Tomato', unit: 'kg', supplierId: 'toyosuFresh', unitPrice: 600 },
  onion: { ingredientId: 'onion', name: 'Onion', unit: 'kg', supplierId: 'toyosuFresh', unitPrice: 300 },
  redChili: { ingredientId: 'redChili', name: 'Red Chili', unit: 'kg', supplierId: 'toyosuFresh', unitPrice: 1500 },
  garlic: { ingredientId: 'garlic', name: 'Garlic', unit: 'kg', supplierId: 'toyosuFresh', unitPrice: 1000 },
  chineseChili: { ingredientId: 'chineseChili', name: 'Chinese Chili', unit: 'kg', supplierId: 'toyosuFresh', unitPrice: 2000 },
  jalapeno: { ingredientId: 'jalapeno', name: 'Jalapeño', unit: 'kg', supplierId: 'toyosuFresh', unitPrice: 1200 },
  waterBase: { ingredientId: 'waterBase', name: 'Water or Sauce Base', unit: 'L', supplierId: 'tokyoSauce', unitPrice: 100 },
};
