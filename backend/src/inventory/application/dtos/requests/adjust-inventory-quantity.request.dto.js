export class AdjustInventoryQuantityRequestDTO {
  constructor(payload = {}) {
    this.payload = payload;
  }

  toObject() {
    if (
      !this.payload ||
      typeof this.payload !== 'object' ||
      Array.isArray(this.payload)
    ) {
      return {};
    }

    return {
      amount: this.payload.amount,
    };
  }
}
