import { jest } from '@jest/globals';

import { validateAddInventoryBatch } from '../../../src/inventory/presentation/validators/add-inventory-batch.validator.js';
import { validateCreateInventoryItem } from '../../../src/inventory/presentation/validators/create-inventory-item.validator.js';
import { validateUpdateInventoryItem } from '../../../src/inventory/presentation/validators/update-inventory-item.validator.js';

function makeReq(body) {
  return { body };
}

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('inventory validators', () => {
  describe('validateCreateInventoryItem', () => {
    it('passes valid inventory item payloads through', () => {
      const next = jest.fn();

      validateCreateInventoryItem(
        makeReq({
          name: 'Rice',
          category: 'GRAINS',
          quantity: 12,
          unit: 'kg',
        }),
        makeRes(),
        next
      );

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('rejects missing item name', () => {
      const next = jest.fn();
      const res = makeRes();

      validateCreateInventoryItem(
        makeReq({ category: 'GRAINS', quantity: 12, unit: 'kg' }),
        res,
        next
      );

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'name is required and cannot be empty',
        })
      );
    });

    it('rejects manual status fields', () => {
      const next = jest.fn();
      const res = makeRes();

      validateCreateInventoryItem(
        makeReq({
          name: 'Rice',
          category: 'GRAINS',
          quantity: 12,
          unit: 'kg',
          status: 'ACTIVE',
        }),
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'status is derived by the server and cannot be set manually',
        })
      );
    });
  });

  describe('validateUpdateInventoryItem', () => {
    it('passes valid item updates through', () => {
      const next = jest.fn();

      validateUpdateInventoryItem(
        makeReq({
          name: 'Rice',
          category: 'GRAINS',
          quantity: 12,
          unit: 'kg',
        }),
        makeRes(),
        next
      );

      expect(next).toHaveBeenCalledWith();
    });

    it('rejects expiryDate on item-level update requests', () => {
      const next = jest.fn();
      const res = makeRes();

      validateUpdateInventoryItem(
        makeReq({
          name: 'Rice',
          category: 'GRAINS',
          quantity: 12,
          unit: 'kg',
          expiryDate: '2026-12-31',
        }),
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'expiryDate cannot be set on item-level update requests',
        })
      );
    });
  });

  describe('validateAddInventoryBatch', () => {
    it('passes valid batch payloads through', () => {
      const next = jest.fn();

      validateAddInventoryBatch(
        makeReq({
          quantity: 10,
          expiryDate: '2026-12-31',
          supplier: 'Supplier A',
          unitPrice: 200,
          location: 'Cold room',
          batchNote: 'First batch',
        }),
        makeRes(),
        next
      );

      expect(next).toHaveBeenCalledWith();
    });

    it('rejects missing quantity', () => {
      const next = jest.fn();
      const res = makeRes();

      validateAddInventoryBatch(makeReq({ supplier: 'Supplier A' }), res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'quantity is required',
        })
      );
    });

    it('rejects manual status fields on batch payloads', () => {
      const next = jest.fn();
      const res = makeRes();

      validateAddInventoryBatch(
        makeReq({
          quantity: 10,
          status: 'ACTIVE',
        }),
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'status is derived by the server and cannot be set manually',
        })
      );
    });
  });
});
