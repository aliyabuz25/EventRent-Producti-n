import React, { useState, useEffect } from 'react';
import { Database, Trash2, RefreshCw, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';

interface DbStats {
  orders: number;
  leads: number;
  users: number;
  products: number;
  catering_orders: number;
  tb_applications: number;
  spec_templates: number;
}

interface ResetTarget {
  key: string;
  label: string;
  description: string;
  color: string;
  danger: boolean;
}

const TARGETS: ResetTarget[] = [
  { key: 'orders',          label: 'Sifarişlər',          description: 'Bütün sifarişlər silinir',             color: '#dc3545', danger: true  },
  { key: 'leads',           label: 'Sorğular',            description: 'Bütün əlaqə sorğuları silinir',        color: '#fd7e14', danger: true  },
  { key: 'catering_orders', label: 'Catering Sifarişlər', description: 'Bütün catering sifarişləri silinir',   color: '#fd7e14', danger: true  },
  { key: 'tb_applications', label: 'TB Müraciətlər',      description: 'Teambuilding müraciətləri silinir',    color: '#fd7e14', danger: true  },
  { key: 'users',           label: 'İstifadəçilər',       description: 'Admin xaricindəki istifadəçilər silinir', color: '#6f42c1', danger: true },
  { key: 'products',        label: 'Məhsullar',           description: 'Bütün məhsullar silinir',              color: '#6f42c1', danger: true  },
  { key: 'spec_templates',  label: 'Metrik Şablonlar',    description: 'Bütün metrik şablonları silinir',      color: '#0dcaf0', danger: false },
  { key: 'all',             label: '⚠️ HƏR ŞEY',          description: 'Sifarişlər, sorğular, istifadəçilər (admin qalır). Məhsullar VƏ metriklər saxlanılır.', color: '#dc3545', danger: true },
];

export default function DatabaseTab({ token }: { token: string }) {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/db-stats', { headers: h });
      if (r.ok) setStats(await r.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleReset = async () => {
    if (confirm !== 'RESET' || !selected) return;
    setResetting(true);
    setResult(null);
    try {
      const r = await fetch('/api/admin/reset-db', {
        method: 'POST', headers: h,
        body: JSON.stringify({ confirm: 'RESET', target: selected }),
      });
      const d = await r.json();
      if (r.ok) {
        setResult({ ok: true, msg: d.message });
        setConfirm('');
        setSelected(null);
        fetchStats();
      } else {
        setResult({ ok: false, msg: d.error || 'Xəta baş verdi' });
      }
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
    <div style={{ padding: '24px', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Database size={20} color="#e30613" />
        </div>
        <div>
          <h5 style={{ margin: 0, fontWeight: 800 }}>Verilənlər Bazası</h5>
          <div style={{ fontSize: 12, color: '#adb5bd' }}>DB idarəetməsi və sıfırlama əməliyyatları</div>
        </div>
        <button onClick={fetchStats} disabled={loading} className="btn btn-sm btn-outline-secondary ms-auto d-flex align-items-center gap-1" style={{ borderRadius: 9 }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Yenilə
        </button>
      </div>

      {/* Warning */}
      <div className="d-flex align-items-start gap-3 p-3 rounded-3 mb-4" style={{ background: '#fff8e1', border: '1px solid #ffe082' }}>
        <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13 }}>
          <strong>Diqqət:</strong> Sıfırlama əməliyyatları geri qaytarıla bilməz. Əvvəlcə DB-nin backup-ını götürün.
          Məhsullar yalnız "Məhsullar" seçimi ilə silinir — "Hər şey" seçimindən təsirlənmir.
        </div>
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

      {/* Result */}
      {result && (
        <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-4"
          style={{ background: result.ok ? '#d1fae5' : '#fee2e2', border: `1px solid ${result.ok ? '#6ee7b7' : '#fca5a5'}` }}>
          {result.ok
            ? <CheckCircle size={16} color="#059669" />
            : <AlertTriangle size={16} color="#dc2626" />}
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
              <div style={{ fontWeight: 700, fontSize: 13, color: t.danger ? '#212529' : '#212529' }}>
                {t.label}
              </div>
              <div style={{ fontSize: 11, color: '#6c757d', marginTop: 3 }}>{t.description}</div>
              {stats && (
                <div style={{ fontSize: 10, fontWeight: 700, color: t.color, marginTop: 4 }}>
                  {t.key === 'all'
                    ? `${(stats.orders + stats.leads + stats.catering_orders + stats.tb_applications)} qeyd təsirlənəcək`
                    : t.key in stats
                      ? `${stats[t.key as keyof DbStats]} qeyd`
                      : ''}
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
            <input
              type="text"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="RESET yazın..."
              className="form-control"
              style={{ borderRadius: 9, maxWidth: 200, fontWeight: 700, letterSpacing: 2 }}
            />
            <button
              onClick={handleReset}
              disabled={confirm !== 'RESET' || resetting}
              className="btn btn-danger fw-bold d-flex align-items-center gap-2"
              style={{ borderRadius: 9 }}>
              {resetting
                ? <><div className="spinner-border spinner-border-sm" /> Sıfırlanır...</>
                : <><Trash2 size={14} /> Sıfırla</>}
            </button>
            <button onClick={() => { setSelected(null); setConfirm(''); }} className="btn btn-outline-secondary" style={{ borderRadius: 9 }}>
              Ləğv Et
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
