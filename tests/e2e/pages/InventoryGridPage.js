/**
 * Page Object — Inventory grid (/inventory)
 */
class InventoryGridPage {
  constructor(page) {
    this.page = page;
    this.url = '/inventory';

    this.title = page.getByRole('heading', { name: /inventory grid/i });
    this.addItemButton = page.getByRole('button', {
      name: /add new inventory item/i,
    });

    this.nameInput = page.getByLabel(/item name/i);
    this.barcodeInput = page.getByLabel(/barcode/i);
    this.quantityInput = page.getByLabel(/quantity/i);
    this.saveButton = page.getByRole('button', { name: /save inventory item/i });
    this.cancelButton = page.getByRole('button', {
      name: /cancel and return to items/i,
    });

    this.selectTriggers = page.locator('[data-slot="select-trigger"]');
  }

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  async openAddItemForm() {
    await this.addItemButton.click();
    await this.page.waitForURL(/\/inventory\/items\/new/);
  }

  async selectDropdownOption(index, optionName) {
    await this.selectTriggers.nth(index).click();
    await this.page.getByRole('option', { name: optionName }).click();
  }

  async fillRequiredNewItemFields({ name, barcode, category, unit, quantity }) {
    await this.nameInput.fill(name);
    await this.barcodeInput.fill(barcode);
    await this.selectDropdownOption(0, category);
    await this.selectDropdownOption(1, unit);
    await this.quantityInput.fill(quantity);
  }

  async submitNewItem() {
    await this.saveButton.click();
  }
}

module.exports = { InventoryGridPage };