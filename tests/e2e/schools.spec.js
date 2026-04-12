/**
 * E2E — School Management: Schools
 *
 * Covers:
 *  - Schools list renders
 *  - Create a new school
 *  - Validation: empty name is rejected
 *  - Edit a school
 *  - Delete a school
 */
const { test, expect } = require('@playwright/test');
const { SchoolsPage } = require('./pages/SchoolsPage');

const TEST_SCHOOL_NAME = `E2E School ${Date.now()}`;

test.describe('Schools', () => {
  let schoolsPage;

  test.beforeEach(async ({ page }) => {
    schoolsPage = new SchoolsPage(page);
    await schoolsPage.goto();
  });

  test('shows the schools list page', async ({ page }) => {
    await expect(page).toHaveURL(/\/school-management\/schools/);
    await expect(schoolsPage.addSchoolButton).toBeVisible();
  });

  test('creates a new school', async ({ page }) => {
    await schoolsPage.openAddModal();
    await schoolsPage.fillAndSubmit({ name: TEST_SCHOOL_NAME });

    // Modal closes and new card appears
    await expect(schoolsPage.modal).not.toBeVisible();
    const card = await schoolsPage.getSchoolCardByName(TEST_SCHOOL_NAME);
    await expect(card).toBeVisible();
  });

  test('shows validation error for empty school name', async ({ page }) => {
    await schoolsPage.openAddModal();
    await schoolsPage.saveButton.click(); // submit with empty name

    // Modal stays open and shows an error
    await expect(schoolsPage.modal).toBeVisible();
    await expect(page.getByText(/required|cannot be empty/i)).toBeVisible();
  });

  test('edits an existing school', async ({ page }) => {
    const card = await schoolsPage.getSchoolCardByName(TEST_SCHOOL_NAME);
    await card.getByRole('button', { name: /edit/i }).click();

    const updated = `${TEST_SCHOOL_NAME} (updated)`;
    await schoolsPage.nameInput.clear();
    await schoolsPage.nameInput.fill(updated);
    await schoolsPage.saveButton.click();

    await expect(await schoolsPage.getSchoolCardByName(updated)).toBeVisible();
  });

  test('deletes a school', async ({ page }) => {
    const card = await schoolsPage.getSchoolCardByName(`${TEST_SCHOOL_NAME} (updated)`);

    page.once('dialog', (dialog) => dialog.accept());
    await card.getByRole('button', { name: /delete/i }).click();

    await expect(card).not.toBeVisible({ timeout: 5_000 });
  });
});
