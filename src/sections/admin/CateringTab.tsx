import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, Eye, EyeOff, X, Check, Phone, MapPin, Calendar, Users } from 'lucide-react';

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
                    <label className="form-label small fw-bold">Şəkil URL</label>
                    <input className="form-control" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
                    {form.image_url && <img src={form.image_url} alt="" className="mt-2 rounded" style={{ height: 80, objectFit: 'cover' }} />}
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