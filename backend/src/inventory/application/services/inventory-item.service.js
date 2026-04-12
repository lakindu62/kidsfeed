import { InventoryItemRepository } from '../../infrastructure/repositories/inventory-item.repository.js';
import { INVENTORY_STATUS } from '../constants/inventory-constants.js';

function escapeRegExp(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeLookupValue(value = '') {
  return String(value).trim().replace(/\s+/g, ' ');
}

function buildExactNameRegex(name) {
  const normalizedName = normalizeLookupValue(name);

  if (!normalizedName) {
    return null;
  }

  const escapedPattern = normalizedName
    .split(' ')
    .map((token) => escapeRegExp(token))
    .join('\\s+');

  return new RegExp(`^${escapedPattern}$`, 'i');
}

function buildContainsNameRegex(name) {
  const normalizedName = normalizeLookupValue(name);

  if (!normalizedName) {
    return null;
  }

  return new RegExp(escapeRegExp(normalizedName), 'i');
}

function toExistingItemSummary(item) {
  if (!item) {
    return null;
  }

  return {
    id: item._id?.toString?.() || item.id || null,
    name: item.name,
    barcode: item.barcode,
    category: item.category,
    unit: item.unit,
    quantity: item.quantity,
    reorderLevel: item.reorderLevel,
    status: item.status,
    expiryStatus: item.expiryStatus,
    brand: item.brand,
  };
}

/**
 * Service for inventory item business logic
 */
export class InventoryItemService {
  constructor() {
    this.inventoryItemRepository = new InventoryItemRepository();
  }

  _createBadRequestError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
  }

  /**
   * Create a new inventory item
   * @param {Object} itemData - Item-level data for the new inventory item
   * @param {Object} initialBatch - Initial batch data for the new inventory item
   * @returns {Promise<Object>} Created inventory item
   */
  async createInventoryItem(itemData, initialBatch) {
    const duplicateLookup = await this.findExistingInventoryItem({
      name: itemData?.name,
      barcode: itemData?.barcode,
    });

    if (
      duplicateLookup.matchType === 'BARCODE_EXACT' ||
      duplicateLookup.matchType === 'NAME_EXACT'
    ) {
      const error = new Error(
        'Inventory item already exists. Add a batch to the existing item instead.'
      );
      error.statusCode = 409;
      error.action = 'ADD_BATCH_TO_EXISTING';
      throw error;
    }

    const item = await this.inventoryItemRepository.create(
      itemData,
      initialBatch
    );

    return item;
  }

  /**
   * Get an inventory item by ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object|null>} Found item or null
   * @throws {Error} If item not found
   */
  async getInventoryItemById(itemId) {
    const item = await this.inventoryItemRepository.findById(itemId);

    if (!item) {
      throw new Error(`Inventory item with ID ${itemId} not found`);
    }

    return item;
  }

  /**
   * List all inventory items with optional filters if needed
   * @param {Object} filters - Optional filters (category, status, etc.)
   * @returns {Promise<Array>} Array of inventory items
   */
  async listInventoryItems(filters = {}) {
    const queryFilter = {};

    if (filters.category) {
      queryFilter.category = filters.category;
    }

    if (filters.status) {
      queryFilter.status = filters.status;
    }

    if (filters.search) {
      queryFilter.name = { $regex: filters.search, $options: 'i' };
    }

    return this.inventoryItemRepository.findMany(queryFilter);
  }

  /**
   * Find an existing inventory item or candidate matches for duplicate-check UX.
   * Barcode exact matches take priority. If no barcode match is found, a normalized
   * exact name match is attempted, followed by a fuzzy name search for advisory use.
   * @param {{ name?: string, barcode?: string }} criteria
   * @returns {Promise<Object>}
   */
  async findExistingInventoryItem(criteria = {}) {
    const barcode = normalizeLookupValue(criteria.barcode || '');
    const name = normalizeLookupValue(criteria.name || '');

    if (!barcode && !name) {
      return {
        matchType: 'NONE',
        existingItem: null,
        candidates: [],
        suggestedAction: 'CREATE_NEW_ITEM',
      };
    }

    if (barcode) {
      const barcodeMatches = await this.inventoryItemRepository.findMany({
        barcode,
      });

      if (barcodeMatches.length > 0) {
        return {
          matchType: 'BARCODE_EXACT',
          existingItem:
            barcodeMatches.length === 1
              ? toExistingItemSummary(barcodeMatches[0])
              : null,
          candidates:
            barcodeMatches.length > 1
              ? barcodeMatches.map((item) => toExistingItemSummary(item))
              : [],
          suggestedAction: 'ADD_BATCH_TO_EXISTING',
        };
      }
    }

    if (name) {
      const exactNameRegex = buildExactNameRegex(name);
      const exactNameMatches = exactNameRegex
        ? await this.inventoryItemRepository.findMany({ name: exactNameRegex })
        : [];

      if (exactNameMatches.length > 0) {
        return {
          matchType: 'NAME_EXACT',
          existingItem:
            exactNameMatches.length === 1
              ? toExistingItemSummary(exactNameMatches[0])
              : null,
          candidates:
            exactNameMatches.length > 1
              ? exactNameMatches.map((item) => toExistingItemSummary(item))
              : [],
          suggestedAction: 'ADD_BATCH_TO_EXISTING',
        };
      }

      const fuzzyNameRegex = buildContainsNameRegex(name);
      const fuzzyNameMatches = fuzzyNameRegex
        ? await this.inventoryItemRepository.findMany({ name: fuzzyNameRegex })
        : [];

      if (fuzzyNameMatches.length > 0) {
        return {
          matchType: 'NAME_POSSIBLE',
          existingItem: null,
          candidates: fuzzyNameMatches.map((item) =>
            toExistingItemSummary(item)
          ),
          suggestedAction: 'ASK_USER_TO_CONFIRM',
        };
      }
    }

    return {
      matchType: 'NONE',
      existingItem: null,
      candidates: [],
      suggestedAction: 'CREATE_NEW_ITEM',
    };
  }

  /**
   * Update an inventory item (full update - PUT)
   * @param {string} itemId - Item ID
   * @param {Object} updateData - Complete update data
   * @returns {Promise<Object>} Updated inventory item
   * @throws {Error} If item not found
   */
  async updateInventoryItem(itemId, updateData) {
    const updatedItem = await this.inventoryItemRepository.updateById(
      itemId,
      updateData
    );

    if (!updatedItem) {
      throw new Error(`Inventory item with ID ${itemId} not found`);
    }

    return updatedItem;
  }

  /**
   * Partially update an inventory item (PATCH)
   * @param {string} itemId - Item ID
   * @param {Object} partialData - Partial update data
   * @returns {Promise<Object>} Updated inventory item
   * @throws {Error} If item not found
   */
  async patchInventoryItem(itemId, partialData) {
    const updatedItem = await this.inventoryItemRepository.patchById(
      itemId,
      partialData
    );

    if (!updatedItem) {
      throw new Error(`Inventory item with ID ${itemId} not found`);
    }

    return updatedItem;
  }

  /**
   * Delete an inventory item
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Deleted inventory item
   * @throws {Error} If item not found
   */
  async deleteInventoryItem(itemId) {
    const item = await this.inventoryItemRepository.findById(itemId);

    if (!item) {
      throw new Error(`Inventory item with ID ${itemId} not found`);
    }

    return this.inventoryItemRepository.deleteById(itemId);
  }

  /**
   * Get items that are low in stock
   * @returns {Promise<Array>} Array of low stock items
   */
  async getLowStockItems() {
    return this.inventoryItemRepository.findLowStockItems();
  }

  /**
   * Get items by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of items in the category
   */
  async getItemsByCategory(category) {
    return this.inventoryItemRepository.findByCategory(category);
  }

  /**
   * Get inventory statistics
   * @returns {Promise<Object>} Inventory statistics
   */
  async getInventoryStats() {
    const [total, active, lowStock, outOfStock, expired] = await Promise.all([
      this.inventoryItemRepository.count(),
      this.inventoryItemRepository.count({ status: INVENTORY_STATUS.ACTIVE }),
      this.inventoryItemRepository.count({
        status: INVENTORY_STATUS.LOW_STOCK,
      }),
      this.inventoryItemRepository.count({
        status: INVENTORY_STATUS.OUT_OF_STOCK,
      }),
      this.inventoryItemRepository.count({ status: INVENTORY_STATUS.EXPIRED }),
    ]);

    return {
      total,
      active,
      lowStock,
      outOfStock,
      expired,
    };
  }

  /**
   * Add a new stock batch to an inventory item
   * @param {string} itemId - Item ID
   * @param {Object} batchData - Batch payload
   * @returns {Promise<Object>} Updated inventory item
   */
  async addBatch(itemId, batchData) {
    const existingItem = await this.inventoryItemRepository.findById(itemId);

    if (!existingItem) {
      throw new Error(`Inventory item with ID ${itemId} not found`);
    }

    const updatedItem = await this.inventoryItemRepository.addBatchById(
      itemId,
      batchData
    );

    if (!updatedItem) {
      throw new Error(`Inventory item with ID ${itemId} not found`);
    }

    return updatedItem;
  }

  /**
   * Remove an inventory batch from an item
   * @param {string} itemId - Item ID
   * @param {string} batchId - Batch ID
   * @returns {Promise<Object>} Updated inventory item
   */
  async removeBatch(itemId, batchId) {
    const existingItem = await this.inventoryItemRepository.findById(itemId);

    if (!existingItem) {
      throw new Error(`Inventory item with ID ${itemId} not found`);
    }

    const updatedItem = await this.inventoryItemRepository.removeBatchById(
      itemId,
      batchId
    );

    if (!updatedItem) {
      throw new Error(
        `Inventory batch with ID ${batchId} not found for item ${itemId}`
      );
    }

    return updatedItem;
  }

  /**
   * Decrement inventory item quantity using FIFO batch consumption.
   *
   * Dual purpose:
   * 1) Used by inventory HTTP endpoints for manual stock adjustments.
   * 2) Used by internal module integrations (e.g., meal planning allocations/consumption).
   * @param {string} itemId - Item ID
   * @param {{ amount: number }} payload - Quantity decrement payload
   * @returns {Promise<Object>} Updated inventory item
   */
  async decrementInventoryItem(itemId, payload) {
    const amount = payload?.amount;

    if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
      throw this._createBadRequestError('amount must be greater than 0');
    }

    const existingItem = await this.inventoryItemRepository.findById(itemId);

    if (!existingItem) {
      throw new Error(`Inventory item with ID ${itemId} not found`);
    }

    const decrementedItem =
      await this.inventoryItemRepository.decrementQuantityById(itemId, amount);

    if (!decrementedItem) {
      throw this._createBadRequestError(
        'Insufficient quantity to decrement by requested amount'
      );
    }

    return decrementedItem;
  }
}
