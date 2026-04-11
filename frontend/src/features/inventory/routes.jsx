import InventoryDashboardPage from './pages/InventoryDashboardPage';
import InventoryItemDetailsPage from './pages/InventoryItemDetailsPage';
import InventoryItemsPage from './pages/InventoryItemsPage';
import InventoryNewItemPage from './pages/InventoryNewItemPage';

export const inventoryPath = '/inventory';
export const inventoryItemsPath = '/inventory/items';
export const inventoryItemsNewPath = '/inventory/items/new';
export const inventoryItemDetailsPath = '/inventory/items/:itemId';

export function InventoryRoute() {
  return <InventoryDashboardPage />;
}

export function InventoryItemsRoute() {
  return <InventoryItemsPage />;
}

export function InventoryNewItemRoute() {
  return <InventoryNewItemPage />;
}

export function InventoryItemDetailsRoute() {
  return <InventoryItemDetailsPage />;
}
