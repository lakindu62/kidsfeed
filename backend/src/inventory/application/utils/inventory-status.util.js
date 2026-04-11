import {
  INVENTORY_EXPIRY_STATUS,
  INVENTORY_STATUS,
} from '../constants/inventory-constants.js';

function toComparableDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function isBatchExpired(batch, now = new Date()) {
  const expiryDate = toComparableDate(batch?.expiryDate);

  return Boolean(batch?.quantity > 0 && expiryDate && expiryDate < now);
}

export function sortBatchesFifo(batches = []) {
  return [...batches].sort((leftBatch, rightBatch) => {
    const leftExpiry = toComparableDate(leftBatch?.expiryDate);
    const rightExpiry = toComparableDate(rightBatch?.expiryDate);

    if (!leftExpiry && !rightExpiry) {
      return 0;
    }

    if (!leftExpiry) {
      return 1;
    }

    if (!rightExpiry) {
      return -1;
    }

    return leftExpiry.getTime() - rightExpiry.getTime();
  });
}

export function syncQuantityAndStatus(item) {
  if (!item) {
    return item;
  }

  const batches = Array.isArray(item.batches) ? item.batches : [];
  const now = new Date();
  const reorderLevel = Number(item.reorderLevel ?? 0);

  let usableQuantity = 0;
  let expiredNonEmptyBatchCount = 0;
  let nonEmptyBatchCount = 0;

  for (const batch of batches) {
    const batchQuantity = Number(batch?.quantity ?? 0);
    const normalizedQuantity = Number.isNaN(batchQuantity) ? 0 : batchQuantity;
    const batchExpired = isBatchExpired(batch, now);

    batch.quantity = normalizedQuantity;

    if (normalizedQuantity > 0) {
      nonEmptyBatchCount += 1;

      if (batchExpired) {
        expiredNonEmptyBatchCount += 1;
      } else {
        usableQuantity += normalizedQuantity;
      }
    }

    if (normalizedQuantity <= 0) {
      batch.status = INVENTORY_STATUS.OUT_OF_STOCK;
      continue;
    }

    if (batchExpired) {
      batch.status = INVENTORY_STATUS.EXPIRED;
      continue;
    }

    if (normalizedQuantity <= reorderLevel) {
      batch.status = INVENTORY_STATUS.LOW_STOCK;
      continue;
    }

    batch.status = INVENTORY_STATUS.ACTIVE;
  }

  item.quantity = usableQuantity;

  if (nonEmptyBatchCount === 0) {
    item.status = INVENTORY_STATUS.OUT_OF_STOCK;
    item.expiryStatus = INVENTORY_EXPIRY_STATUS.UNAVAILABLE;
    return item;
  }

  if (expiredNonEmptyBatchCount === nonEmptyBatchCount) {
    item.status = INVENTORY_STATUS.EXPIRED;
    item.expiryStatus = INVENTORY_EXPIRY_STATUS.TOTALLY_EXPIRED;
    return item;
  }

  if (expiredNonEmptyBatchCount > 0) {
    item.expiryStatus = INVENTORY_EXPIRY_STATUS.PARTIALLY_EXPIRED;
  } else {
    item.expiryStatus = INVENTORY_EXPIRY_STATUS.SAFE;
  }

  if (usableQuantity === 0) {
    item.status = INVENTORY_STATUS.OUT_OF_STOCK;
  } else if (usableQuantity <= reorderLevel) {
    item.status = INVENTORY_STATUS.LOW_STOCK;
  } else {
    item.status = INVENTORY_STATUS.ACTIVE;
  }

  return item;
}
