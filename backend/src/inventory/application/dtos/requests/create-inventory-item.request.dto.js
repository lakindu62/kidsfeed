function toPlainObject(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  return { ...input };
}

export class CreateInventoryItemRequestDTO {
  constructor(payload = {}) {
    this.payload = payload;
  }

  toObject() {
    return toPlainObject(this.payload);
  }
}
