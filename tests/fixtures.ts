import { test as base, expect, Page } from '@playwright/test';

const API_URL = process.env.TEST_API_URL || 'http://localhost:4000';

type TestFixtures = {
  authedPage: Page;
  guestToken: string;
};

export const test = base.extend<TestFixtures>({
  guestToken: async ({ request }, use) => {
    const response = await request.post(`${API_URL}/api/auth/guest`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.token).toBeTruthy();
    await use(data.token);
  },
  authedPage: async ({ page, guestToken }, use) => {
    // Set token in localStorage before navigating
    await page.addInitScript((token) => {
      localStorage.setItem('token', token);
    }, guestToken);
    await page.goto('/');
    // Wait for app to load — look for header nav, guild sidebar dock, or the main layout
    await page.waitForSelector(
      '[data-testid="app-loaded"], [data-testid="main-layout"], header nav, .guild-sidebar',
      { timeout: 15000 }
    );
    await use(page);
  },
});

export { expect };
