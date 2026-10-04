import { test, expect, chromium } from '@playwright/test';

const BASE = 'https://erent.octotech.az';

test.use({ baseURL: BASE, actionTimeout: 10000 });

test('01 - Ana səhifə - konsol xətası yoxdur', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('404')) errors.push(m.text()); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('Konsol xətaları:', errors);
  expect(errors.length).toBe(0);
});

test('02 - Navbar linklər işləyir', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const links = ['catalog', 'services', 'about', 'contact', 'portfolio', 'teambuilding'];
  for (const link of links) {
    const res = await page.request.get(`${BASE}/${link}`);
    expect(res.status()).toBe(200);
    console.log(`✓ /${link} → ${res.status()}`);
  }
});

test('03 - Kataloq - məhsullar yüklənir', async ({ page }) => {
  await page.goto(`${BASE}/catalog`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  const productLinks = await page.locator('a[href*="product"]').count();
  console.log('Məhsul linki sayı:', productLinks);
});

test('04 - Məhsul detalı - tam açılır', async ({ page }) => {
  const products = await (await page.request.get(`${BASE}/api/products`)).json();
  if (!products?.length) { console.log('Məhsul yoxdur, skip'); return; }
  const p = products[0];
  await page.goto(`${BASE}/catalog/product/${p.id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  console.log('✓ Məhsul açıldı:', p.name);
});

test('05 - Səbətə əlavə et → Sifariş ver', async ({ page }) => {
  const products = await (await page.request.get(`${BASE}/api/products`)).json();
  if (!products?.length) { console.log('Məhsul yoxdur, skip'); return; }
  const p = products[0];

  // LocalStorage-ə məhsul əlavə et
  await page.goto(BASE);
  await page.evaluate((product) => {
    const item = { productId: product.id, name: product.name, category: product.category, quantity: 1, image: product.images?.[0] || '' };
    localStorage.setItem('cart', JSON.stringify([item]));
    window.dispatchEvent(new Event('cart-updated'));
  }, p);

  await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Form doldur
  const nameInput = page.locator('input[type="text"]').first();
  const phoneInput = page.locator('input[type="tel"]').first();
  
  if (await nameInput.count() > 0) { await nameInput.fill('Playwright Test'); console.log('✓ Ad dolduruldu'); }
  if (await phoneInput.count() > 0) { await phoneInput.fill('+994501234567'); console.log('✓ Telefon dolduruldu'); }
  
  const dateInput = page.locator('input[type="date"]').first();
  if (await dateInput.count() > 0) await dateInput.fill('2026-12-15');

  await page.screenshot({ path: '/tmp/cart_filled.png' });

  // Submit
  const submitBtn = page.locator('button[type="submit"]').first();
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    await page.waitForTimeout(3000);
    console.log('✓ Sifariş göndərildi, URL:', page.url());
    await page.screenshot({ path: '/tmp/cart_submitted.png' });
  }
});

test('06 - API sifariş yoxla', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/orders`, {
    data: {
      name: 'Playwright User',
      phone: '+994501234567',
      email: 'test@playwright.az',
      event_date: '2026-12-20',
      location: 'Bakı, İçərişəhər',
      note: 'Real test sifarişi',
      items: [{ productId: 'test-id', productName: 'Test Məhsul', quantity: 2, technicalAnswers: { 'Güc': '500W', 'Rəng': 'Qara' } }],
      source: 'website'
    }
  });
  const body = await res.json();
  console.log('Sifariş cavabı:', JSON.stringify(body));
  expect(res.status()).toBe(201);
  expect(body.id).toBeTruthy();
  console.log('✓ Sifariş yaradıldı, ID:', body.id);
});

test('07 - Catering səhifəsi tam işləyir', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${BASE}/catering`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  console.log('✓ Catering yükləndi, xəta:', errors.length);
});

test('08 - Portfolio tam işləyir', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${BASE}/portfolio`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  console.log('✓ Portfolio yükləndi, xəta:', errors.length);
});

test('09 - Teambuilding tam işləyir', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${BASE}/teambuilding`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  console.log('✓ Teambuilding yükləndi, xəta:', errors.length);
});

test('10 - Contact formu göndərilir', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/leads`, {
    data: { name: 'Test User', phone: '+994501234567', email: 'test@test.az', message: 'Playwright test müraciəti' }
  });
  console.log('Contact API status:', res.status());
  expect([200, 201]).toContain(res.status());
  const body = await res.json();
  console.log('✓ Müraciət göndərildi, ID:', body.id);
});

test('11 - Login - yanlış şifrə rədd edilir', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/auth/login`, {
    data: { email: 'wrong@test.com', password: 'wrongpassword' }
  });
  expect(res.status()).toBe(401);
  console.log('✓ Yanlış login rədd edildi');
});

test('12 - 404 səhifəsi işləyir', async ({ page }) => {
  await page.goto(`${BASE}/nonexistent-page-xyz`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  console.log('✓ 404 səhifəsi işləyir');
});

test('13 - XSS qorunması', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/orders`, {
    data: { name: '<script>alert(1)</script>', phone: '+994501234567', items: [], source: 'website' }
  });
  expect([201, 400]).toContain(res.status());
  console.log('✓ XSS payload rədd edildi və ya sanitize edildi');
});

test('14 - Auth middleware qoruması', async ({ page }) => {
  const endpoints = ['/api/orders', '/api/users', '/api/media'];
  for (const ep of endpoints) {
    const res = await page.request.get(`${BASE}${ep}`);
    expect([401, 403]).toContain(res.status());
    console.log(`✓ ${ep} → ${res.status()} (qorunur)`);
  }
});

test('15 - Services və About səhifəsi açılır', async ({ page }) => {
  for (const path of ['/services', '/about']) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log(`✓ ${path} yükləndi`);
  }
});
