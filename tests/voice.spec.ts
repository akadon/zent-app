import { test, expect } from './fixtures';

test.describe('Voice', () => {
  test('app loads and main content area is visible', async ({ authedPage }) => {
    // Basic test to ensure the app is functional
    await expect(authedPage.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('dock area is visible for guild navigation', async ({ authedPage }) => {
    // The dock (left column with guild icons) should be visible
    const dock = authedPage.locator('[data-testid="guild-dock"]');
    await expect(dock).toBeVisible({ timeout: 10000 });
  });
});
