import {
  syncQuantityAndStatus,
  sortBatchesFifo,
} from '../../application/utils/inventory-status.util.js';
import { InventoryItem } from '../schemas/inventory-item.schema.js';

const ITEM_FIELD_KEYS = new Set([
  'barcode',
  'name',
  'description',
  'brand',
  'allergens',
  'traces',
  'ingredients',
  'imageUrl',
  'nutritionalGrade',
  'category',
  'unit',
  'reorderLevel',
  'packageWeight',
  'packageWeightUnit',
  'packageType',
]);

function pickItemFields(source = {}) {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => ITEM_FIELD_KEYS.has(key))
  );
}

function isBatchExpired(batch, now = new Date()) {
  if (!batch?.expiryDate || batch.quantity <= 0) {
    return false;
  }

  const expiryDate = new Date(batch.expiryDate);

  return !Number.isNaN(expiryDate.getTime()) && expiryDate < now;
}

/**
 * Repository for inventory item data access operations
 */
export class InventoryItemRepository {
  /**
   * Create a new inventory item
   * @param {Object} itemData - Inventory item data
   * @param {Object} initialBatch - Initial batch data
   * @returns {Promise<Object>} Created inventory item
   */
  async create(itemData, initialBatch) {
    const item = new InventoryItem({
      ...pickItemFields(itemData),
      batches: initialBatch ? [initialBatch] : [],
    });

    syncQuantityAndStatus(item);

    return item.save();
  }

  /**
   * Find an inventory item by ID
   * @param {string} id - Inventory item ID
   * @returns {Promise<Object|null>} Found inventory item or null
   */
  async findById(id) {
    return InventoryItem.findById(id);
  }

  /**
   * Find all inventory items with optional filters if needed
   * @param {Object} filter - Query filter
   * @returns {Promise<Array>} Array of inventory items
   */
  async findMany(filter = {}) {
    return InventoryItem.find(filter).sort({ createdAt: -1 });
  }

  /**
   * Update an inventory item by ID
   * @param {string} id - Inventory item ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated inventory item or null
   */
  async updateById(id, updates) {
    const item = await InventoryItem.findById(id);

    if (!item) {
      return null;
    }

    Object.assign(item, pickItemFields(updates));
    syncQuantityAndStatus(item);

    return item.save();
  }

  /**
   * Partially update an inventory item by ID
   * @param {string} id - Inventory item ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated inventory item or null
   */
  async patchById(id, updates) {
    const item = await InventoryItem.findById(id);

    if (!item) {
      return null;
    }

    Object.assign(item, pickItemFields(updates));
    syncQuantityAndStatus(item);

    return item.save();
  }

  /**
   * Delete an inventory item by ID
   * @param {string} id - Inventory item ID
   * @returns {Promise<Object|null>} Deleted inventory item or null
   */
  async deleteById(id) {
    return InventoryItem.findByIdAndDelete(id);
  }

  /**
   * Count inventory items with optional filter
   * @param {Object} filter - Query filter
   * @returns {Promise<number>} Count of matching items
   */
  async count(filter = {}) {
    return InventoryItem.countDocuments(filter);
  }

  /**
   * Find items that are low in stock
   * @returns {Promise<Array>} Array of low stock items
   */
  async findLowStockItems() {
    return InventoryItem.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
    }).sort({ quantity: 1 });
  }

  /**
   * Find items by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of items in the category
   */
  async findByCategory(category) {
    return InventoryItem.find({ category }).sort({ name: 1 });
  }

  /**
   * Add a new stock batch to an item
   * @param {string} id - Inventory item ID
   * @param {Object} batch - Batch data
   * @returns {Promise<Object|null>} Updated inventory item or null
   */
  async addBatchById(id, batch) {
    const item = await InventoryItem.findById(id);

    if (!item) {
      return null;
    }

    item.batches.push(batch);
    syncQuantityAndStatus(item);

    return item.save();
  }

  /**
   * Remove a stock batch from an item
   * @param {string} itemId - Inventory item ID
   * @param {string} batchId - Batch sub-document ID
   * @returns {Promise<Object|null>} Updated inventory item or null
   */
  async removeBatchById(itemId, batchId) {
    const item = await InventoryItem.findById(itemId);

    if (!item) {
      return null;
    }

    const batch = item.batches.id(batchId);

    if (!batch) {
      return null;
    }

    batch.deleteOne();
    syncQuantityAndStatus(item);

    return item.save();
  }

  /**
   * Decrement item quantity by amount with non-negative guard
   * @param {string} id - Inventory item ID
   * @param {number} amount - Amount to decrease
   * @returns {Promise<Object|null>} Updated inventory item or null
   */
  async decrementQuantityById(id, amount) {
    const item = await InventoryItem.findById(id);

    if (!item) {
      return null;
    }

    // Read-then-write keeps FIFO depletion simple here; if concurrency pressure grows,
    // this path should move behind a transaction/session boundary.
    const now = new Date();
    const usableBatches = sortBatchesFifo(
      item.batches.filter(
        (batch) => batch.quantity > 0 && !isBatchExpired(batch, now)
      )
    );

    const availableQuantity = usableBatches.reduce(
      (sum, batch) => sum + batch.quantity,
      0
    );

    if (availableQuantity < amount) {
      return null;
    }

    let remainingAmount = amount;

    for (const batch of usableBatches) {
      if (remainingAmount <= 0) {
        break;
      }

      const quantityToDrain = Math.min(batch.quantity, remainingAmount);
      batch.quantity -= quantityToDrain;
      remainingAmount -= quantityToDrain;
    }

    item.batches = item.batches.filter((batch) => batch.quantity > 0);
    syncQuantityAndStatus(item);

    return item.save();
  }
}
