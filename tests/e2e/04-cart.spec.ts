import { test, expect } from '@playwright/test';

test.describe('Səbət', () => {
  test('boş səbət crash vermir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    // Əvvəlcə localStorage-i təmizlə
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('cart'));

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('korrupt localStorage cart crash vermir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    // Pozulmuş JSON yaz
    await page.evaluate(() => localStorage.setItem('cart', 'INVALID_JSON{{{'));

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);

    // Cleanup
    await page.evaluate(() => localStorage.removeItem('cart'));
  });

  test('items undefined olan cart crash vermir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    // items sahəsi olmayan cart items
    await page.evaluate(() => localStorage.setItem('cart', JSON.stringify([
      { productId: 'test-123', quantity: 1, name: null, category: null, image: null }
    ])));

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);

    await page.evaluate(() => localStorage.removeItem('cart'));
  });
});