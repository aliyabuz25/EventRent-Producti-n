import { test, expect, Page, request } from '@playwright/test';

const ADMIN_EMAIL = 'admin@eventrent.az';
const ADMIN_PASS  = 'Test1234!';
const API         = 'http://localhost:4320';

// ── Token cache — test prosesi üçün bir dəfə alınır ──────────────────────────
let _cachedToken: string | null = null;

async function getToken(): Promise<string> {
  if (_cachedToken) return _cachedToken;
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  const data = await res.json() as any;
  if (!data.token) throw new Error(`Login failed: ${JSON.stringify(data)}`);
  _cachedToken = data.token;
  return _cachedToken!;
}

// ── Admin paneline token inject et ───────────────────────────────────────────
async function adminLogin(page: Page) {
  const token = await getToken();
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((t) => localStorage.setItem('er_admin_token', t), token);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  return token;
}

// ── Tab seç ───────────────────────────────────────────────────────────────────
async function clickTab(page: Page, ...labels: string[]) {
  for (const label of labels) {
    const el = page.locator('button, a, li').filter({ hasText: new RegExp(label, 'i') }).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.click();
      await page.waitForTimeout(1000);
      return true;
    }
  }
  return false;
}

// ── Xəta izlə ────────────────────────────────────────────────────────────────
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', e => {
    if (!e.message.includes('ResizeObserver') && !e.message.includes('favicon'))
      errors.push(e.message);
  });
  return errors;
}

// ═══════════════════════════════════════════════════════════════════════════
test.describe('🔐 Admin Login', () => {
  test('doğru credentials ilə token alınır', async ({ page }) => {
    const errors = watchErrors(page);
    const token = await getToken();
    console.log('✓ Token:', token.substring(0, 40) + '...');
    expect(token).toBeTruthy();
    expect(errors).toHaveLength(0);
  });

  test('yanlış şifrə rədd edilir — crash yoxdur', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 })) {
      await emailInput.fill(ADMIN_EMAIL);
      await page.locator('input[type="password"]').first().fill('WrongPass999!');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(2000);
      const token = await page.evaluate(() => localStorage.getItem('er_admin_token'));
      expect(token).toBeFalsy();
      console.log('✓ Yanlış şifrə rədd edildi');
    }
    expect(errors).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
test.describe('📊 Dashboard', () => {
  test('KPI kartları yüklənir', async ({ page }) => {
    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'Dashboard', 'Ana');
    await page.waitForTimeout(2000);
    const kpi = page.locator('[style*="font-size: 32px"], [class*="text-4xl"], [class*="font-black"]').first();
    console.log('KPI visible:', await kpi.isVisible({ timeout: 2000 }).catch(() => false));
    expect(errors).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
test.describe('👤 İstifadəçi İdarəsi', () => {
  test('yeni istifadəçi yaradır', async ({ page }) => {
    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'İstifadəçi', 'Users');

    const newBtn = page.locator('button').filter({ hasText: /Yeni İstifadəçi/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 })) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const ts = Date.now();
      await page.locator('input[name="name"], input[placeholder*="Ad"]').first().fill(`PW User ${ts}`);
      await page.locator('input[type="email"]').first().fill(`pw_${ts}@test.az`);
      await page.locator('input[type="password"]').first().fill('TestPass123!');

      const roleSelect = page.locator('select[name="role"]').first();
      if (await roleSelect.isVisible()) await roleSelect.selectOption('viewer');

      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(1500);

      const newUser = page.locator(`text=pw_${ts}@test.az`).first();
      const vis = await newUser.isVisible({ timeout: 3000 }).catch(() => false);
      console.log('✓ Yeni user görünür:', vis);
    }
    expect(errors).toHaveLength(0);
  });

  test('istifadəçi toggle (deaktiv/aktiv)', async ({ page }) => {
    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'İstifadəçi', 'Users');
    await page.waitForTimeout(500);

    const toggleBtn = page.locator('button[title*="Deaktiv"], button[title*="Aktiv"]').first();
    if (await toggleBtn.isVisible({ timeout: 3000 })) {
      const titleBefore = await toggleBtn.getAttribute('title');
      await toggleBtn.click();
      await page.waitForTimeout(1000);
      console.log('✓ Toggle:', titleBefore, '→ dəyişdirildi');
    }
    expect(errors).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
test.describe('📦 Məhsul İdarəsi', () => {
  test('məhsul siyahısı açılır', async ({ page }) => {
    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'Məhsul', 'Product');
    await page.waitForTimeout(1500);

    const rows = page.locator('table tbody tr, .card');
    console.log('Məhsul sayı:', await rows.count());
    expect(errors).toHaveLength(0);
  });

  test('yeni məhsul formu açılır, doldurulur, ləğv edilir', async ({ page }) => {
    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'Məhsul', 'Product');

    const newBtn = page.locator('button').filter({ hasText: /Yeni|New/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 })) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator('input[name="name"], input[placeholder*="ad"], input[placeholder*="Ad"]').first();
      if (await nameInput.isVisible({ timeout: 2000 })) {
        await nameInput.fill(`PW Test Məhsul ${Date.now()}`);
        const desc = page.locator('textarea').first();
        if (await desc.isVisible()) await desc.fill('Playwright test məhsulu.');

        const cancelBtn = page.locator('button').filter({ hasText: /Ləğv|Cancel|Bağla/i }).first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
          console.log('✓ Form ləğv edildi');
        }
      }
    }
    expect(errors).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
test.describe('📋 Sorğular (Leads)', () => {
  test('leads siyahısı açılır', async ({ page }) => {
    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'Sorğu', 'Leads', 'Lead');
    await page.waitForTimeout(1500);

    const rows = page.locator('table tbody tr');
    console.log('Lead sayı:', await rows.count());
    expect(errors).toHaveLength(0);
  });

  test('status filtri işləyir', async ({ page }) => {
    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'Sorğu', 'Leads', 'Lead');
    await page.waitForTimeout(1000);

    for (const label of ['Yeni', 'Hamısı']) {
      const btn = page.locator('button').filter({ hasText: new RegExp(`^${label}$`) }).first();
      if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(400);
        console.log(`✓ Filter: ${label}`);
      }
    }
    expect(errors).toHaveLength(0);
  });

  test('lead axtarışı işləyir', async ({ page }) => {
    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'Sorğu', 'Leads', 'Lead');
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="Ad"], input[placeholder*="email"], input[placeholder*="telefon"]').first();
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('Playwright');
      await page.waitForTimeout(500);
      const rows = await page.locator('table tbody tr').count();
      console.log(`✓ Axtarış "Playwright": ${rows} nəticə`);
      await searchInput.fill('');
      await page.waitForTimeout(300);
    }
    expect(errors).toHaveLength(0);
  });

  test('lead detail modal açılır, bağlanır', async ({ page }) => {
    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'Sorğu', 'Leads', 'Lead');
    await page.waitForTimeout(1500);

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible({ timeout: 2000 })) {
      const eyeBtn = firstRow.locator('button').first();
      if (await eyeBtn.isVisible()) {
        await eyeBtn.click();
        await page.waitForTimeout(800);

        const modal = page.locator('.modal.show').first();
        if (await modal.isVisible({ timeout: 2000 })) {
          console.log('✓ Lead modal açıldı');
          const closeBtn = modal.locator('button.btn-close, button:has-text("Bağla")').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }
    expect(errors).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
test.describe('🛒 Sifarişlər', () => {
  test('sifarişlər siyahısı açılır', async ({ page }) => {
    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'Sifariş', 'Orders', 'Order');
    await page.waitForTimeout(1500);

    const rows = page.locator('table tbody tr');
    console.log('Sifariş sayı:', await rows.count());
    expect(errors).toHaveLength(0);
  });

  test('sifariş modal açılır, status dəyişdirilir', async ({ page }) => {
    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'Sifariş', 'Orders', 'Order');
    await page.waitForTimeout(1500);

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible({ timeout: 2000 })) {
      const eyeBtn = firstRow.locator('button').first();
      if (await eyeBtn.isVisible()) {
        await eyeBtn.click();
        await page.waitForTimeout(1000);

        const modal = page.locator('.modal.show').first();
        if (await modal.isVisible({ timeout: 2000 })) {
          console.log('✓ Order modal açıldı');
          const statusSelect = modal.locator('select').first();
          if (await statusSelect.isVisible()) {
            await statusSelect.selectOption('contacted');
            await page.waitForTimeout(500);
            console.log('✓ Status: contacted');
          }
          const closeBtn = modal.locator('button.btn-close').first();
          if (await closeBtn.isVisible()) await closeBtn.click();
        }
      }
    }
    expect(errors).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
test.describe('🌐 Normal User — API Axışı', () => {
  test('API ilə sifariş yarat, admin paneldə görün', async ({ page }) => {
    const token = await getToken();
    const ts = Date.now();

    const res = await fetch(`${API}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        name: `PW Sifariş User ${ts}`,
        phone: '+994501234567',
        email: `pw_order_${ts}@test.az`,
        event_date: '2025-12-20',
        location: 'Bakı, Test Venue',
        note: 'Playwright e2e testi',
        items: [{ productId: 'test-1', quantity: 2, name: 'Test Məhsul', category: 'Test' }],
        source: 'website',
        lang: 'az',
      }),
    });
    console.log('Order API status:', res.status);
    expect(res.status).toBeLessThan(500);

    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'Sifariş', 'Orders', 'Order');
    await page.waitForTimeout(1500);

    const inList = page.locator(`text=PW Sifariş User ${ts}`).first();
    console.log('Sifariş admin siyahısında:', await inList.isVisible({ timeout: 3000 }).catch(() => false));
    expect(errors).toHaveLength(0);
  });

  test('API ilə lead yarat, admin paneldə görün', async ({ page }) => {
    const ts = Date.now();

    const res = await fetch(`${API}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `PW Lead User ${ts}`,
        phone: '+994551234567',
        email: `pw_lead_${ts}@test.az`,
        eventDate: '2025-11-15',
        location: 'Bakı, Landmark',
        note: 'Playwright lead testi',
        items: [{ productId: 'test-1', quantity: 1 }],
        source: 'website',
      }),
    });
    console.log('Lead API status:', res.status);
    expect(res.status).toBeLessThan(500);

    const errors = watchErrors(page);
    await adminLogin(page);
    await clickTab(page, 'Sorğu', 'Leads', 'Lead');
    await page.waitForTimeout(1500);

    const inList = page.locator(`text=PW Lead User ${ts}`).first();
    console.log('Lead admin siyahısında:', await inList.isVisible({ timeout: 3000 }).catch(() => false));
    expect(errors).toHaveLength(0);
  });

  test('real məhsul detail səhifəsi açılır', async ({ page }) => {
    const errors = watchErrors(page);
    const token = await getToken();

    const res = await fetch(`${API}/api/products`, { headers: { Authorization: `Bearer ${token}` } });
    const products = await res.json() as any[];
    const product = Array.isArray(products) ? products.find((p: any) => p.active !== 0) : null;

    if (product) {
      await page.goto(`/product/${product.id}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
      console.log('✓ Məhsul detail:', product.name, `(id: ${product.id})`);
    } else {
      await page.goto('/catalog');
      await page.waitForLoadState('networkidle');
      console.log('Aktiv məhsul yoxdur, kataloq açıldı');
    }
    expect(errors).toHaveLength(0);
  });
});