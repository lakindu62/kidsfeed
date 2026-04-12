import {
  INVENTORY_EXPIRY_STATUS,
  INVENTORY_STATUS,
} from '../../../src/inventory/application/constants/inventory-constants.js';
import {
  sortBatchesFifo,
  syncQuantityAndStatus,
} from '../../../src/inventory/application/utils/inventory-status.util.js';

describe('inventory-status.util', () => {
  describe('sortBatchesFifo', () => {
    it('sorts batches by earliest expiry date first and leaves undated batches last', () => {
      const result = sortBatchesFifo([
        { id: 'later', expiryDate: '2026-06-01' },
        { id: 'none' },
        { id: 'earlier', expiryDate: '2026-05-01' },
      ]);

      expect(result.map((batch) => batch.id)).toEqual([
        'earlier',
        'later',
        'none',
      ]);
    });
  });

  describe('syncQuantityAndStatus', () => {
    it('marks an item as out of stock when it has no usable batches', () => {
      const item = syncQuantityAndStatus({ batches: [] });

      expect(item.quantity).toBe(0);
      expect(item.status).toBe(INVENTORY_STATUS.OUT_OF_STOCK);
      expect(item.expiryStatus).toBe(INVENTORY_EXPIRY_STATUS.UNAVAILABLE);
    });

    it('calculates usable quantity and expiry status from mixed batches', () => {
      const item = syncQuantityAndStatus({
        reorderLevel: 5,
        batches: [
          {
            quantity: 8,
            expiryDate: '2099-12-31',
          },
          {
            quantity: 2,
            expiryDate: '2000-01-01',
          },
        ],
      });

      expect(item.quantity).toBe(8);
      expect(item.status).toBe(INVENTORY_STATUS.ACTIVE);
      expect(item.expiryStatus).toBe(INVENTORY_EXPIRY_STATUS.PARTIALLY_EXPIRED);
      expect(item.batches[0].status).toBe(INVENTORY_STATUS.ACTIVE);
      expect(item.batches[1].status).toBe(INVENTORY_STATUS.EXPIRED);
    });

    it('marks an item as low stock when usable quantity is at or below reorder level', () => {
      const item = syncQuantityAndStatus({
        reorderLevel: 10,
        batches: [
          {
            quantity: 7,
            expiryDate: '2099-12-31',
          },
        ],
      });

      expect(item.quantity).toBe(7);
      expect(item.status).toBe(INVENTORY_STATUS.LOW_STOCK);
      expect(item.expiryStatus).toBe(INVENTORY_EXPIRY_STATUS.SAFE);
    });

    it('marks an item as totally expired when every non-empty batch is expired', () => {
      const item = syncQuantityAndStatus({
        reorderLevel: 1,
        batches: [
          {
            quantity: 3,
            expiryDate: '2000-01-01',
          },
          {
            quantity: 1,
            expiryDate: '2001-01-01',
          },
        ],
      });

      expect(item.quantity).toBe(0);
      expect(item.status).toBe(INVENTORY_STATUS.EXPIRED);
      expect(item.expiryStatus).toBe(INVENTORY_EXPIRY_STATUS.TOTALLY_EXPIRED);
    });
  });
});
