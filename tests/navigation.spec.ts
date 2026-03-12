import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('header is visible after login', async ({ authedPage }) => {
    const header = authedPage.locator('header');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('guild dock sidebar is visible', async ({ authedPage }) => {
    // The dock with guild icons is rendered as a column on the left
    const dock = authedPage.locator('[data-testid="guild-dock"]');
    await expect(dock).toBeVisible({ timeout: 10000 });
  });

  test('home button works', async ({ authedPage }) => {
    const homeButton = authedPage.locator('[data-testid="home-button"]');
    await expect(homeButton).toBeVisible({ timeout: 10000 });
    await homeButton.click();
    // Should show friends page or home content
    await expect(authedPage.locator('main')).toBeVisible();
  });

  test('settings button opens user settings', async ({ authedPage }) => {
    const settingsButton = authedPage.locator('[data-testid="settings-button"]');
    await expect(settingsButton).toBeVisible({ timeout: 10000 });
    await settingsButton.click();

    // User settings full-screen panel should appear
    await expect(authedPage.getByText('My Account')).toBeVisible({ timeout: 5000 });
    await expect(authedPage.locator('[data-testid="settings-close-button"]')).toBeVisible();
  });

  test('can close settings', async ({ authedPage }) => {
    // Open settings
    await authedPage.locator('[data-testid="settings-button"]').click();
    await expect(authedPage.getByText('My Account')).toBeVisible({ timeout: 5000 });

    // Close settings
    await authedPage.locator('[data-testid="settings-close-button"]').click();
    // Settings should disappear — My Account heading no longer visible
    await expect(authedPage.getByText('User Settings').first()).toBeHidden({ timeout: 5000 });
  });

  test('user avatar button is visible in header', async ({ authedPage }) => {
    const avatar = authedPage.locator('[data-testid="user-avatar-button"]');
    await expect(avatar).toBeVisible({ timeout: 10000 });
  });

  test('create guild button is visible in dock', async ({ authedPage }) => {
    const createGuildButton = authedPage.locator('[data-testid="create-guild-button"]');
    await expect(createGuildButton).toBeVisible({ timeout: 10000 });
  });

  test('explore button is visible in dock', async ({ authedPage }) => {
    const exploreButton = authedPage.locator('[data-testid="explore-button"]');
    await expect(exploreButton).toBeVisible({ timeout: 10000 });
  });
});
