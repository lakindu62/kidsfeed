import mongoose from 'mongoose';

import {
  INVENTORY_CATEGORIES,
  INVENTORY_EXPIRY_STATUS,
  INVENTORY_STATUS,
} from '../../application/constants/inventory-constants.js';

/**
 * Mongoose schema for inventory items
 * @typedef {Object} InventoryItem
 * @property {string} name - Name of the inventory item
 * @property {string} description - Description of the item
 * @property {string} category - Category of the item (e.g., 'FOOD', 'SUPPLIES', 'EQUIPMENT')
 * @property {number} quantity - Current quantity in stock
 * @property {string} unit - Unit of measurement (e.g., 'kg', 'pieces', 'liters')
 * @property {number} reorderLevel - Minimum quantity before reorder
 * @property {number} unitPrice - Price per unit
 * @property {string} supplier - Supplier name
 * @property {string} location - Storage location
 * @property {Date} expiryDate - Expiry date for perishable items
 * @property {string} status - Status of the item ('ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED')
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 * @property {string} [barcode] - UPC/EAN barcode from Open Food Facts
 * @property {string} [brand] - Brand name of the product
 * @property {string[]} [allergens] - Array of allergens (e.g., 'nuts', 'milk')
 * @property {string[]} [traces] - Potential allergen traces processing tags
 * @property {string} [ingredients] - Full ingredients list
 * @property {string} [imageUrl] - URL to the product image
 * @property {string} [nutritionalGrade] - Nutritional grade (a-e)
 * @property {number} [packageWeight] - The numeric weight/volume of a single package (e.g. 400)
 * @property {string} [packageWeightUnit] - The unit of the package weight (e.g. 'g', 'ml')
 * @property {string} [packageType] - The container type (e.g. 'jar', 'bottle', 'box')
 */
const batchSchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    supplier: {
      type: String,
      default: '',
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: String,
      default: '',
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    batchNote: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(INVENTORY_STATUS),
      default: INVENTORY_STATUS.ACTIVE,
    },
  },
  {
    _id: true,
  }
);

const inventoryItemSchema = new mongoose.Schema(
  {
    barcode: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    brand: {
      type: String,
      default: '',
    },
    allergens: {
      type: [String],
      default: [],
    },
    traces: {
      type: [String],
      default: [],
    },
    ingredients: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    nutritionalGrade: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(INVENTORY_CATEGORIES),
      default: 'OTHER',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      default: 'pieces',
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    packageWeight: {
      type: Number,
      default: 0,
      min: 0,
    },
    packageWeightUnit: {
      type: String,
      default: '',
    },
    packageType: {
      type: String,
      default: '',
    },
    batches: {
      type: [batchSchema],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(INVENTORY_STATUS),
      default: INVENTORY_STATUS.OUT_OF_STOCK,
    },
    expiryStatus: {
      type: String,
      enum: Object.values(INVENTORY_EXPIRY_STATUS),
      default: INVENTORY_EXPIRY_STATUS.UNAVAILABLE,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index for faster queries added on name, category, and status fields
 */
inventoryItemSchema.index({ name: 1 });
inventoryItemSchema.index({ category: 1 });
inventoryItemSchema.index({ status: 1 });

export const InventoryItem = mongoose.model(
  'InventoryItem',
  inventoryItemSchema
);
