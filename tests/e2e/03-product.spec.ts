import { test, expect } from '@playwright/test';

test.describe('Məhsul Səhifəsi', () => {
  test('kataloqdan məhsula keçid crash vermir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    // İlk məhsul kartına klik et
    const productCard = page.locator('a[href*="/product/"], [data-testid="product-card"]').first();
    const anyClickable = page.locator('.cursor-pointer, [role="button"]').first();

    if (await productCard.count() > 0) {
      await productCard.click();
      await page.waitForLoadState('networkidle');
    } else if (await anyClickable.count() > 0) {
      // URL-dən birbaşa get
      await page.goto('/product/1');
      await page.waitForLoadState('networkidle');
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('mövcud olmayan məhsul ID crash vermir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/product/nonexistent-id-99999');
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});