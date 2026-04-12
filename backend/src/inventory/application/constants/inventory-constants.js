/**
 * Inventory item categories
 */
export const INVENTORY_CATEGORIES = {
  VEGETABLES: 'VEGETABLES',
  FRUITS: 'FRUITS',
  GRAINS: 'GRAINS',
  PACKAGED: 'PACKAGED',
  BISCUITS: 'BISCUITS',
  MEAT_FISH: 'MEAT_FISH',
  DAIRY: 'DAIRY',
  BEVERAGES: 'BEVERAGES',
  SPICES_CONDIMENTS: 'SPICES_CONDIMENTS',
  SNACKS: 'SNACKS',
  BAKING: 'BAKING',
  FROZEN: 'FROZEN',
  CANNED: 'CANNED',
  OTHER: 'OTHER',
  // Legacy values retained for backward compatibility with existing records.
  FOOD: 'FOOD',
  SUPPLIES: 'SUPPLIES',
  EQUIPMENT: 'EQUIPMENT',
};

/**
 * Inventory item status values
 */
export const INVENTORY_STATUS = {
  ACTIVE: 'ACTIVE',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  EXPIRED: 'EXPIRED',
};

/**
 * Inventory item expiry-state values
 */
export const INVENTORY_EXPIRY_STATUS = {
  UNAVAILABLE: 'UNAVAILABLE',
  SAFE: 'SAFE',
  PARTIALLY_EXPIRED: 'PARTIALLY_EXPIRED',
  TOTALLY_EXPIRED: 'TOTALLY_EXPIRED',
};

/**
 * Default units of measurement exported
 */
export const MEASUREMENT_UNITS = [
  'pieces',
  'kg',
  'g',
  'liters',
  'ml',
  'boxes',
  'packs',
  'units',
];

/**
 * Default reorder level
 */
export const DEFAULT_REORDER_LEVEL = 10;
