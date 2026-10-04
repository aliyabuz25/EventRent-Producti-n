import { test, expect } from '@playwright/test';

const PAGES = [
  '/',
  '/catalog',
  '/cart',
  '/about',
  '/services',
  '/contact',
  '/teambuilding',
  '/portfolio',
  '/login',
];

test.describe('Bütün Səhifələr — Crash Yoxdur', () => {
  for (const path of PAGES) {
    test(`${path} — crash yoxdur`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));

      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // Animasiyalar üçün əlavə gözləmə
      await page.waitForTimeout(800);

      const realErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('ResizeObserver') &&
        !e.includes('net::ERR') &&
        !e.includes('ERR_CONNECTION_REFUSED')
      );
      expect(realErrors, `"${path}" crash: ${realErrors.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('Edge Cases — Yanlış URL-lər', () => {
  test('mövcud olmayan route crash vermir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/nonexistent-page-xyz');
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('mövcud olmayan kateqoriya crash vermir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/catalog/nonexistent-category-xyz');
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('mövcud olmayan xidmət crash vermir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/services/nonexistent/nonexistent-item');
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});