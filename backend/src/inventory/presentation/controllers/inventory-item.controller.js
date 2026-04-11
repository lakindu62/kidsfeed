import express from 'express';
import { CreateInventoryItemRequestDTO } from '../../application/dtos/requests/create-inventory-item.request.dto.js';
import { UpdateInventoryItemRequestDTO } from '../../application/dtos/requests/update-inventory-item.request.dto.js';
import { PatchInventoryItemRequestDTO } from '../../application/dtos/requests/patch-inventory-item.request.dto.js';
import { AdjustInventoryQuantityRequestDTO } from '../../application/dtos/requests/adjust-inventory-quantity.request.dto.js';
import { AddInventoryBatchRequestDTO } from '../../application/dtos/requests/add-inventory-batch.request.dto.js';
import { InventoryItemService } from '../../application/services/inventory-item.service.js';
import { openFoodFactsService } from '../../application/services/open-food-facts.service.js';
import { inventoryErrorMiddleware } from '../middleware/inventory-error.middleware.js';
import { validateAdjustInventoryQuantity } from '../validators/adjust-inventory-quantity.validator.js';
import { validateAddInventoryBatch } from '../validators/add-inventory-batch.validator.js';
import { validateCreateInventoryItem } from '../validators/create-inventory-item.validator.js';
import { validateUpdateInventoryItem } from '../validators/update-inventory-item.validator.js';
import { validatePatchInventoryItem } from '../validators/patch-inventory-item.validator.js';

export const inventoryRouter = express.Router();

const inventoryItemService = new InventoryItemService();

/**
 * GET /api/inventory
 * List all inventory items with optional filters.
 */
inventoryRouter.get('/', async (req, res, next) => {
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
    error.fallbackMessage = 'Failed to retrieve inventory items';
    return next(error);
  }
});

/**
 * GET /api/inventory/stats
 * Get inventory statistics
 */
inventoryRouter.get('/stats', async (req, res, next) => {
  try {
    const stats = await inventoryItemService.getInventoryStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    error.fallbackMessage = 'Failed to retrieve inventory statistics';
    return next(error);
  }
});

/**
 * GET /api/inventory/low-stock
 * Get items that are low in stock
 */
inventoryRouter.get('/low-stock', async (req, res, next) => {
  try {
    const items = await inventoryItemService.getLowStockItems();

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    error.fallbackMessage = 'Failed to retrieve low stock items';
    return next(error);
  }
});

/**
 * GET /api/inventory/lookup/:barcode
 * Contacts external Open Food Facts service to autofill frontend mapping.
 * Entirely optional and completely decoupled from POST /api/inventory.
 */
inventoryRouter.get('/lookup/:barcode', async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const lookupData = await openFoodFactsService.lookupByBarcode(barcode);

    res.status(200).json({
      success: true,
      data: lookupData,
    });
  } catch (error) {
    error.fallbackMessage = 'Failed to handle barcode lookup';
    return next(error);
  }
});

/**
 * GET /api/inventory/existing-lookup
 * Find existing inventory item matches for duplicate-check UX.
 */
inventoryRouter.get('/existing-lookup', async (req, res, next) => {
  try {
    const { name, barcode } = req.query;

    if (!name && !barcode) {
      return res.status(400).json({
        success: false,
        message: 'name or barcode is required for existing lookup',
      });
    }

    const lookupData = await inventoryItemService.findExistingInventoryItem({
      name,
      barcode,
    });

    res.status(200).json({
      success: true,
      data: lookupData,
    });
  } catch (error) {
    error.fallbackMessage = 'Failed to handle existing inventory lookup';
    return next(error);
  }
});

/**
 * GET /api/inventory/:id
 * Get a single inventory item by ID
 */
inventoryRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await inventoryItemService.getInventoryItemById(id);

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    error.fallbackMessage = 'Failed to retrieve inventory item';
    return next(error);
  }
});

/**
 * POST /api/inventory
 * Create a new inventory item
 */
inventoryRouter.post(
  '/',
  validateCreateInventoryItem,
  async (req, res, next) => {
    try {
      const { itemData, initialBatch } = new CreateInventoryItemRequestDTO(
        req.body
      ).toObject();

      const newItem = await inventoryItemService.createInventoryItem(
        itemData,
        initialBatch
      );

      res.status(201).json({
        success: true,
        message: 'Inventory item created successfully',
        data: newItem,
      });
    } catch (error) {
      error.fallbackMessage = 'Failed to create inventory item';
      return next(error);
    }
  }
);

/**
 * POST /api/inventory/:id/batches
 * Add a new stock batch to an inventory item
 */
inventoryRouter.post(
  '/:id/batches',
  validateAddInventoryBatch,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const batchData = new AddInventoryBatchRequestDTO(req.body).toObject();

      const updatedItem = await inventoryItemService.addBatch(id, batchData);

      res.status(201).json({
        success: true,
        message: 'Inventory batch added successfully',
        data: updatedItem,
      });
    } catch (error) {
      error.fallbackMessage = 'Failed to add inventory batch';
      return next(error);
    }
  }
);

/**
 * DELETE /api/inventory/:id/batches/:batchId
 * Remove a stock batch from an inventory item
 */
inventoryRouter.delete('/:id/batches/:batchId', async (req, res, next) => {
  try {
    const { id, batchId } = req.params;

    const updatedItem = await inventoryItemService.removeBatch(id, batchId);

    res.status(200).json({
      success: true,
      message: 'Inventory batch removed successfully',
      data: updatedItem,
    });
  } catch (error) {
    error.fallbackMessage = 'Failed to remove inventory batch';
    return next(error);
  }
});

/**
 * PUT /api/inventory/:id
 * Fully update an inventory item
 */
inventoryRouter.put(
  '/:id',
  validateUpdateInventoryItem,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = new UpdateInventoryItemRequestDTO(req.body).toObject();

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
      error.fallbackMessage = 'Failed to update inventory item';
      return next(error);
    }
  }
);

/**
 * PATCH /api/inventory/:id
 * Partially update an inventory item
 */
inventoryRouter.patch(
  '/:id',
  validatePatchInventoryItem,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const partialData = new PatchInventoryItemRequestDTO(req.body).toObject();

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
      error.fallbackMessage = 'Failed to partially update inventory item';
      return next(error);
    }
  }
);

/**
 * PATCH /api/inventory/:id/decrement
 * Decrement inventory item quantity
 */
inventoryRouter.patch(
  '/:id/decrement',
  validateAdjustInventoryQuantity,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const adjustmentData = new AdjustInventoryQuantityRequestDTO(
        req.body
      ).toObject();

      const updatedItem = await inventoryItemService.decrementInventoryItem(
        id,
        adjustmentData
      );

      res.status(200).json({
        success: true,
        message: 'Inventory item quantity decreased successfully',
        data: updatedItem,
      });
    } catch (error) {
      error.fallbackMessage = 'Failed to decrement inventory item quantity';
      return next(error);
    }
  }
);

/**
 * DELETE /api/inventory/:id
 * Delete an inventory item
 */
inventoryRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedItem = await inventoryItemService.deleteInventoryItem(id);

    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully',
      data: deletedItem,
    });
  } catch (error) {
    error.fallbackMessage = 'Failed to delete inventory item';
    return next(error);
  }
});

inventoryRouter.use(inventoryErrorMiddleware);
