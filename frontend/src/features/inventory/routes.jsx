import InventoryItemDetailsPage from './pages/InventoryItemDetailsPage';
import InventoryItemsPage from './pages/InventoryItemsPage';
import InventoryNewItemPage from './pages/InventoryNewItemPage';

export function InventoryRoute() {
  return <InventoryItemsPage />;
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
