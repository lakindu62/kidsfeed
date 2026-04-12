import { CreateInventoryItemRequestDTO } from './create-inventory-item.request.dto.js';

export class PatchInventoryItemRequestDTO extends CreateInventoryItemRequestDTO {
  toObject() {
    return super.toObject().itemData;
  }
}
