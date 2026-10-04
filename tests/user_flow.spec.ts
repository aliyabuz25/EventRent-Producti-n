import { test, expect, chromium } from '@playwright/test';

const BASE = 'https://erent.octotech.az';

test('Real user flow - Ana səhifə, Kataloq, Sifariş, Catering, Portfolio', async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 600 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  // 1. Ana səhifə
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/.+/);
  console.log('✓ Ana səhifə açıldı');
  await page.screenshot({ path: '/tmp/01_home.png' });

  // 2. Kataloqa get
  await page.goto(`${BASE}/catalog`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('✓ Kataloq açıldı');
  await page.screenshot({ path: '/tmp/02_catalog.png' });

  // 3. İlk məhsula klik
  const firstProduct = page.locator('a[href*="/catalog/product/"], a[href*="/product/"]').first();
  if (await firstProduct.count() > 0) {
    await firstProduct.click();
    await page.waitForTimeout(1500);
    console.log('✓ Məhsul səhifəsi açıldı:', page.url());
    await page.screenshot({ path: '/tmp/03_product.png' });

    // 4. Səbətə əlavə et
    const addBtn = page.locator('button:has-text("Səbət"), button:has-text("Əlavə"), button:has-text("Seç"), button:has-text("Kira")').first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      console.log('✓ Məhsul səbətə əlavə edildi');
      await page.screenshot({ path: '/tmp/04_add_to_cart.png' });
    }
  }

  // 5. Səbətə get
  await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('✓ Səbət açıldı');
  await page.screenshot({ path: '/tmp/05_cart.png' });

  // 6. Sifariş formu doldurmaq
  const nameInput = page.locator('input[placeholder*="Ad"], input[name="name"], input[placeholder*="ad"]').first();
  const phoneInput = page.locator('input[placeholder*="Telefon"], input[placeholder*="050"], input[type="tel"]').first();
  if (await nameInput.count() > 0) {
    await nameInput.fill('Test İstifadəçi');
    await page.waitForTimeout(300);
  }
  if (await phoneInput.count() > 0) {
    await phoneInput.fill('+994501234567');
    await page.waitForTimeout(300);
  }
  const noteInput = page.locator('textarea').first();
  if (await noteInput.count() > 0) {
    await noteInput.fill('Bu test sifarişidir. Real test üçün yazılıb.');
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: '/tmp/06_cart_form.png' });
  console.log('✓ Sifariş formu dolduruldu');

  // Sifarişi göndər
  const submitBtn = page.locator('button[type="submit"], button:has-text("Sifariş"), button:has-text("Göndər")').first();
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ Sifariş göndərildi');
    await page.screenshot({ path: '/tmp/07_order_sent.png' });
  }

  // 7. Catering səhifəsi
  await page.goto(`${BASE}/catering`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('✓ Catering səhifəsi açıldı');
  await page.screenshot({ path: '/tmp/08_catering.png' });

  // Catering paketi seç
  const cateringBtn = page.locator('button:has-text("Seç"), button:has-text("Sifariş"), a:has-text("Paket")').first();
  if (await cateringBtn.count() > 0) {
    await cateringBtn.click();
    await page.waitForTimeout(1000);
    console.log('✓ Catering paketi seçildi');
    await page.screenshot({ path: '/tmp/09_catering_selected.png' });
  }

  // 8. Portfolio
  await page.goto(`${BASE}/portfolio`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('✓ Portfolio açıldı');
  await page.screenshot({ path: '/tmp/10_portfolio.png' });

  // 9. Teambuilding
  await page.goto(`${BASE}/teambuilding`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('✓ Teambuilding açıldı');
  await page.screenshot({ path: '/tmp/11_teambuilding.png' });

  // 10. Əlaqə / Contact
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const contactName = page.locator('input[placeholder*="Ad"], input[name="name"]').first();
  const contactPhone = page.locator('input[placeholder*="Telefon"], input[type="tel"]').first();
  const contactMsg = page.locator('textarea').first();
  if (await contactName.count() > 0) await contactName.fill('Real Test User');
  if (await contactPhone.count() > 0) await contactPhone.fill('+994501234567');
  if (await contactMsg.count() > 0) await contactMsg.fill('Salam, test müraciətidir. Zəhmət olmasa əlaqə saxlayın.');
  await page.screenshot({ path: '/tmp/12_contact_form.png' });
  
  const contactSubmit = page.locator('button[type="submit"]').first();
  if (await contactSubmit.count() > 0) {
    await contactSubmit.click();
    await page.waitForTimeout(2000);
    console.log('✓ Əlaqə formu göndərildi');
    await page.screenshot({ path: '/tmp/13_contact_sent.png' });
  }

  // Konsol xətaları
  if (errors.length > 0) {
    console.log('⚠ Konsol xətaları:', errors.slice(0, 5));
  } else {
    console.log('✓ Konsol xətası yoxdur');
  }

  await browser.close();
});
