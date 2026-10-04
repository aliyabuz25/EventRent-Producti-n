import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, UserCheck, UserX, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../components/Toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'viewer';
  active: number;
  created_at: string;
  updated_at: string;
}

const ROLE_MAP = {
  admin:  { label: 'Admin',    bg: '#fff0f0', color: '#e30613' },
  sales:  { label: 'Satış',    bg: '#fff3cd', color: '#664d03' },
  viewer: { label: 'Baxıcı',   bg: '#e2d9f3', color: '#432874' },
};

const inputCls = 'form-control form-control-sm';
const EMPTY_FORM = { name: '', email: '', password: '', role: 'viewer' as User['role'], active: 1 };

export default function UsersTab({ token, currentUserId }: { token: string; currentUserId: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const toast = useToast();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/users', { headers });
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setError(''); setShowModal(true); };
  const openEdit   = (u: User) => { setEditId(u.id); setForm({ name: u.name, email: u.email, password: '', role: u.role, active: u.active }); setError(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditId(null); setForm({ ...EMPTY_FORM }); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { ...form };
      if (editId && !body.password) delete (body as any).password;
      const res = await fetch(editId ? `/api/users/${editId}` : '/api/users', {
        method: editId ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Xəta baş verdi.'); setSaving(false); return; }
      toast.success(editId ? 'İstifadəçi yeniləndi.' : 'İstifadəçi yaradıldı.');
      await load();
      closeModal();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu istifadəçini silmək istədiyinizə əminsiniz?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success('İstifadəçi silindi.');
    await load();
  };

  const handleToggle = async (id: number) => {
    const res = await fetch(`/api/users/${id}/toggle`, { method: 'PATCH', headers });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.info(data.active ? 'Hesab aktiv edildi.' : 'Hesab deaktiv edildi.');
    setUsers(prev => prev.map(u => u.id === id ? data : u));
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-danger" style={{ width: 28, height: 28 }} /></div>;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-0 fw-bold">İstifadəçilər</h5>
          <div style={{ fontSize: 12, color: '#6c757d' }}>{users.length} hesab</div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={load} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 10 }}><RefreshCw size={13} /></button>
          <button onClick={openCreate} className="btn btn-danger btn-sm fw-semibold d-flex align-items-center gap-2" style={{ borderRadius: 10, padding: '8px 16px' }}>
            <Plus size={14} /> Yeni İstifadəçi
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <div className="table-responsive">
          <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                {['Ad', 'Email', 'Rol', 'Status', 'Tarix', ''].map((h, i) => (
                  <th key={i} className={`fw-semibold text-muted border-0 py-3 ${i === 0 ? 'ps-4' : ''} ${i === 5 ? 'text-end pe-3' : ''}`}
                    style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const isMe = user.id === currentUserId;
                const role = ROLE_MAP[user.role] ?? { label: user.role, bg: '#f8f9fa', color: '#495057' };
                return (
                  <tr key={user.id} style={{ opacity: user.active ? 1 : 0.5 }}>
                    <td className="ps-4 align-middle">
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#e30613', fontWeight: 900, fontSize: 12 }}>{(user.name || user.email || '?')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="fw-semibold" style={{ fontSize: 13 }}>{user.name} {isMe && <span style={{ fontSize: 9, color: '#e30613', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: 4 }}>siz</span>}</div>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle" style={{ color: '#6c757d' }}>{user.email}</td>
                    <td className="align-middle">
                      <span style={{ background: role.bg, color: role.color, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {role.label}
                      </span>
                    </td>
                    <td className="align-middle">
                      <span style={{ background: user.active ? '#d1e7dd' : '#f8d7da', color: user.active ? '#0a3622' : '#58151c', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                        {user.active ? 'Aktiv' : 'Deaktiv'}
                      </span>
                    </td>
                    <td className="align-middle" style={{ fontSize: 11, color: '#adb5bd' }}>
                      {user.created_at && !isNaN(new Date(user.created_at).getTime()) ? (() => { try { return new Date(user.created_at).toLocaleDateString('az-AZ'); } catch { return new Date(user.created_at).toLocaleDateString(); } })() : '—'}
                    </td>
                    <td className="align-middle text-end pe-3">
                      <div className="d-flex gap-1 justify-content-end">
                        {!isMe && (
                          <button onClick={() => handleToggle(user.id)} title={user.active ? 'Deaktiv et' : 'Aktiv et'}
                            className={`btn btn-sm ${user.active ? 'btn-outline-warning' : 'btn-outline-success'} d-flex align-items-center`}
                            style={{ borderRadius: 8, padding: '4px 8px' }}>
                            {user.active ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>
                        )}
                        <button onClick={() => openEdit(user)} className="btn btn-sm btn-outline-secondary d-flex align-items-center" style={{ borderRadius: 8, padding: '4px 8px' }}><Pencil size={13} /></button>
                        {!isMe && (
                          <button onClick={() => handleDelete(user.id)} className="btn btn-sm btn-outline-danger d-flex align-items-center" style={{ borderRadius: 8, padding: '4px 8px' }}><Trash2 size={13} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 18 }}>
              <div className="modal-header border-0 pb-0 px-4 pt-4">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: editId ? '#fff3cd' : '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editId ? <Pencil size={18} color="#664d03" /> : <Plus size={18} color="#e30613" />}
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">{editId ? 'İstifadəçini Düzəlt' : 'Yeni İstifadəçi'}</h6>
                    <div style={{ fontSize: 11, color: '#adb5bd' }}>{editId ? `ID: ${editId}` : 'Yeni hesab yarat'}</div>
                  </div>
                </div>
                <button onClick={closeModal} className="btn-close" />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body px-4 py-3">
                  {error && <div className="alert alert-danger py-2 px-3 mb-3" style={{ borderRadius: 10, fontSize: 13 }}>{error}</div>}
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Ad Soyad *</label>
                      <input required className={inputCls} style={{ borderRadius: 9 }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ad Soyad" />
                    </div>
                    <div>
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Email *</label>
                      <input required type="email" className={inputCls} style={{ borderRadius: 9 }} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                    </div>
                    <div>
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>{editId ? 'Yeni Parol (boş = dəyişməz)' : 'Parol *'}</label>
                      <div className="d-flex gap-1">
                        <input
                          type={showPass ? 'text' : 'password'}
                          className={inputCls}
                          style={{ borderRadius: 9 }}
                          required={!editId}
                          value={form.password}
                          onChange={e => setForm({ ...form, password: e.target.value })}
                          placeholder={editId ? '••••••••' : 'Ən az 6 simvol'}
                          minLength={editId ? undefined : 6}
                        />
                        <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center" style={{ borderRadius: 9 }} onClick={() => setShowPass(v => !v)}>
                          {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Rol *</label>
                      <div className="d-flex gap-2">
                        {(Object.entries(ROLE_MAP) as [User['role'], typeof ROLE_MAP[User['role']]][]).map(([key, val]) => (
                          <div key={key} onClick={() => setForm({ ...form, role: key })}
                            style={{ flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${form.role === key ? val.color : '#dee2e6'}`, background: form.role === key ? val.bg : '#fff', transition: 'all 0.15s', textAlign: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: form.role === key ? val.color : '#495057' }}>{val.label}</div>
                            <div style={{ fontSize: 10, color: '#adb5bd', marginTop: 2 }}>
                              {key === 'admin' ? 'Tam giriş' : key === 'sales' ? 'Sifarişlər' : 'Yalnız baxış'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {editId && (
                      <div className="d-flex align-items-center gap-2">
                        <div className="form-check form-switch mb-0">
                          <input className="form-check-input" type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked ? 1 : 0 })} />
                        </div>
                        <label style={{ fontSize: 13 }}>Aktiv hesab</label>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-top py-3 px-4 gap-2">
                  <button type="button" onClick={closeModal} className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 9 }}>Ləğv Et</button>
                  <button type="submit" disabled={saving} className="btn btn-sm btn-danger fw-semibold d-flex align-items-center gap-1" style={{ borderRadius: 9 }}>
                    <Check size={13} /> {saving ? 'Saxlanır...' : editId ? 'Yenilə' : 'Yarat'}
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