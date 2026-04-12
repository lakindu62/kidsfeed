import InventoryItemDetailsPage from './pages/InventoryItemDetailsPage';
import InventoryItemsPage from './pages/InventoryItemsPage';
import InventoryNewItemPage from './pages/InventoryNewItemPage';

export const inventoryPath = '/inventory';
export const inventoryItemsPath = '/inventory/items';
export const inventoryItemsNewPath = '/inventory/items/new';
export const inventoryItemDetailsPath = '/inventory/items/:itemId';

export const inventoryChildren = [
  { index: true, Component: InventoryItemsPage },
  { path: 'items', Component: InventoryItemsPage },
  { path: 'items/new', Component: InventoryNewItemPage },
  { path: 'items/:itemId', Component: InventoryItemDetailsPage },
];
