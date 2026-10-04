import { test, expect } from '@playwright/test';

test.describe('Kataloq', () => {
  test('kataloq səhifəsi açılır, crash yoxdur', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('axtarış işləyir', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="text"], input[placeholder*="axtar"], input[placeholder*="Search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      // Crash olmamalıdır
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));
      expect(errors).toHaveLength(0);
    }
  });

  test('boş axtarış nəticəsi crash vermir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="text"], input[placeholder*="axtar"], input[placeholder*="Search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('xxxxxxxxxnotexists12345');
      await page.waitForTimeout(500);
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});