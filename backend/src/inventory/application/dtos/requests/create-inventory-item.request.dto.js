function toPlainObject(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  return { ...input };
}

const ITEM_DATA_KEYS = [
  'name',
  'category',
  'unit',
  'barcode',
  'description',
  'brand',
  'allergens',
  'traces',
  'ingredients',
  'imageUrl',
  'nutritionalGrade',
  'reorderLevel',
  'packageWeight',
  'packageWeightUnit',
  'packageType',
];

const INITIAL_BATCH_KEYS = [
  'quantity',
  'expiryDate',
  'supplier',
  'unitPrice',
  'location',
  'batchNote',
];

function pickKeys(source, keys) {
  const normalizedSource = toPlainObject(source);

  return keys.reduce((result, key) => {
    if (normalizedSource[key] !== undefined) {
      result[key] = normalizedSource[key];
    }

    return result;
  }, {});
}

export class CreateInventoryItemRequestDTO {
  constructor(payload = {}) {
    this.payload = payload;
  }

  toObject() {
    return {
      itemData: pickKeys(this.payload, ITEM_DATA_KEYS),
      initialBatch: pickKeys(this.payload, INITIAL_BATCH_KEYS),
    };
  }
}
