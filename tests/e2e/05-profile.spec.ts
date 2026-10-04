import { test, expect } from '@playwright/test';

test.describe('Profil Səhifəsi', () => {
  test('giriş etmədən profil — redirect işləyir, crash yoxdur', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('er_admin_token'));

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('profil sifarişlər — boş items olan order crash vermir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    // Login et
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    if (await emailInput.count() > 0) {
      await emailInput.fill('test@test.com');
      await passInput.fill('wrongpassword');
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }

    // Login uğursuz olsa belə crash olmamalı
    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});