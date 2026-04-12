/**
 * Page Object — Schools list (/school-management/schools)
 */
class SchoolsPage {
  constructor(page) {
    this.page = page;
    this.url = '/school-management/schools';

    this.addSchoolButton = page.getByRole('button', { name: /add school/i });
    this.schoolCards = page.locator('[data-testid="school-card"]');

    // Modal
    this.modal = page.locator('[data-testid="school-form-modal"]');
    this.nameInput = page.getByLabel(/school name/i);
    this.addressInput = page.getByLabel(/address/i);
    this.saveButton = page.getByRole('button', { name: /save|create/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  async openAddModal() {
    await this.addSchoolButton.click();
    await this.modal.waitFor({ state: 'visible' });
  }

  async fillAndSubmit({ name, address }) {
    await this.nameInput.fill(name);
    if (address) await this.addressInput.fill(address);
    await this.saveButton.click();
  }

  async getSchoolCardByName(name) {
    return this.page.locator('[data-testid="school-card"]', { hasText: name });
  }
}

module.exports = { SchoolsPage };
