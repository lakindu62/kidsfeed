/**
 * E2E — Meal Distribution
 *
 * Prerequisites (same as other Playwright specs):
 *  - Frontend dev server (default http://localhost:5173)
 *  - Backend running if pages call APIs on load
 *  - E2E_EMAIL / E2E_PASSWORD for auth.setup.js
 *  - Test user must have a role allowed for /meal-distribution (ADMIN, SCHOOL_STAFF, SCHOOL_ADMIN)
 */
const { test, expect } = require('@playwright/test');
const { MealDistributionPage } = require('./pages/MealDistributionPage');

test.describe('Meal Distribution', () => {
  let md;

  test.beforeEach(async ({ page }) => {
    md = new MealDistributionPage(page);
  });

  test.describe('Dashboard', () => {
    test('loads dashboard and shows page title', async ({ page }) => {
      await md.gotoDashboard();
      await expect(page).toHaveURL(/\/meal-distribution\/?$/);
      await expect(
        page.getByRole('heading', { level: 1, name: /^Dashboard$/ }),
      ).toBeVisible();
    });

    test('shows weekly KPI section', async ({ page }) => {
      await md.gotoDashboard();
      await expect(
        page.getByRole('heading', { name: /last 7 days at a glance/i }),
      ).toBeVisible();
    });

    test('shows today sessions and no-show sections', async ({ page }) => {
      await md.gotoDashboard();
      await expect(
        page.getByRole('heading', { name: /today's meal sessions/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /today's no-show alerts/i }),
      ).toBeVisible();
    });

    test('shows new session floating button', async ({ page }) => {
      await md.gotoDashboard();
      await expect(md.newSessionFab).toBeVisible();
    });
  });

  test.describe('Sidebar navigation', () => {
    test.beforeEach(async ({ page }) => {
      await md.gotoDashboard();
    });

    test('navigates to Meal Sessions', async ({ page }) => {
      await md.navigateViaSidebar(md.navMealSessions);
      await expect(page).toHaveURL(/\/meal-distribution\/sessions/);
      await expect(
        page.getByRole('heading', { level: 1, name: /^Meal Sessions$/ }),
      ).toBeVisible();
    });

    test('navigates to Mark Attendance', async ({ page }) => {
      await md.navigateViaSidebar(md.navMarkAttendance);
      await expect(page).toHaveURL(/\/meal-distribution\/attendance/);
      await expect(
        page.getByRole('heading', { level: 1, name: /^Mark Attendance$/ }),
      ).toBeVisible();
    });

    test('navigates to No-Show Alerts', async ({ page }) => {
      await md.navigateViaSidebar(md.navNoShowAlerts);
      await expect(page).toHaveURL(/\/meal-distribution\/no-show-alerts/);
      await expect(
        page.getByRole('heading', { level: 1, name: /^No-Show Alerts$/ }),
      ).toBeVisible();
    });

    test('navigates to Student History', async ({ page }) => {
      await md.navigateViaSidebar(md.navStudentHistory);
      await expect(page).toHaveURL(/\/meal-distribution\/student-history/);
      await expect(
        page.getByRole('heading', { level: 1, name: /^Student Meal History$/ }),
      ).toBeVisible();
    });

    test('navigates to Reports', async ({ page }) => {
      await md.navigateViaSidebar(md.navReports);
      await expect(page).toHaveURL(/\/meal-distribution\/reports/);
      await expect(
        page.getByRole('heading', { level: 1, name: /^Reports$/ }),
      ).toBeVisible();
    });

    test('navigates back to Dashboard', async ({ page }) => {
      await md.navigateViaSidebar(md.navMealSessions);
      await md.navigateViaSidebar(md.navDashboard);
      await expect(page).toHaveURL(/\/meal-distribution\/?$/);
    });
  });

  test.describe('Meal Sessions', () => {
    test('shows sessions list heading and table', async ({ page }) => {
      await md.gotoSessions();
      await expect(
        page.getByRole('heading', { name: /all meal sessions/i }),
      ).toBeVisible();
      await expect(page.locator('table').first()).toBeVisible();
    });

    test('opens create session modal from FAB', async ({ page }) => {
      await md.gotoSessions();
      await md.newSessionFab.click();
      await expect(md.createSessionModalHeading).toBeVisible();
      await md.modalCancelButton.click();
      await expect(md.createSessionModalHeading).not.toBeVisible();
    });
  });

  test.describe('Mark Attendance', () => {
    test('shows attendance mode tabs', async ({ page }) => {
      await md.gotoAttendance();
      await expect(md.manualTab).toBeVisible();
      await expect(md.qrTab).toBeVisible();
    });
  });

  test.describe('No-Show Alerts', () => {
    test('shows alerts section heading', async ({ page }) => {
      await md.gotoNoShowAlerts();
      await expect(
        page.getByRole('heading', { name: /all no-show/i }),
      ).toBeVisible();
    });
  });

  test.describe('Student Meal History', () => {
    test('shows student ID filter input', async ({ page }) => {
      await md.gotoStudentHistory();
      await expect(md.studentIdInput).toBeVisible();
    });
  });

  test.describe('Reports', () => {
    test('shows PDF report sections', async ({ page }) => {
      await md.gotoReports();
      await expect(
        page.getByRole('heading', { name: /session attendance summary/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /^No-show report$/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /^Session roster$/i }),
      ).toBeVisible();
    });
  });
});
