import React, { useState, useRef, useEffect } from 'react';
import {
  Archive,
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Image as ImageIcon,
  Database,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

interface DbStats {
  orders: number;
  leads: number;
  users: number;
  products: number;
  categories: number;
  catering_orders: number;
  tb_applications: number;
  spec_templates: number;
}

interface InstallResult {
  ok: boolean;
  message: string;
  details?: {
    db_restored: boolean;
    content_restored: boolean;
    uploads_restored: boolean;
    uploads_count: number;
    old_db_backup?: string;
    stats?: DbStats;
    installed_at?: string;
  };
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function InstallBackupTab({ token }: { token: string }) {
  const [currentStats, setCurrentStats] = useState<DbStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [installStep, setInstallStep] = useState<string>('');
  const [result, setResult] = useState<InstallResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ah = { Authorization: `Bearer ${token}` };

  const fetchCurrentStats = async () => {
    setStatsLoading(true);
    try {
      const r = await fetch('/api/admin/db-stats', { headers: ah });
      if (r.ok) setCurrentStats(await r.json());
    } catch {} finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentStats();
  }, []);

  const handleFileSelect = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.zip')) {
      alert('Yalnız .zip formatında arxiv qəbul edilir!');
      return;
    }
    setSelectedFile(f);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInstall = async () => {
    if (!selectedFile) return;

    const conf = window.confirm(
      `"${selectedFile.name}" adlı tam backup arxivini quraşdırmaq istədiyinizdən əminsiniz?\n\n` +
      `Bu əməliyyat:\n` +
      `1. Mövcud DB-nin ehtiyat nüsxəsini saxlayacaq\n` +
      `2. Verilənlər bazasını arxivdəki baza ilə yeniləyəcək\n` +
      `3. Sayt məzmununu (site-content.json) bərpa edəcək\n` +
      `4. Bütün şəkilləri (/uploads/) quraşdıracaq\n\n` +
      `Davam edilsin?`
    );
    if (!conf) return;

    setInstalling(true);
    setError(null);
    setResult(null);
    setUploadProgress(0);
    setInstallStep('Arxiv yüklənir...');

    try {
      const fd = new FormData();
      fd.append('backup', selectedFile);

      // XMLHttpRequest for accurate upload progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/backup/install-backup');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            setUploadProgress(percent);
            if (percent < 100) {
              setInstallStep(`ZIP faylı yüklənir... ${percent}%`);
            } else {
              setInstallStep('Arxiv açılır və fayllar quraşdırılır (bu bir neçə saniyə çəkə bilər)...');
            }
          }
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText || '{}');
            if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
              setResult(data);
              setInstallStep('Tamamlandı!');
              fetchCurrentStats();
              resolve();
            } else {
              const errMsg = data.error || data.message || `Xəta: ${xhr.statusText}`;
              setError(errMsg);
              reject(new Error(errMsg));
            }
          } catch (pe: any) {
            setError('Server cavabı oxunmadı: ' + pe.message);
            reject(pe);
          }
        };

        xhr.onerror = () => {
          const msg = 'Şəbəkə xətası və ya sorğu kəsildi.';
          setError(msg);
          reject(new Error(msg));
        };

        xhr.send(fd);
      });
    } catch (err: any) {
      console.error('[install-backup]', err);
    } finally {
      setInstalling(false);
      setUploadProgress(null);
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <div style={{ background: '#e30613', padding: 8, borderRadius: 10, display: 'inline-flex', color: '#fff' }}>
              <Archive size={22} />
            </div>
            <h4 style={{ fontWeight: 800, margin: 0, color: '#212529', letterSpacing: '-0.02em' }}>
              Install Backup (Tam Bərpa)
            </h4>
          </div>
          <div style={{ fontSize: 13, color: '#6c757d', marginTop: 4 }}>
            Tam ehtiyat nüsxəsi arxivini (ZIP) sistemə bütöv şəkildə quraşdırın: <strong>SQLite DB</strong>, <strong>bütün şəkillər (/uploads)</strong> və <strong>sayt məzmunu</strong> bir kliklə bərpa edilir.
          </div>
        </div>

        <button
          onClick={fetchCurrentStats}
          disabled={statsLoading}
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          style={{ borderRadius: 8 }}>
          <RefreshCw size={14} className={statsLoading ? 'spin' : ''} />
          <span>Statistikanı Yenilə</span>
        </button>
      </div>

      {/* Current System Status Card */}
      <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Mövcud Sistem Qeydləri
        </div>
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '12px 16px', border: '1px solid #f1f3f5' }}>
              <div style={{ fontSize: 11, color: '#6c757d' }}>Məhsullar</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#212529' }}>{currentStats?.products ?? '—'}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '12px 16px', border: '1px solid #f1f3f5' }}>
              <div style={{ fontSize: 11, color: '#6c757d' }}>İstifadəçilər</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#212529' }}>{currentStats?.users ?? '—'}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '12px 16px', border: '1px solid #f1f3f5' }}>
              <div style={{ fontSize: 11, color: '#6c757d' }}>Metrik Şablonlar</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#212529' }}>{currentStats?.spec_templates ?? '—'}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '12px 16px', border: '1px solid #f1f3f5' }}>
              <div style={{ fontSize: 11, color: '#6c757d' }}>Sifarişlər & Sorğular</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#212529' }}>
                {currentStats ? currentStats.orders + currentStats.leads : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions & Features */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '16px' }}>
            <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#166534', fontWeight: 700, fontSize: 13 }}>
              <Database size={16} />
              <span>1. Tam Baza (.db)</span>
            </div>
            <div style={{ fontSize: 12, color: '#14532d' }}>
              Arxivdəki SQLite verilənlər bazası avtomatik oxunur və tətbiq olunur. Əvvəlki baza təhlükəsizlik üçün arxivlənir.
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: '16px' }}>
            <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#1e40af', fontWeight: 700, fontSize: 13 }}>
              <ImageIcon size={16} />
              <span>2. Bütün Şəkillər (/uploads)</span>
            </div>
            <div style={{ fontSize: 12, color: '#1e3a8a' }}>
              Məhsulların, oyunların və menyuların 300+ vizual faylları birbaşa serverin <code>uploads/</code> qovluğuna açılır.
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 14, padding: '16px' }}>
            <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#854d0e', fontWeight: 700, fontSize: 13 }}>
              <FileText size={16} />
              <span>3. Sayt Məzmunu</span>
            </div>
            <div style={{ fontSize: 12, color: '#713f12' }}>
              Səhifələrin mətnləri və tənzimləmələri (<code>site-content.json</code>) avtomatik bərpa olunur.
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !installing && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#e30613' : selectedFile ? '#22c55e' : '#cbd5e1'}`,
          background: isDragging ? '#fff5f5' : selectedFile ? '#f0fdf4' : '#fff',
          borderRadius: 18,
          padding: '40px 24px',
          textAlign: 'center',
          cursor: installing ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: 24,
        }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        <div style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: selectedFile ? '#dcfce7' : '#fee2e2',
          color: selectedFile ? '#16a34a' : '#e30613',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}>
          {selectedFile ? <Package size={32} /> : <Upload size={32} />}
        </div>

        {selectedFile ? (
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#15803d' }}>
              {selectedFile.name}
            </div>
            <div style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>
              Ölçü: <strong>{fmtSize(selectedFile.size)}</strong> · ZIP tam backup arxivi seçildi
            </div>
            <div style={{ marginTop: 12 }}>
              <span className="badge bg-success" style={{ padding: '6px 12px', fontSize: 12 }}>
                Quraşdırmaya Hazırdır
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
              ZIP Formatındakı Backup Faylını Buraya Sürükləyin və ya Seçin
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
              (Məsələn: <code>eventrent_full_backup_*.zip</code> — 2 GB-a qədər)
            </div>
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger fw-semibold"
                style={{ borderRadius: 8, padding: '8px 18px' }}>
                Fayl Seçin
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action / Progress Bar */}
      {selectedFile && (
        <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#212529' }}>
                Tam Quraşdırma Əməliyyatı
              </div>
              <div style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>
                Arxivdəki DB, uploads şəkilləri və sayt məzmunu tam təhlükəsiz şəkildə quraşdırılacaq.
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                onClick={() => { setSelectedFile(null); setResult(null); setError(null); }}
                disabled={installing}
                className="btn btn-outline-secondary"
                style={{ borderRadius: 9 }}>
                Ləğv Et
              </button>

              <button
                onClick={handleInstall}
                disabled={installing}
                className="btn btn-danger fw-bold d-flex align-items-center gap-2"
                style={{ borderRadius: 9, background: '#e30613', padding: '10px 22px' }}>
                {installing ? (
                  <>
                    <div className="spinner-border spinner-border-sm" />
                    <span>Quraşdırılır...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Tam Backup Quraşdır</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress details */}
          {installing && (
            <div style={{ marginTop: 20 }}>
              <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: '#e30613' }}>{installStep}</span>
                <span>{uploadProgress !== null ? `${uploadProgress}%` : ''}</span>
              </div>
              <div className="progress" style={{ height: 10, borderRadius: 5 }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated bg-danger"
                  style={{ width: `${uploadProgress ?? 100}%` }}
                />
              </div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
                Böyük arxivlərdə (500+ MB şəkillər) faylların serverdə açılması bir neçə dəqiqə çəkə bilər, zəhmət olmasa pəncərəni bağlamayın.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="d-flex align-items-start gap-3 p-3 rounded-3 mb-4"
          style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}>
          <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>Xəta Baş Verdi</div>
            <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 2 }}>{error}</div>
          </div>
        </div>
      )}

      {/* Success Result Card */}
      {result && result.ok && (
        <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
          <div className="d-flex align-items-center gap-3 mb-3">
            <CheckCircle size={28} color="#16a34a" />
            <div>
              <h5 style={{ fontWeight: 800, margin: 0, color: '#166534' }}>
                {result.message}
              </h5>
              <div style={{ fontSize: 12, color: '#15803d' }}>
                {result.details?.installed_at && new Date(result.details.installed_at).toLocaleString('az-AZ')}
              </div>
            </div>
          </div>

          <div className="row g-3 my-2">
            <div className="col-12 col-md-4">
              <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                  ✓ Verilənlər Bazası (DB)
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginTop: 4 }}>
                  Uğurla Bərpa Edildi
                </div>
                {result.details?.old_db_backup && (
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
                    Köhnə baza nüsxəsi: <code>{result.details.old_db_backup}</code>
                  </div>
                )}
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                  ✓ Şəkillər (/uploads)
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginTop: 4 }}>
                  {result.details?.uploads_count ?? 0} ədəd şəkil quraşdırıldı
                </div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
                  Bütün məhsul və media şəkilləri yerləşdirildi
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                  ✓ Sayt Məzmunu
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginTop: 4 }}>
                  {result.details?.content_restored ? 'Yeniləndi' : 'Mövcud saxlandı'}
                </div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
                  site-content.json tətbiq edildi
                </div>
              </div>
            </div>
          </div>

          {/* New Stats Display */}
          {result.details?.stats && (
            <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 10 }}>
                Yeni Baza Məlumatları:
              </div>
              <div className="d-flex flex-wrap gap-3" style={{ fontSize: 12 }}>
                <div>Məhsullar: <strong>{result.details.stats.products}</strong></div>
                <div>Kateqoriyalar: <strong>{result.details.stats.categories}</strong></div>
                <div>İstifadəçilər: <strong>{result.details.stats.users}</strong></div>
                <div>Metriklər: <strong>{result.details.stats.spec_templates}</strong></div>
              </div>
            </div>
          )}

          <div className="mt-3 d-flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-sm btn-success fw-bold"
              style={{ borderRadius: 8 }}>
              Səhifəni Yenilə və Məlumatları Gör
            </button>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b' }}>
        <div className="d-flex align-items-center gap-2 mb-1" style={{ fontWeight: 700, color: '#334155' }}>
          <ShieldCheck size={16} color="#0284c7" />
          <span>Avtomatik Təhlükəsizlik Zəmanəti</span>
        </div>
        Bərpa əməliyyatı başlamazdan əvvəl sistem cari verilənlər bazasını avtomatik olaraq <code>data/eventrent.db.bak_YYYY-MM-DD</code> adı ilə saxlayır. Hər hansı problem baş verərsə, "Verilənlər Bazası" bölməsindən əvvəlki ehtiyat nüsxəsini bərpa edə bilərsiniz.
      </div>
    </div>
  );
}
