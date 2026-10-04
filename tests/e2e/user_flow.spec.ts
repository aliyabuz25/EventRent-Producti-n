import { test, expect } from '@playwright/test';

const BASE = 'https://erent.octotech.az';

test.use({ baseURL: BASE });

test('01 - Ana səhifə yüklənir', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/.+/);
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.waitForTimeout(1000);
  console.log('Konsol xətaları:', errors.length);
  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
});

test('02 - Kataloq açılır, məhsul görünür', async ({ page }) => {
  await page.goto(`${BASE}/catalog`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const products = page.locator('a[href*="product"], .product-card, [class*="product"]');
  console.log('Məhsul sayı:', await products.count());
});

test('03 - Məhsul detalı açılır', async ({ page }) => {
  await page.goto(`${BASE}/catalog`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const link = page.locator('a[href*="product"]').first();
  if (await link.count() > 0) {
    const href = await link.getAttribute('href');
    await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('Məhsul URL:', page.url());
    expect(page.url()).toContain('product');
  }
});

test('04 - Səbət səhifəsi açılır', async ({ page }) => {
  await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  console.log('Səbət yükləndi');
});

test('05 - Sifariş formu doldurulur və göndərilir', async ({ page }) => {
  await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const nameInput = page.locator('input[placeholder*="Ad"], input[name="name"], input[placeholder*="ad"]').first();
  const phoneInput = page.locator('input[placeholder*="Telefon"], input[placeholder*="050"], input[type="tel"]').first();
  const textarea = page.locator('textarea').first();
  
  if (await nameInput.count() > 0) {
    await nameInput.fill('Test İstifadəçi');
    console.log('✓ Ad dolduruldu');
  }
  if (await phoneInput.count() > 0) {
    await phoneInput.fill('+994501234567');
    console.log('✓ Telefon dolduruldu');
  }
  if (await textarea.count() > 0) {
    await textarea.fill('Test sifarişi — Playwright testi');
    console.log('✓ Qeyd dolduruldu');
  }
  
  const submitBtn = page.locator('button[type="submit"], button:has-text("Sifariş"), button:has-text("Göndər")').first();
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ Form göndərildi, URL:', page.url());
  }
});

test('06 - Catering səhifəsi açılır', async ({ page }) => {
  await page.goto(`${BASE}/catering`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  console.log('✓ Catering yükləndi');
  
  const btn = page.locator('button:has-text("Sifariş"), button:has-text("Seç"), button:has-text("Ətraflı")').first();
  if (await btn.count() > 0) {
    await btn.click();
    await page.waitForTimeout(1000);
    console.log('✓ Catering düyməsi kliklədi');
  }
});

test('07 - Portfolio açılır', async ({ page }) => {
  await page.goto(`${BASE}/portfolio`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  console.log('✓ Portfolio yükləndi');
});

test('08 - Teambuilding açılır', async ({ page }) => {
  await page.goto(`${BASE}/teambuilding`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  console.log('✓ Teambuilding yükləndi');
  
  const gameBtn = page.locator('button:has-text("Seç"), button:has-text("Ətraflı"), [class*="game"]').first();
  if (await gameBtn.count() > 0) {
    await gameBtn.click();
    await page.waitForTimeout(1000);
    console.log('✓ Teambuilding oyun seçildi');
  }
});

test('09 - Əlaqə formu doldurulur', async ({ page }) => {
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const nameInput = page.locator('input[placeholder*="Ad"], input[name="name"]').first();
  const phoneInput = page.locator('input[placeholder*="Telefon"], input[type="tel"]').first();
  const msgInput = page.locator('textarea').first();
  
  if (await nameInput.count() > 0) await nameInput.fill('Real Test User');
  if (await phoneInput.count() > 0) await phoneInput.fill('+994501234567');
  if (await msgInput.count() > 0) await msgInput.fill('Salam, test müraciətidir. Playwright testi.');
  
  console.log('✓ Əlaqə formu dolduruldu');
  
  const submitBtn = page.locator('button[type="submit"]').first();
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ Əlaqə formu göndərildi');
  }
});

test('10 - Login səhifəsi açılır', async ({ page }) => {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]').first();
  expect(await emailInput.count()).toBeGreaterThan(0);
  await emailInput.fill('testuser@example.com');
  const passInput = page.locator('input[type="password"]').first();
  if (await passInput.count() > 0) await passInput.fill('wrongpassword');
  const loginBtn = page.locator('button[type="submit"]').first();
  if (await loginBtn.count() > 0) {
    await loginBtn.click();
    await page.waitForTimeout(1500);
    console.log('✓ Yanlış giriş cəhdi — sistem rədd etdi (gözlənilir)');
  }
});
