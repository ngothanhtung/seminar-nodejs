const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test('Login test', async ({ page }) => {
    await page.goto('https://sachso.edu.vn');

    await page.click('text=Đăng nhập');
    await page.fill('input[id="email"]', 'ngothanhtung.it@gmail.com');
    await page.fill('input[id="password"]', 'MKkb1980');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('https://sachso.edu.vn/lms/home');
    await page.waitForTimeout(5000);
  });
});

// npx playwright test tests/sachso.spec.js --headed
