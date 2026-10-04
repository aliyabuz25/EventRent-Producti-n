import React, { useState } from 'react';
import { Lead, LeadStatus, Product } from '../../types';
import { format } from 'date-fns';
import { Eye, Trash2, Filter, Search, FileText, Clock, CheckCircle2, TrendingUp, Mail, Phone, Calendar, MapPin, Package, Users, X, Info } from 'lucide-react';

const STATUS_MAP: Record<LeadStatus, { bg: string; color: string; label: string }> = {
  new:       { bg: '#cfe2ff', color: '#084298', label: 'Yeni' },
  contacted: { bg: '#fff3cd', color: '#664d03', label: 'Əlaqə' },
  quoted:    { bg: '#e2d9f3', color: '#432874', label: 'Təklif' },
  won:       { bg: '#d1e7dd', color: '#0a3622', label: 'Qazanıldı' },
  lost:      { bg: '#f8d7da', color: '#58151c', label: 'İtirildi' },
};

function Badge({ status }: { status: LeadStatus }) {
  const s = STATUS_MAP[status] ?? { bg: '#f8f9fa', color: '#495057', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

interface Props { leads: Lead[]; products: Product[]; token?: string; onReload?: () => void; }

export default function LeadsTab({ leads, products, token = '', onReload }: Props) {
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const updateStatus = async (id: string, status: LeadStatus) => {
    await fetch(`/api/leads/${id}/status`, { method: 'PATCH', headers: h, body: JSON.stringify({ status }) });
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : s);
    onReload?.();
  };
  const deleteLead = async (id: string) => {
    if (!window.confirm('Silmək istədiyinizə əminsiniz?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE', headers: h });
    if (selected?.id === id) setSelected(null);
    onReload?.();
  };

  const filtered = (leads ?? []).filter(l => {
    const mf = filter === 'all' || l.status === filter;
    const ms = [l.name, l.email, l.phone].join(' ').toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const stats = {
    total: (leads ?? []).length,
    new: (leads ?? []).filter(l => l.status === 'new').length,
    won: (leads ?? []).filter(l => l.status === 'won').length,
    conv: (leads ?? []).length ? Math.round((leads ?? []).filter(l => l.status === 'won').length / (leads ?? []).length * 100) : 0,
  };

  const inputCls = 'form-control form-control-sm';

  return (
    <div>
      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Ümumi', value: stats.total, Icon: FileText, color: '#e30613' },
          { label: 'Yeni', value: stats.new, Icon: Clock, color: '#0d6efd' },
          { label: 'Qazanıldı', value: stats.won, Icon: CheckCircle2, color: '#198754' },
          { label: 'Konversiya', value: `${stats.conv}%`, Icon: TrendingUp, color: '#6f42c1' },
        ].map((s, i) => (
          <div key={i} className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-3">
                <div className="mb-2" style={{ width: 36, height: 36, borderRadius: 9, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.Icon size={16} color={s.color} />
                </div>
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
              <input
                type="text"
                className={inputCls}
                placeholder="Ad, email, telefon..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 12, borderRadius: 8 }}
              />
            </div>
            <div className="d-flex flex-wrap gap-1">
              {(['all', 'new', 'contacted', 'quoted', 'won', 'lost'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`btn btn-sm ${filter === s ? 'btn-danger' : 'btn-outline-secondary'}`}
                  style={{ fontSize: 11, borderRadius: 8, fontWeight: 600 }}
                >
                  {s === 'all' ? 'Hamısı' : STATUS_MAP[s as LeadStatus].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                {['Müştəri', 'Tədbir', 'Məhsullar', 'Status', ''].map((h, i) => (
                  <th key={i} className={`fw-semibold text-muted border-0 py-3 ${i === 0 ? 'ps-3' : ''} ${i === 4 ? 'text-end pe-3' : ''}`}
                    style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id}>
                  <td className="ps-3 align-middle">
                    <div className="fw-semibold" style={{ fontSize: 13 }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: '#6c757d' }}>{lead.email}</div>
                    <div style={{ fontSize: 11, color: '#6c757d' }}>{lead.phone}</div>
                  </td>
                  <td className="align-middle">
                    <div style={{ fontSize: 12, color: '#495057' }}>
                      {lead.eventDate && !isNaN(new Date(lead.eventDate).getTime()) ? format(new Date(lead.eventDate), 'dd MMM yyyy') : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#adb5bd' }}>{lead.location || '—'}</div>
                  </td>
                  <td className="align-middle">
                    <div className="d-flex gap-1">
                      {(lead.items ?? []).slice(0, 3).map((item, idx) => {
                        const p = products.find(x => x.id === item.productId);
                        return (
                          <div key={idx} style={{ width: 32, height: 32, borderRadius: 8, background: '#f8f9fa', border: '1px solid #e9ecef', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#adb5bd' }}>
                            {p?.images?.[0] ? <img src={p.images[0]} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} referrerPolicy="no-referrer" /> : idx + 1}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="align-middle">
                    <div className="d-flex align-items-center gap-1">
                      <Badge status={lead.status} />
                      <select
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value as LeadStatus)}
                        className="form-select form-select-sm ms-1"
                        style={{ width: 'auto', fontSize: 11, borderRadius: 8, border: '1px solid #dee2e6' }}
                      >
                        {Object.entries(STATUS_MAP).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="align-middle text-end pe-3">
                    <div className="d-flex gap-1 justify-content-end">
                      <button onClick={() => setSelected(lead)} className="btn btn-sm btn-outline-secondary d-flex align-items-center" style={{ borderRadius: 8, padding: '4px 8px' }}><Eye size={13} /></button>
                      <button onClick={() => deleteLead(lead.id)} className="btn btn-sm btn-outline-danger d-flex align-items-center" style={{ borderRadius: 8, padding: '4px 8px' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-5" style={{ fontSize: 13 }}>Sorğu tapılmadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4">
                <div className="d-flex align-items-center gap-3">
                  <Badge status={selected.status} />
                  <div>
                    <h6 className="mb-0 fw-bold">{selected.name}</h6>
                    <div style={{ fontSize: 10, color: '#adb5bd' }}>ID: {selected.id}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="btn-close" />
              </div>
              <div className="modal-body px-4 py-3">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}><Users size={11} /> Müştəri</div>
                      <div className="fw-semibold mb-1">{selected.name}</div>
                      <div style={{ fontSize: 12, color: '#6c757d', display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={11} /> {selected.email}</div>
                      <div style={{ fontSize: 12, color: '#6c757d', display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={11} /> {selected.phone}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={11} /> Tədbir</div>
                      <div style={{ fontSize: 13 }}>{selected.eventDate && !isNaN(new Date(selected.eventDate).getTime()) ? format(new Date(selected.eventDate), 'dd MMMM yyyy') : 'Tarix qeyd edilməyib'}</div>
                      <div style={{ fontSize: 12, color: '#6c757d', display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={11} /> {selected.location || 'Məkan qeyd edilməyib'}</div>
                    </div>
                  </div>
                </div>
                {(selected.items ?? []).length > 0 && (
                  <div className="mb-3">
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}><Package size={11} /> Məhsullar</div>
                    <div className="d-flex flex-column gap-2">
                      {(selected.items ?? []).map((item, idx) => {
                        const p = products.find(x => x.id === item.productId);
                        return (
                          <div key={idx} className="d-flex align-items-center gap-3 p-2 rounded-3" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e9ecef', overflow: 'hidden', flexShrink: 0 }}>
                              {p?.images?.[0] ? <img src={p.images[0]} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} referrerPolicy="no-referrer" /> : <Package size={18} color="#adb5bd" />}
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-semibold" style={{ fontSize: 13 }}>{p?.name ?? 'Naməlum'}</div>
                              <div style={{ fontSize: 11, color: '#6c757d' }}>{p?.category ?? '—'}</div>
                            </div>
                            <span className="badge bg-light text-dark border" style={{ fontSize: 11, borderRadius: 8 }}>{item.quantity} ədəd</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {selected.note && (
                  <div className="p-3 rounded-3" style={{ background: '#fff8e1', border: '1px solid #ffe082' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}><Info size={11} /> Qeyd</div>
                    <div style={{ fontSize: 13, color: '#495057' }}>{selected.note}</div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top py-3 px-4 d-flex flex-wrap gap-2">
                <div style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.1em', width: '100%', marginBottom: 4 }}>Status Dəyiş</div>
                {(Object.entries(STATUS_MAP) as [LeadStatus, typeof STATUS_MAP[LeadStatus]][]).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => updateStatus(selected.id, k)}
                    className={`btn btn-sm ${selected.status === k ? 'btn-danger' : 'btn-outline-secondary'}`}
                    style={{ fontSize: 11, borderRadius: 8, fontWeight: 600 }}
                  >{v.label}</button>
                ))}
                <button onClick={() => setSelected(null)} className="btn btn-sm btn-secondary ms-auto" style={{ borderRadius: 8 }}>Bağla</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}