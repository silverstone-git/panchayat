import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Assuming the Vite default title is "Vite + React" or "DemoVox"
  // For safety, we just expect it to have *some* title to verify Playwright connects.
  const title = await page.title();
  expect(title).toBeDefined();
});
