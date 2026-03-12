import { test, expect } from './fixtures';

test.describe('User Settings', () => {
  test.beforeEach(async ({ authedPage }) => {
    // Open settings
    await authedPage.locator('[data-testid="settings-button"]').click();
    await expect(authedPage.getByText('My Account')).toBeVisible({ timeout: 5000 });
  });

  test('user settings opens with account tab', async ({ authedPage }) => {
    await expect(authedPage.locator('[data-testid="settings-nav-account"]')).toBeVisible();
    // Account tab content should be visible
    await expect(authedPage.getByText('My Account').first()).toBeVisible();
  });

  test('profile tab is clickable', async ({ authedPage }) => {
    await authedPage.locator('[data-testid="settings-nav-profile"]').click();
    await expect(authedPage.getByText('Display Name')).toBeVisible({ timeout: 5000 });
  });

  test('security tab is clickable', async ({ authedPage }) => {
    await authedPage.locator('[data-testid="settings-nav-security"]').click();
    await expect(authedPage.getByText('Security')).toBeVisible({ timeout: 5000 });
  });

  test('sessions tab is clickable', async ({ authedPage }) => {
    await authedPage.locator('[data-testid="settings-nav-sessions"]').click();
    await expect(authedPage.getByText('Active Sessions')).toBeVisible({ timeout: 5000 });
  });

  test('appearance tab is clickable', async ({ authedPage }) => {
    await authedPage.locator('[data-testid="settings-nav-appearance"]').click();
    await expect(authedPage.getByText('Theme')).toBeVisible({ timeout: 5000 });
  });

  test('accessibility tab is clickable', async ({ authedPage }) => {
    await authedPage.locator('[data-testid="settings-nav-accessibility"]').click();
    await expect(authedPage.getByText('Accessibility')).toBeVisible({ timeout: 5000 });
  });

  test('notifications tab is clickable', async ({ authedPage }) => {
    await authedPage.locator('[data-testid="settings-nav-notifications"]').click();
    await expect(authedPage.getByText('Notifications')).toBeVisible({ timeout: 5000 });
  });

  test('data & privacy tab is clickable', async ({ authedPage }) => {
    await authedPage.locator('[data-testid="settings-nav-data"]').click();
    await expect(authedPage.getByText('Data & Privacy')).toBeVisible({ timeout: 5000 });
  });

  test('logout button is visible', async ({ authedPage }) => {
    const logoutButton = authedPage.locator('[data-testid="settings-logout-button"]');
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toContainText('Log Out');
  });

  test('guest claim button visible for guest users', async ({ authedPage }) => {
    const claimButton = authedPage.locator('[data-testid="settings-claim-button"]');
    await expect(claimButton).toBeVisible({ timeout: 5000 });
    await expect(claimButton).toContainText('Claim Account');
  });

  test('can edit display name in profile tab', async ({ authedPage }) => {
    await authedPage.locator('[data-testid="settings-nav-profile"]').click();
    const displayNameInput = authedPage.locator('[data-testid="profile-display-name-input"]');
    await expect(displayNameInput).toBeVisible({ timeout: 5000 });
    await displayNameInput.fill('Test User');
    await expect(displayNameInput).toHaveValue('Test User');
  });

  test('logout button works', async ({ authedPage }) => {
    await authedPage.locator('[data-testid="settings-logout-button"]').click();
    // After logout, should redirect to the auth page
    const emailInput = authedPage.locator('[data-testid="auth-email-input"], #auth-email');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });
});
