/**
 * E2E — Inventory: add item from the grid page
 *
 * Covers:
 *  - Inventory landing page opens on the grid view
 *  - Create a new inventory item from the grid page
 *  - Created item redirects to its details page
 */
const { test, expect } = require('@playwright/test');
const { InventoryGridPage } = require('./pages/InventoryGridPage');

test.describe('Inventory', () => {
  let inventoryGridPage;

  test.beforeEach(async ({ page }) => {
    inventoryGridPage = new InventoryGridPage(page);
    await inventoryGridPage.goto();
  });

  test('adds a new inventory item from the grid page', async ({ page }) => {
    const timestamp = Date.now();
    const itemName = `E2E Inventory Item ${timestamp}`;
    const itemBarcode = `E2E${timestamp}`;

    await expect(page).toHaveURL(/\/inventory/);
    await expect(inventoryGridPage.title).toBeVisible();

    await inventoryGridPage.openAddItemForm();
    await expect(page).toHaveURL(/\/inventory\/items\/new/);

    await inventoryGridPage.fillRequiredNewItemFields({
      name: itemName,
      barcode: itemBarcode,
      category: 'Packaged',
      unit: 'Pieces',
      quantity: '12',
    });

    await inventoryGridPage.submitNewItem();

    await expect(page).toHaveURL(/\/inventory\/items\/[A-Za-z0-9_-]+/);
    await expect(page.getByRole('heading', { name: itemName })).toBeVisible();
  });
});