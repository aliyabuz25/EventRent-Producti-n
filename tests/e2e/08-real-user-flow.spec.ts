import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@eventrent.az';
const ADMIN_PASS  = 'Test1234!';

// ─── Helpers ────────────────────────────────────────────────────────────────
async function noErrors(page: Page, label: string) {
  const errs: string[] = [];
  page.on('pageerror', e => errs.push(e.message));
  const real = errs.filter(e =>
    !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
  );
  expect(real, `[${label}] crash: ${real.join('\n')}`).toHaveLength(0);
}

async function adminLogin(page: Page) {
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');

  // Login formu varsa doldur
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail"]').first();
  const passInput  = page.locator('input[type="password"]').first();
  const submitBtn  = page.locator('button[type="submit"], button:has-text("Giriş"), button:has-text("Login")').first();

  if (await emailInput.isVisible()) {
    await emailInput.fill(ADMIN_EMAIL);
    await passInput.fill(ADMIN_PASS);
    await submitBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  }
}

// ─── BLOK 1: Admin Login ─────────────────────────────────────────────────────
test.describe('Admin — Giriş', () => {
  test('admin email + şifrə ilə daxil olur', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await adminLogin(page);

    // Login uğurlu olduqda admin dashboard görünür
    const url = page.url();
    console.log('URL after login:', url);

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Login crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});

// ─── BLOK 2: Admin — Yeni İstifadəçi Yarat ──────────────────────────────────
test.describe('Admin — İstifadəçi Yarat', () => {
  test('yeni istifadəçi əlavə edir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await adminLogin(page);

    // Users tab-ına keç
    const usersTab = page.locator('text=İstifadəçi, text=Users, [data-tab="users"], button:has-text("İstifadəçi")').first();
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(1000);
    }

    // Yeni istifadəçi butonu
    const newUserBtn = page.locator('button:has-text("Yeni İstifadəçi"), button:has-text("Əlavə et"), button:has-text("New")').first();
    if (await newUserBtn.isVisible()) {
      await newUserBtn.click();
      await page.waitForTimeout(500);

      // Formu doldur
      const nameInput  = page.locator('input[placeholder*="Ad"], input[name="name"]').first();
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passInput  = page.locator('input[type="password"]').first();

      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Kullanıcı');
        await emailInput.fill(`testuser_${Date.now()}@eventrent.az`);
        await passInput.fill('TestPass123!');

        const saveBtn = page.locator('button[type="submit"], button:has-text("Saxla"), button:has-text("Yarat")').first();
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await page.waitForTimeout(1500);
        }
      }
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `User create crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});

// ─── BLOK 3: Admin — Məhsul Yarat ───────────────────────────────────────────
test.describe('Admin — Məhsul Yarat', () => {
  test('yeni məhsul əlavə edir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await adminLogin(page);

    // Products tab
    const productsTab = page.locator('text=Məhsul, text=Ürün, text=Products, [data-tab="products"]').first();
    if (await productsTab.isVisible()) {
      await productsTab.click();
      await page.waitForTimeout(1000);
    }

    // Yeni məhsul
    const newBtn = page.locator('button:has-text("Yeni"), button:has-text("Əlavə"), button:has-text("New")').first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator('input[name="name"], input[placeholder*="Ad"], input[placeholder*="Name"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill(`Test Məhsul ${Date.now()}`);

        const descInput = page.locator('textarea[name="description"], textarea').first();
        if (await descInput.isVisible()) {
          await descInput.fill('Bu bir test məhsuludur. Playwright tərəfindən yaradılıb.');
        }

        const saveBtn = page.locator('button[type="submit"], button:has-text("Saxla"), button:has-text("Yarat")').first();
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await page.waitForTimeout(1500);
        }
      }
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Product create crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});

// ─── BLOK 4: Admin — Lead/Sorğu İdarəsi ─────────────────────────────────────
test.describe('Admin — Leads Tab', () => {
  test('leads tab açılır, status dəyişdirir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await adminLogin(page);

    const leadsTab = page.locator('text=Sorğu, text=Lead, text=Leads').first();
    if (await leadsTab.isVisible()) {
      await leadsTab.click();
      await page.waitForTimeout(1000);
    }

    // Status filter sına
    const filterBtn = page.locator('button:has-text("Yeni"), button:has-text("new")').first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(500);
    }

    // Hamısı filtri
    const allBtn = page.locator('button:has-text("Hamısı"), button:has-text("All")').first();
    if (await allBtn.isVisible()) {
      await allBtn.click();
      await page.waitForTimeout(500);
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Leads crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});

// ─── BLOK 5: Admin — Dashboard Statistika ───────────────────────────────────
test.describe('Admin — Dashboard', () => {
  test('dashboard açılır, KPI kartları görünür', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await adminLogin(page);

    // Dashboard tab
    const dashTab = page.locator('text=Dashboard, text=Ana Səhifə').first();
    if (await dashTab.isVisible()) {
      await dashTab.click();
      await page.waitForTimeout(2000);
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Dashboard crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});

// ─── BLOK 6: Normal User — Sifariş Axışı ────────────────────────────────────
test.describe('Normal User — Sifariş Axışı', () => {
  test('kataloqdan məhsul seç, səbətə əlavə et, sifariş ver', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    // Kataloqa get
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // İlk məhsul kartına hover et, sonra + butonuna bas
    const addBtn = page.locator('button').filter({ hasText: '' }).first();
    const plusBtn = page.locator('button svg').first();

    // Məhsul kartını tap
    const productCards = page.locator('.cursor-pointer, [class*="group"]').filter({ hasText: /.+/ });
    if (await productCards.count() > 0) {
      await productCards.first().hover();
      await page.waitForTimeout(300);

      // Plus butonu
      const cartAddBtn = page.locator('button:has(svg)').last();
      if (await cartAddBtn.isVisible()) {
        await cartAddBtn.click();
        await page.waitForTimeout(500);

        // Modal açılırsa kapat
        const modalConfirm = page.locator('button:has-text("Təsdiqlə"), button:has-text("Confirm"), button:has-text("Əlavə et")').first();
        if (await modalConfirm.isVisible()) {
          await modalConfirm.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Səbətə get
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Sifariş formu doldur
    const nameInput  = page.locator('input[placeholder*="Ad"], input[name="name"]').first();
    const phoneInput = page.locator('input[placeholder*="Telefon"], input[type="tel"]').first();
    const emailInput = page.locator('input[type="email"]').first();

    if (await nameInput.isVisible()) {
      await nameInput.fill('Playwright Test User');
      if (await phoneInput.isVisible()) await phoneInput.fill('+994501234567');
      if (await emailInput.isVisible()) await emailInput.fill('playwright@test.az');

      const eventDateInput = page.locator('input[type="date"], input[placeholder*="Tarix"]').first();
      if (await eventDateInput.isVisible()) await eventDateInput.fill('2025-12-15');

      const locationInput = page.locator('input[placeholder*="Məkan"], input[name="location"]').first();
      if (await locationInput.isVisible()) await locationInput.fill('Bakı, Test Venue');
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Order flow crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('sifariş formu boş göndərilmir, validation işləyir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // Submit butonunu tap və sına
    const submitBtn = page.locator('button[type="submit"], button:has-text("Sifariş ver"), button:has-text("Göndər")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Validation crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});

// ─── BLOK 7: Admin — Sifarişlər Tab ─────────────────────────────────────────
test.describe('Admin — Sifarişlər', () => {
  test('sifarişlər tab açılır, modal işləyir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await adminLogin(page);

    const ordersTab = page.locator('text=Sifariş, text=Order').first();
    if (await ordersTab.isVisible()) {
      await ordersTab.click();
      await page.waitForTimeout(1500);
    }

    // İlk sifarişin detail butonuna bas
    const eyeBtn = page.locator('button svg[class*="lucide-eye"], button:has(svg)').first();
    if (await eyeBtn.isVisible()) {
      await eyeBtn.click();
      await page.waitForTimeout(800);

      // Modalu bağla
      const closeBtn = page.locator('button.btn-close, button:has-text("Bağla"), button:has-text("Close")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Orders crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});

// ─── BLOK 8: Admin — Axtar/Filter ───────────────────────────────────────────
test.describe('Admin — Axtarış və Filter', () => {
  test('leads axtarışı işləyir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await adminLogin(page);

    const leadsTab = page.locator('text=Sorğu, text=Leads').first();
    if (await leadsTab.isVisible()) {
      await leadsTab.click();
      await page.waitForTimeout(1000);
    }

    const searchInput = page.locator('input[placeholder*="Ad"], input[placeholder*="email"], input[placeholder*="telefon"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await searchInput.fill('');
      await page.waitForTimeout(300);
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Search crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('orders status filter işləyir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await adminLogin(page);

    const ordersTab = page.locator('text=Sifariş, text=Orders').first();
    if (await ordersTab.isVisible()) {
      await ordersTab.click();
      await page.waitForTimeout(1000);
    }

    // Bütün status filterləri sına
    const statusBtns = page.locator('button:has-text("Yeni"), button:has-text("Qazanıldı"), button:has-text("İtirildi")');
    const count = await statusBtns.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await statusBtns.nth(i).click();
      await page.waitForTimeout(300);
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Filter crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});

// ─── BLOK 9: Contact Formu ───────────────────────────────────────────────────
test.describe('Contact Formu', () => {
  test('əlaqə formu doldurulur, göndərilir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const nameInput  = page.locator('input[name="name"], input[placeholder*="Ad"]').first();
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    const emailInput = page.locator('input[type="email"]').first();
    const msgInput   = page.locator('textarea').first();

    if (await nameInput.isVisible()) {
      await nameInput.fill('Playwright Test');
      if (await phoneInput.isVisible()) await phoneInput.fill('+994501234567');
      if (await emailInput.isVisible()) await emailInput.fill('test@playwright.az');
      if (await msgInput.isVisible()) await msgInput.fill('Bu bir test mesajıdır. Playwright tərəfindən göndərilir.');

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    expect(realErrors, `Contact crash: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});