/**
 * Page Object — Meal Distribution (/meal-distribution and child routes)
 *
 * One page object covers the whole feature: six screens share the same layout
 * (sidebar + top bar). Use goto* helpers or navigateViaSidebar for each route.
 */
class MealDistributionPage {
  constructor(page) {
    this.page = page;
    this.basePath = '/meal-distribution';

    // Sidebar (FeatureSidebar renders nav items as buttons)
    this.navDashboard = page.getByRole('button', { name: /^Dashboard$/i });
    this.navMealSessions = page.getByRole('button', { name: /^Meal Sessions$/i });
    this.navMarkAttendance = page.getByRole('button', { name: /^Mark Attendance$/i });
    this.navNoShowAlerts = page.getByRole('button', { name: /^No-Show Alerts$/i });
    this.navStudentHistory = page.getByRole('button', { name: /^Student History$/i });
    this.navReports = page.getByRole('button', { name: /^Reports$/i });

    // Shared chrome
    this.newSessionFab = page.getByRole('button', { name: /new session/i });

    // Sessions — create modal
    this.createSessionModalHeading = page.getByRole('heading', {
      name: /create new session/i,
    });
    this.modalCancelButton = page.getByRole('button', { name: /^Cancel$/i });

    // Attendance
    this.manualTab = page.getByRole('tab', { name: /^Manual$/i });
    this.qrTab = page.getByRole('tab', { name: /qr code/i });

    // Student history
    this.studentIdInput = page.getByPlaceholder(/student id/i);
  }

  /** @param {string} [subPath] e.g. `/sessions` or empty for dashboard */
  async goto(subPath = '') {
    const url =
      subPath && subPath.length > 0
        ? `${this.basePath}${subPath.startsWith('/') ? subPath : `/${subPath}`}`
        : this.basePath;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async gotoDashboard() {
    await this.goto();
  }

  async gotoSessions() {
    await this.goto('/sessions');
  }

  async gotoAttendance() {
    await this.goto('/attendance');
  }

  async gotoNoShowAlerts() {
    await this.goto('/no-show-alerts');
  }

  async gotoStudentHistory() {
    await this.goto('/student-history');
  }

  async gotoReports() {
    await this.goto('/reports');
  }

  /**
   * @param {import('@playwright/test').Locator} navButton — e.g. this.navMealSessions
   */
  async navigateViaSidebar(navButton) {
    await navButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}

module.exports = { MealDistributionPage };
