import { AddInventoryBatchRequestDTO } from '../../../src/inventory/application/dtos/requests/add-inventory-batch.request.dto.js';
import { AdjustInventoryQuantityRequestDTO } from '../../../src/inventory/application/dtos/requests/adjust-inventory-quantity.request.dto.js';
import { CreateInventoryItemRequestDTO } from '../../../src/inventory/application/dtos/requests/create-inventory-item.request.dto.js';
import { PatchInventoryItemRequestDTO } from '../../../src/inventory/application/dtos/requests/patch-inventory-item.request.dto.js';
import { UpdateInventoryItemRequestDTO } from '../../../src/inventory/application/dtos/requests/update-inventory-item.request.dto.js';

describe('inventory request DTOs', () => {
  it('maps create inventory payload into item and initial batch data', () => {
    const dto = new CreateInventoryItemRequestDTO({
      name: 'Rice',
      category: 'GRAINS',
      unit: 'kg',
      barcode: '123456',
      description: 'Long grain rice',
      brand: 'Kidsfeed',
      allergens: ['none'],
      traces: ['gluten'],
      ingredients: 'Rice',
      imageUrl: 'https://example.com/rice.png',
      nutritionalGrade: 'a',
      reorderLevel: 10,
      packageWeight: 25,
      packageWeightUnit: 'kg',
      packageType: 'bag',
      quantity: 20,
      expiryDate: '2026-12-31',
      supplier: 'Supplier A',
      unitPrice: 100,
      location: 'Store room',
      batchNote: 'First stock',
      ignored: 'nope',
    });

    expect(dto.toObject()).toEqual({
      itemData: {
        name: 'Rice',
        category: 'GRAINS',
        unit: 'kg',
        barcode: '123456',
        description: 'Long grain rice',
        brand: 'Kidsfeed',
        allergens: ['none'],
        traces: ['gluten'],
        ingredients: 'Rice',
        imageUrl: 'https://example.com/rice.png',
        nutritionalGrade: 'a',
        reorderLevel: 10,
        packageWeight: 25,
        packageWeightUnit: 'kg',
        packageType: 'bag',
      },
      initialBatch: {
        quantity: 20,
        expiryDate: '2026-12-31',
        supplier: 'Supplier A',
        unitPrice: 100,
        location: 'Store room',
        batchNote: 'First stock',
      },
    });
  });

  it('maps update inventory payload to item data only', () => {
    const dto = new UpdateInventoryItemRequestDTO({
      name: 'Rice',
      category: 'GRAINS',
      unit: 'kg',
      quantity: 20,
      barcode: '123456',
      supplier: 'Supplier A',
    });

    expect(dto.toObject()).toEqual({
      name: 'Rice',
      category: 'GRAINS',
      unit: 'kg',
      barcode: '123456',
    });
  });

  it('maps patch inventory payload to item data only', () => {
    const dto = new PatchInventoryItemRequestDTO({
      name: 'Rice',
      category: 'GRAINS',
      unit: 'kg',
      quantity: 20,
      batchNote: 'ignored',
    });

    expect(dto.toObject()).toEqual({
      name: 'Rice',
      category: 'GRAINS',
      unit: 'kg',
    });
  });

  it('maps batch adjustment payload to amount only', () => {
    const dto = new AdjustInventoryQuantityRequestDTO({
      amount: 5,
      note: 'ignored',
    });

    expect(dto.toObject()).toEqual({ amount: 5 });
    expect(new AdjustInventoryQuantityRequestDTO(null).toObject()).toEqual({});
    expect(new AdjustInventoryQuantityRequestDTO(['bad']).toObject()).toEqual(
      {}
    );
  });

  it('maps add batch payload to batch keys only', () => {
    const dto = new AddInventoryBatchRequestDTO({
      quantity: 12,
      expiryDate: '2026-12-31',
      supplier: 'Supplier A',
      unitPrice: 200,
      location: 'Cold room',
      batchNote: 'Initial batch',
      ignored: 'nope',
    });

    expect(dto.toObject()).toEqual({
      quantity: 12,
      expiryDate: '2026-12-31',
      supplier: 'Supplier A',
      unitPrice: 200,
      location: 'Cold room',
      batchNote: 'Initial batch',
    });
  });
});
