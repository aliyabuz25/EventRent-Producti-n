import { test, expect } from '@playwright/test';

const ADMIN_URL = '/admin';

test.describe('Admin Panel', () => {
  test('admin login səhifəsi açılır', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('yanlış credentials crash vermir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[type="text"]').first();
    const passInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    if (await emailInput.count() > 0 && await passInput.count() > 0) {
      await emailInput.fill('wrong@wrong.com');
      await passInput.fill('wrongpass');
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});