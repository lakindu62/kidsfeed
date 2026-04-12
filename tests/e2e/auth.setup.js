/**
 * Auth setup — runs once before the test suite.
 * Logs in via Clerk and saves the browser storage state so all other
 * tests can reuse the session without hitting the login UI.
 *
 * Credentials come from environment variables:
 *   E2E_EMAIL    — Clerk account email
 *   E2E_PASSWORD — Clerk account password
 *
 * Usage:
 *   E2E_EMAIL=you@example.com E2E_PASSWORD=secret npx playwright test
 */
const { test: setup, expect } = require('@playwright/test');
const path = require('path');

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_EMAIL and E2E_PASSWORD environment variables are required for auth setup.\n' +
      'Run: E2E_EMAIL=you@example.com E2E_PASSWORD=secret npx playwright test'
    );
  }

  await page.goto('/');

  // Click sign-in — Clerk renders a "Sign in" button on the home page
  await page.getByRole('link', { name: /sign in/i }).click();

  // Fill Clerk's hosted sign-in form
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole('button', { name: /continue/i }).click();

  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /continue|sign in/i }).click();

  // Wait until we land somewhere authenticated (not the home / sign-in page)
  await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'), { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
