import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, Eye, EyeOff, X, Check, Phone, MapPin, Calendar, Users, Image as ImageIcon, Upload } from 'lucide-react';
import { useToast } from '../../components/Toast';

/* ── Media Picker Modal ── */
function MediaPicker({ token, onPick, onClose }: { token: string; onPick: (url: string) => void; onClose: () => void }) {
  const [files, setFiles] = useState<{ filename: string; url: string }[]>([]);
  useEffect(() => {
    fetch('/api/media', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(setFiles).catch(() => {});
  }, []);
  return (
    <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1060 }} onClick={onClose}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h6 className="modal-title fw-bold">Media Kitabxanası</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body px-4 pb-4">
            {files.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <ImageIcon size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                <div style={{ fontSize: 13 }}>Media yoxdur. Əvvəlcə Media tabında fayl yükləyin.</div>
              </div>
            ) : (
              <div className="row g-2">
                {files.map(f => (
                  <div key={f.filename} className="col-4 col-md-3">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: '0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ''}
                      onClick={() => { onPick(f.url); onClose(); }}>
                      <div style={{ height: 80, background: '#f8f9fa', overflow: 'hidden' }}>
                        <img src={f.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '4px 6px', fontSize: 9, color: '#6c757d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.filename}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Smart Image Input ── */
function ImgInput({ value, onChange, token }: { value: string; onChange: (v: string) => void; token: string }) {
  const [picker, setPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/media/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!r.ok) throw new Error();
      const d = await r.json();
      onChange(d.url || '');
      toast.success('Şəkil yükləndi ✓');
    } catch { toast.error('Şəkil yüklənmədi'); }
    finally { setUploading(false); }
  };

  return (
    <div className="d-flex flex-column gap-2">
      {value && (
        <div style={{ position: 'relative', height: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid #e9ecef', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={value} style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <button type="button" onClick={() => onChange('')}
            style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8, background: 'rgba(220,53,69,0.9)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={13} />
          </button>
          <a href={value} target="_blank" rel="noreferrer"
            style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 600, borderRadius: 6, padding: '4px 10px', textDecoration: 'none' }}>
            ↗ Tam ölçü
          </a>
        </div>
      )}
      <label
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1.5px dashed', borderColor: uploading ? '#e30613' : '#dee2e6', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', background: uploading ? '#fff5f5' : '#fafafa', transition: '0.15s' }}
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#e30613'; e.currentTarget.style.background = '#fff5f5'; }}
        onDragLeave={e => { e.currentTarget.style.borderColor = '#dee2e6'; e.currentTarget.style.background = '#fafafa'; }}
        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#dee2e6'; e.currentTarget.style.background = '#fafafa'; const f = e.dataTransfer.files[0]; if (f) upload(f); }}
      >
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
        {uploading
          ? <><div className="spinner-border spinner-border-sm text-danger" style={{ width: 14, height: 14 }} /><span style={{ fontSize: 11, color: '#e30613', fontWeight: 600 }}>Yüklənir...</span></>
          : <><Upload size={14} color="#adb5bd" /><span style={{ fontSize: 11, color: '#6c757d' }}>Şəkil sürüklə və burax və ya <span style={{ color: '#e30613', fontWeight: 600 }}>seç</span></span></>
        }
      </label>
      <div className="d-flex gap-2">
        <input className="form-control form-control-sm" style={{ borderRadius: 9, fontSize: 11 }} value={value} onChange={e => onChange(e.target.value)} placeholder="https://..." />
        <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 9, padding: '4px 10px', flexShrink: 0, fontSize: 11 }} onClick={() => setPicker(true)} title="Mediadan seç">
          <ImageIcon size={12} /> Seç
        </button>
      </div>
      {picker && <MediaPicker token={token} onPick={v => { onChange(v); setPicker(false); }} onClose={() => setPicker(false)} />}
    </div>
  );
}

interface CateringOrder {
  id: number;
  name: string;
  phone: string;
  email: string;
  guests: string;
  location: string;
  date: string;
  time_range: string;
  format: string;
  menu_note: string;
  package_name: string;
  status: string;
  created_at: string;
}

interface CateringPackage {
  id: number;
  name: string;
  description: string;
  price: string;
  price_note: string;
  features: string[];
  badge: string;
  badge_color: string;
  image_url: string;
  is_popular: number;
  active: number;
  sort_order: number;
}

const EMPTY: Omit<CateringPackage, 'id' | 'created_at' | 'updated_at'> = {
  name: '', description: '', price: '', price_note: '',
  features: [], badge: '', badge_color: 'orange',
  image_url: '', is_popular: 0, active: 1, sort_order: 0,
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:         { label: 'Yeni',       color: 'primary' },
  in_progress: { label: 'İşlənir',   color: 'warning' },
  done:        { label: 'Tamamlandı', color: 'success' },
  cancelled:   { label: 'Ləğv edildi', color: 'danger' },
};

export default function CateringTab({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState<'orders' | 'packages'>('orders');
  const [orders, setOrders] = useState<CateringOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [packages, setPackages] = useState<CateringPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CateringPackage | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [featInput, setFeatInput] = useState('');
  const [saving, setSaving] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const loadOrders = () => {
    setOrdersLoading(true);
    fetch('/api/catering/orders', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  };

  const load = () => {
    setLoading(true);
    fetch('/api/catering/packages/all', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(d => setPackages(Array.isArray(d) ? d.map((p: any) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })) : []))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); load(); }, []);

  const updateOrderStatus = async (id: number, status: string) => {
    await fetch(`/api/catering/orders/${id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
    loadOrders();
  };

  const deleteOrder = async (id: number) => {
    if (!confirm('Silinsin?')) return;
    await fetch(`/api/catering/orders/${id}`, { method: 'DELETE', headers });
    loadOrders();
  };

  const openNew = () => { setEditing(null); setForm({ ...EMPTY }); setFeatInput(''); setShowForm(true); };
  const openEdit = (p: CateringPackage) => { setEditing(p); setForm({ ...p }); setFeatInput(''); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const addFeature = () => {
    const v = featInput.trim();
    if (!v) return;
    setForm(f => ({ ...f, features: [...f.features, v] }));
    setFeatInput('');
  };

  const removeFeature = (i: number) => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.name.trim()) return alert('Ad mütləqdir.');
    setSaving(true);
    try {
      const url = editing ? `/api/catering/packages/${editing.id}` : '/api/catering/packages';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      load();
      closeForm();
    } catch { alert('Xəta baş verdi.'); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Silinsin?')) return;
    await fetch(`/api/catering/packages/${id}`, { method: 'DELETE', headers });
    load();
  };

  const toggle = async (p: CateringPackage) => {
    await fetch(`/api/catering/packages/${p.id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ ...p, active: p.active ? 0 : 1 }),
    });
    load();
  };

  const BADGE_COLORS = ['orange', 'blue', 'green', 'purple', 'red', 'gold'];

  return (
    <div>
      {/* Tab switcher */}
      <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-3">
        <button
          className={`btn btn-sm ${activeTab === 'orders' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('orders')}
        >
          Sifarişlər {orders.filter(o => o.status === 'new').length > 0 && (
            <span className="badge bg-danger ms-1">{orders.filter(o => o.status === 'new').length}</span>
          )}
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'packages' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('packages')}
        >
          Paketlər
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="fw-bold mb-0">Ketrinq Sifarişləri</h6>
              <small className="text-muted">{orders.length} sifariş</small>
            </div>
            <button className="btn btn-sm btn-outline-secondary" onClick={loadOrders}>Yenilə</button>
          </div>

          {ordersLoading && <div className="text-center py-4 text-muted">Yüklənir...</div>}

          {!ordersLoading && orders.length === 0 && (
            <div className="text-center py-5 text-muted">Hələ heç bir sifariş yoxdur.</div>
          )}

          {!ordersLoading && orders.map(o => {
            const st = STATUS_LABELS[o.status] || STATUS_LABELS.new;
            return (
              <div key={o.id} className="card mb-3 border-0 shadow-sm" style={{ borderRadius: 14 }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="fw-bold">#{o.id}</span>
                        <span className={`badge bg-${st.color}`}>{st.label}</span>
                        {o.package_name && <span className="badge bg-light text-dark">{o.package_name}</span>}
                        <small className="text-muted">{(() => { try { return new Date(o.created_at).toLocaleDateString('az-Latn-AZ'); } catch { return new Date(o.created_at).toLocaleDateString(); } })()}</small>
                      </div>
                      <div className="d-flex flex-wrap gap-3 mt-2">
                        <span className="d-flex align-items-center gap-1 small"><Users size={12} /> {o.name}</span>
                        <a href={`tel:${o.phone}`} className="d-flex align-items-center gap-1 small text-decoration-none text-dark">
                          <Phone size={12} /> {o.phone}
                        </a>
                        {o.location && <span className="d-flex align-items-center gap-1 small text-muted"><MapPin size={12} /> {o.location}</span>}
                        {o.date && <span className="d-flex align-items-center gap-1 small text-muted"><Calendar size={12} /> {o.date}</span>}
                        {o.guests && <span className="d-flex align-items-center gap-1 small text-muted"><Users size={12} /> {o.guests} nəfər</span>}
                      </div>
                      {o.menu_note && (
                        <p className="small text-muted mb-0 mt-2">📝 {o.menu_note}</p>
                      )}
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 140 }}
                        value={o.status}
                        onChange={e => updateOrderStatus(o.id, e.target.value)}
                      >
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => deleteOrder(o.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PACKAGES TAB */}
      {activeTab === 'packages' && (
        <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-0">Ketrinq Paketləri</h5>
          <small className="text-muted">{packages.length} paket</small>
        </div>
        <button className="btn btn-sm btn-dark d-flex align-items-center gap-2" onClick={openNew}>
          <Plus size={15} /> Yeni Paket
        </button>
      </div>

      {loading && <div className="text-center py-5 text-muted">Yüklənir...</div>}

      {/* Package cards */}
      {!loading && (
        <div className="row g-3">
          {packages.map(p => (
            <div key={p.id} className="col-12 col-md-6 col-xl-4">
              <div className={`card h-100 border ${p.active ? 'border-0 shadow-sm' : 'border-warning'}`} style={{ borderRadius: 16 }}>
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="card-img-top"
                    style={{ height: 160, objectFit: 'cover', borderRadius: '16px 16px 0 0' }} />
                )}
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <div className="flex-1">
                      <h6 className="fw-bold mb-0">{p.name}</h6>
                      {p.badge && (
                        <span className="badge rounded-pill mt-1"
                          style={{ background: p.badge_color === 'orange' ? '#e30613' : p.badge_color === 'gold' ? '#f59e0b' : p.badge_color, fontSize: 10 }}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                    {p.is_popular === 1 && <Star size={14} className="text-warning mt-1 flex-shrink-0" fill="currentColor" />}
                  </div>
                  <p className="text-muted small mb-2" style={{ minHeight: 36 }}>{p.description}</p>
                  <div className="fw-bold mb-1">{p.price} {p.price_note && <span className="fw-normal text-muted small">{p.price_note}</span>}</div>
                  <ul className="small text-muted ps-3 mb-0">
                    {(p.features ?? []).slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
                    {(p.features ?? []).length > 3 && <li>+{(p.features ?? []).length - 3} daha</li>}
                  </ul>
                </div>
                <div className="card-footer bg-transparent border-top-0 d-flex gap-2 pt-0 px-3 pb-3">
                  <button className="btn btn-sm btn-outline-secondary flex-1" onClick={() => openEdit(p)}>
                    <Edit2 size={13} className="me-1" /> Redaktə
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => toggle(p)} title={p.active ? 'Gizlə' : 'Göstər'}>
                    {p.active ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => del(p.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {packages.length === 0 && !loading && (
            <div className="col-12 text-center py-5 text-muted">
              <p>Hələ heç bir paket yoxdur.</p>
              <button className="btn btn-dark btn-sm" onClick={openNew}>İlk paketi əlavə et</button>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: 20 }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{editing ? 'Paketi Redaktə Et' : 'Yeni Paket'}</h5>
                <button className="btn-close" onClick={closeForm} />
              </div>
              <div className="modal-body pt-3">
                <div className="row g-3">
                  {/* Name */}
                  <div className="col-12">
                    <label className="form-label small fw-bold">Paket Adı *</label>
                    <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="məs: Standart Paket" />
                  </div>
                  {/* Description */}
                  <div className="col-12">
                    <label className="form-label small fw-bold">Açıqlama</label>
                    <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Paket haqqında qısa məlumat..." />
                  </div>
                  {/* Price */}
                  <div className="col-6">
                    <label className="form-label small fw-bold">Qiymət</label>
                    <input className="form-control" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="məs: 500 AZN" />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold">Qiymət qeydi</label>
                    <input className="form-control" value={form.price_note} onChange={e => setForm(f => ({ ...f, price_note: e.target.value }))} placeholder="məs: nəfər başına" />
                  </div>
                  {/* Badge */}
                  <div className="col-6">
                    <label className="form-label small fw-bold">Badge mətn</label>
                    <input className="form-control" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="məs: Ən Populyar" />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold">Badge rəng</label>
                    <select className="form-select" value={form.badge_color} onChange={e => setForm(f => ({ ...f, badge_color: e.target.value }))}>
                      {BADGE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {/* Image */}
                  <div className="col-12">
                    <label className="form-label small fw-bold">Şəkil</label>
                    <ImgInput value={form.image_url} onChange={v => setForm(f => ({ ...f, image_url: v }))} token={token} />
                  </div>
                  {/* Features */}
                  <div className="col-12">
                    <label className="form-label small fw-bold">Xüsusiyyətlər</label>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        className="form-control form-control-sm"
                        value={featInput}
                        onChange={e => setFeatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                        placeholder="Xüsusiyyət əlavə et... (Enter)"
                      />
                      <button className="btn btn-sm btn-dark" onClick={addFeature}><Plus size={14} /></button>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {form.features.map((f, i) => (
                        <span key={i} className="badge rounded-pill bg-light text-dark d-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                          <Check size={11} className="text-success" /> {f}
                          <button className="btn-close btn-close-sm ms-1" style={{ fontSize: 8 }} onClick={() => removeFeature(i)} />
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Sort + toggles */}
                  <div className="col-4">
                    <label className="form-label small fw-bold">Sıra</label>
                    <input type="number" className="form-control" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
                  </div>
                  <div className="col-4 d-flex align-items-end">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={!!form.is_popular} onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked ? 1 : 0 }))} id="isPopular" />
                      <label className="form-check-label small" htmlFor="isPopular">Populyar</label>
                    </div>
                  </div>
                  <div className="col-4 d-flex align-items-end">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={!!form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked ? 1 : 0 }))} id="isActive" />
                      <label className="form-check-label small" htmlFor="isActive">Aktiv</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={closeForm}>Ləğv et</button>
                <button className="btn btn-dark" onClick={save} disabled={saving}>
                  {saving ? 'Saxlanılır...' : editing ? 'Yadda saxla' : 'Əlavə et'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}