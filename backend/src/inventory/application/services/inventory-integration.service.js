import { InventoryItemService } from './inventory-item.service.js';

/**
 * Internal integration surface for other backend modules (e.g., meal planning).
 * This service is intentionally independent from HTTP controllers and route guards.
 */
export class InventoryIntegrationService {
  constructor() {
    this.inventoryItemService = new InventoryItemService();
  }

  /**
   * Read a single inventory item for internal module use.
   * Returns the full inventory item object, including optional fields when available.
   * @param {string} itemId
   * @returns {Promise<Object>}
   */
  async getInventoryItemById(itemId) {
    return this.inventoryItemService.getInventoryItemById(itemId);
  }

  /**
   * List inventory items for internal module use.
   * Returns full inventory item objects, including optional fields when available.
   * Supported filters: category, status, search.
   * @param {{ category?: string, status?: string, search?: string }} filters
   * @returns {Promise<Array>}
   */
  async listInventoryItems(filters = {}) {
    return this.inventoryItemService.listInventoryItems(filters);
  }

  /**
   * Decrease stock for meal planning allocations/consumption.
   * @param {{ itemId: string, amount: number }} payload
   * @returns {Promise<Object>} Updated inventory item
   */
  async allocateForMealPlanning(payload) {
    const { itemId, amount } = payload || {};

    return this.inventoryItemService.decrementInventoryItem(itemId, {
      amount,
    });
  }

  /**
   * Increase stock for meal planning releases/rollbacks.
   * @param {{ itemId: string, amount: number }} payload
   * @returns {Promise<Object>} Updated inventory item
   */
  async releaseForMealPlanning(payload) {
    const { itemId, amount } = payload || {};

    return this.inventoryItemService.incrementInventoryItem(itemId, {
      amount,
    });
  }
}

export const inventoryIntegrationService = new InventoryIntegrationService();
