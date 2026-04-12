/**
 * Page Object — Students screen (/school-management/schools/:schoolId/students)
 */
const path = require('path');

class StudentsPage {
  constructor(page) {
    this.page = page;

    this.addStudentButton = page.getByRole('button', { name: /add student/i });
    this.importButton = page.getByRole('button', { name: /import/i });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.studentRows = page.locator('[data-testid="student-row"]');

    // Import wizard
    this.importModal = page.locator('[data-testid="csv-import-wizard"]');
    this.fileInput = page.locator('input[type="file"]');
    this.importConfirmButton = page.getByRole('button', { name: /import \d+ student/i });
    this.doneButton = page.getByRole('button', { name: /done/i });
  }

  async goto(schoolId) {
    await this.page.goto(`/school-management/schools/${schoolId}/students`);
    await this.page.waitForLoadState('networkidle');
  }

  async openAddModal() {
    await this.addStudentButton.click();
  }

  async openImportWizard() {
    await this.importButton.click();
  }

  async uploadCsv(filePath) {
    await this.fileInput.setInputFiles(filePath);
  }

  async searchFor(query) {
    await this.searchInput.fill(query);
  }
}

module.exports = { StudentsPage };
