const { test, expect } = require('@playwright/test');

test.describe('Basic tests', () => {
  test('Basic test 1', async ({ page }) => {
    await page.goto('https://aptech-danang.edu.vn/');
    await expect(page).toHaveTitle(/Softech1 Aptech2/);
  });

  test('Basic test 2', async ({ page }) => {
    await page.goto('https://aptech-danang.edu.vn');
    const title = page.locator('title').first();
    await expect(title).toContainText('APTECH');
  });
});
