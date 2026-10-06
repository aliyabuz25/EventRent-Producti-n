import express from 'express';
import fs from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

const app  = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || 4320);
const CONTENT_FILE_PATH = path.resolve('data/site-content.json');
const DB_PATH = path.resolve(process.env.DB_PATH || 'data/eventrent.db');
const JWT_SECRET = process.env.JWT_SECRET || 'ev3ntr3nt_pr0d_s3cr3t_2025';

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve('uploads')));
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5050,http://localhost:5173').split(',');

// Rate limiters
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Çox cəhd. 15 dəq sonra yenidən cəhd edin.' }, standardHeaders: true, legacyHeaders: false });
const otpLimiter  = rateLimit({ windowMs: 5  * 60 * 1000, max: 5,  message: { error: 'Çox OTP sorğusu. 5 dəq sonra yenidən cəhd edin.' }, standardHeaders: true, legacyHeaders: false });
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ══════════════════════════════════════════
   SQLite init
══════════════════════════════════════════ */
let db;

function initDb() {
  const Database = require('better-sqlite3');
  const dataDir  = path.dirname(DB_PATH);
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'viewer',
      active     INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      phone      TEXT NOT NULL,
      email      TEXT DEFAULT '',
      event_date TEXT DEFAULT '',
      location   TEXT DEFAULT '',
      note       TEXT DEFAULT '',
      status     TEXT NOT NULL DEFAULT 'new',
      items      TEXT NOT NULL DEFAULT '[]',
      user_id    TEXT DEFAULT '',
      source     TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS smtp_config (
      id         INTEGER PRIMARY KEY DEFAULT 1,
      host       TEXT DEFAULT '',
      port       INTEGER DEFAULT 587,
      secure     INTEGER DEFAULT 0,
      user_email TEXT DEFAULT '',
      password   TEXT DEFAULT '',
      from_name  TEXT DEFAULT 'Eventrent',
      from_email TEXT DEFAULT '',
      notify_to  TEXT DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO smtp_config (id) VALUES (1);
    CREATE TABLE IF NOT EXISTS products (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      category      TEXT DEFAULT '',
      description   TEXT DEFAULT '',
      technical_specs TEXT DEFAULT '{}',
      images        TEXT DEFAULT '[]',
      tags          TEXT DEFAULT '[]',
      related_products TEXT DEFAULT '[]',
      active        INTEGER DEFAULT 1,
      sort_order    INTEGER DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS support_tickets (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER DEFAULT 0,
      user_name  TEXT DEFAULT '',
      user_email TEXT DEFAULT '',
      subject    TEXT NOT NULL,
      message    TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'open',
      priority   TEXT NOT NULL DEFAULT 'normal',
      reply      TEXT DEFAULT '',
      replied_at TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tb_games (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT 'Indoor',
      image       TEXT DEFAULT '',
      description TEXT DEFAULT '',
      details     TEXT DEFAULT '',
      sort_order  INTEGER DEFAULT 0,
      active      INTEGER DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tb_concepts (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      image       TEXT DEFAULT '',
      sort_order  INTEGER DEFAULT 0,
      active      INTEGER DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
CREATE TABLE IF NOT EXISTS leads (
       id         INTEGER PRIMARY KEY AUTOINCREMENT,
       name       TEXT NOT NULL,
       phone      TEXT DEFAULT '',
       email      TEXT DEFAULT '',
       message    TEXT DEFAULT '',
       status     TEXT NOT NULL DEFAULT 'new',
       created_at TEXT NOT NULL DEFAULT (datetime('now')),
       updated_at TEXT NOT NULL DEFAULT (datetime('now'))
     );
   `);

  db.prepare(`
    CREATE TABLE IF NOT EXISTS wa_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      phone       TEXT NOT NULL DEFAULT '',
      message     TEXT NOT NULL DEFAULT '',
      direction   TEXT NOT NULL DEFAULT 'out',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS tb_applications (
      id          TEXT PRIMARY KEY,
      order_no    TEXT NOT NULL DEFAULT '',
      name        TEXT NOT NULL,
      phone       TEXT NOT NULL,
      company     TEXT NOT NULL DEFAULT '',
      game_id     TEXT NOT NULL DEFAULT '',
      game_name   TEXT NOT NULL DEFAULT '',
      extra       TEXT NOT NULL DEFAULT '{}',
      status      TEXT NOT NULL DEFAULT 'new',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS catering_orders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      phone       TEXT NOT NULL,
      email       TEXT NOT NULL DEFAULT '',
      guests      TEXT NOT NULL DEFAULT '',
      location    TEXT NOT NULL DEFAULT '',
      date        TEXT NOT NULL DEFAULT '',
      time_range  TEXT NOT NULL DEFAULT '',
      format      TEXT NOT NULL DEFAULT '',
      menu_note   TEXT NOT NULL DEFAULT '',
      package_name TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'new',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS catering_packages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price       TEXT NOT NULL DEFAULT '',
      price_note  TEXT NOT NULL DEFAULT '',
      features    TEXT NOT NULL DEFAULT '[]',
      badge       TEXT NOT NULL DEFAULT '',
      badge_color TEXT NOT NULL DEFAULT 'orange',
      image_url   TEXT NOT NULL DEFAULT '',
      is_popular  INTEGER NOT NULL DEFAULT 0,
      active      INTEGER NOT NULL DEFAULT 1,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS reels (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      client      TEXT NOT NULL DEFAULT '',
      date_label  TEXT NOT NULL DEFAULT '',
      location    TEXT NOT NULL DEFAULT '',
      category    TEXT NOT NULL DEFAULT '',
      tags        TEXT NOT NULL DEFAULT '[]',
      media_type  TEXT NOT NULL DEFAULT 'video',
      media_url   TEXT NOT NULL DEFAULT '',
      poster_url  TEXT NOT NULL DEFAULT '',
      sort_order  INTEGER NOT NULL DEFAULT 0,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS spec_templates (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      unit        TEXT NOT NULL DEFAULT '',
      category    TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      field_type  TEXT NOT NULL DEFAULT 'text',
      options     TEXT NOT NULL DEFAULT '[]',
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
  try {
    db.prepare(`ALTER TABLE spec_templates ADD COLUMN field_type TEXT NOT NULL DEFAULT 'text'`).run();
  } catch {}
  try {
    db.prepare(`ALTER TABLE spec_templates ADD COLUMN options TEXT NOT NULL DEFAULT '[]'`).run();
  } catch {}

  console.log('✓ SQLite ready:', DB_PATH);
}

initDb();

/* ══════════════════════════════════════════
   JWT middleware
══════════════════════════════════════════ */
function signToken(payload) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  const jwt = require('jsonwebtoken');
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  const user = db.prepare('SELECT * FROM users WHERE id=? AND active=1').get(payload.id);
  if (!user) return res.status(401).json({ error: 'User not found or inactive' });
  req.user = user;
  next();
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  next();
}

/* ══════════════════════════════════════════
   Nodemailer
══════════════════════════════════════════ */
let transporter = null;

async function buildTransporter(cfg = null) {
  try {
    const nodemailer = require('nodemailer');
    const row = cfg || db.prepare('SELECT * FROM smtp_config WHERE id=1').get();
    const host   = row?.host       || process.env.SMTP_HOST || '';
    const port   = Number(row?.port ?? process.env.SMTP_PORT ?? 587);
    const secure = !!(row?.secure  ?? (process.env.SMTP_SECURE === 'true'));
    const user   = row?.user_email || process.env.SMTP_USER || '';
    const pass   = row?.password   || process.env.SMTP_PASS || '';
    if (!host || !user || !pass) {
      console.warn('⚠ SMTP: host, user or password missing');
      transporter = null; return false;
    }
const tlsOptions = secure
     ? { rejectUnauthorized: false }   // SSL — cert check disabled for self-signed certs
     : {};
    const t = nodemailer.createTransport({
      host, port, secure,
      auth: { user, pass },
      tls: tlsOptions,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
    await t.verify();
    transporter = t;
    console.log('✓ SMTP ready:', host, port, secure ? 'SSL' : 'STARTTLS');
    return true;
  } catch (err) {
    console.warn('⚠ SMTP build error:', err.message, err.code || '— email disabled, API still running');
    transporter = null;
    return false;
  }
}

async function sendMail({ to, subject, html }) {
  if (!transporter) await buildTransporter();
  if (!transporter) {
    console.error('✗ sendMail: no transporter, check SMTP config');
    return false;
  }
  try {
    const row = db.prepare('SELECT * FROM smtp_config WHERE id=1').get();
    const from = `${row?.from_name || 'Eventrent'} <${row?.from_email || row?.user_email || ''}>`;
    const recipient = to || row?.notify_to || row?.user_email || '';
    if (!recipient) { console.error('✗ sendMail: no recipient'); return false; }
    const info = await transporter.sendMail({ from, to: recipient, subject, html });
    console.log('✓ Email sent to', recipient, '— messageId:', info.messageId);
    return true;
  } catch (err) {
    console.error('✗ Mail send error:', err.message, err.code || '');
    transporter = null;
    return false;
  }
}

// ── Email i18n strings ──────────────────────
const EMAIL_I18N = {
  az: {
    newOrder:       'Yeni Sifariş',
    orderReceived:  'Sifarişiniz qəbul edildi',
    orderThankYou:  'Sifarişiniz üçün təşəkkür edirik! Qısa müddətdə sizinlə əlaqə saxlayacağıq.',
    orderNum:       'Sifariş №',
    fullName:       'Ad Soyad',
    phone:          'Telefon',
    email:          'Email',
    eventDate:      'Tədbir tarixi',
    location:       'Yer',
    note:           'Qeyd',
    products:       'Məhsullar',
    product:        'Məhsul',
    qty:            'Ədəd',
    statusUpdated:  'Sifariş Statusu Yeniləndi',
    statusMsg:      'Hörmətli {name}, sifarişinizin statusu yeniləndi:',
    orderDate:      'Sifariş tarixi',
    supportReply:   'Dəstək Sorğunuza Cavab',
    supportSubject: 'Mövzu',
    supportAnswer:  'Cavab',
    viewSite:       'Saytı Ziyarət Et',
    rights:         'Bütün hüquqlar qorunur',
  },
  en: {
    newOrder:       'New Order',
    orderReceived:  'Your Order Has Been Received',
    orderThankYou:  'Thank you for your order! We will contact you shortly.',
    orderNum:       'Order #',
    fullName:       'Full Name',
    phone:          'Phone',
    email:          'Email',
    eventDate:      'Event Date',
    location:       'Location',
    note:           'Note',
    products:       'Products',
    product:        'Product',
    qty:            'Qty',
    statusUpdated:  'Order Status Updated',
    statusMsg:      'Dear {name}, your order status has been updated:',
    orderDate:      'Order Date',
    supportReply:   'Reply to Your Support Ticket',
    supportSubject: 'Subject',
    supportAnswer:  'Reply',
    viewSite:       'Visit Website',
    rights:         'All rights reserved',
  },
  ru: {
    newOrder:       'Новый Заказ',
    orderReceived:  'Ваш заказ принят',
    orderThankYou:  'Спасибо за заказ! Мы свяжемся с вами в ближайшее время.',
    orderNum:       'Заказ №',
    fullName:       'Имя Фамилия',
    phone:          'Телефон',
    email:          'Email',
    eventDate:      'Дата мероприятия',
    location:       'Место',
    note:           'Примечание',
    products:       'Товары',
    product:        'Товар',
    qty:            'Кол-во',
    statusUpdated:  'Статус заказа обновлён',
    statusMsg:      'Уважаемый {name}, статус вашего заказа обновлён:',
    orderDate:      'Дата заказа',
    supportReply:   'Ответ на ваш запрос в поддержку',
    supportSubject: 'Тема',
    supportAnswer:  'Ответ',
    viewSite:       'Посетить сайт',
    rights:         'Все права защищены',
  },
  tr: {
    newOrder:       'Yeni Sipariş',
    orderReceived:  'Siparişiniz Alındı',
    orderThankYou:  'Siparişiniz için teşekkürler! En kısa sürede sizinle iletişime geçeceğiz.',
    orderNum:       'Sipariş #',
    fullName:       'Ad Soyad',
    phone:          'Telefon',
    email:          'Email',
    eventDate:      'Etkinlik Tarihi',
    location:       'Konum',
    note:           'Not',
    products:       'Ürünler',
    product:        'Ürün',
    qty:            'Adet',
    statusUpdated:  'Sipariş Durumu Güncellendi',
    statusMsg:      'Sayın {name}, siparişinizin durumu güncellendi:',
    orderDate:      'Sipariş tarihi',
    supportReply:   'Destek Talebinize Yanıt',
    supportSubject: 'Konu',
    supportAnswer:  'Yanıt',
    viewSite:       'Siteyi Ziyaret Et',
    rights:         'Tüm hakları saklıdır',
  },
};

function getLocale(lang) {
  return EMAIL_I18N[lang] || EMAIL_I18N.az;
}

function emailBase({ headerTitle, headerSub, bodyHtml, lang = 'az', appUrl }) {
  const L = getLocale(lang);
  const url = appUrl || process.env.APP_URL || 'https://eventrent.az';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${headerTitle}</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Inter',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#141414;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#e30613 0%,#b00010 100%);padding:32px 36px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size:24px;font-weight:900;letter-spacing:-0.04em;color:#fff;line-height:1">
                  <span style="color:#fff">event</span><span style="color:rgba(255,255,255,0.6)">rent</span>
                </div>
                <div style="color:rgba(255,255,255,0.5);font-size:9px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin-top:2px">AZERBAIJAN</div>
              </td>
            </tr>
            <tr><td style="padding-top:24px">
              <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.02em">${headerTitle}</div>
              ${headerSub ? `<div style="font-size:13px;color:rgba(255,255,255,0.65);margin-top:6px">${headerSub}</div>` : ''}
            </td></tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 36px;color:#e0e0e0">
          ${bodyHtml}
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 36px 28px;text-align:center">
          <a href="${url}" style="display:inline-block;background:#e30613;color:#fff;text-decoration:none;font-weight:900;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:14px 32px;border-radius:100px">${L.viewSite}</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.06);padding:20px 36px;text-align:center">
          <div style="font-size:11px;color:rgba(255,255,255,0.25)">© ${new Date().getFullYear()} eventrent — ${L.rights}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.15);margin-top:4px">${url}</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function orderEmailHtml(order, lang = 'az') {
  const L = getLocale(lang);
  const items = (JSON.parse(order.items || '[]'));
  const itemsHtml = items.length ? `
    <div style="margin-top:24px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.3);margin-bottom:12px">${L.products}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr style="background:rgba(255,255,255,0.04)">
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:rgba(255,255,255,0.4);font-weight:700;border-radius:8px 0 0 8px">${L.product}</th>
          <th style="padding:10px 14px;text-align:center;font-size:11px;color:rgba(255,255,255,0.4);font-weight:700;border-radius:0 8px 8px 0">${L.qty}</th>
        </tr>
        ${items.map(i => `<tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
          <td style="padding:10px 14px;font-size:13px;color:#e0e0e0">${i.name || i.productId || '—'}</td>
          <td style="padding:10px 14px;text-align:center;font-size:13px;font-weight:700;color:#e30613">${i.quantity}</td>
        </tr>`).join('')}
      </table>
    </div>` : '';

  const rows = [
    [L.fullName,  order.name],
    [L.phone,     order.phone],
    [L.email,     order.email || '—'],
    [L.eventDate, order.event_date || '—'],
    [L.location,  order.location || '—'],
    ...(order.note ? [[L.note, order.note]] : []),
  ];

  const bodyHtml = `
    <p style="font-size:14px;color:rgba(255,255,255,0.65);margin:0 0 24px">${L.orderThankYou}</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${rows.map(([k, v]) => `<tr>
        <td style="padding:8px 0;font-size:12px;color:rgba(255,255,255,0.35);width:140px;vertical-align:top">${k}</td>
        <td style="padding:8px 0;font-size:13px;color:#fff;font-weight:600">${v}</td>
      </tr>`).join('')}
    </table>
    ${itemsHtml}`;

  return emailBase({
    headerTitle: `${L.orderNum}${String(order.id).padStart(4,'0')}`,
    headerSub: order.created_at,
    bodyHtml,
    lang,
  });
}

function orderStatusEmailHtml(order, statusLabel, lang = 'az') {
  const L = getLocale(lang);
  const msg = L.statusMsg.replace('{name}', order.name || '');
  const bodyHtml = `
    <p style="font-size:14px;color:rgba(255,255,255,0.65);margin:0 0 24px">${msg}</p>
    <div style="background:rgba(227,6,19,0.12);border:1px solid rgba(227,6,19,0.3);border-radius:12px;padding:20px 24px;margin:0 0 24px">
      <div style="font-size:22px;font-weight:900;color:#e30613;letter-spacing:-0.02em">${statusLabel}</div>
    </div>
    <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0">${L.orderDate}: ${order.created_at}</p>`;

  return emailBase({
    headerTitle: L.statusUpdated,
    headerSub: `${L.orderNum}${String(order.id).padStart(4,'0')}`,
    bodyHtml,
    lang,
  });
}

function supportReplyEmailHtml(ticket, replyText, lang = 'az') {
  const L = getLocale(lang);
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      <tr>
        <td style="padding:8px 0;font-size:12px;color:rgba(255,255,255,0.35);width:100px">${L.supportSubject}</td>
        <td style="padding:8px 0;font-size:13px;color:#fff;font-weight:600">${ticket.subject}</td>
      </tr>
    </table>
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.3);margin-bottom:12px">${L.supportAnswer}</div>
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-left:4px solid #e30613;border-radius:10px;padding:18px 20px;font-size:14px;color:#e0e0e0;line-height:1.6">${replyText}</div>`;

  return emailBase({
    headerTitle: L.supportReply,
    bodyHtml,
    lang,
  });
}

/* ══════════════════════════════════════════
   SETUP — ilk qurulum (yalnız admin yoxdursa)
══════════════════════════════════════════ */

// Check if setup needed
app.get('/api/setup/status', (req, res) => {
  const count = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='admin' AND active=1").get();
  res.json({ needsSetup: count.c === 0 });
});

// Create first admin (only if no admin exists)
app.post('/api/setup', (req, res) => {
  const count = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='admin' AND active=1").get();
  if (count.c > 0) return res.status(403).json({ error: 'Qurulum artıq tamamlanmışdır.' });

  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password?.trim())
    return res.status(400).json({ error: 'Ad, email və şifrə mütləqdir.' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Şifrə ən az 8 simvol olmalıdır.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Düzgün email formatı daxil edin.' });

  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'Bu email artıq istifadə olunur.' });

  const bcrypt = require('bcryptjs');
  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare("INSERT INTO users (name, email, password, role, active) VALUES (?, ?, ?, 'admin', 1)")
    .run(name.trim(), email.toLowerCase().trim(), hashed);

  const user  = db.prepare('SELECT id,name,email,role,active FROM users WHERE id=?').get(result.lastInsertRowid);
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  console.log(`✓ First admin created: ${email}`);
  res.status(201).json({ token, user });
});

/* ══════════════════════════════════════════
   AUTH ROUTES
══════════════════════════════════════════ */
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Ad, email və parol tələb olunur.' });
  if (password.length < 6) return res.status(400).json({ error: 'Parol ən az 6 simvol olmalıdır.' });
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'Bu email artıq qeydiyyatdadır.' });
  const bcrypt = require('bcryptjs');
  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email.toLowerCase().trim(), hashed, 'viewer');
  const user   = db.prepare('SELECT id,name,email,role,active FROM users WHERE id=?').get(result.lastInsertRowid);
  const token  = signToken({ id: user.id, email: user.email, role: user.role });
  res.status(201).json({ token, user });
});

app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email və parol tələb olunur.' });
  const user = db.prepare('SELECT * FROM users WHERE email=? AND active=1').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Email və ya parol yanlışdır.' });
  const bcrypt = require('bcryptjs');
  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Email və ya parol yanlışdır.' });
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  const { password: _, ...safe } = user;
  res.json({ token, user: safe });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const { password: _, ...safe } = req.user;
  res.json(safe);
});

app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Ad tələb olunur.' });
  db.prepare('UPDATE users SET name=?, updated_at=datetime(\'now\') WHERE id=?').run(name.trim(), req.user.id);
  const user = db.prepare('SELECT id,name,email,role,active,created_at FROM users WHERE id=?').get(req.user.id);
  res.json(user);
});

app.post('/api/auth/change-password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Mövcud və yeni parol tələb olunur.' });
  if (new_password.length < 6) return res.status(400).json({ error: 'Yeni parol ən az 6 simvol olmalıdır.' });
  const bcrypt = require('bcryptjs');
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password)) return res.status(401).json({ error: 'Mövcud parol yanlışdır.' });
  const hashed = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password=?, updated_at=datetime(\'now\') WHERE id=?').run(hashed, req.user.id);
  res.json({ ok: true });
});

/* ══════════════════════════════════════════
   USER MANAGEMENT (admin only)
══════════════════════════════════════════ */
app.get('/api/users', authMiddleware, adminOnly, (req, res) => {
  const users = db.prepare('SELECT id,name,email,role,active,created_at,updated_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

app.post('/api/users', authMiddleware, adminOnly, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Ad, email və parol tələb olunur.' });
  if (password.length < 6) return res.status(400).json({ error: 'Parol ən az 6 simvol olmalıdır.' });
  const validRoles = ['admin', 'sales', 'viewer'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Yanlış rol.' });
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'Bu email artıq mövcuddur.' });
  const bcrypt  = require('bcryptjs');
  const hashed  = bcrypt.hashSync(password, 10);
  const result  = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email.toLowerCase().trim(), hashed, role);
  const user    = db.prepare('SELECT id,name,email,role,active,created_at FROM users WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

app.put('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
  const { name, email, role, active, password } = req.body;
  const id = Number(req.params.id);
  if (id === req.user.id && role && role !== req.user.role) return res.status(400).json({ error: 'Öz rolunuzu dəyişə bilməzsiniz.' });
  const existing = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  if (!existing) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
  let hashed = existing.password;
  if (password && password.length >= 6) {
    const bcrypt = require('bcryptjs');
    hashed = bcrypt.hashSync(password, 10);
  }
  db.prepare(`UPDATE users SET name=?,email=?,role=?,active=?,password=?,updated_at=datetime('now') WHERE id=?`)
    .run(name || existing.name, (email || existing.email).toLowerCase().trim(), role || existing.role, active !== undefined ? (active ? 1 : 0) : existing.active, hashed, id);
  const user = db.prepare('SELECT id,name,email,role,active,created_at,updated_at FROM users WHERE id=?').get(id);
  res.json(user);
});

app.delete('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Öz hesabınızı silə bilməzsiniz.' });
  const adminCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role=\'admin\' AND active=1').get();
  const target = db.prepare('SELECT role FROM users WHERE id=?').get(id);
  if (target?.role === 'admin' && adminCount.c <= 1) return res.status(400).json({ error: 'Son admini silmək olmaz.' });
  db.prepare('DELETE FROM users WHERE id=?').run(id);
  res.json({ ok: true });
});

app.patch('/api/users/:id/toggle', authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Öz hesabınızı deaktiv edə bilməzsiniz.' });
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  if (!user) return res.status(404).json({ error: 'Tapılmadı.' });
  if (user.active === 1) {
    const adminCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role=\'admin\' AND active=1').get();
    if (user.role === 'admin' && adminCount.c <= 1) return res.status(400).json({ error: 'Son aktiv admini deaktiv edə bilməzsiniz.' });
  }
  db.prepare('UPDATE users SET active=?, updated_at=datetime(\'now\') WHERE id=?').run(user.active ? 0 : 1, id);
  const updated = db.prepare('SELECT id,name,email,role,active,created_at,updated_at FROM users WHERE id=?').get(id);
  res.json(updated);
});

/* ══════════════════════════════════════════
   ORDERS (SQLite)
══════════════════════════════════════════ */
app.get('/api/orders', authMiddleware, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items || '[]') })));
});

app.post('/api/orders', (req, res) => {
  const { name, phone, email, event_date, location, note, items, source } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Ad və telefon tələb olunur.' });
  // optionally attach user_id from JWT if present
  let userId = '';
  try {
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) { const payload = verifyToken(token); if (payload?.id) userId = String(payload.id); }
  } catch {}
  const result = db.prepare(`INSERT INTO orders (name,phone,email,event_date,location,note,items,user_id,source) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(name, phone, email || '', event_date || '', location || '', note || '', JSON.stringify(items || []), userId, source || 'website');
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(result.lastInsertRowid);
  const lang = req.body.lang || req.headers['accept-language']?.slice(0,2) || 'az';
  const L = getLocale(lang);
  const mailSubject = `${L.newOrder} — ${name} | eventrent`;
  const mailHtml = orderEmailHtml(order, lang);
  // Admin notification (to notify_to)
  sendMail({ subject: mailSubject, html: mailHtml }).catch(() => {});
  // Customer confirmation (to customer email)
  if (order.email) {
    sendMail({ to: order.email, subject: `${L.orderReceived} | eventrent`, html: mailHtml }).catch(() => {});
  }
  res.status(201).json({ ...order, items: JSON.parse(order.items || '[]') });
});

app.put('/api/orders/:id', authMiddleware, (req, res) => {
  const { name, phone, email, event_date, location, note, status, items } = req.body;
  const existing = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare(`UPDATE orders SET name=?,phone=?,email=?,event_date=?,location=?,note=?,status=?,items=?,updated_at=datetime('now') WHERE id=?`)
    .run(name ?? existing.name, phone ?? existing.phone, email ?? existing.email, event_date ?? existing.event_date, location ?? existing.location, note ?? existing.note, status ?? existing.status, JSON.stringify(items ?? JSON.parse(existing.items || '[]')), req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  res.json({ ...order, items: JSON.parse(order.items || '[]') });
});

app.patch('/api/orders/:id/status', authMiddleware, async (req, res) => {
  const { status, send_email } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare('UPDATE orders SET status=?, updated_at=datetime(\'now\') WHERE id=?').run(status, req.params.id);
  const updatedOrder = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  // Send status email to customer if requested and email exists
  if (send_email && order.email) {
    const lang = req.body.lang || 'az';
    const L = getLocale(lang);
    const statusLabels = {
      az: { new:'Yeni', processing:'İcrada', quoted:'Təklif verildi', won:'Tamamlandı', lost:'Ləğv edildi', contacted:'Əlaqə saxlanıldı' },
      en: { new:'New', processing:'In Progress', quoted:'Quoted', won:'Completed', lost:'Cancelled', contacted:'Contacted' },
      ru: { new:'Новый', processing:'В обработке', quoted:'Предложение отправлено', won:'Завершён', lost:'Отменён', contacted:'Связались' },
      tr: { new:'Yeni', processing:'İşlemde', quoted:'Teklif Verildi', won:'Tamamlandı', lost:'İptal', contacted:'İletişime Geçildi' },
    };
    const statusLabel = (statusLabels[lang] || statusLabels.az)[status] || status;
    await sendMail({
      to: updatedOrder.email,
      subject: `${L.orderNum}${String(updatedOrder.id).padStart(4,'0')} — ${statusLabel}`,
      html: orderStatusEmailHtml(updatedOrder, statusLabel, lang),
    }).catch(() => {});
  }
  res.json({ ...updatedOrder, items: JSON.parse(updatedOrder.items || '[]') });
});

app.delete('/api/orders/:id', authMiddleware, (req, res) => {
  const order = db.prepare('SELECT id FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare('DELETE FROM orders WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/orders/:id/send-email', authMiddleware, async (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Tapılmadı.' });
  const lang = req.query.lang || 'az';
  const L = getLocale(lang);
  const sent = await sendMail({ subject: `${L.orderNum}${String(order.id).padStart(4,'0')} — ${order.name}`, html: orderEmailHtml(order, lang) });
  res.json({ ok: sent });
});

/* ══════════════════════════════════════════
   LEADS
══════════════════════════════════════════ */
app.get('/api/leads', authMiddleware, adminOnly, (_req, res) => {
  const rows = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  res.json(rows);
});

app.post('/api/leads', (req, res) => {
  const { name, phone, email, message } = req.body;
  if (!name) return res.status(400).json({ error: 'Ad tələb olunur.' });
  const result = db.prepare(`INSERT INTO leads (name,phone,email,message) VALUES (?,?,?,?)`)
    .run(name, phone || '', email || '', message || '');
  const lead = db.prepare('SELECT * FROM leads WHERE id=?').get(result.lastInsertRowid);
  const lang = req.body.lang || 'az';
  const L = getLocale(lang);
  const html = emailBase({
    headerTitle: L.newOrder,
    headerSub: `${name} — ${phone || email || ''}`,
    bodyHtml: `<p style="color:rgba(255,255,255,0.65);font-size:14px"><b style="color:#fff">${name}</b>${phone ? `<br>📞 ${phone}` : ''}${email ? `<br>✉️ ${email}` : ''}${message ? `<br><br>${message}` : ''}</p>`,
    lang,
  });
  sendMail({ subject: `Yeni Müraciət — ${name} | eventrent`, html }).catch(() => {});
  res.status(201).json(lead);
});

app.patch('/api/leads/:id/status', authMiddleware, adminOnly, (req, res) => {
  const { status } = req.body;
  const existing = db.prepare('SELECT * FROM leads WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare(`UPDATE leads SET status=?, updated_at=datetime('now') WHERE id=?`).run(status, req.params.id);
  const lead = db.prepare('SELECT * FROM leads WHERE id=?').get(req.params.id);
  res.json(lead);
});

app.delete('/api/leads/:id', authMiddleware, adminOnly, (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id=?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare('DELETE FROM leads WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ══════════════════════════════════════════
   REELS / PORTFOLIO
══════════════════════════════════════════ */
app.get('/api/reels', (_req, res) => {
  const rows = db.prepare('SELECT * FROM reels ORDER BY sort_order ASC, created_at DESC').all();
  res.json(rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]'), active: !!r.active })));
});

app.post('/api/reels', authMiddleware, adminOnly, (req, res) => {
  const { title, client, date_label, location, category, tags, media_type, media_url, poster_url, sort_order } = req.body;
  if (!title || !media_url) return res.status(400).json({ error: 'title və media_url mütləqdir.' });
  const id = 'reel_' + Date.now();
  db.prepare(`INSERT INTO reels (id,title,client,date_label,location,category,tags,media_type,media_url,poster_url,sort_order)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, title, client||'', date_label||'', location||'', category||'', JSON.stringify(tags||[]), media_type||'video', media_url, poster_url||'', sort_order||0);
  const reel = db.prepare('SELECT * FROM reels WHERE id=?').get(id);
  res.status(201).json({ ...reel, tags: JSON.parse(reel.tags), active: !!reel.active });
});

app.put('/api/reels/:id', authMiddleware, adminOnly, (req, res) => {
  const { title, client, date_label, location, category, tags, media_type, media_url, poster_url, sort_order, active } = req.body;
  const existing = db.prepare('SELECT * FROM reels WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare(`UPDATE reels SET title=?,client=?,date_label=?,location=?,category=?,tags=?,media_type=?,media_url=?,poster_url=?,sort_order=?,active=?,updated_at=datetime('now') WHERE id=?`)
    .run(title, client||'', date_label||'', location||'', category||'', JSON.stringify(tags||[]), media_type||'video', media_url, poster_url||'', sort_order??0, active===false?0:1, req.params.id);
  const reel = db.prepare('SELECT * FROM reels WHERE id=?').get(req.params.id);
  res.json({ ...reel, tags: JSON.parse(reel.tags), active: !!reel.active });
});

app.delete('/api/reels/:id', authMiddleware, adminOnly, (req, res) => {
  const existing = db.prepare('SELECT * FROM reels WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare('DELETE FROM reels WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ══════════════════════════════════════════
   SPEC TEMPLATES
══════════════════════════════════════════ */
app.get('/api/spec-templates', (_req, res) => {
  const rows = db.prepare('SELECT * FROM spec_templates ORDER BY sort_order ASC, created_at ASC').all();
  res.json(rows.map(r => ({ ...r, options: JSON.parse(r.options || '[]') })));
});

app.post('/api/spec-templates', authMiddleware, adminOnly, (req, res) => {
  const { name, unit = '', category = '', description = '', field_type = 'text', options = [], sort_order = 0 } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Ad tələb olunur.' });
  const existing = db.prepare('SELECT id FROM spec_templates WHERE name=?').get(name.trim());
  if (existing) return res.status(409).json({ error: 'Bu adda metrik artıq mövcuddur.' });
  const id = 'st_' + Date.now();
  db.prepare('INSERT INTO spec_templates (id,name,unit,category,description,field_type,options,sort_order) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, name.trim(), unit.trim(), category.trim(), description.trim(), field_type, JSON.stringify(options), sort_order);
  const row = db.prepare('SELECT * FROM spec_templates WHERE id=?').get(id);
  res.json({ ...row, options: JSON.parse(row.options || '[]') });
});

app.put('/api/spec-templates/:id', authMiddleware, adminOnly, (req, res) => {
  const existing = db.prepare('SELECT * FROM spec_templates WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tapılmadı.' });
  const { name, unit = '', category = '', description = '', field_type = 'text', options = [], sort_order = 0 } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Ad tələb olunur.' });
  db.prepare('UPDATE spec_templates SET name=?,unit=?,category=?,description=?,field_type=?,options=?,sort_order=? WHERE id=?')
    .run(name.trim(), unit.trim(), category.trim(), description.trim(), field_type, JSON.stringify(options), sort_order, req.params.id);
  const row = db.prepare('SELECT * FROM spec_templates WHERE id=?').get(req.params.id);
  res.json({ ...row, options: JSON.parse(row.options || '[]') });
});

app.delete('/api/spec-templates/:id', authMiddleware, adminOnly, (req, res) => {
  const existing = db.prepare('SELECT * FROM spec_templates WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare('DELETE FROM spec_templates WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ══════════════════════════════════════════
   SMTP CONFIG
══════════════════════════════════════════ */
app.get('/api/smtp', authMiddleware, adminOnly, (_req, res) => {
  const row = db.prepare('SELECT * FROM smtp_config WHERE id=1').get();
  res.json({ ...row, password: row?.password ? '••••••••' : '', secure: !!(row?.secure) });
});

app.put('/api/smtp', authMiddleware, adminOnly, async (req, res) => {
  const { host, port, secure, user_email, password, from_name, from_email, notify_to } = req.body;
  const existing = db.prepare('SELECT password FROM smtp_config WHERE id=1').get();
  const realPass = (password && password !== '••••••••') ? password : (existing?.password || '');
  db.prepare(`INSERT INTO smtp_config (id,host,port,secure,user_email,password,from_name,from_email,notify_to,updated_at) VALUES (1,?,?,?,?,?,?,?,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET host=?,port=?,secure=?,user_email=?,password=?,from_name=?,from_email=?,notify_to=?,updated_at=datetime('now')`)
    .run(host, Number(port)||587, secure?1:0, user_email, realPass, from_name, from_email, notify_to, host, Number(port)||587, secure?1:0, user_email, realPass, from_name, from_email, notify_to);
  transporter = null;
  const ok = await buildTransporter({ host, port: Number(port)||587, secure: !!secure, user_email, password: realPass, from_name, from_email, notify_to });
  res.json({ ok, connected: ok });
});

app.post('/api/smtp/test', authMiddleware, adminOnly, async (req, res) => {
  const { to } = req.body;
  const lang = req.body.lang || 'az';
  const testHtml = emailBase({ headerTitle: 'SMTP Test ✓', headerSub: 'Bu test emailidir · This is a test email', bodyHtml: '<p style="color:rgba(255,255,255,0.65);font-size:14px">SMTP konfiqurasiyası uğurla yoxlandı. <br>SMTP configuration verified successfully.</p>', lang });
  const sent = await sendMail({ to, subject: 'eventrent — SMTP Test ✓', html: testHtml });
  res.json({ ok: sent });
});

/* ══════════════════════════════════════════
   PRODUCTS API
══════════════════════════════════════════ */
function parseProduct(p) {
  if (!p) return null;
  return {
    ...p,
    technicalSpecs:   JSON.parse(p.technical_specs  || '{}'),
    images:           JSON.parse(p.images            || '[]'),
    tags:             JSON.parse(p.tags              || '[]'),
    relatedProducts:  JSON.parse(p.related_products  || '[]'),
  };
}

app.get('/api/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY sort_order ASC, created_at ASC').all();
  res.json(rows.map(parseProduct));
});

app.get('/api/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Tapılmadı.' });
  res.json(parseProduct(row));
});

app.post('/api/products', authMiddleware, adminOnly, (req, res) => {
  const { name, category, description, technicalSpecs, images, tags, relatedProducts, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Ad tələb olunur.' });
  const id = 'prod-' + Date.now();
  db.prepare(`INSERT INTO products (id,name,category,description,technical_specs,images,tags,related_products,sort_order) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(id, name, category||'', description||'', JSON.stringify(technicalSpecs||{}), JSON.stringify(images||[]), JSON.stringify(tags||[]), JSON.stringify(relatedProducts||[]), sort_order||0);
  res.status(201).json(parseProduct(db.prepare('SELECT * FROM products WHERE id=?').get(id)));
});

app.put('/api/products/:id', authMiddleware, adminOnly, (req, res) => {
  const { name, category, description, technicalSpecs, images, tags, relatedProducts, sort_order, active } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare(`UPDATE products SET name=?,category=?,description=?,technical_specs=?,images=?,tags=?,related_products=?,sort_order=?,active=?,updated_at=datetime('now') WHERE id=?`)
    .run(name??existing.name, category??existing.category, description??existing.description,
      JSON.stringify(technicalSpecs??JSON.parse(existing.technical_specs||'{}')),
      JSON.stringify(images??JSON.parse(existing.images||'[]')),
      JSON.stringify(tags??JSON.parse(existing.tags||'[]')),
      JSON.stringify(relatedProducts??JSON.parse(existing.related_products||'[]')),
      sort_order??existing.sort_order, active??existing.active, req.params.id);
  res.json(parseProduct(db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id)));
});

app.delete('/api/products/:id', authMiddleware, adminOnly, (req, res) => {
  const product = db.prepare('SELECT id FROM products WHERE id=?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ══════════════════════════════════════════
   SUPPORT TICKETS API
══════════════════════════════════════════ */
app.get('/api/support', authMiddleware, adminOnly, (req, res) => {
  const rows = db.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC').all();
  res.json(rows);
});

app.get('/api/support/my', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM support_tickets WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});

app.post('/api/support', authMiddleware, (req, res) => {
  const { subject, message, priority } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Mövzu və mesaj tələb olunur.' });
  const result = db.prepare('INSERT INTO support_tickets (user_id,user_name,user_email,subject,message,priority) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, req.user.name, req.user.email, subject, message, priority||'normal');
  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json(ticket);
});

app.post('/api/support/guest', (req, res) => {
  const { subject, message, user_name, user_email, priority } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Mövzu və mesaj tələb olunur.' });
  const result = db.prepare('INSERT INTO support_tickets (user_id,user_name,user_email,subject,message,priority) VALUES (?,?,?,?,?,?)')
    .run(0, user_name||'', user_email||'', subject, message, priority||'normal');
  res.status(201).json(db.prepare('SELECT * FROM support_tickets WHERE id=?').get(result.lastInsertRowid));
});

app.put('/api/support/:id/reply', authMiddleware, adminOnly, (req, res) => {
  const { reply, status } = req.body;
  if (!reply) return res.status(400).json({ error: 'Cavab tələb olunur.' });
  db.prepare(`UPDATE support_tickets SET reply=?,status=?,replied_at=datetime('now'),updated_at=datetime('now') WHERE id=?`)
    .run(reply, status||'answered', req.params.id);
  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id=?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Tapılmadı.' });
  // send email if user has email
  if (ticket.user_email) {
    const lang = req.body.lang || 'az';
    const L = getLocale(lang);
    sendMail({
      to: ticket.user_email,
      subject: `${L.supportReply}: ${ticket.subject}`,
      html: supportReplyEmailHtml(ticket, reply, lang),
    }).catch(() => {});
  }
  res.json(ticket);
});

app.patch('/api/support/:id/status', authMiddleware, adminOnly, (req, res) => {
  const { status } = req.body;
  const ticket = db.prepare('SELECT id FROM support_tickets WHERE id=?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare(`UPDATE support_tickets SET status=?,updated_at=datetime('now') WHERE id=?`).run(status, req.params.id);
  res.json(db.prepare('SELECT * FROM support_tickets WHERE id=?').get(req.params.id));
});

app.delete('/api/support/:id', authMiddleware, adminOnly, (req, res) => {
  db.prepare('DELETE FROM support_tickets WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ══════════════════════════════════════════
   TEAMBUILDING API
══════════════════════════════════════════ */
// Games
app.get('/api/tb/games', (req, res) => {
  const rows = db.prepare('SELECT * FROM tb_games ORDER BY sort_order ASC, created_at ASC').all();
  res.json(rows);
});
app.post('/api/tb/games', authMiddleware, adminOnly, (req, res) => {
  const { name, category, image, description, details, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Ad tələb olunur.' });
  const id = 'game-' + Date.now();
  db.prepare('INSERT INTO tb_games (id,name,category,image,description,details,sort_order) VALUES (?,?,?,?,?,?,?)')
    .run(id, name, category || 'Indoor', image || '', description || '', details || '', sort_order || 0);
  res.json(db.prepare('SELECT * FROM tb_games WHERE id=?').get(id));
});
app.put('/api/tb/games/:id', authMiddleware, adminOnly, (req, res) => {
  const existing = db.prepare('SELECT id FROM tb_games WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tapılmadı.' });
  const { name, category, image, description, details, sort_order, active } = req.body;
  db.prepare('UPDATE tb_games SET name=?,category=?,image=?,description=?,details=?,sort_order=?,active=? WHERE id=?')
    .run(name, category, image || '', description || '', details || '', sort_order ?? 0, active ?? 1, req.params.id);
  res.json(db.prepare('SELECT * FROM tb_games WHERE id=?').get(req.params.id));
});
app.delete('/api/tb/games/:id', authMiddleware, adminOnly, (req, res) => {
  const existing = db.prepare('SELECT id FROM tb_games WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare('DELETE FROM tb_games WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// Concepts
app.get('/api/tb/concepts', (req, res) => {
  const rows = db.prepare('SELECT * FROM tb_concepts ORDER BY sort_order ASC, created_at ASC').all();
  res.json(rows);
});
app.post('/api/tb/concepts', authMiddleware, adminOnly, (req, res) => {
  const { name, image, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Ad tələb olunur.' });
  const id = 'concept-' + Date.now();
  db.prepare('INSERT INTO tb_concepts (id,name,image,sort_order) VALUES (?,?,?,?)').run(id, name, image || '', sort_order || 0);
  res.json(db.prepare('SELECT * FROM tb_concepts WHERE id=?').get(id));
});
app.put('/api/tb/concepts/:id', authMiddleware, adminOnly, (req, res) => {
  const existing = db.prepare('SELECT id FROM tb_concepts WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tapılmadı.' });
  const { name, image, sort_order, active } = req.body;
  db.prepare('UPDATE tb_concepts SET name=?,image=?,sort_order=?,active=? WHERE id=?')
    .run(name, image || '', sort_order ?? 0, active ?? 1, req.params.id);
  res.json(db.prepare('SELECT * FROM tb_concepts WHERE id=?').get(req.params.id));
});
app.delete('/api/tb/concepts/:id', authMiddleware, adminOnly, (req, res) => {
  db.prepare('DELETE FROM tb_concepts WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ══════════════════════════════════════════
   MEDIA UPLOAD
══════════════════════════════════════════ */
const UPLOAD_DIR = path.resolve('uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

app.post('/api/media/upload', authMiddleware, async (req, res) => {
  try {
    const multer = require('multer');
    const storage = multer.diskStorage({
      destination: UPLOAD_DIR,
      filename: (_req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase();
        const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
        cb(null, `${name}-${Date.now()}${ext}`);
      },
    });
    const upload = multer({
      storage,
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
      },
    }).single('file');

    await new Promise((resolve, reject) => upload(req, res, err => err ? reject(err) : resolve(null)));
    if (!req.file) return res.status(400).json({ error: 'Fayl yüklənmədi.' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ ok: true, url, filename: req.file.filename, size: req.file.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/media', authMiddleware, async (_req, res) => {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const items = await Promise.all(
      files.filter(f => /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(f)).map(async f => {
        const stat = await fs.stat(path.join(UPLOAD_DIR, f));
        return { filename: f, url: `/uploads/${f}`, size: stat.size, created_at: stat.birthtime };
      })
    );
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(items);
  } catch { res.json([]); }
});

app.delete('/api/media/:filename', authMiddleware, adminOnly, async (req, res) => {
  try {
    const file = path.join(UPLOAD_DIR, path.basename(req.params.filename));
    if (existsSync(file)) await fs.unlink(file);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ══════════════════════════════════════════
   STATS / DASHBOARD API
══════════════════════════════════════════ */
app.get('/api/stats', authMiddleware, adminOnly, (req, res) => {
  // KPI totals
  const totalOrders  = db.prepare('SELECT COUNT(*) as n FROM orders').get().n;
  const totalLeads   = db.prepare('SELECT COUNT(*) as n FROM leads').get().n;
  const totalTickets = db.prepare('SELECT COUNT(*) as n FROM support_tickets').get().n;
  const totalProducts = db.prepare('SELECT COUNT(*) as n FROM products WHERE active=1').get().n;
  const newOrders    = db.prepare("SELECT COUNT(*) as n FROM orders WHERE status='new'").get().n;
  const newLeads     = db.prepare("SELECT COUNT(*) as n FROM leads WHERE status='new'").get().n;
  const openTickets  = db.prepare("SELECT COUNT(*) as n FROM support_tickets WHERE status='open'").get().n;
  const wonOrders    = db.prepare("SELECT COUNT(*) as n FROM orders WHERE status='won'").get().n;

  // Orders by status
  const ordersByStatus = db.prepare("SELECT status, COUNT(*) as count FROM orders GROUP BY status").all();

  // Leads by status
  const leadsByStatus  = db.prepare("SELECT status, COUNT(*) as count FROM leads GROUP BY status").all();

  // Orders last 30 days (by day)
  const ordersOverTime = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count
    FROM orders
    WHERE created_at >= date('now', '-30 days')
    GROUP BY day ORDER BY day ASC
  `).all();

  // Leads last 30 days (by day)
  const leadsOverTime = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count
    FROM leads
    WHERE created_at >= date('now', '-30 days')
    GROUP BY day ORDER BY day ASC
  `).all();

  // Tickets by priority
  const ticketsByPriority = db.prepare("SELECT priority, COUNT(*) as count FROM support_tickets GROUP BY priority").all();

  // Tickets by status
  const ticketsByStatus = db.prepare("SELECT status, COUNT(*) as count FROM support_tickets GROUP BY status").all();

  // Products by category
  const productsByCategory = db.prepare("SELECT category, COUNT(*) as count FROM products WHERE active=1 GROUP BY category ORDER BY count DESC").all();

  // Top ordered products (parse items JSON)
  const allOrders = db.prepare("SELECT items FROM orders WHERE items != '[]'").all();
  const productFreq = {};
  allOrders.forEach(o => {
    try {
      const items = JSON.parse(o.items || '[]');
      items.forEach(item => {
        const name = item.name || item.productId || 'Unknown';
        productFreq[name] = (productFreq[name] || 0) + (item.quantity || 1);
      });
    } catch {}
  });
  const topProducts = Object.entries(productFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Orders by source
  const ordersBySource = db.prepare("SELECT source, COUNT(*) as count FROM orders GROUP BY source").all();

  // Revenue placeholder (orders won count)
  const conversionRate = totalOrders > 0 ? Math.round((wonOrders / totalOrders) * 100) : 0;

  res.json({
    kpi: { totalOrders, totalLeads, totalTickets, totalProducts, newOrders, newLeads, openTickets, wonOrders, conversionRate },
    ordersByStatus,
    leadsByStatus,
    ordersOverTime,
    leadsOverTime,
    ticketsByPriority,
    ticketsByStatus,
    productsByCategory,
    topProducts,
    ordersBySource,
  });
});

/* ══════════════════════════════════════════
   CONTENT API (JSON file)
══════════════════════════════════════════ */
async function ensureContentFile() {
  const dir = path.dirname(CONTENT_FILE_PATH);
  if (!existsSync(dir)) await fs.mkdir(dir, { recursive: true });
  if (!existsSync(CONTENT_FILE_PATH)) await fs.writeFile(CONTENT_FILE_PATH, '{}\n', 'utf8');
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, smtp: !!transporter });
});

app.get('/api/content', async (_req, res) => {
  try {
    await ensureContentFile();
    res.type('application/json').send(await fs.readFile(CONTENT_FILE_PATH, 'utf8'));
  } catch { res.status(500).json({ error: 'Content could not be loaded.' }); }
});

const BACKUP_DIR = path.resolve('data/content-backups');

async function backupContent() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    if (!existsSync(CONTENT_FILE_PATH)) return;
    const current = await fs.readFile(CONTENT_FILE_PATH, 'utf8');
    if (current.trim() === '{}' || current.trim() === '') return;
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(BACKUP_DIR, `site-content_${ts}.json`);
    await fs.writeFile(backupPath, current, 'utf8');
    // Keep only last 20 backups
    const files = (await fs.readdir(BACKUP_DIR))
      .filter(f => f.startsWith('site-content_') && f.endsWith('.json'))
      .sort();
    if (files.length > 20) {
      const toDelete = files.slice(0, files.length - 20);
      for (const f of toDelete) await fs.unlink(path.join(BACKUP_DIR, f)).catch(() => {});
    }
    return backupPath;
  } catch (e) { console.error('Backup failed:', e.message); }
}

app.put('/api/content', authMiddleware, adminOnly, async (req, res) => {
  try {
    await ensureContentFile();
    const backup = await backupContent();
    await fs.writeFile(CONTENT_FILE_PATH, JSON.stringify(req.body ?? {}, null, 2), 'utf8');
    res.json({ ok: true, backup: backup ? path.basename(backup) : null });
  } catch { res.status(500).json({ error: 'Content could not be saved.' }); }
});

app.post('/api/content', authMiddleware, adminOnly, async (req, res) => {
  try {
    await ensureContentFile();
    await backupContent();
    await fs.writeFile(CONTENT_FILE_PATH, JSON.stringify(req.body ?? {}, null, 2), 'utf8');
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Content could not be saved.' }); }
});

app.get('/api/content/backups', authMiddleware, adminOnly, async (_req, res) => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const files = (await fs.readdir(BACKUP_DIR))
      .filter(f => f.startsWith('site-content_') && f.endsWith('.json'))
      .sort().reverse();
    const items = await Promise.all(files.map(async f => {
      const stat = await fs.stat(path.join(BACKUP_DIR, f));
      return { filename: f, size: stat.size, created_at: stat.mtime.toISOString() };
    }));
    res.json(items);
  } catch { res.json([]); }
});

app.post('/api/content/restore/:filename', authMiddleware, adminOnly, async (req, res) => {
  try {
    const file = path.basename(req.params.filename);
    if (!file.startsWith('site-content_') || !file.endsWith('.json')) return res.status(400).json({ error: 'Yanlış fayl adı.' });
    const backupPath = path.join(BACKUP_DIR, file);
    if (!existsSync(backupPath)) return res.status(404).json({ error: 'Backup tapılmadı.' });
    await backupContent(); // backup current before restore
    const data = await fs.readFile(backupPath, 'utf8');
    await fs.writeFile(CONTENT_FILE_PATH, data, 'utf8');
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Bərpa alınmadı.' }); }
});

/* ══════════════════════════════════════════
   WHATSAPP (Baileys) + OTP
══════════════════════════════════════════ */
let waSocket = null;
let waQr = null;
let waStatus = 'disconnected'; // disconnected | qr | connecting | connected
const OTP_STORE = new Map(); // phone -> { code, expires, attempts }

async function startWhatsApp() {
  try {
    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = await import('@whiskeysockets/baileys');
    const pino = (await import('pino')).default;

    const sessionDir = path.resolve('data/wa_session');
    if (!existsSync(sessionDir)) mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    waSocket = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['EventRent', 'Chrome', '120.0.0'],
    });

    waSocket.ev.on('creds.update', saveCreds);

    waSocket.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        waQr = qr;
        waStatus = 'qr';
        console.log('📱 WhatsApp QR hazır — Admin paneldən skan edin');
      }
      if (connection === 'open') {
        waQr = null;
        waStatus = 'connected';
        console.log('✅ WhatsApp qoşuldu');
      }
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = code !== DisconnectReason.loggedOut;
        waStatus = 'disconnected';
        waQr = null;
        console.log('WhatsApp bağlantı kəsildi, kod:', code);
        if (shouldReconnect) {
          setTimeout(startWhatsApp, 5000);
        }
      }
    });
  } catch (err) {
    console.error('WhatsApp başlatıla bilmədi:', err.message);
  }
}

async function sendWhatsApp(phone, message) {
  if (!waSocket || waStatus !== 'connected') throw new Error('WhatsApp qoşulu deyil');
  const jid = phone.replace(/\D/g, '') + '@s.whatsapp.net';
  await waSocket.sendMessage(jid, { text: message });
  // Log to DB
  db.prepare(`INSERT INTO wa_logs (phone, message, direction) VALUES (?,?,'out')`).run(phone, message);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// WhatsApp status + QR
app.get('/api/wa/status', authMiddleware, adminOnly, (_req, res) => {
  res.json({ status: waStatus, qr: waQr });
});

app.post('/api/wa/reconnect', authMiddleware, adminOnly, async (_req, res) => {
  waStatus = 'connecting';
  startWhatsApp().catch(() => {});
  res.json({ ok: true });
});

app.post('/api/wa/disconnect', authMiddleware, adminOnly, async (_req, res) => {
  try {
    if (waSocket) { await waSocket.logout(); waSocket = null; }
    waStatus = 'disconnected'; waQr = null;
  } catch {}
  res.json({ ok: true });
});

app.post('/api/wa/send', authMiddleware, adminOnly, async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone və message lazımdır.' });
  try {
    await sendWhatsApp(phone, message);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/wa/logs', authMiddleware, adminOnly, (_req, res) => {
  const logs = db.prepare('SELECT * FROM wa_logs ORDER BY created_at DESC LIMIT 200').all();
  res.json(logs);
});

app.delete('/api/wa/logs', authMiddleware, adminOnly, (_req, res) => {
  db.prepare('DELETE FROM wa_logs').run();
  res.json({ ok: true });
});

// OTP: göndər
app.post('/api/otp/send', otpLimiter, async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Telefon nömrəsi lazımdır.' });
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 7) return res.status(400).json({ error: 'Düzgün telefon nömrəsi daxil edin.' });

  const code = generateOtp();
  OTP_STORE.set(clean, { code, expires: Date.now() + 5 * 60 * 1000, attempts: 0 });

  const msg = `🔐 EventRent\n\nTəsdiq kodunuz: *${code}*\n\nBu kod 5 dəqiqə ərzində etibarlıdır.`;

  if (waStatus === 'connected') {
    try {
      await sendWhatsApp(clean, msg);
      res.json({ ok: true, via: 'whatsapp' });
    } catch (err) {
      // Fallback: dev mode - return code
      console.log(`OTP [${clean}]: ${code}`);
      res.json({ ok: true, via: 'fallback', _dev_code: process.env.NODE_ENV !== 'production' ? code : undefined });
    }
  } else {
    // WhatsApp qoşulu deyilsə dev mode
    console.log(`OTP [${clean}]: ${code}`);
    res.json({ ok: true, via: 'fallback', _dev_code: process.env.NODE_ENV !== 'production' ? code : undefined });
  }
});

// OTP: yoxla
app.post('/api/otp/verify', (req, res) => {
  const { phone, code } = req.body;
  const clean = phone?.replace(/\D/g, '');
  const entry = OTP_STORE.get(clean);

  if (!entry) return res.status(400).json({ error: 'OTP tapılmadı. Yenidən göndərin.' });
  if (Date.now() > entry.expires) { OTP_STORE.delete(clean); return res.status(400).json({ error: 'OTP müddəti bitib.' }); }
  if (entry.attempts >= 5) { OTP_STORE.delete(clean); return res.status(400).json({ error: 'Çox sayda yanlış giriş. Yenidən göndərin.' }); }
  if (entry.code !== String(code).trim()) {
    entry.attempts++;
    return res.status(400).json({ error: 'Yanlış kod. Cəhd sayı: ' + entry.attempts });
  }

  OTP_STORE.delete(clean);
  res.json({ ok: true });
});

/* ══════════════════════════════════════════
   TB APPLICATIONS (Teambuilding başvuruları)
══════════════════════════════════════════ */
app.get('/api/tb/applications', authMiddleware, adminOnly, (_req, res) => {
  const rows = db.prepare('SELECT * FROM tb_applications ORDER BY created_at DESC').all();
  res.json(rows.map(r => ({ ...r, extra: JSON.parse(r.extra || '{}') })));
});

app.post('/api/tb/applications', async (req, res) => {
  const { name, phone, company, game_id, game_name, concept_id, concept_name, location, participants, date } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Ad və telefon mütləqdir.' });

  const id = 'tba_' + Date.now();
  
  // Avtomatik sifariş nömrəsi (#TB-100X)
  const count = db.prepare("SELECT COUNT(*) as c FROM tb_applications").get().c;
  const order_no = 'TB-' + (1000 + count + 1);

  const extra = JSON.stringify({ location, participants, date, concept_id, concept_name });
  db.prepare(`INSERT INTO tb_applications (id,order_no,name,phone,company,game_id,game_name,extra,status) VALUES (?,?,?,?,?,?,?,?,'new')`)
    .run(id, order_no, name, phone, company || '', game_id || '', game_name || '', extra);

  const app_row = db.prepare('SELECT * FROM tb_applications WHERE id=?').get(id);

  // WA mesajı müştəriyə
  const siteUrl = process.env.SITE_URL || 'http://localhost:5050';
  const clientMsg = `✅ *EventRent — Müraciətiniz qəbul edildi!*\n\nSifariş Nömrəsi: ${order_no}\nAd: ${name}\nŞirkət: ${company || '—'}\nOyun: ${game_name || '—'}\nMəkan: ${location || '—'}\nTarix: ${date || '—'}\nİştirakçı: ${participants || '—'}\n\n🔗 Sifarişi izləyin: ${siteUrl}/track/${order_no.replace('#', '')}\n\n📞 Tezliklə sizinlə əlaqə saxlayacağıq.`;

  // WA mesajı sahibəyə
  const ownerPhone = process.env.OWNER_WA_PHONE || '';
  const ownerMsg = `🔔 *Yeni Teambuilding Başvurusu (${order_no})!*\n\nAd: ${name}\nTelefon: ${phone}\nŞirkət: ${company || '—'}\nOyun: ${game_name || '—'}\nKonsepsiya: ${concept_name || '—'}\nMəkan: ${location || '—'}\nTarix: ${date || '—'}\nİştirakçı: ${participants || '—'}`;

  if (waStatus === 'connected') {
    sendWhatsApp(phone.replace(/\D/g, ''), clientMsg).catch(() => {});
    if (ownerPhone) sendWhatsApp(ownerPhone.replace(/\D/g, ''), ownerMsg).catch(() => {});
  }

  res.status(201).json({ ok: true, id, app: { ...app_row, extra: JSON.parse(app_row.extra) } });
});

app.patch('/api/tb/applications/:id/status', authMiddleware, adminOnly, (req, res) => {
  const { status } = req.body;
  const VALID = ['new', 'in_progress', 'done', 'cancelled'];
  if (!status || !VALID.includes(status)) return res.status(400).json({ error: 'Yanlış status.' });
  const exists = db.prepare('SELECT id FROM tb_applications WHERE id=?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare(`UPDATE tb_applications SET status=?, updated_at=datetime('now') WHERE id=?`).run(status, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/tb/applications/:id', authMiddleware, adminOnly, (req, res) => {
  const exists = db.prepare('SELECT id FROM tb_applications WHERE id=?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare('DELETE FROM tb_applications WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// Public tracking endpoint
app.get('/api/tb/track/:order_no', (req, res) => {
  const row = db.prepare('SELECT id,order_no,name,game_name,status,created_at FROM tb_applications WHERE order_no=?').get(req.params.order_no);
  if (!row) return res.status(404).json({ error: 'Sifariş tapılmadı.' });
  res.json({ ...row });
});

/* ══════════════════════════════════════════
   Catering Packages
══════════════════════════════════════════ */

// Public — list active packages
app.get('/api/catering/packages', (req, res) => {
  const rows = db.prepare(`SELECT * FROM catering_packages WHERE active=1 ORDER BY sort_order ASC, id ASC`).all();
  res.json(rows.map(r => ({ ...r, features: JSON.parse(r.features || '[]') })));
});

// Admin — list all packages
app.get('/api/catering/packages/all', authMiddleware, adminOnly, (req, res) => {
  const rows = db.prepare(`SELECT * FROM catering_packages ORDER BY sort_order ASC, id ASC`).all();
  res.json(rows.map(r => ({ ...r, features: JSON.parse(r.features || '[]') })));
});

// Admin — create
app.post('/api/catering/packages', authMiddleware, adminOnly, (req, res) => {
  const { name, description, price, price_note, features, badge, badge_color, image_url, is_popular, active, sort_order } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Ad mütləqdir.' });
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO catering_packages (name, description, price, price_note, features, badge, badge_color, image_url, is_popular, active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description||'', price||'', price_note||'', JSON.stringify(features||[]), badge||'', badge_color||'orange', image_url||'', is_popular?1:0, active!==false?1:0, sort_order||0);
  const row = db.prepare('SELECT * FROM catering_packages WHERE id=?').get(lastInsertRowid);
  res.status(201).json({ ...row, features: JSON.parse(row.features) });
});

// Admin — update
app.put('/api/catering/packages/:id', authMiddleware, adminOnly, (req, res) => {
  const exists = db.prepare('SELECT id FROM catering_packages WHERE id=?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Tapılmadı.' });
  const { name, description, price, price_note, features, badge, badge_color, image_url, is_popular, active, sort_order } = req.body;
  db.prepare(`
    UPDATE catering_packages SET name=?, description=?, price=?, price_note=?, features=?, badge=?, badge_color=?, image_url=?, is_popular=?, active=?, sort_order=?, updated_at=datetime('now') WHERE id=?
  `).run(name, description||'', price||'', price_note||'', JSON.stringify(features||[]), badge||'', badge_color||'orange', image_url||'', is_popular?1:0, active!==false?1:0, sort_order||0, req.params.id);
  const row = db.prepare('SELECT * FROM catering_packages WHERE id=?').get(req.params.id);
  res.json({ ...row, features: JSON.parse(row.features) });
});

// Admin — delete
app.delete('/api/catering/packages/:id', authMiddleware, adminOnly, (req, res) => {
  const exists = db.prepare('SELECT id FROM catering_packages WHERE id=?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare('DELETE FROM catering_packages WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// Public — catering order (ayrıca catering_orders cədvəlinə)
app.post('/api/catering/orders', async (req, res) => {
  const { name, phone, email, guests, package_name, location, date, time_range, format, menu_note } = req.body;
  if (!name?.trim() || !phone?.trim()) return res.status(400).json({ error: 'Ad və telefon mütləqdir.' });
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO catering_orders (name, phone, email, guests, location, date, time_range, format, menu_note, package_name, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
  `).run(name, phone, email||'', guests||'', location||'', date||'', time_range||'', format||'', menu_note||'', package_name||'Fərdi Sifariş');
  const ownerPhone = process.env.OWNER_WA_PHONE;
  const siteUrl = process.env.SITE_URL || 'http://localhost:5050';
  if (waSocket) {
    const ownerMsg = `🍽️ *Yeni Ketrinq Sifarişi! #${lastInsertRowid}*\n\n👤 Ad: ${name}\n📞 Tel: ${phone}\n📧 Email: ${email||'—'}\n👥 Qonaq: ${guests||'—'}\n📦 Paket: ${package_name||'—'}\n📍 Məkan: ${location||'—'}\n📅 Tarix: ${date||'—'}\n⏰ Saat: ${time_range||'—'}\n🎉 Format: ${format||'—'}\n📝 Qeyd: ${menu_note||'—'}\n\n🔗 ${siteUrl}/admin`;
    if (ownerPhone) sendWhatsApp(ownerPhone.replace(/\D/g,''), ownerMsg).catch(()=>{});
    if (phone) {
      const clientMsg = `✅ *EventRent — Ketrinq Sifarişiniz qəbul edildi!*\n\n🍽️ Paket: ${package_name||'Fərdi Sifariş'}\n📍 Məkan: ${location||'—'}\n📅 Tarix: ${date||'—'}\n👥 Qonaq: ${guests||'—'}\n\n📞 Tezliklə sizinlə əlaqə saxlayacağıq.\n\nEventRent.az`;
      sendWhatsApp(phone.replace(/\D/g,''), clientMsg).catch(()=>{});
    }
  }
  res.status(201).json({ ok: true, id: lastInsertRowid });
});

// Admin — get all catering orders
app.get('/api/catering/orders', authMiddleware, (req, res) => {
  const rows = db.prepare(`SELECT * FROM catering_orders ORDER BY id DESC`).all();
  res.json(rows);
});

// Admin — update catering order status
app.patch('/api/catering/orders/:id/status', authMiddleware, adminOnly, (req, res) => {
  const { status } = req.body;
  const VALID = ['new', 'in_progress', 'done', 'cancelled'];
  if (!VALID.includes(status)) return res.status(400).json({ error: 'Yanlış status.' });
  const exists = db.prepare('SELECT id FROM catering_orders WHERE id=?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare(`UPDATE catering_orders SET status=?, updated_at=datetime('now') WHERE id=?`).run(status, req.params.id);
  res.json({ ok: true });
});

// Admin — delete catering order
app.delete('/api/catering/orders/:id', authMiddleware, adminOnly, (req, res) => {
  const exists = db.prepare('SELECT id FROM catering_orders WHERE id=?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Tapılmadı.' });
  db.prepare('DELETE FROM catering_orders WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ══════════════════════════════════════════
   DB Reset (Admin Only)
══════════════════════════════════════════ */
app.post('/api/admin/reset-db', authMiddleware, adminOnly, (req, res) => {
  const { confirm, target } = req.body;
  if (confirm !== 'RESET') return res.status(400).json({ error: 'Confirm text must be "RESET"' });

  const targets = {
    orders:    () => { db.prepare('DELETE FROM orders').run(); db.prepare("DELETE FROM sqlite_sequence WHERE name='orders'").run(); },
    leads:     () => { db.prepare('DELETE FROM leads').run(); db.prepare("DELETE FROM sqlite_sequence WHERE name='leads'").run(); },
    users:     () => {
      // Keep the first admin user, delete the rest
      const adminUser = db.prepare("SELECT id FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1").get();
      if (adminUser) db.prepare('DELETE FROM users WHERE id != ?').run(adminUser.id);
      else db.prepare('DELETE FROM users').run();
    },
    products:  () => { db.prepare('DELETE FROM products').run(); },
    catering_orders: () => { db.prepare('DELETE FROM catering_orders').run(); db.prepare("DELETE FROM sqlite_sequence WHERE name='catering_orders'").run(); },
    tb_applications: () => { db.prepare('DELETE FROM tb_applications').run(); db.prepare("DELETE FROM sqlite_sequence WHERE name='tb_applications'").run(); },
    spec_templates: () => { db.prepare('DELETE FROM spec_templates').run(); db.prepare("DELETE FROM sqlite_sequence WHERE name='spec_templates'").run(); },
    all: () => {
      db.prepare('DELETE FROM orders').run();
      db.prepare('DELETE FROM leads').run();
      db.prepare('DELETE FROM catering_orders').run();
      db.prepare('DELETE FROM tb_applications').run();
      const adminUser = db.prepare("SELECT id FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1").get();
      if (adminUser) db.prepare('DELETE FROM users WHERE id != ?').run(adminUser.id);
      // Keep products and spec_templates
      try { db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('orders','leads','catering_orders','tb_applications')").run(); } catch {}
    },
  };

  const fn = targets[target];
  if (!fn) return res.status(400).json({ error: `Unknown target: ${target}. Valid: ${Object.keys(targets).join(', ')}` });

  try {
    fn();
    console.log(`[RESET] Admin reset: ${target} by user ${req.user?.email}`);
    res.json({ ok: true, message: `"${target}" reset successfully.` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/db-stats', authMiddleware, adminOnly, (req, res) => {
  try {
    const stats = {
      orders:          db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
      leads:           db.prepare('SELECT COUNT(*) as c FROM leads').get().c,
      users:           db.prepare('SELECT COUNT(*) as c FROM users').get().c,
      products:        db.prepare('SELECT COUNT(*) as c FROM products').get().c,
      catering_orders: db.prepare('SELECT COUNT(*) as c FROM catering_orders').get().c,
      tb_applications: db.prepare('SELECT COUNT(*) as c FROM tb_applications').get().c,
      spec_templates:  db.prepare('SELECT COUNT(*) as c FROM spec_templates').get().c,
    };
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ══════════════════════════════════════════
   Start
══════════════════════════════════════════ */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ API :${PORT}  DB: ${DB_PATH}`);
  buildTransporter().catch(() => {});
  startWhatsApp().catch(() => {});
});