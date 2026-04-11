# Inventory Management Module

## Overview

The Inventory Management module provides comprehensive CRUD operations for managing inventory items in the KidsFeed system. This module follows a layered architecture with clear separation of concerns across application, infrastructure, and presentation layers.

## Architecture

This module is structured using a layered architecture approach consistent with other modules in the system:

```
inventory/
├── bootstrap.js                                   # Module initialization
├── index.js                                       # Public HTTP router export
├── integration.js                                 # Internal integration export
├── application/                                   # Business logic layer
│   ├── constants/
│   │   └── inventory-constants.js                # Enums and constants
│   ├── dtos/                                      # Data Transfer Objects
│   │   ├── requests/
│   │   │   ├── create-inventory-item.request.dto.js
│   │   │   ├── update-inventory-item.request.dto.js
│   │   │   ├── patch-inventory-item.request.dto.js
│   │   │   └── adjust-inventory-quantity.request.dto.js
│   │   └── responses/
│   │       └── barcode-lookup-response.dto.js
│   └── services/
│       ├── inventory-item.service.js             # Main inventory use-cases
│       ├── inventory-integration.service.js      # Internal module interface
│       └── open-food-facts.service.js            # External barcode lookup
├── infrastructure/                                # Data access layer
│   ├── repositories/
│   │   └── inventory-item.repository.js
│   ├── schemas/
│   │   └── inventory-item.schema.js
│   └── services/
└── presentation/                                  # HTTP/API layer
  ├── controllers/
  │   └── inventory-item.controller.js
  ├── errors/
  │   └── inventory-error.handler.js
  ├── middleware/
  │   └── inventory-error.middleware.js
  └── validators/
    ├── create-inventory-item.validator.js
    ├── update-inventory-item.validator.js
    ├── patch-inventory-item.validator.js
    └── adjust-inventory-quantity.validator.js
```

## Data Model

### InventoryItem Schema

| Field               | Type          | Required | Description                                    |
| ------------------- | ------------- | -------- | ---------------------------------------------- |
| `name`              | String        | Yes      | Name of the inventory item                     |
| `barcode`           | String        | No       | Product barcode (digits only when provided)    |
| `description`       | String        | No       | Detailed description of the item               |
| `brand`             | String        | No       | Product brand                                  |
| `allergens`         | String[]      | No       | Array of allergens                             |
| `traces`            | String[]      | No       | Array of allergen traces                       |
| `ingredients`       | String        | No       | Full ingredients text                          |
| `imageUrl`          | String        | No       | Product image URL                              |
| `nutritionalGrade`  | String        | No       | Nutritional grade: a, b, c, d, e               |
| `category`          | String (Enum) | Yes      | Category: FOOD, SUPPLIES, EQUIPMENT, OTHER     |
| `quantity`          | Number        | Yes      | Derived usable quantity from non-expired batches (min: 0) |
| `unit`              | String        | Yes      | Unit of measurement (e.g., kg, pieces, liters) |
| `reorderLevel`      | Number        | No       | Minimum quantity before reorder (default: 10)  |
| `packageWeight`     | Number        | No       | Package weight/volume value (min: 0)           |
| `packageWeightUnit` | String        | No       | Package weight/volume unit                     |
| `packageType`       | String        | No       | Package/container type                         |
| `batches`           | Array         | Yes      | Embedded stock batches                          |
| `status`            | String (Enum) | Auto     | ACTIVE, LOW_STOCK, OUT_OF_STOCK, EXPIRED       |
| `expiryStatus`      | String (Enum) | Auto     | UNAVAILABLE, SAFE, PARTIALLY_EXPIRED, TOTALLY_EXPIRED |
| `createdAt`         | Date          | Auto     | Creation timestamp                             |
| `updatedAt`         | Date          | Auto     | Last update timestamp                          |

### Batch Schema

Each inventory item keeps an embedded `batches` array. Every batch stores its own quantity and batch-owned metadata:

| Field        | Type   | Required | Default    | Notes                              |
| ------------ | ------ | -------- | ---------- | ---------------------------------- |
| `quantity`   | Number | Yes      | -          | min: 0                             |
| `expiryDate` | Date   | No       | `null`     | Batch expiry date                  |
| `supplier`   | String | No       | `''`       | Supplier for the batch             |
| `unitPrice`  | Number | No       | `0`        | min: 0                             |
| `location`   | String | No       | `''`       | Batch storage location             |
| `receivedAt` | Date   | No       | `Date.now` | Auto-set when batch is created     |
| `batchNote`  | String | No       | `''`       | Free-text batch note               |
| `status`     | String | Auto     | `ACTIVE`   | ACTIVE, LOW_STOCK, OUT_OF_STOCK, EXPIRED |

Root `quantity` is derived from usable batches only. Root `status` is stock-state semantics. Root `expiryStatus` is derived separately and is used to represent batch expiry coverage.

### Status Auto-Calculation

The `status` field is automatically calculated from batch-aware stock state:

- **EXPIRED**: If all non-empty batches are expired
- **OUT_OF_STOCK**: If there are no batches or no usable stock remains for reasons other than full expiry
- **LOW_STOCK**: If usable stock is at or below `reorderLevel`
- **ACTIVE**: Otherwise

The `expiryStatus` field is automatically calculated from batch expiry coverage:

- **UNAVAILABLE**: No batches exist yet
- **SAFE**: No non-empty batch is expired
- **PARTIALLY_EXPIRED**: Some but not all non-empty batches are expired
- **TOTALLY_EXPIRED**: All non-empty batches are expired

Clients cannot set `status` or `expiryStatus` manually in POST, PUT, PATCH, or batch requests.

## API Endpoints

Base URL: `/api/inventory`

### 1. List All Items

```http
GET /api/inventory
```

**Query Parameters:**

- `category` (optional) - Filter by category (FOOD, SUPPLIES, EQUIPMENT, OTHER)
- `status` (optional) - Filter by status (ACTIVE, LOW_STOCK, OUT_OF_STOCK, EXPIRED)
- `search` (optional) - Search by item name (case-insensitive)

**Response:**

```json
{
  "success": true,
  "count": 10,
  "data": [...]
}
```

### 2. Get Inventory Statistics

```http
GET /api/inventory/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 100,
    "active": 80,
    "lowStock": 15,
    "outOfStock": 3,
    "expired": 2
  }
}
```

### 3. Get Low Stock Items

```http
GET /api/inventory/low-stock
```

**Response:**

```json
{
  "success": true,
  "count": 15,
  "data": [...]
}
```

### 4. Barcode Lookup (Open Food Facts)

```http
GET /api/inventory/lookup/:barcode
```

**Response:**

```json
{
  "success": true,
  "data": {
    "barcode": "...",
    "name": "...",
    "brand": "...",
    "weight": 0,
    "unit": "",
    "allergens": ["milk"],
    "traces": ["nuts"],
    "ingredients": "...",
    "imageUrl": "https://...",
    "nutritionalGrade": "a",
    "packageWeight": 400,
    "packageWeightUnit": "g",
    "packageType": "box"
  }
}
```

**Notes:**

- Lookup data is normalized by `BarcodeLookupResponseDTO`.
- Fields like `allergens`, `traces`, `ingredients`, `imageUrl`, and packaging fields are included when available from Open Food Facts.
- `weight` and `unit` are currently part of the DTO contract and may be returned as defaults (`0` and empty string) when not mapped.

**Error Responses:**

- `404` when barcode/product is not found in Open Food Facts.
- `500` for other lookup failures (connectivity/downstream errors).

### 5. Existing Item Lookup

```http
GET /api/inventory/existing-lookup?name=<name>&barcode=<barcode>
```

This endpoint supports the frontend duplicate-check flow and never calls Open Food Facts.

**Lookup behavior:**

- If `barcode` is provided, the backend checks for an exact barcode match first.
- If there is no barcode match, or barcode is absent, the backend checks for a normalized exact name match.
- If exact name matching finds nothing, the backend returns fuzzy name candidates as advisory matches only.

**Response shape:**

```json
{
  "success": true,
  "data": {
    "matchType": "BARCODE_EXACT | NAME_EXACT | NAME_POSSIBLE | NONE",
    "existingItem": null,
    "candidates": [],
    "suggestedAction": "CREATE_NEW_ITEM | ADD_BATCH_TO_EXISTING | ASK_USER_TO_CONFIRM"
  }
}
```

### 6. Get Single Item

```http
GET /api/inventory/:id
```

**Response:**

```json
{
  "success": true,
  "data": {...}
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Inventory item with ID {id} not found"
}
```

**Error Response (400 - invalid id format):**

```json
{
  "success": false,
  "message": "Invalid inventory item id format"
}
```

### 7. Create New Item

```http
POST /api/inventory
```

**Required Item Fields:**

- `name` (string, non-empty)
- `category` (string, one of: FOOD, SUPPLIES, EQUIPMENT, OTHER)
- `unit` (string, non-empty)

**Optional Item Fields:**

- `description` (string)
- `barcode` (string of digits)
- `brand` (string)
- `allergens` (array of strings)
- `traces` (array of strings)
- `ingredients` (string)
- `imageUrl` (valid URL string or empty string)
- `nutritionalGrade` (string: a, b, c, d, e)
- `packageWeight` (number, ≥ 0)
- `packageWeightUnit` (string)
- `packageType` (string)
- `reorderLevel` (number, ≥ 0)
**Required Initial Batch Fields:**

- `quantity` (number, ≥ 0)

**Optional Initial Batch Fields:**

- `expiryDate` (ISO date string)
- `supplier` (string)
- `unitPrice` (number, ≥ 0)
- `location` (string)
- `batchNote` (string)

`status` and `expiryStatus` are derived by backend and must not be provided by clients.


**Request Example:**

```json
{
  "name": "Rice",
  "description": "Basmati Rice",
  "category": "FOOD",
  "unit": "kg",
  "reorderLevel": 10,
  "quantity": 50,
  "unitPrice": 150,
  "supplier": "ABC Suppliers",
  "location": "Warehouse A",
  "expiryDate": "2026-12-31",
  "batchNote": "Initial delivery"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Inventory item created successfully",
  "data": {...}
}
```

### 8. Update Item (Full Update)

```http
PUT /api/inventory/:id
```

**Required Item Fields:** Same as POST item fields (all required item fields must be provided)

**Optional Item Fields:** Same optional item fields as POST.

Item-level PUT does not accept batch fields.

`status` and `expiryStatus` are derived by backend and must not be provided by clients.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Inventory item updated successfully",
  "data": {...}
}
```

### 9. Update Item (Partial Update)

```http
PATCH /api/inventory/:id
```

**Fields:** Any combination of item-level fields from the schema (at least one required)

**Request Example:**

```json
{
  "quantity": 30,
  "brand": "Updated Brand"
}
```

`quantity`, batch-only fields, `status`, and `expiryStatus` are derived by backend and must not be provided by clients.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Inventory item partially updated successfully",
  "data": {...}
}
```

### 10. Add Batch to Item

```http
POST /api/inventory/:id/batches
```

**Request Body:**

```json
{
  "quantity": 5,
  "expiryDate": "2026-12-31",
  "supplier": "ABC Suppliers",
  "unitPrice": 150,
  "location": "Warehouse A",
  "batchNote": "Second delivery"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Inventory batch added successfully",
  "data": { ... }
}
```

### 11. Decrement Item Quantity

```http
PATCH /api/inventory/:id/decrement
```

**Request Body:**

```json
{
  "amount": 3
}
```

**Notes:**

- `amount` must be greater than `0`
- request fails with `400` when decrement would make quantity negative

**Success Response (200):**

```json
{
  "success": true,
  "message": "Inventory item quantity decreased successfully",
  "data": { ... }
}
```

### 12. Delete Item

```http
DELETE /api/inventory/:id
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Inventory item deleted successfully",
  "data": {...}
}
```

## Validation Rules

### Create (POST) and Update (PUT)

- `name`: Required, non-empty string
- `category`: Required, must be one of: FOOD, SUPPLIES, EQUIPMENT, OTHER
- `unit`: Required, non-empty string
- `barcode`: Optional, digits-only string
- `brand`: Optional, string
- `allergens`: Optional, array of strings
- `traces`: Optional, array of strings
- `ingredients`: Optional, string
- `imageUrl`: Optional, valid URL or empty string
- `nutritionalGrade`: Optional, one of: a, b, c, d, e
- `packageWeight`: Optional, non-negative number
- `packageWeightUnit`: Optional, string
- `packageType`: Optional, string
- `reorderLevel`: Optional, non-negative number
- `status`: Rejected if provided (server-derived)
- `expiryStatus`: Rejected if provided (server-derived)

### Create Initial Batch

- `quantity`: Required, non-negative number
- `expiryDate`: Optional, valid ISO date string
- `supplier`: Optional, string
- `unitPrice`: Optional, non-negative number
- `location`: Optional, string
- `batchNote`: Optional, string

### Partial Update (PATCH)

- At least one item-level field must be provided
- All provided fields must pass their respective validations
- Fields not provided will remain unchanged
- `quantity`, batch-only fields, `status`, and `expiryStatus` are rejected if provided

### Quantity Adjustments

- `amount`: Required, number, must be greater than 0
- `PATCH /api/inventory/:id/decrement`

### Batch Creation

- `quantity`: Required, non-negative number
- `expiryDate`: Optional, valid ISO date string
- `supplier`: Optional, string
- `unitPrice`: Optional, non-negative number
- `location`: Optional, string
- `batchNote`: Optional, string

## Service Layer Methods

### InventoryItemService

| Method                                             | Description                                  |
| -------------------------------------------------- | -------------------------------------------- |
| `createInventoryItem(itemData, initialBatch)`      | Create a new inventory item with initial batch |
| `getInventoryItemById(itemId)`                     | Get item by ID (throws error if not found)   |
| `listInventoryItems(filters)`                      | List items with optional filters             |
| `findExistingInventoryItem(criteria)`              | Existing-item lookup for duplicate checks     |
| `updateInventoryItem(itemId, updateData)`          | Full update (PUT)                             |
| `patchInventoryItem(itemId, partialData)`          | Partial update (PATCH)                        |
| `addBatch(itemId, batchData)`                      | Add a new batch to an item                    |
| `removeBatch(itemId, batchId)`                     | Remove a batch from an item                   |
| `decrementInventoryItem(itemId, payload)`          | FIFO decrease across usable batches           |
| `deleteInventoryItem(itemId)`                      | Delete item by ID                              |
| `getLowStockItems()`                               | Get all items with quantity ≤ reorderLevel    |
| `getItemsByCategory(category)`                     | Get items by category                         |
| `getInventoryStats()`                              | Get inventory statistics                      |

### InventoryIntegrationService

| Method                             | Description                                           |
| ---------------------------------- | ----------------------------------------------------- |
| `getInventoryItemById(itemId)`     | Internal read by id                                   |
| `listInventoryItems(filters)`      | Internal list/filter                                  |
| `allocateForMealPlanning(payload)` | Internal decrement for meal-planning allocation/use   |
| `releaseForMealPlanning(payload)`  | Internal add-batch for meal-planning release/rollback |

## Repository Layer Methods

### InventoryItemRepository

| Method                              | Description                              |
| ----------------------------------- | ---------------------------------------- |
| `create(itemData, initialBatch)`    | Create new item and initial batch        |
| `findById(id)`                      | Find item by ID                          |
| `findMany(filter)`                  | Find items with optional filter          |
| `updateById(id, updates)`           | Update item-level fields by ID          |
| `patchById(id, updates)`            | Partially update item-level fields      |
| `addBatchById(id, batch)`           | Add a batch to an item                  |
| `removeBatchById(itemId, batchId)`  | Remove a batch from an item             |
| `deleteById(id)`                    | Delete item by ID                        |
| `count(filter)`                     | Count items with optional filter         |
| `findLowStockItems()`               | Find items where quantity ≤ reorderLevel |
| `findByCategory(category)`          | Find items by category                   |
| `decrementQuantityById(id, amount)` | FIFO decrement across usable batches     |

## Error Handling

Inventory routes forward errors to module middleware:

- `presentation/middleware/inventory-error.middleware.js`
- which delegates classification to `presentation/errors/inventory-error.handler.js`

Error response envelope depends on status category:

- `400`/`404`

```json
{
  "success": false,
  "message": "Error description"
}
```

- `500`

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Validation error, invalid id format, or invalid quantity adjustment
- `409` - Duplicate inventory item detected on create
- `404` - Item not found
- `500` - Server error

## Usage Examples

### Create an Item

```javascript
const response = await fetch('/api/inventory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Milk Powder',
    category: 'FOOD',
    unit: 'kg',
    reorderLevel: 5,
    quantity: 20,
    unitPrice: 500,
    expiryDate: '2026-12-31',
    supplier: 'ABC Suppliers',
    location: 'Warehouse A',
    batchNote: 'Initial stock',
  }),
});
```

### Add Batch

```javascript
const response = await fetch('/api/inventory/123/batches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quantity: 15,
    expiryDate: '2027-01-01',
    supplier: 'ABC Suppliers',
    unitPrice: 525,
    location: 'Warehouse B',
    batchNote: 'Additional delivery',
  }),
});
```

### Existing Item Lookup

```javascript
const response = await fetch(
  '/api/inventory/existing-lookup?barcode=1234567890123&name=Milk%20Powder'
);
const data = await response.json();
console.log(data.data.matchType);
```

### Decrement Quantity

```javascript
const response = await fetch('/api/inventory/123/decrement', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 5 }),
});
```

### Get Low Stock Items

```javascript
const response = await fetch('/api/inventory/low-stock');
const data = await response.json();
console.log(data.data); // Array of low stock items
```

### Filter by Category

```javascript
const response = await fetch('/api/inventory?category=FOOD&status=ACTIVE');
const data = await response.json();
```

## Integration

The inventory module is registered in the main application:

```javascript
// src/app.js
import { inventoryRouter } from './inventory/index.js';

app.use('/api/inventory', inventoryRouter);
```

Internal module integration surface is exported separately:

```javascript
// src/inventory/integration.js
import { inventoryIntegrationService } from './inventory/integration.js';

await inventoryIntegrationService.allocateForMealPlanning({
  itemId: '...',
  amount: 2,
});
```

## Database Indexes

The following indexes are created for optimized query performance:

- `barcode` (ascending)
- `name` (ascending)
- `category` (ascending)
- `status` (ascending)

## Constants

Available in `application/constants/inventory-constants.js`:

```javascript
INVENTORY_CATEGORIES = {
  FOOD: 'FOOD',
  SUPPLIES: 'SUPPLIES',
  EQUIPMENT: 'EQUIPMENT',
  OTHER: 'OTHER',
};

INVENTORY_STATUS = {
  ACTIVE: 'ACTIVE',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  EXPIRED: 'EXPIRED',
};

INVENTORY_EXPIRY_STATUS = {
  UNAVAILABLE: 'UNAVAILABLE',
  SAFE: 'SAFE',
  PARTIALLY_EXPIRED: 'PARTIALLY_EXPIRED',
  TOTALLY_EXPIRED: 'TOTALLY_EXPIRED',
};

MEASUREMENT_UNITS = [
  'pieces',
  'kg',
  'g',
  'liters',
  'ml',
  'boxes',
  'packs',
  'units',
];

DEFAULT_REORDER_LEVEL = 10;
```

## Future Enhancements

Potential improvements for future versions:

- Inventory movement tracking (in/out transactions)
- Batch operations for bulk updates
- Inventory forecasting based on usage patterns
- Integration with supplier management
- Automated reorder alerts/notifications
- Barcode/QR code support
- Inventory audit logs
- Multi-location inventory tracking
- Image upload for inventory items

## Testing

To test the endpoints, you can use tools like Postman, cURL, or any HTTP client.

Example cURL command:

```bash
# Create an item
curl -X POST http://localhost:3000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rice",
    "category": "FOOD",
    "quantity": 50,
    "unit": "kg"
  }'

# Get all items
curl http://localhost:3000/api/inventory

# Get low stock items
curl http://localhost:3000/api/inventory/low-stock
```

## Contributing

When adding new features or modifying existing code:

1. Follow the existing layered architecture structure
2. Use DTOs for request/response data transformation when applicable
3. Add JSDoc comments to all functions
4. Implement proper validation
5. Include error handling
6. Update this documentation
7. Write unit tests (if test framework is available)

## Support

For issues or questions regarding the inventory module, please contact the development team or create an issue in the project repository.

---

**Last Updated:** April 11, 2026  
**Module Version:** 1.0.0  
**Maintainer:** KidsFeed Development Team
