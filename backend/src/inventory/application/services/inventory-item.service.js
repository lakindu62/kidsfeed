import { InventoryItemRepository } from '../../infrastructure/repositories/inventory-item.repository.js';
import { INVENTORY_STATUS } from '../constants/inventory-constants.js';

/**
 * Service for inventory item business logic
 */
export class InventoryItemService {
  constructor() {
    this.inventoryItemRepository = new InventoryItemRepository();
  }

  /**
   * Calculate and update the status of an inventory item based on quantity and expiry
   * @param {Object} item - Inventory item
   * @returns {string} Calculated status
   * @private
   */
  _calculateStatus(item) {
    // Check if expired
    if (item.expiryDate && new Date(item.expiryDate) < new Date()) {
      return INVENTORY_STATUS.EXPIRED;
    }

    // Check if out of stock
    if (item.quantity === 0) {
      return INVENTORY_STATUS.OUT_OF_STOCK;
    }

    // Check if low stock
    if (item.quantity <= item.reorderLevel) {
      return INVENTORY_STATUS.LOW_STOCK;
    }

    return INVENTORY_STATUS.ACTIVE;
  }

  /**
   * Create a new inventory item
   * @param {Object} itemData - Data for the new inventory item
   * @returns {Promise<Object>} Created inventory item
   */
  async createInventoryItem(itemData) {
    const safeCreateData = { ...itemData };
    delete safeCreateData.status;

    // Calculate initial status
    const status = this._calculateStatus({
      quantity: safeCreateData.quantity ?? 0,
      reorderLevel: safeCreateData.reorderLevel ?? 10,
      expiryDate: safeCreateData.expiryDate,
    });

    const item = await this.inventoryItemRepository.create({
      ...safeCreateData,
      status,
    });

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
   * Update an inventory item (full update - PUT)
   * @param {string} itemId - Item ID
   * @param {Object} updateData - Complete update data
   * @returns {Promise<Object>} Updated inventory item
   * @throws {Error} If item not found
   */
  async updateInventoryItem(itemId, updateData) {
    const existingItem = await this.inventoryItemRepository.findById(itemId);

    if (!existingItem) {
      throw new Error(`Inventory item with ID ${itemId} not found`);
    }

    const safeUpdateData = { ...updateData };
    delete safeUpdateData.status;

    // Merge with existing data so omitted optional fields do not skew status.
    const mergedData = {
      quantity: safeUpdateData.quantity ?? existingItem.quantity,
      reorderLevel: safeUpdateData.reorderLevel ?? existingItem.reorderLevel,
      expiryDate: safeUpdateData.expiryDate ?? existingItem.expiryDate,
    };

    const status = this._calculateStatus(mergedData);

    const updatedItem = await this.inventoryItemRepository.updateById(itemId, {
      ...safeUpdateData,
      status,
    });

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
    const existingItem = await this.inventoryItemRepository.findById(itemId);

    if (!existingItem) {
      throw new Error(`Inventory item with ID ${itemId} not found`);
    }

    const safePartialData = { ...partialData };
    delete safePartialData.status;

    // Merge with existing data to calculate status
    const mergedData = {
      quantity: safePartialData.quantity ?? existingItem.quantity,
      reorderLevel: safePartialData.reorderLevel ?? existingItem.reorderLevel,
      expiryDate: safePartialData.expiryDate ?? existingItem.expiryDate,
    };

    const status = this._calculateStatus(mergedData);

    const updatedItem = await this.inventoryItemRepository.updateById(itemId, {
      ...safePartialData,
      status,
    });

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
}
