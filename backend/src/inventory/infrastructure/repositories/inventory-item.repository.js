import { InventoryItem } from '../schemas/inventory-item.schema.js';

/**
 * Repository for inventory item data access operations
 */
export class InventoryItemRepository {
  /**
   * Create a new inventory item
   * @param {Object} data - Inventory item data
   * @returns {Promise<Object>} Created inventory item
   */
  async create(data) {
    return InventoryItem.create(data);
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
   * Find all inventory items with optional filters
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
    return InventoryItem.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
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
}
