import { CreateInventoryItemRequestDTO } from './create-inventory-item.request.dto.js';

export class UpdateInventoryItemRequestDTO extends CreateInventoryItemRequestDTO {
  toObject() {
    return super.toObject().itemData;
  }
}
