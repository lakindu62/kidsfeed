/**
 * E2E — School Management: Students
 *
 * Covers:
 *  - Students list renders for a school
 *  - Add a student manually
 *  - Search filters the list
 *  - CSV import wizard: upload → preview → confirm
 *  - Delete a student
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { StudentsPage } = require('./pages/StudentsPage');

// Set this to a real schoolId from your dev DB, or override with env var
const SCHOOL_ID = process.env.E2E_SCHOOL_ID ?? '';

const CSV_PATH = path.resolve(__dirname, '../../frontend/public/students-import-template.csv');

test.describe('Students', () => {
  let studentsPage;

  test.beforeAll(() => {
    if (!SCHOOL_ID) {
      console.warn(
        'WARNING: E2E_SCHOOL_ID is not set. Students tests will be skipped.\n' +
        'Run: E2E_SCHOOL_ID=<id> npx playwright test'
      );
    }
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!SCHOOL_ID, 'E2E_SCHOOL_ID env var required');
    studentsPage = new StudentsPage(page);
    await studentsPage.goto(SCHOOL_ID);
  });

  test('shows the students screen', async ({ page }) => {
    await expect(page).toHaveURL(new RegExp(`/schools/${SCHOOL_ID}/students`));
    await expect(studentsPage.addStudentButton).toBeVisible();
    await expect(studentsPage.importButton).toBeVisible();
  });

  test('adds a student manually', async ({ page }) => {
    await studentsPage.openAddModal();

    const modal = page.locator('[data-testid="student-form-modal"]');
    await expect(modal).toBeVisible();

    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('Student');
    await page.getByLabel(/student id/i).fill(`TST-${Date.now()}`);

    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(modal).not.toBeVisible();

    // New student appears in the list
    await expect(page.getByText('Test Student')).toBeVisible();
  });

  test('search filters the student list', async ({ page }) => {
    await studentsPage.searchFor('Test');

    // At least the student we just created should appear
    await expect(page.getByText('Test Student')).toBeVisible();

    // A clearly non-matching query hides results
    await studentsPage.searchFor('zzz_no_match_zzz');
    await expect(page.getByText('Test Student')).not.toBeVisible();
  });

  test('imports students via CSV', async ({ page }) => {
    await studentsPage.openImportWizard();

    // Step 1: upload the file
    await studentsPage.uploadCsv(CSV_PATH);

    // Step 2: preview shows valid count
    await expect(studentsPage.importConfirmButton).toBeVisible({ timeout: 10_000 });
    const btnText = await studentsPage.importConfirmButton.textContent();
    expect(btnText).toMatch(/import \d+ student/i);

    // Step 3: confirm
    await studentsPage.importConfirmButton.click();
    await expect(studentsPage.doneButton).toBeVisible({ timeout: 10_000 });
    await studentsPage.doneButton.click();
  });

  test('deletes a student', async ({ page }) => {
    // Find the manually added student and delete it
    const row = page.locator('[data-testid="student-row"]', { hasText: 'Test Student' }).first();
    await expect(row).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: /delete/i }).click();

    await expect(row).not.toBeVisible({ timeout: 5_000 });
  });
});
