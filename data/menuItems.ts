import { MenuItem } from '../types/kitchen';

export const MENU_ITEMS: MenuItem[] = [
  { id: 'grilledChicken', name: 'Grilled Chicken', unit: 'kg', minimumStock: 30 },
  { id: 'bbqPork', name: 'BBQ Pork', unit: 'kg', minimumStock: 25 },
  { id: 'bistekBeef', name: 'Bistek Beef', unit: 'kg', minimumStock: 25 },
  { id: 'limeRice', name: 'Lime Rice', unit: 'kg', minimumStock: 50 },
  { id: 'guacamole', name: 'Guacamole', unit: 'kg', minimumStock: 15 },
  { id: 'chipotleSauce', name: 'Chipotle Sauce', unit: 'L', minimumStock: 15 },
];
