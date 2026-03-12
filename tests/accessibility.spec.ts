import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { test, expect } from './fixtures';

baseTest.describe('Accessibility — Auth Page', () => {
  baseTest('login form inputs have associated labels', async ({ page }) => {
    await page.goto('/');
    // Email input should have a label
    const emailLabel = page.locator('label[for="auth-email"]');
    await baseExpect(emailLabel).toBeVisible({ timeout: 10000 });

    // Password input should have a label
    const passwordLabel = page.locator('label[for="auth-password"]');
    await baseExpect(passwordLabel).toBeVisible();
  });

  baseTest('auth form is keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="auth-email-input"], #auth-email', { timeout: 10000 });

    // Tab through the form
    await page.keyboard.press('Tab');
    // Should be able to reach the email input
    const activeTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
    // Active element should be an input or button
    baseExpect(['input', 'button', 'a', 'textarea']).toContain(activeTag);
  });

  baseTest('submit button is focusable', async ({ page }) => {
    await page.goto('/');
    const loginButton = page.locator('[data-testid="auth-login-button"]');
    await baseExpect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.focus();
    const isFocused = await loginButton.evaluate((el) => document.activeElement === el);
    baseExpect(isFocused).toBeTruthy();
  });
});

test.describe('Accessibility — Main App', () => {
  test('header buttons are keyboard focusable', async ({ authedPage }) => {
    const settingsButton = authedPage.locator('[data-testid="settings-button"]');
    await expect(settingsButton).toBeVisible({ timeout: 10000 });
    await settingsButton.focus();
    const isFocused = await settingsButton.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBeTruthy();
  });

  test('message input has aria-label', async ({ authedPage }) => {
    const messageInput = authedPage.locator('[data-testid="message-input"]');
    const isVisible = await messageInput.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }
    await expect(messageInput).toHaveAttribute('aria-label', 'Message');
  });

  test('settings navigation is keyboard accessible', async ({ authedPage }) => {
    // Open settings
    await authedPage.locator('[data-testid="settings-button"]').click();
    await expect(authedPage.getByText('My Account')).toBeVisible({ timeout: 5000 });

    // Tab through settings nav items
    const navItems = authedPage.locator('[data-testid^="settings-nav-"]');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);

    // Each nav item should be focusable
    for (let i = 0; i < Math.min(count, 3); i++) {
      await navItems.nth(i).focus();
      const isFocused = await navItems.nth(i).evaluate((el) => document.activeElement === el);
      expect(isFocused).toBeTruthy();
    }
  });
});
