import { test, expect } from '@playwright/test';

test.describe('Ana Səhifə', () => {
  test('açılır, konsol xətası yoxdur', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Səhifə başlığı mövcuddur
    await expect(page).toHaveTitle(/.+/);

    // Kritik konsol xətası yoxdur
    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('ResizeObserver') &&
      !e.includes('net::ERR')
    );
    expect(realErrors, `Konsol xətaları: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('navbar görünür', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });
});
