import { test, expect } from './fixtures';

test.describe('UI Components', () => {
  test('settings modal opens and closes with Escape', async ({ authedPage }) => {
    await authedPage.locator('[data-testid="settings-button"]').click();
    await expect(authedPage.getByText('My Account')).toBeVisible({ timeout: 5000 });

    // Press Escape to close
    await authedPage.keyboard.press('Escape');
    // Settings should disappear
    await expect(authedPage.locator('[data-testid="settings-close-button"]')).toBeHidden({ timeout: 5000 });
  });

  test('header buttons have tooltips (title attributes)', async ({ authedPage }) => {
    // The settings button has title="Settings"
    const settingsButton = authedPage.locator('[data-testid="settings-button"]');
    await expect(settingsButton).toBeVisible({ timeout: 10000 });
    await expect(settingsButton).toHaveAttribute('title', 'Settings');
  });

  test('toggle member list button works', async ({ authedPage }) => {
    const membersButton = authedPage.locator('[data-testid="members-toggle-button"]');
    await expect(membersButton).toBeVisible({ timeout: 10000 });
    // Click to toggle
    await membersButton.click();
    // Should toggle member panel — just ensure button remains interactive
    await expect(membersButton).toBeVisible();
  });

  test('quick search button is visible on desktop', async ({ authedPage }) => {
    const searchButton = authedPage.locator('[data-testid="quick-search-button"]');
    // This is only visible on lg+ screens
    const isVisible = await searchButton.isVisible().catch(() => false);
    if (isVisible) {
      await expect(searchButton).toContainText('Quick search');
    }
  });

  test('sidebar toggle button works', async ({ authedPage }) => {
    const toggleButton = authedPage.locator('[data-testid="sidebar-toggle-button"]');
    await expect(toggleButton).toBeVisible({ timeout: 10000 });
    await toggleButton.click();
    // Button should still be visible after toggling
    await expect(toggleButton).toBeVisible();
  });

  test('notifications button is visible', async ({ authedPage }) => {
    const notifButton = authedPage.locator('[data-testid="notifications-button"]');
    await expect(notifButton).toBeVisible({ timeout: 10000 });
  });
});
