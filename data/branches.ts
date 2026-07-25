import { Branch } from '../types/kitchen';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'shibuya',
    name: 'Shibuya Branch',
    isCentralKitchen: false,
    inventory: [
      { menuItemId: 'grilledChicken', currentStock: 12, requestedQuantity: 18 },
      { menuItemId: 'bbqPork', currentStock: 10, requestedQuantity: 8 },
      { menuItemId: 'bistekBeef', currentStock: 15, requestedQuantity: 5 },
      { menuItemId: 'limeRice', currentStock: 25, requestedQuantity: 20 },
      { menuItemId: 'guacamole', currentStock: 6, requestedQuantity: 10 },
      { menuItemId: 'chipotleSauce', currentStock: 8, requestedQuantity: 6 },
    ],
  },
  {
    id: 'shinjuku',
    name: 'Shinjuku Branch',
    isCentralKitchen: false,
    inventory: [
      { menuItemId: 'grilledChicken', currentStock: 5, requestedQuantity: 25 },
      { menuItemId: 'bbqPork', currentStock: 8, requestedQuantity: 15 },
      { menuItemId: 'bistekBeef', currentStock: 12, requestedQuantity: 10 },
      { menuItemId: 'limeRice', currentStock: 18, requestedQuantity: 35 },
      { menuItemId: 'guacamole', currentStock: 3, requestedQuantity: 12 },
      { menuItemId: 'chipotleSauce', currentStock: 5, requestedQuantity: 10 },
    ],
  },
  {
    id: 'ginza',
    name: 'Ginza Branch',
    isCentralKitchen: false,
    inventory: [
      { menuItemId: 'grilledChicken', currentStock: 20, requestedQuantity: 10 },
      { menuItemId: 'bbqPork', currentStock: 15, requestedQuantity: 12 },
      { menuItemId: 'bistekBeef', currentStock: 30, requestedQuantity: 0 },
      { menuItemId: 'limeRice', currentStock: 55, requestedQuantity: 0 },
      { menuItemId: 'guacamole', currentStock: 16, requestedQuantity: 0 },
      { menuItemId: 'chipotleSauce', currentStock: 14, requestedQuantity: 2 },
    ],
  },
  {
    id: 'azabuJuban',
    name: 'Azabu-Juban Branch',
    isCentralKitchen: false,
    inventory: [
      { menuItemId: 'grilledChicken', currentStock: 8, requestedQuantity: 22 },
      { menuItemId: 'bbqPork', currentStock: 11, requestedQuantity: 14 },
      { menuItemId: 'bistekBeef', currentStock: 7, requestedQuantity: 18 },
      { menuItemId: 'limeRice', currentStock: 30, requestedQuantity: 25 },
      { menuItemId: 'guacamole', currentStock: 5, requestedQuantity: 12 },
      { menuItemId: 'chipotleSauce', currentStock: 9, requestedQuantity: 8 },
    ],
  },
  {
    id: 'roppongi',
    name: 'Roppongi Branch',
    isCentralKitchen: true,
    inventory: [
      { menuItemId: 'grilledChicken', currentStock: 15, requestedQuantity: 15 },
      { menuItemId: 'bbqPork', currentStock: 12, requestedQuantity: 10 },
      { menuItemId: 'bistekBeef', currentStock: 10, requestedQuantity: 15 },
      { menuItemId: 'limeRice', currentStock: 40, requestedQuantity: 15 },
      { menuItemId: 'guacamole', currentStock: 8, requestedQuantity: 8 },
      { menuItemId: 'chipotleSauce', currentStock: 11, requestedQuantity: 5 },
    ],
  },
];
