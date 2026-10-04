import { writeFileSync } from 'fs';

const API = 'http://localhost:4320';
const TOKEN_FILE = '/tmp/er_token.txt';

export default async function globalSetup() {
  // Token faylda varsa istifadə et
  try {
    const existing = require('fs').readFileSync(TOKEN_FILE, 'utf8').trim();
    if (existing && existing.split('.').length === 3) {
      // Tokenin hələ keçərli olduğunu yoxla
      const check = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${existing}` }
      });
      if (check.ok) {
        console.log('[globalSetup] Existing token valid ✓');
        process.env.ER_TOKEN = existing;
        return;
      }
    }
  } catch {}

  // Yeni token al
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@eventrent.az', password: 'Test1234!' }),
  });
  const data = await res.json() as any;
  if (!data.token) throw new Error('[globalSetup] Login failed: ' + JSON.stringify(data));
  
  writeFileSync(TOKEN_FILE, data.token);
  process.env.ER_TOKEN = data.token;
  console.log('[globalSetup] New token obtained ✓');
}