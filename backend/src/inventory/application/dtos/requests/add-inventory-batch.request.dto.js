const BATCH_KEYS = [
  'quantity',
  'expiryDate',
  'supplier',
  'unitPrice',
  'location',
  'batchNote',
];

function toPlainObject(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  return { ...input };
}

function pickKeys(source, keys) {
  const normalizedSource = toPlainObject(source);

  return keys.reduce((result, key) => {
    if (normalizedSource[key] !== undefined) {
      result[key] = normalizedSource[key];
    }

    return result;
  }, {});
}

export class AddInventoryBatchRequestDTO {
  constructor(payload = {}) {
    this.payload = payload;
  }

  toObject() {
    return pickKeys(this.payload, BATCH_KEYS);
  }
}
