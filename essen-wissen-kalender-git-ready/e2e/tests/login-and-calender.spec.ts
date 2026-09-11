import { test, expect } from '@playwright/test';

test('Admin loggt ein und sieht Kalender-Events', async ({ page }) => {
  await page.goto('https://kalender.localhost');

  // Login
  await page.fill('#login-email', 'test@example.org');
  await page.fill('#login-password', 'geheim');
  await page.click('#login-form button[type="submit"]');

  await expect(page.getByText('Erfolgreich angemeldet.')).toBeVisible();

  // Kalender-Ansicht hat mindestens ein Event
  await expect(page.locator('.event-chip')).toHaveCountGreaterThan(0);
});