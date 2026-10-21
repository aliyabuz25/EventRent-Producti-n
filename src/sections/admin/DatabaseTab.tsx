import React, { useState, useEffect, useRef } from 'react';
import { Database, Trash2, RefreshCw, AlertTriangle, CheckCircle, BarChart3, Download, Upload, Archive, FileDown, HardDrive, Image as ImageIcon, Clock, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface DbStats {
  orders: number; leads: number; users: number; products: number;
  catering_orders: number; tb_applications: number; spec_templates: number;
}

interface BackupItem {
  type: 'content' | 'db';
  filename: string;
  size: number;
  created_at: string;
}

interface ResetTarget {
  key: string; label: string; description: string; color: string; danger: boolean;
}

const TARGETS: ResetTarget[] = [
  { key: 'orders',          label: 'Sifarişlər',          description: 'Bütün sifarişlər silinir',                                      color: '#dc3545', danger: true  },
  { key: 'leads',           label: 'Sorğular',            description: 'Bütün əlaqə sorğuları silinir',                                 color: '#fd7e14', danger: true  },
  { key: 'catering_orders', label: 'Catering Sifarişlər', description: 'Bütün catering sifarişləri silinir',                            color: '#fd7e14', danger: true  },
  { key: 'tb_applications', label: 'TB Müraciətlər',      description: 'Teambuilding müraciətləri silinir',                             color: '#fd7e14', danger: true  },
  { key: 'users',           label: 'İstifadəçilər',       description: 'Admin xaricindəki istifadəçilər silinir',                       color: '#6f42c1', danger: true  },
  { key: 'products',        label: 'Məhsullar',           description: 'Bütün məhsullar silinir',                                       color: '#6f42c1', danger: true  },
  { key: 'spec_templates',  label: 'Metrik Şablonlar',    description: 'Bütün metrik şablonları silinir',                               color: '#0dcaf0', danger: false },
  { key: 'all',             label: '⚠️ HƏR ŞEY',          description: 'Sifarişlər, sorğular, istifadəçilər (admin qalır). Məhsullar VƏ metriklər saxlanılır.', color: '#dc3545', danger: true },
];

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

export default function DatabaseTab({ token }: { token: string }) {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  // Backup state
  const [backupList, setBackupList] = useState<BackupItem[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showBackupHistory, setShowBackupHistory] = useState(false);
  const dbFileRef = useRef<HTMLInputElement>(null);

  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const ah = { Authorization: `Bearer ${token}` };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/db-stats', { headers: h });
      if (r.ok) setStats(await r.json());
    } finally { setLoading(false); }
  };

  const fetchBackupList = async () => {
    setBackupLoading(true);
    try {
      const r = await fetch('/api/admin/backup/list', { headers: ah });
      if (r.ok) setBackupList(await r.json());
    } finally { setBackupLoading(false); }
  };

  useEffect(() => { fetchStats(); fetchBackupList(); }, []);

  // Download helper
  const downloadFile = async (url: string, label: string) => {
    setDownloading(label);
    try {
      const r = await fetch(url, { headers: ah });
      if (!r.ok) { alert('Yükləmə xətası: ' + r.status); return; }
      const cd = r.headers.get('content-disposition') || '';
      const match = cd.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : label;
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } finally { setDownloading(null); }
  };

  // DB restore
  const handleRestoreDb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.db')) { alert('Yalnız .db faylı qəbul edilir'); return; }
    if (!window.confirm(`"${file.name}" faylı ilə DB-ni bərpa etmək istəyirsiniz? Mövcud DB backup olaraq saxlanacaq.`)) {
      e.target.value = '';
      return;
    }
    setRestoring(true);
    setRestoreResult(null);
    try {
      const fd = new FormData();
      fd.append('db', file);
      const r = await fetch('/api/admin/backup/restore-db', { method: 'POST', headers: ah, body: fd });
      const d = await r.json();
      setRestoreResult({ ok: r.ok, msg: d.message || d.error || 'Xəta' });
      if (r.ok) { fetchStats(); fetchBackupList(); }
    } catch (err: any) {
      setRestoreResult({ ok: false, msg: err.message });
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  // DB reset
  const handleReset = async () => {
    if (confirm !== 'RESET' || !selected) return;
    setResetting(true);
    setResult(null);
    try {
      const r = await fetch('/api/admin/reset-db', { method: 'POST', headers: h, body: JSON.stringify({ confirm: 'RESET', target: selected }) });
      const d = await r.json();
      if (r.ok) { setResult({ ok: true, msg: d.message }); setConfirm(''); setSelected(null); fetchStats(); }
      else setResult({ ok: false, msg: d.error || 'Xəta baş verdi' });
    } catch (e: any) {
      setResult({ ok: false, msg: e.message });
    } finally { setResetting(false); }
  };

  const statLabels: Record<string, string> = {
    orders: 'Sifarişlər', leads: 'Sorğular', users: 'İstifadəçilər',
    products: 'Məhsullar', catering_orders: 'Catering', tb_applications: 'TB Müraciət', spec_templates: 'Metriklər',
  };

  const selectedTarget = TARGETS.find(t => t.key === selected);

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Database size={20} color="#e30613" />
        </div>
        <div>
          <h5 style={{ margin: 0, fontWeight: 800 }}>Verilənlər Bazası</h5>
          <div style={{ fontSize: 12, color: '#adb5bd' }}>Backup, bərpa və sıfırlama əməliyyatları</div>
        </div>
        <button onClick={() => { fetchStats(); fetchBackupList(); }} disabled={loading}
          className="btn btn-sm btn-outline-secondary ms-auto d-flex align-items-center gap-1" style={{ borderRadius: 9 }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Yenilə
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-4">
          <div style={{ fontSize: 11, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            <BarChart3 size={13} style={{ marginRight: 6 }} />Cari DB Statistikası
          </div>
          <div className="row g-2">
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} className="col-6 col-md-3">
                <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: v === 0 ? '#adb5bd' : '#212529' }}>{v}</div>
                  <div style={{ fontSize: 10, color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>{statLabels[k] || k}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ BACKUP BÖLMƏ ═══════════════ */}
      <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Archive size={13} /> Backup — Yüklə
        </div>

        <div className="row g-3 mb-3">
          {/* DB backup */}
          <div className="col-12 col-md-4">
            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '16px', border: '1px solid #e9ecef', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <HardDrive size={18} color="#e30613" />
                <span style={{ fontWeight: 700, fontSize: 13 }}>Verilənlər Bazası</span>
              </div>
              <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 12 }}>
                Bütün məlumatlar — sifarişlər, məhsullar, istifadəçilər. <code>.db</code> formatı.
              </div>
              <button
                onClick={() => downloadFile('/api/admin/backup/db', 'eventrent.db')}
                disabled={downloading === 'eventrent.db'}
                className="btn btn-sm btn-danger fw-semibold w-100 d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: 9 }}>
                {downloading === 'eventrent.db'
                  ? <><div className="spinner-border spinner-border-sm" /> Yüklənir...</>
                  : <><FileDown size={14} /> DB Yüklə (.db)</>}
              </button>
            </div>
          </div>

          {/* Uploads backup */}
          <div className="col-12 col-md-4">
            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '16px', border: '1px solid #e9ecef', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ImageIcon size={18} color="#0d6efd" />
                <span style={{ fontWeight: 700, fontSize: 13 }}>Media / Uploads</span>
              </div>
              <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 12 }}>
                Bütün yüklənmiş şəkil və fayllar. <code>.zip</code> formatı.
              </div>
              <button
                onClick={() => downloadFile('/api/admin/backup/uploads', 'uploads.zip')}
                disabled={downloading === 'uploads.zip'}
                className="btn btn-sm btn-primary fw-semibold w-100 d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: 9 }}>
                {downloading === 'uploads.zip'
                  ? <><div className="spinner-border spinner-border-sm" /> Yüklənir...</>
                  : <><FileDown size={14} /> Media Yüklə (.zip)</>}
              </button>
            </div>
          </div>

          {/* Full backup */}
          <div className="col-12 col-md-4">
            <div style={{ background: '#fff8e1', borderRadius: 12, padding: '16px', border: '1px solid #ffe082', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Archive size={18} color="#f59e0b" />
                <span style={{ fontWeight: 700, fontSize: 13 }}>Tam Backup</span>
              </div>
              <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 12 }}>
                DB + Media + Site məzmunu. Tam bərpa üçün. <code>.zip</code> formatı.
              </div>
              <button
                onClick={() => downloadFile('/api/admin/backup/full', 'full_backup.zip')}
                disabled={downloading === 'full_backup.zip'}
                className="btn btn-sm fw-semibold w-100 d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: 9, background: '#f59e0b', color: '#fff', border: 'none' }}>
                {downloading === 'full_backup.zip'
                  ? <><div className="spinner-border spinner-border-sm" /> Yüklənir...</>
                  : <><Download size={14} /> Tam Backup (.zip)</>}
              </button>
            </div>
          </div>
        </div>

        {/* Restore result */}
        {restoreResult && (
          <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-3"
            style={{ background: restoreResult.ok ? '#d1fae5' : '#fee2e2', border: `1px solid ${restoreResult.ok ? '#6ee7b7' : '#fca5a5'}` }}>
            {restoreResult.ok ? <CheckCircle size={16} color="#059669" /> : <AlertTriangle size={16} color="#dc2626" />}
            <span style={{ fontSize: 13, fontWeight: 600, color: restoreResult.ok ? '#065f46' : '#991b1b' }}>{restoreResult.msg}</span>
          </div>
        )}

        {/* DB Restore */}
        <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '16px', border: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <RotateCcw size={16} color="#6f42c1" />
            <span style={{ fontWeight: 700, fontSize: 13, color: '#212529' }}>DB Bərpa Et (Restore)</span>
          </div>
          <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 12 }}>
            Əvvəl yüklədiyiniz <code>.db</code> faylını yükləyin. Mövcud DB avtomatik backup olaraq saxlanacaq.
            <strong style={{ color: '#dc3545' }}> Diqqət: bu əməliyyat mövcud bütün məlumatları əvəz edəcək.</strong>
          </div>
          <div className="d-flex align-items-center gap-3">
            <input ref={dbFileRef} type="file" accept=".db" style={{ display: 'none' }} onChange={handleRestoreDb} />
            <button
              onClick={() => dbFileRef.current?.click()}
              disabled={restoring}
              className="btn btn-sm fw-semibold d-flex align-items-center gap-2"
              style={{ borderRadius: 9, background: '#6f42c1', color: '#fff', border: 'none' }}>
              {restoring
                ? <><div className="spinner-border spinner-border-sm" /> Bərpa edilir...</>
                : <><Upload size={14} /> .db Faylı Seç və Bərpa Et</>}
            </button>
            <span style={{ fontSize: 11, color: '#adb5bd' }}>Yalnız <code>.db</code> formatı qəbul edilir (maks. 200 MB)</span>
          </div>
        </div>
      </div>

      {/* Backup history */}
      <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 16, marginBottom: 24, overflow: 'hidden' }}>
        <button
          onClick={() => { setShowBackupHistory(v => !v); if (!showBackupHistory) fetchBackupList(); }}
          style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={15} color="#6c757d" />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Backup Tarixçəsi</span>
            <span style={{ background: '#f1f3f5', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600, color: '#6c757d' }}>{backupList.length}</span>
          </div>
          {showBackupHistory ? <ChevronUp size={16} color="#6c757d" /> : <ChevronDown size={16} color="#6c757d" />}
        </button>
        {showBackupHistory && (
          <div style={{ borderTop: '1px solid #f1f3f5', padding: '0 20px 16px' }}>
            {backupLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner-border spinner-border-sm text-secondary" /></div>
            ) : backupList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, fontSize: 13, color: '#adb5bd' }}>Backup tapılmadı</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {backupList.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8f9fa', borderRadius: 10, border: '1px solid #e9ecef' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: b.type === 'db' ? '#fff0f0' : '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {b.type === 'db' ? <HardDrive size={14} color="#e30613" /> : <Archive size={14} color="#0d6efd" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.filename}</div>
                      <div style={{ fontSize: 10, color: '#adb5bd' }}>{fmtDate(b.created_at)} · {fmtSize(b.size)}</div>
                    </div>
                    <span style={{ background: b.type === 'db' ? '#fff0f0' : '#f0f4ff', color: b.type === 'db' ? '#e30613' : '#0d6efd', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {b.type === 'db' ? 'DB' : 'Məzmun'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="d-flex align-items-start gap-3 p-3 rounded-3 mb-4" style={{ background: '#fff8e1', border: '1px solid #ffe082' }}>
        <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13 }}>
          <strong>Diqqət:</strong> Sıfırlama əməliyyatları geri qaytarıla bilməz. Əvvəlcə yuxarıdan <strong>DB Backup</strong> yükləyin.
          Məhsullar yalnız "Məhsullar" seçimi ilə silinir — "Hər şey" seçimindən təsirlənmir.
        </div>
      </div>

      {/* Reset result */}
      {result && (
        <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-4"
          style={{ background: result.ok ? '#d1fae5' : '#fee2e2', border: `1px solid ${result.ok ? '#6ee7b7' : '#fca5a5'}` }}>
          {result.ok ? <CheckCircle size={16} color="#059669" /> : <AlertTriangle size={16} color="#dc2626" />}
          <span style={{ fontSize: 13, fontWeight: 600, color: result.ok ? '#065f46' : '#991b1b' }}>{result.msg}</span>
        </div>
      )}

      {/* Reset targets */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        <Trash2 size={13} style={{ marginRight: 6 }} />Sıfırlama Hədəfi Seçin
      </div>
      <div className="row g-2 mb-4">
        {TARGETS.map(t => (
          <div key={t.key} className="col-12 col-md-6">
            <button
              onClick={() => { setSelected(t.key === selected ? null : t.key); setConfirm(''); setResult(null); }}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: 12,
                border: `2px solid ${selected === t.key ? t.color : '#e9ecef'}`,
                background: selected === t.key ? `${t.color}10` : '#fff',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: '#6c757d', marginTop: 3 }}>{t.description}</div>
              {stats && (
                <div style={{ fontSize: 10, fontWeight: 700, color: t.color, marginTop: 4 }}>
                  {t.key === 'all'
                    ? `${stats.orders + stats.leads + stats.catering_orders + stats.tb_applications} qeyd təsirlənəcək`
                    : t.key in stats ? `${stats[t.key as keyof DbStats]} qeyd` : ''}
                </div>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Confirm & Execute */}
      {selected && (
        <div style={{ background: '#fff0f0', border: '2px solid #fca5a5', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#dc2626' }}>
            ⚠️ "{selectedTarget?.label}" sıfırlanacaq
          </div>
          <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 16 }}>
            {selectedTarget?.description} — Bu əməliyyat geri qaytarıla bilməz.
            Davam etmək üçün aşağıya <strong>RESET</strong> yazın.
          </div>
          <div className="d-flex gap-3 align-items-center">
            <input type="text" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="RESET yazın..." className="form-control"
              style={{ borderRadius: 9, maxWidth: 200, fontWeight: 700, letterSpacing: 2 }} />
            <button onClick={handleReset} disabled={confirm !== 'RESET' || resetting}
              className="btn btn-danger fw-bold d-flex align-items-center gap-2" style={{ borderRadius: 9 }}>
              {resetting ? <><div className="spinner-border spinner-border-sm" /> Sıfırlanır...</> : <><Trash2 size={14} /> Sıfırla</>}
            </button>
            <button onClick={() => { setSelected(null); setConfirm(''); }}
              className="btn btn-outline-secondary" style={{ borderRadius: 9 }}>Ləğv Et</button>
          </div>
        </div>
      )}

    </div>
  );
}
