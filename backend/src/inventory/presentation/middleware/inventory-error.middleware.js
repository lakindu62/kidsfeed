import { handleInventoryItemError } from '../errors/inventory-error.handler.js';

export function inventoryErrorMiddleware(error, _req, res, _next) {
  const fallbackMessage =
    error?.fallbackMessage ||
    'An unexpected error occurred in inventory module';

  return handleInventoryItemError(res, error, fallbackMessage);
}
