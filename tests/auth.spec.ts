import { test, expect } from './fixtures';
import { test as baseTest, expect as baseExpect } from '@playwright/test';

baseTest.describe('Auth Page — unauthenticated', () => {
  baseTest('login page renders with email and password inputs', async ({ page }) => {
    await page.goto('/');
    // Should show the auth page since we have no token
    const emailInput = page.locator('[data-testid="auth-email-input"], #auth-email');
    await baseExpect(emailInput).toBeVisible({ timeout: 10000 });

    const passwordInput = page.locator('[data-testid="auth-password-input"], #auth-password');
    await baseExpect(passwordInput).toBeVisible();
  });

  baseTest('login button is visible', async ({ page }) => {
    await page.goto('/');
    const loginButton = page.locator('[data-testid="auth-login-button"]');
    await baseExpect(loginButton).toBeVisible({ timeout: 10000 });
    await baseExpect(loginButton).toHaveText('Log In');
  });

  baseTest('"Continue as Guest" button is visible', async ({ page }) => {
    await page.goto('/');
    const guestButton = page.locator('[data-testid="auth-guest-button"]');
    await baseExpect(guestButton).toBeVisible({ timeout: 10000 });
    await baseExpect(guestButton).toHaveText('Continue as Guest');
  });

  baseTest('register form shows when clicking register link', async ({ page }) => {
    await page.goto('/');
    const registerLink = page.locator('[data-testid="auth-register-link"]');
    await baseExpect(registerLink).toBeVisible({ timeout: 10000 });
    await registerLink.click();

    // Should now show the register heading
    await baseExpect(page.getByText('Create an account')).toBeVisible();
    // Username field should appear in register mode
    const usernameInput = page.locator('#auth-username');
    await baseExpect(usernameInput).toBeVisible();
  });

  baseTest('guest login creates session and redirects to app', async ({ page }) => {
    await page.goto('/');
    const guestButton = page.locator('[data-testid="auth-guest-button"]');
    await baseExpect(guestButton).toBeVisible({ timeout: 10000 });
    await guestButton.click();

    // After guest login, should see the main layout (header with nav)
    await baseExpect(
      page.locator('[data-testid="main-layout"], header nav')
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Auth — after guest login', () => {
  test('guest banner appears after guest login', async ({ authedPage }) => {
    const banner = authedPage.locator('[data-testid="guest-banner"]');
    await expect(banner).toBeVisible({ timeout: 10000 });
    await expect(banner).toContainText('guest');
  });

  test('claim account button is visible in guest banner', async ({ authedPage }) => {
    const claimButton = authedPage.locator('[data-testid="guest-claim-button"]');
    await expect(claimButton).toBeVisible({ timeout: 10000 });
    await expect(claimButton).toHaveText('Claim Account');
  });

  test('claim account modal opens from banner', async ({ authedPage }) => {
    const claimButton = authedPage.locator('[data-testid="guest-claim-button"]');
    await expect(claimButton).toBeVisible({ timeout: 10000 });
    await claimButton.click();

    // The claim modal should appear
    await expect(authedPage.getByText('Claim Your Account').or(authedPage.getByText('Claim Account').nth(1))).toBeVisible({ timeout: 5000 });
  });
});
