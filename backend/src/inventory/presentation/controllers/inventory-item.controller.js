import express from 'express';
import { InventoryItemService } from '../../application/services/inventory-item.service.js';
import { validateCreateInventoryItem } from '../validators/create-inventory-item.validator.js';
import { validateUpdateInventoryItem } from '../validators/update-inventory-item.validator.js';
import { validatePatchInventoryItem } from '../validators/patch-inventory-item.validator.js';

export const inventoryRouter = express.Router();

const inventoryItemService = new InventoryItemService();

/**
 * GET /api/inventory
 * List all inventory items with optional filters
 */
inventoryRouter.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;

    const filters = {};
    if (category) {
      filters.category = category;
    }
    if (status) {
      filters.status = status;
    }
    if (search) {
      filters.search = search;
    }

    const items = await inventoryItemService.listInventoryItems(filters);

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory items',
      error: error.message,
    });
  }
});

/**
 * GET /api/inventory/stats
 * Get inventory statistics
 */
inventoryRouter.get('/stats', async (req, res) => {
  try {
    const stats = await inventoryItemService.getInventoryStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory statistics',
      error: error.message,
    });
  }
});

/**
 * GET /api/inventory/low-stock
 * Get items that are low in stock
 */
inventoryRouter.get('/low-stock', async (req, res) => {
  try {
    const items = await inventoryItemService.getLowStockItems();

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve low stock items',
      error: error.message,
    });
  }
});

/**
 * GET /api/inventory/:id
 * Get a single inventory item by ID
 */
inventoryRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await inventoryItemService.getInventoryItemById(id);

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory item',
      error: error.message,
    });
  }
});

/**
 * POST /api/inventory
 * Create a new inventory item
 */
inventoryRouter.post('/', validateCreateInventoryItem, async (req, res) => {
  try {
    const itemData = req.body;

    const newItem = await inventoryItemService.createInventoryItem(itemData);

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: newItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory item',
      error: error.message,
    });
  }
});

/**
 * PUT /api/inventory/:id
 * Fully update an inventory item
 */
inventoryRouter.put('/:id', validateUpdateInventoryItem, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedItem = await inventoryItemService.updateInventoryItem(
      id,
      updateData
    );

    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: updatedItem,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/inventory/:id
 * Partially update an inventory item
 */
inventoryRouter.patch('/:id', validatePatchInventoryItem, async (req, res) => {
  try {
    const { id } = req.params;
    const partialData = req.body;

    const updatedItem = await inventoryItemService.patchInventoryItem(
      id,
      partialData
    );

    res.status(200).json({
      success: true,
      message: 'Inventory item partially updated successfully',
      data: updatedItem,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to partially update inventory item',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/inventory/:id
 * Delete an inventory item
 */
inventoryRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedItem = await inventoryItemService.deleteInventoryItem(id);

    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully',
      data: deletedItem,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item',
      error: error.message,
    });
  }
});
