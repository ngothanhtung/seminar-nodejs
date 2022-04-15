const { test, expect } = require('@playwright/test');

test.describe('Basic tests', () => {
  test('Basic test 1', async ({ page }) => {
    await page.goto('https://aptech-danang.edu.vn/');
    await expect(page).toHaveTitle(/Softech Aptech/);
  });

  test('Basic test 2', async ({ page }) => {
    await page.goto('https://aptech-danang.edu.vn/chuong-trinh-dao-tao/khoa-ngan-han/fullstack-web-reactjs-nodejs');
    const title = page.locator('title').first();
    await expect(title).toContainText('REACTJS & NODEJS');
  });
});
