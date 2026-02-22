import mongoose from 'mongoose';

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
 */
const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: ['FOOD', 'SUPPLIES', 'EQUIPMENT', 'OTHER'],
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
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplier: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index for faster queries
 */
inventoryItemSchema.index({ name: 1 });
inventoryItemSchema.index({ category: 1 });
inventoryItemSchema.index({ status: 1 });

export const InventoryItem = mongoose.model(
  'InventoryItem',
  inventoryItemSchema
);
