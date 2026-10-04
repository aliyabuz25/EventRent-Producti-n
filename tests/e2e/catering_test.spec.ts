import { test, expect } from '@playwright/test';

const BASE = 'https://erent.octotech.az';
test.use({ baseURL: BASE, actionTimeout: 12000 });

test('Catering - API birbaşa sifariş', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/catering/orders`, {
    data: {
      name: 'Playwright Catering Test',
      phone: '+994501234567',
      email: 'catering@test.az',
      guests: '80',
      package_name: 'Premium Paket',
      location: 'Bakı, Hüseyn Cavid 40',
      date: '2026-12-25',
      time_range: '19:00-00:00',
      format: 'Toy',
      menu_note: 'Uşaq menyusu da lazımdır'
    }
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.id).toBeTruthy();
  console.log('✓ Catering sifarişi yaradıldı, ID:', body.id);
});

test('Catering - Səhifə açılır, form görünür', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  
  await page.goto(`${BASE}/catering`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Form inputlarını tap
  const nameInput = page.locator('input[placeholder*="Ad"], input[placeholder*="ad"], input[type="text"]').first();
  const phoneInput = page.locator('input[placeholder*="050"], input[placeholder*="Telefon"], input[type="tel"]').first();
  
  console.log('Ad input:', await nameInput.count());
  console.log('Telefon input:', await phoneInput.count());
  console.log('Konsol xətaları:', errors.length);
  
  expect(errors.length).toBe(0);
  
  if (await nameInput.count() > 0) {
    await nameInput.fill('Playwright Test İstifadəçisi');
    console.log('✓ Ad dolduruldu');
  }
  
  if (await phoneInput.count() > 0) {
    await phoneInput.fill('+994501234567');
    console.log('✓ Telefon dolduruldu');
  }

  // Qonaq sayı
  const guestInput = page.locator('input[placeholder*="onaq"], input[placeholder*="nəfər"], input[type="number"]').first();
  if (await guestInput.count() > 0) {
    await guestInput.fill('100');
    console.log('✓ Qonaq sayı dolduruldu');
  }

  // Məkan
  const locationInput = page.locator('input[placeholder*="Məkan"], input[placeholder*="yer"]').first();
  if (await locationInput.count() > 0) {
    await locationInput.fill('Bakı, Neftçilər prospekti 123');
    console.log('✓ Məkan dolduruldu');
  }

  await page.screenshot({ path: '/tmp/catering_form.png' });

  // Submit
  const submitBtn = page.locator('button[type="submit"], button:has-text("Sifariş"), button:has-text("Göndər")').first();
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    await page.waitForTimeout(3000);
    console.log('✓ Form göndərildi');
    await page.screenshot({ path: '/tmp/catering_submitted.png' });
  }
});

test('Catering - Paket seçimi işləyir', async ({ page }) => {
  await page.goto(`${BASE}/catering`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Paket kartları
  const packages = await page.locator('[class*="package"], [class*="card"], button:has-text("Seç")').count();
  console.log('Paket/kart sayı:', packages);
  
  // İlk "Seç" düyməsi
  const selectBtn = page.locator('button:has-text("Seç"), button:has-text("Sifariş")').first();
  if (await selectBtn.count() > 0) {
    await selectBtn.click();
    await page.waitForTimeout(1000);
    console.log('✓ Paket seçildi');
    await page.screenshot({ path: '/tmp/catering_package.png' });
  }
});
