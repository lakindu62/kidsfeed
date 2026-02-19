# Inventory Management Module

## Overview

The Inventory Management module provides comprehensive CRUD operations for managing inventory items in the KidsFeed system. This module follows Domain-Driven Design (DDD) principles with clear separation of concerns across multiple layers.

## Architecture

This module is structured using DDD principles with the following layers:

```
inventory/
├── index.js                          # Module exports
├── application/                      # Business logic layer
│   ├── constants/
│   │   └── inventory-constants.js   # Enums and constants
│   └── services/
│       └── inventory-item.service.js # Business logic services
├── infrastructure/                   # Data access layer
│   ├── repositories/
│   │   └── inventory-item.repository.js # Data access operations
│   └── schemas/
│       └── inventory-item.schema.js      # Mongoose schema
└── presentation/                     # API layer
    ├── controllers/
    │   └── inventory-item.controller.js  # Express route handlers
    └── validators/
        ├── create-inventory-item.validator.js  # POST validation
        ├── update-inventory-item.validator.js  # PUT validation
        └── patch-inventory-item.validator.js   # PATCH validation
```

## Data Model

### InventoryItem Schema

| Field          | Type          | Required | Description                                    |
| -------------- | ------------- | -------- | ---------------------------------------------- |
| `name`         | String        | Yes      | Name of the inventory item                     |
| `description`  | String        | No       | Detailed description of the item               |
| `category`     | String (Enum) | Yes      | Category: FOOD, SUPPLIES, EQUIPMENT, OTHER     |
| `quantity`     | Number        | Yes      | Current quantity in stock (min: 0)             |
| `unit`         | String        | Yes      | Unit of measurement (e.g., kg, pieces, liters) |
| `reorderLevel` | Number        | No       | Minimum quantity before reorder (default: 10)  |
| `unitPrice`    | Number        | No       | Price per unit (min: 0)                        |
| `supplier`     | String        | No       | Supplier name                                  |
| `location`     | String        | No       | Storage location                               |
| `expiryDate`   | Date          | No       | Expiry date for perishable items               |
| `status`       | String (Enum) | Auto     | ACTIVE, LOW_STOCK, OUT_OF_STOCK, EXPIRED       |
| `createdAt`    | Date          | Auto     | Creation timestamp                             |
| `updatedAt`    | Date          | Auto     | Last update timestamp                          |

### Status Auto-Calculation

The `status` field is automatically calculated based on:

- **EXPIRED**: If `expiryDate` has passed
- **OUT_OF_STOCK**: If `quantity` is 0
- **LOW_STOCK**: If `quantity` ≤ `reorderLevel`
- **ACTIVE**: Otherwise

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

### 4. Get Single Item

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

### 5. Create New Item

```http
POST /api/inventory
```

**Required Fields:**

- `name` (string, non-empty)
- `category` (string, one of: FOOD, SUPPLIES, EQUIPMENT, OTHER)
- `quantity` (number, ≥ 0)
- `unit` (string, non-empty)

**Optional Fields:**

- `description` (string)
- `reorderLevel` (number, ≥ 0)
- `unitPrice` (number, ≥ 0)
- `supplier` (string)
- `location` (string)
- `expiryDate` (ISO date string)

**Request Example:**

```json
{
  "name": "Rice",
  "description": "Basmati Rice",
  "category": "FOOD",
  "quantity": 50,
  "unit": "kg",
  "reorderLevel": 10,
  "unitPrice": 150,
  "supplier": "ABC Suppliers",
  "location": "Warehouse A",
  "expiryDate": "2026-12-31"
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

### 6. Update Item (Full Update)

```http
PUT /api/inventory/:id
```

**Required Fields:** Same as POST (all required fields must be provided)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Inventory item updated successfully",
  "data": {...}
}
```

### 7. Update Item (Partial Update)

```http
PATCH /api/inventory/:id
```

**Fields:** Any combination of fields from the schema (at least one required)

**Request Example:**

```json
{
  "quantity": 30,
  "status": "ACTIVE"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Inventory item partially updated successfully",
  "data": {...}
}
```

### 8. Delete Item

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
- `quantity`: Required, non-negative number
- `unit`: Required, non-empty string
- `reorderLevel`: Optional, non-negative number
- `unitPrice`: Optional, non-negative number
- `expiryDate`: Optional, valid ISO date string

### Partial Update (PATCH)

- At least one field must be provided
- All provided fields must pass their respective validations
- Fields not provided will remain unchanged

## Service Layer Methods

### InventoryItemService

| Method                                    | Description                                |
| ----------------------------------------- | ------------------------------------------ |
| `createInventoryItem(itemData)`           | Create a new inventory item                |
| `getInventoryItemById(itemId)`            | Get item by ID (throws error if not found) |
| `listInventoryItems(filters)`             | List items with optional filters           |
| `updateInventoryItem(itemId, updateData)` | Full update (PUT)                          |
| `patchInventoryItem(itemId, partialData)` | Partial update (PATCH)                     |
| `deleteInventoryItem(itemId)`             | Delete item by ID                          |
| `getLowStockItems()`                      | Get all items with quantity ≤ reorderLevel |
| `getItemsByCategory(category)`            | Get items by category                      |
| `getInventoryStats()`                     | Get inventory statistics                   |

## Repository Layer Methods

### InventoryItemRepository

| Method                     | Description                              |
| -------------------------- | ---------------------------------------- |
| `create(data)`             | Create new item in database              |
| `findById(id)`             | Find item by ID                          |
| `findMany(filter)`         | Find items with optional filter          |
| `updateById(id, updates)`  | Update item by ID                        |
| `deleteById(id)`           | Delete item by ID                        |
| `count(filter)`            | Count items with optional filter         |
| `findLowStockItems()`      | Find items where quantity ≤ reorderLevel |
| `findByCategory(category)` | Find items by category                   |

## Error Handling

All endpoints follow a consistent error response format:

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
- `400` - Validation error
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
    quantity: 20,
    unit: 'kg',
    reorderLevel: 5,
    unitPrice: 500,
  }),
});
```

### Update Quantity (PATCH)

```javascript
const response = await fetch('/api/inventory/123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quantity: 15,
  }),
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

## Database Indexes

The following indexes are created for optimized query performance:

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

1. Follow the existing DDD structure
2. Add JSDoc comments to all functions
3. Implement proper validation
4. Include error handling
5. Update this documentation
6. Write unit tests (if test framework is available)

## Support

For issues or questions regarding the inventory module, please contact the development team or create an issue in the project repository.

---

**Last Updated:** February 19, 2026  
**Module Version:** 1.0.0  
**Maintainer:** KidsFeed Development Team
