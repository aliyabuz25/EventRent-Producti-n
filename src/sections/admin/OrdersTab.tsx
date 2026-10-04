import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Mail, Phone, Calendar, MapPin, Package, X, Check, Search, Send, RefreshCw } from 'lucide-react';
import { useToast } from '../../components/Toast';

function fmtDate(s: string) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return s; }
}

export interface Order {
  id: number;
  name: string;
  phone: string;
  email: string;
  event_date: string;
  location: string;
  note: string;
  status: string;
  items: { productId: string; quantity: number }[];
  source: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  new:       { bg: '#cfe2ff', color: '#084298', label: 'Yeni' },
  contacted: { bg: '#fff3cd', color: '#664d03', label: 'Əlaqə' },
  quoted:    { bg: '#e2d9f3', color: '#432874', label: 'Təklif' },
  won:       { bg: '#d1e7dd', color: '#0a3622', label: 'Qazanıldı' },
  lost:      { bg: '#f8d7da', color: '#58151c', label: 'İtirildi' },
};

const EMPTY_FORM = { name: '', phone: '', email: '', event_date: '', location: '', note: '', status: 'new', items: [] as Order['items'], source: 'admin' };

function Badge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { bg: '#f8f9fa', color: '#495057', label: status };
  return <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{s.label}</span>;
}

interface DbProduct { id: string; name: string; category: string; images: string[]; }

export default function OrdersTab({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [pgAvail, setPgAvail] = useState(true);
  const [sendStatusEmail, setSendStatusEmail] = useState(false);

  const toast = useToast();
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    try {
      const [oRes, pRes] = await Promise.all([
        fetch('/api/orders', { headers: h }),
        fetch('/api/products'),
      ]);
      if (!oRes.ok) { setPgAvail(false); setLoading(false); return; }
      const data = await oRes.json();
      setOrders(Array.isArray(data) ? data : []);
      if (pRes.ok) setProducts(await pRes.json());
      setPgAvail(true);
    } catch { setPgAvail(false); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowModal(true); };
  const openEdit = (o: Order) => { setEditId(o.id); setForm({ name: o.name, phone: o.phone, email: o.email, event_date: o.event_date || '', location: o.location || '', note: o.note || '', status: o.status, items: o.items || [], source: o.source || 'admin' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditId(null); setForm({ ...EMPTY_FORM }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/orders/${editId}` : '/api/orders';
      const res = await fetch(url, { method, headers: h, body: JSON.stringify(form) });
      if (res.ok) { toast.success(editId ? 'Sifariş yeniləndi.' : 'Sifariş yaradıldı.'); await load(); closeModal(); }
      else { const err = await res.json(); toast.error(err.error || 'Xəta baş verdi.'); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu sifarişi silmək istədiyinizə əminsiniz?')) return;
    const res = await fetch(`/api/orders/${id}`, { method: 'DELETE', headers: h });
    if (res.ok) { toast.success('Sifariş silindi.'); setSelected(null); await load(); }
    else toast.error('Silmək alınmadı.');
  };

  const handleStatusChange = async (id: number, status: string, sendEmail = false) => {
    await fetch(`/api/orders/${id}/status`, { method: 'PATCH', headers: h, body: JSON.stringify({ status, send_email: sendEmail }) });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : s);
  };

  const handleSendEmail = async (id: number) => {
    setSendingEmail(id);
    try {
      const res = await fetch(`/api/orders/${id}/send-email`, { method: 'POST', headers: h });
      const data = res.ok ? await res.json() : {};
      setSendingEmail(null);
      if (data.ok) toast.success('Email göndərildi!');
      else toast.error('Email göndərilmədi. SMTP ayarlarını yoxlayın.');
    } catch {
      setSendingEmail(null);
      toast.error('Email göndərilmədi. Serverə qoşulma xətası.');
    }
  };

  const inputCls = 'form-control form-control-sm';

  const filtered = orders.filter(o => {
    const mf = filterStatus === 'all' || o.status === filterStatus;
    const ms = [o.name, o.email, o.phone, o.location].join(' ').toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const stats = {
    total: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    won: orders.filter(o => o.status === 'won').length,
  };

  if (!pgAvail) return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div><h5 className="mb-0 fw-bold">Sifarişlər</h5></div>
        <button onClick={load} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 10 }}><RefreshCw size={13} /> Yenilə</button>
      </div>
      <div className="card border-0 shadow-sm p-5 text-center" style={{ borderRadius: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#fff3cd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Package size={24} color="#664d03" />
        </div>
        <h6 className="fw-bold mb-2">Sifarişlər yüklənmədi</h6>
        <p className="text-muted mb-3" style={{ fontSize: 13 }}>Server ilə əlaqə kəsildi. Serverin işlədiyini yoxlayın və yenidən cəhd edin.</p>
        <button onClick={load} className="btn btn-sm btn-primary" style={{ borderRadius: 10 }}>Yenidən cəhd et</button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-0 fw-bold">Sifarişlər</h5>
          <div style={{ fontSize: 12, color: '#6c757d' }}>{orders.length} sifariş</div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={load} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 10 }}><RefreshCw size={13} /></button>
          <button onClick={openCreate} className="btn btn-danger btn-sm fw-semibold d-flex align-items-center gap-2" style={{ borderRadius: 10, padding: '8px 16px' }}>
            <Plus size={14} /> Yeni Sifariş
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Ümumi', value: stats.total, color: '#e30613' },
          { label: 'Yeni', value: stats.new, color: '#0d6efd' },
          { label: 'Qazanıldı', value: stats.won, color: '#198754' },
          { label: 'Konversiya', value: stats.total ? `${Math.round(stats.won / stats.total * 100)}%` : '0%', color: '#6f42c1' },
        ].map((s, i) => (
          <div key={i} className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-3">
                <div style={{ fontSize: 24, fontWeight: 900, color: '#212529' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#6c757d', fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-0" style={{ borderRadius: 14 }}>
        <div className="card-header bg-white border-bottom py-3 px-3" style={{ borderRadius: '14px 14px 0 0' }}>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <div className="position-relative" style={{ minWidth: 220 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#adb5bd', pointerEvents: 'none' }} />
              <input type="text" className={inputCls} placeholder="Ad, email, telefon..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30, borderRadius: 8 }} />
            </div>
            <div className="d-flex flex-wrap gap-1">
              {(['all', ...Object.keys(STATUS_MAP)] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`btn btn-sm ${filterStatus === s ? 'btn-danger' : 'btn-outline-secondary'}`} style={{ fontSize: 11, borderRadius: 8, fontWeight: 600 }}>
                  {s === 'all' ? 'Hamısı' : STATUS_MAP[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-danger" style={{ width: 28, height: 28 }} /></div>
          ) : (
            <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  {['#', 'Müştəri', 'Tarix', 'Məkan', 'Status', ''].map((h, i) => (
                    <th key={i} className={`fw-semibold text-muted border-0 py-3 ${i === 0 ? 'ps-3' : ''} ${i === 5 ? 'text-end pe-3' : ''}`} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id}>
                    <td className="ps-3 align-middle text-muted" style={{ fontSize: 12 }}>#{order.id}</td>
                    <td className="align-middle">
                      <div className="fw-semibold" style={{ fontSize: 13 }}>{order.name}</div>
                      <div style={{ fontSize: 11, color: '#6c757d' }}>{order.phone}</div>
                    </td>
                    <td className="align-middle" style={{ fontSize: 12, color: '#495057' }}>{fmtDate(order.event_date)}</td>
                    <td className="align-middle" style={{ fontSize: 12, color: '#6c757d' }}>{order.location || '—'}</td>
                    <td className="align-middle">
                      <div className="d-flex align-items-center gap-1">
                        <Badge status={order.status} />
                        <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)} className="form-select form-select-sm ms-1" style={{ width: 'auto', fontSize: 11, borderRadius: 8 }}>
                          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="align-middle text-end pe-3">
                      <div className="d-flex gap-1 justify-content-end">
                        <button onClick={() => setSelected(order)} className="btn btn-sm btn-outline-secondary d-flex align-items-center" style={{ borderRadius: 8, padding: '4px 8px' }} title="Bax"><Package size={13} /></button>
                        <button onClick={() => handleSendEmail(order.id)} disabled={sendingEmail === order.id} className="btn btn-sm btn-outline-secondary d-flex align-items-center" style={{ borderRadius: 8, padding: '4px 8px' }} title="Email göndər">{sendingEmail === order.id ? <RefreshCw size={13} className="spinning" /> : <Mail size={13} />}</button>
                        <button onClick={() => openEdit(order)} className="btn btn-sm btn-outline-secondary d-flex align-items-center" style={{ borderRadius: 8, padding: '4px 8px' }}><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(order.id)} className="btn btn-sm btn-outline-danger d-flex align-items-center" style={{ borderRadius: 8, padding: '4px 8px' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-5" style={{ fontSize: 13 }}>Sifariş tapılmadı</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Modal */}
      {selected && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 18 }}>
              <div className="modal-header border-0 pb-0 px-4 pt-4">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={20} color="#e30613" />
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">{selected.name}</h6>
                    <div style={{ fontSize: 11, color: '#adb5bd' }}>Sifariş #{selected.id} · {fmtDate(selected.created_at)}</div>
                  </div>
                  <Badge status={selected.status} />
                </div>
                <button onClick={() => setSelected(null)} className="btn-close" />
              </div>
              <div className="modal-body px-4 py-3">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Müştəri</div>
                      <div className="fw-semibold mb-1">{selected.name}</div>
                      <div style={{ fontSize: 12, color: '#6c757d', display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={11} /> {selected.email || '—'}</div>
                      <div style={{ fontSize: 12, color: '#6c757d', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><Phone size={11} /> {selected.phone}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Tədbir</div>
                      <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={11} color="#6c757d" /> {selected.event_date || 'Tarix yoxdur'}</div>
                      <div style={{ fontSize: 12, color: '#6c757d', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><MapPin size={11} /> {selected.location || '—'}</div>
                    </div>
                  </div>
                </div>
                {selected.note && (
                  <div className="p-3 rounded-3 mb-3" style={{ background: '#fff8e1', border: '1px solid #ffe082' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Qeyd</div>
                    <div style={{ fontSize: 13 }}>{selected.note}</div>
                  </div>
                )}
                {selected.items?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Məhsullar ({selected.items.length})</div>
                    {selected.items.map((item: any, i) => {
                      const prod = getProduct(item.productId);
                      const img  = prod?.images?.[0] || item.image || '';
                      const name = prod?.name || item.name || item.productId || '—';
                      const cat  = prod?.category || item.category || '';
                      return (
                        <div key={i} className="d-flex align-items-center gap-3 p-2 rounded-3 mb-2" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 9, background: '#e9ecef', overflow: 'hidden', flexShrink: 0 }}>
                            {img ? <img src={img} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div className="d-flex align-items-center justify-content-center h-100"><Package size={16} color="#adb5bd" /></div>}
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <div className="fw-semibold" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                            {cat && <div style={{ fontSize: 10, color: '#adb5bd' }}>{cat}</div>}
                            {item.technicalAnswers && Object.keys(item.technicalAnswers).length > 0 && (
                              <div style={{ fontSize: 10, color: '#6c757d', marginTop: 2 }}>
                                {Object.entries(item.technicalAnswers).map(([k,v]) => `${k}: ${v}`).join(' · ')}
                              </div>
                            )}
                          </div>
                          <span className="badge bg-light text-dark border" style={{ fontSize: 11, borderRadius: 8, flexShrink: 0 }}>{item.quantity} ədəd</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="modal-footer border-top py-3 px-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {/* Status + email */}
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  <select className="form-select form-select-sm" style={{ borderRadius: 9, fontSize: 12, width: 'auto' }}
                    value={selected.status}
                    onChange={async e => {
                      const newStatus = e.target.value;
                      await fetch(`/api/orders/${selected.id}/status`, { method: 'PATCH', headers: h, body: JSON.stringify({ status: newStatus, send_email: sendStatusEmail }) });
                      setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, status: newStatus } : o));
                      setSelected(s => s ? { ...s, status: newStatus } : s);
                      if (sendStatusEmail && selected.email) toast.success('Status yeniləndi və email göndərildi.');
                      else toast.success('Status yeniləndi.');
                    }}>
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  {selected.email && (
                    <label className="d-flex align-items-center gap-1 mb-0" style={{ fontSize: 11, cursor: 'pointer', userSelect: 'none', color: '#6c757d' }}>
                      <input type="checkbox" checked={sendStatusEmail} onChange={e => setSendStatusEmail(e.target.checked)} style={{ cursor: 'pointer' }} />
                      Email bildiriş göndər
                    </label>
                  )}
                </div>
                <button onClick={() => handleSendEmail(selected.id)} disabled={sendingEmail === selected.id} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 9 }}>
                  <Send size={12} /> Sifariş Emaili
                </button>
                <button onClick={() => { setSelected(null); openEdit(selected); }} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 9 }}>
                  <Pencil size={12} /> Düzəlt
                </button>
                <button onClick={() => setSelected(null)} className="btn btn-sm btn-danger fw-semibold" style={{ borderRadius: 9 }}>Bağla</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 18 }}>
              <div className="modal-header border-0 pb-0 px-4 pt-4">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: editId ? '#fff3cd' : '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editId ? <Pencil size={18} color="#664d03" /> : <Plus size={18} color="#e30613" />}
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">{editId ? 'Sifarişi Düzəlt' : 'Yeni Sifariş'}</h6>
                    <div style={{ fontSize: 11, color: '#adb5bd' }}>{editId ? `#${editId}` : 'Yeni sifariş əlavə et'}</div>
                  </div>
                </div>
                <button onClick={closeModal} className="btn-close" />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body px-4 py-3">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Ad Soyad *</label>
                      <input required className={inputCls} style={{ borderRadius: 9 }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ad Soyad" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Telefon *</label>
                      <input required className={inputCls} style={{ borderRadius: 9 }} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+994 XX XXX XX XX" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Email</label>
                      <input type="email" className={inputCls} style={{ borderRadius: 9 }} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Status</label>
                      <select className="form-select form-select-sm" style={{ borderRadius: 9 }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                        {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Tədbir Tarixi</label>
                      <input type="date" className={inputCls} style={{ borderRadius: 9 }} value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Məkan</label>
                      <input className={inputCls} style={{ borderRadius: 9 }} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Bakı, Hilton Hotel..." />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Qeyd</label>
                      <textarea rows={3} className={inputCls} style={{ resize: 'none', borderRadius: 9 }} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Əlavə qeydlər..." />
                    </div>

                    {/* Items */}
                    <div className="col-12">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <label className="form-label fw-semibold mb-0" style={{ fontSize: 12 }}>Məhsullar</label>
                        <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 8, fontSize: 11 }}
                          onClick={() => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 1 }] }))}>
                          <Plus size={12} /> Əlavə et
                        </button>
                      </div>
                      {form.items.map((item, i) => (
                        <div key={i} className="d-flex gap-2 mb-2">
                          <input className={inputCls} style={{ borderRadius: 9, flex: 3 }} value={item.productId} onChange={e => setForm(f => { const items = [...f.items]; items[i] = { ...items[i], productId: e.target.value }; return { ...f, items }; })} placeholder="Məhsul ID və ya adı" />
                          <input type="number" min={1} className={inputCls} style={{ borderRadius: 9, flex: 1 }} value={item.quantity} onChange={e => setForm(f => { const items = [...f.items]; items[i] = { ...items[i], quantity: Number(e.target.value) }; return { ...f, items }; })} />
                          <button type="button" className="btn btn-sm btn-outline-danger d-flex align-items-center" style={{ borderRadius: 9 }} onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top py-3 px-4 gap-2">
                  <button type="button" onClick={closeModal} className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 9 }}>Ləğv Et</button>
                  <button type="submit" disabled={saving} className="btn btn-sm btn-danger fw-semibold d-flex align-items-center gap-1" style={{ borderRadius: 9 }}>
                    <Check size={13} /> {saving ? 'Saxlanır...' : editId ? 'Yenilə' : 'Sifariş Yarat'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}