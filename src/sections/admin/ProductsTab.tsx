import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Package, X, Check, Image as ImageIcon, Tag, Search, RefreshCw, Eye, EyeOff, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

interface Product {
  id: string; name: string; category: string; description: string;
  technicalSpecs: Record<string, string>; images: string[]; tags: string[];
  relatedProducts: string[]; active: number; sort_order: number;
}

interface SpecTemplate {
  id: string; name: string; unit: string; category: string; description: string; sort_order: number;
}

const EMPTY: Omit<Product, 'id' | 'active' | 'sort_order'> = {
  name: '', category: '', description: '', technicalSpecs: {}, images: [''], tags: [], relatedProducts: [],
};

const inputCls = 'form-control form-control-sm';

function MediaPicker({ token, onPick, onClose }: { token: string; onPick: (url: string) => void; onClose: () => void }) {
  const [files, setFiles] = useState<{ filename: string; url: string }[]>([]);
  useEffect(() => {
    fetch('/api/media', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(setFiles).catch(() => {});
  }, []);
  return (
    <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h6 className="modal-title fw-bold">Media Seç</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body px-4 pb-4">
            {files.length === 0 ? <div className="text-center py-4 text-muted" style={{ fontSize: 13 }}>Media yoxdur.</div> : (
              <div className="row g-2">
                {files.map(f => (
                  <div key={f.filename} className="col-4 col-md-3">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }} onClick={() => { onPick(f.url); onClose(); }}>
                      <div style={{ height: 80, background: '#fff', borderBottom: '1px solid #f1f3f5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={f.url} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '4px' }} />
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

export default function ProductsTab({ token }: { token: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState({ ...EMPTY });
  const [activeTab, setActiveTab] = useState<'info' | 'images' | 'specs' | 'tags'>('info');
  const [saving, setSaving]     = useState(false);
  const [specKey, setSpecKey]   = useState('');
  const [specVal, setSpecVal]   = useState('');
  const [specUnit, setSpecUnit] = useState('');
  const [templates, setTemplates] = useState<SpecTemplate[]>([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [tmplForm, setTmplForm] = useState({ name: '', unit: '', category: '', description: '' });
  const [tmplEditId, setTmplEditId] = useState<string | null>(null);
  const [mediaPicker, setMediaPicker] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [imgPreviews, setImgPreviews] = useState<boolean[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const toast = useToast();
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const uploadImage = async (file: File, idx: number) => {
    setUploadingIdx(idx);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/media/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!r.ok) throw new Error('Upload xətası');
      const d = await r.json();
      const url = d.url || d.filename || '';
      if (!url) throw new Error('URL yoxdur');
      setImage(idx, url);
      setTimeout(() => {
        setImgPreviews(p => { const n = [...p]; n[idx] = true; return n; });
      }, 100);
      toast.success('Şəkil yükləndi ✓');
    } catch {
      toast.error('Şəkil yüklənmədi');
    } finally {
      setUploadingIdx(null);
    }
  };

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/products');
    setProducts(r.ok ? await r.json() : []);
    setLoading(false);
  };

  const loadTemplates = async () => {
    const r = await fetch('/api/spec-templates', { headers: { Authorization: `Bearer ${token}` } });
    setTemplates(r.ok ? await r.json() : []);
  };

  useEffect(() => { load(); loadTemplates(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY, images: [''] });
    setActiveTab('info'); setShowModal(true);
  };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ name: p.name, category: p.category, description: p.description, technicalSpecs: { ...p.technicalSpecs }, images: p.images.length ? [...p.images] : [''], tags: [...p.tags], relatedProducts: [...p.relatedProducts] });
    setActiveTab('info'); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditId(null); setSpecKey(''); setSpecVal(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, images: form.images.filter(Boolean), active: 1 };
      const res  = await fetch(editId ? `/api/products/${editId}` : '/api/products', {
        method: editId ? 'PUT' : 'POST', headers: h, body: JSON.stringify(body),
      });
      if (!res.ok) { toast.error((await res.json()).error); return; }
      toast.success(editId ? 'Məhsul yeniləndi.' : 'Məhsul əlavə edildi.');
      await load(); closeModal();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" məhsulunu silmək istədiyinizə əminsiniz?`)) return;
    const r = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: h });
    if (r.ok) { toast.success('Məhsul silindi.'); await load(); }
    else toast.error('Silmək alınmadı.');
  };

  const handleToggle = async (p: Product) => {
    await fetch(`/api/products/${p.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ ...p, active: p.active ? 0 : 1 }) });
    await load();
  };

  const setImage   = (i: number, v: string) => setForm(f => { const imgs = [...f.images]; imgs[i] = v; return { ...f, images: imgs }; });
  const addImage   = () => setForm(f => ({ ...f, images: [...f.images, ''] }));
  const rmImage    = (i: number) => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }));
  const addSpec = () => {
    if (!specKey.trim()) return;
    const valWithUnit = specVal.trim() + (specUnit.trim() ? ' ' + specUnit.trim() : '');
    setForm(f => ({ ...f, technicalSpecs: { ...f.technicalSpecs, [specKey.trim()]: valWithUnit } }));
    setSpecKey(''); setSpecVal(''); setSpecUnit('');
  };
  const rmSpec = (k: string) => setForm(f => { const s = { ...f.technicalSpecs }; delete s[k]; return { ...f, technicalSpecs: s }; });

  const applyTemplate = (t: SpecTemplate) => {
    if (form.technicalSpecs[t.name] !== undefined) return; // artıq var
    setForm(f => ({ ...f, technicalSpecs: { ...f.technicalSpecs, [t.name]: t.unit ? '' : '' } }));
    setSpecKey(t.name); setSpecVal(''); setSpecUnit(t.unit);
  };

  const saveTmpl = async () => {
    if (!tmplForm.name.trim()) return;
    const method = tmplEditId ? 'PUT' : 'POST';
    const url = tmplEditId ? `/api/spec-templates/${tmplEditId}` : '/api/spec-templates';
    const r = await fetch(url, { method, headers: h, body: JSON.stringify(tmplForm) });
    if (r.ok) { toast.success(tmplEditId ? 'Şablon yeniləndi.' : 'Şablon yaradıldı.'); setTmplForm({ name: '', unit: '', category: '', description: '' }); setTmplEditId(null); await loadTemplates(); }
    else { const d = await r.json(); toast.error(d.error || 'Xəta'); }
  };

  const deleteTmpl = async (id: string) => {
    if (!window.confirm('Şablonu silmək istəyirsiniz?')) return;
    const r = await fetch(`/api/spec-templates/${id}`, { method: 'DELETE', headers: h });
    if (r.ok) { toast.success('Şablon silindi.'); await loadTemplates(); }
  };

  const applyAllTemplates = (tList: SpecTemplate[]) => {
    const newSpecs = { ...form.technicalSpecs };
    tList.forEach(t => { if (newSpecs[t.name] === undefined) newSpecs[t.name] = ''; });
    setForm(f => ({ ...f, technicalSpecs: newSpecs }));
    toast.success(`${tList.length} xüsusiyyət tətbiq edildi.`);
  };

  const filtered = products.filter(p =>
    [p.name, p.category, ...(p.tags||[])].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  const tabBtn = (id: typeof activeTab, label: string) => (
    <button type="button" onClick={() => setActiveTab(id)}
      className={`btn btn-sm ${activeTab === id ? 'btn-danger' : 'btn-outline-secondary'} fw-semibold`}
      style={{ borderRadius: 8, fontSize: 11 }}>
      {label}
    </button>
  );

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-0 fw-bold">Məhsullar</h5>
          <div style={{ fontSize: 12, color: '#6c757d' }}>{products.length} məhsul</div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <div className="btn-group" style={{ borderRadius: 10, overflow: 'hidden' }}>
            <button onClick={() => setViewMode('list')} className={`btn btn-sm d-flex align-items-center gap-1 ${viewMode === 'list' ? 'btn-dark' : 'btn-outline-secondary'}`} style={{ borderRadius: '10px 0 0 10px', padding: '6px 10px' }} title="Sətir görünüşü"><List size={14} /></button>
            <button onClick={() => setViewMode('grid')} className={`btn btn-sm d-flex align-items-center gap-1 ${viewMode === 'grid' ? 'btn-dark' : 'btn-outline-secondary'}`} style={{ borderRadius: '0 10px 10px 0', padding: '6px 10px' }} title="Grid görünüşü"><LayoutGrid size={14} /></button>
          </div>
          <button onClick={load} className="btn btn-sm btn-outline-secondary d-flex align-items-center" style={{ borderRadius: 10 }}><RefreshCw size={13} /></button>
          <button onClick={() => setShowTemplateManager(true)} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 fw-semibold" style={{ borderRadius: 10, padding: '8px 14px' }}>
            <Tag size={13} /> Metriklər
          </button>
          <button onClick={openCreate} className="btn btn-danger btn-sm fw-semibold d-flex align-items-center gap-2" style={{ borderRadius: 10, padding: '8px 16px' }}><Plus size={14} /> Yeni Məhsul</button>
        </div>
      </div>

      <div className="position-relative mb-4">
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
        <input className={inputCls} style={{ borderRadius: 10, paddingLeft: 30 }} placeholder="Ad, kateqoriya, teq..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" style={{ width: 28, height: 28 }} /></div>
      ) : viewMode === 'list' ? (
        <div className="ag-theme-alpine" style={{ height: 520, width: '100%', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          <AgGridReact
            rowData={filtered}
            rowHeight={64}
            headerHeight={42}
            pagination={true}
            paginationPageSize={20}
            suppressCellFocus={true}
            animateRows={true}
            defaultColDef={{ resizable: true, sortable: true, filter: true, suppressHeaderMenuButton: true }}
            columnDefs={[
              {
                headerName: '',
                field: 'images',
                width: 72,
                sortable: false,
                filter: false,
                resizable: false,
                cellRenderer: (p: any) => {
                  const src = p.value?.[0];
                  return src
                    ? <img src={src} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, border: '1px solid #f1f3f5', background: '#fff', padding: 2 }} />
                    : <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #f1f3f5', background: '#f8f9fa', color: '#adb5bd' }}><Package size={20} /></div>;
                },
              },
              {
                headerName: 'Ad',
                field: 'name',
                flex: 2,
                minWidth: 160,
                cellRenderer: (p: any) => (
                  <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, display: 'flex', alignItems: 'center', height: '100%' }}>{p.value}</div>
                ),
              },
              {
                headerName: 'Kateqoriya',
                field: 'category',
                flex: 1,
                minWidth: 120,
                cellRenderer: (p: any) => (
                  <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    {p.value ? <span style={{ background: '#f1f3f5', color: '#495057', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px' }}>{p.value}</span> : null}
                  </div>
                ),
              },
              {
                headerName: 'Teqlər',
                field: 'tags',
                flex: 1,
                minWidth: 120,
                sortable: false,
                cellRenderer: (p: any) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%', flexWrap: 'wrap' }}>
                    {(p.value || []).slice(0, 3).map((t: string) => (
                      <span key={t} style={{ background: '#e9ecef', color: '#6c757d', fontSize: 10, borderRadius: 20, padding: '2px 8px' }}>{t}</span>
                    ))}
                  </div>
                ),
              },
              {
                headerName: 'Status',
                field: 'active',
                width: 100,
                filter: false,
                cellRenderer: (p: any) => (
                  <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    {p.value
                      ? <span style={{ background: '#d1e7dd', color: '#0a3622', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px' }}>Aktiv</span>
                      : <span style={{ background: '#f8d7da', color: '#58151c', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px' }}>Deaktiv</span>}
                  </div>
                ),
              },
              {
                headerName: 'Əməliyyat',
                field: 'id',
                width: 140,
                sortable: false,
                filter: false,
                resizable: false,
                cellRenderer: (p: any) => {
                  const prod = filtered.find((x: Product) => x.id === p.value);
                  if (!prod) return null;
                  return (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', height: '100%' }}>
                      <button title="Düzəlt" onClick={() => openEdit(prod)}
                        style={{ border: '1px solid #dee2e6', background: '#fff', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Pencil size={13} color="#495057" />
                      </button>
                      <button title={prod.active ? 'Deaktiv et' : 'Aktiv et'} onClick={() => handleToggle(prod)}
                        style={{ border: '1px solid #dee2e6', background: '#fff', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {prod.active ? <EyeOff size={13} color="#f59e0b" /> : <Eye size={13} color="#22c55e" />}
                      </button>
                      <button title="Sil" onClick={() => handleDelete(prod.id, prod.name)}
                        style={{ border: '1px solid #fee2e2', background: '#fff5f5', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={13} color="#dc3545" />
                      </button>
                    </div>
                  );
                },
              },
            ]}
          />
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map(p => (
            <div key={p.id} className="col-6 col-md-4 col-lg-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, overflow: 'hidden', opacity: p.active ? 1 : 0.6, transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}>
                <div style={{ height: 140, background: '#fff', borderBottom: '1px solid #f1f3f5', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.images?.[0] ? <img src={p.images[0]} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 6 }} /> : <div className="d-flex align-items-center justify-content-center h-100 text-muted"><Package size={32} opacity={0.3} /></div>}
                  {!p.active && <span style={{ position: 'absolute', top: 8, right: 8, background: '#dc3545', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>Deaktiv</span>}
                  {p.category && <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>{p.category}</span>}
                </div>
                <div className="p-3">
                  <div className="fw-bold mb-1" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  {p.tags?.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {p.tags.slice(0, 3).map(tag => <span key={tag} style={{ background: '#f1f3f5', color: '#6c757d', fontWeight: 500, fontSize: 9, borderRadius: 20, padding: '2px 8px' }}>{tag}</span>)}
                    </div>
                  )}
                  <div className="d-flex gap-1 mt-2">
                    <button onClick={() => openEdit(p)} className="btn btn-sm btn-outline-secondary flex-grow-1 d-flex align-items-center justify-content-center gap-1" style={{ borderRadius: 8, fontSize: 11 }}><Pencil size={11} /> Düzəlt</button>
                    <button onClick={() => handleToggle(p)} className={`btn btn-sm ${p.active ? 'btn-outline-warning' : 'btn-outline-success'} d-flex align-items-center`} style={{ borderRadius: 8, padding: '4px 8px' }}>{p.active ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="btn btn-sm btn-outline-danger d-flex align-items-center" style={{ borderRadius: 8, padding: '4px 8px' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-12 text-center py-5 text-muted"><Package size={36} style={{ marginBottom: 12, opacity: 0.3 }} /><div>Məhsul tapılmadı</div></div>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 18 }}>
              <div className="modal-header border-0 px-4 pt-4 pb-2">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: editId ? '#fff3cd' : '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editId ? <Pencil size={18} color="#664d03" /> : <Plus size={18} color="#e30613" />}
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">{editId ? 'Məhsulu Düzəlt' : 'Yeni Məhsul'}</h6>
                    <div style={{ fontSize: 11, color: '#adb5bd' }}>{editId || 'Yeni məhsul əlavə et'}</div>
                  </div>
                </div>
                <button className="btn-close" onClick={closeModal} />
              </div>

              <div className="d-flex gap-2 px-4 pt-2 pb-0">
                {tabBtn('info', 'Məlumat')}
                {tabBtn('images', `Şəkillər (${form.images.filter(Boolean).length})`)}
                {tabBtn('specs', `Texniki (${Object.keys(form.technicalSpecs).length})`)}
                {tabBtn('tags', `Teqlər (${form.tags.length})`)}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body px-4 py-3" style={{ minHeight: 320 }}>
                  {activeTab === 'info' && (
                    <div className="d-flex flex-column gap-3">
                      <div className="row g-3">
                        <div className="col-md-8">
                          <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Məhsul Adı *</label>
                          <input required className={inputCls} style={{ borderRadius: 9 }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Məs: LED Ekran 3×4m" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Kateqoriya *</label>
                          <input required className={inputCls} style={{ borderRadius: 9 }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="LED, Səs, Səhnə..." />
                        </div>
                      </div>
                      <div>
                        <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Təsvir</label>
                        <textarea className="form-control form-control-sm" style={{ borderRadius: 9, resize: 'none' }} rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Məhsul haqqında ətraflı məlumat yazın..." />
                      </div>
                      {/* Növbəti addım göstəricisi */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 9, fontSize: 11 }} onClick={() => setActiveTab('images')}>
                          <ImageIcon size={12} /> Şəkillər <ChevronRight size={11} />
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 9, fontSize: 11 }} onClick={() => setActiveTab('specs')}>
                          Texniki <ChevronRight size={11} />
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 9, fontSize: 11 }} onClick={() => setActiveTab('tags')}>
                          <Tag size={12} /> Teqlər <ChevronRight size={11} />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'images' && (
                    <div className="d-flex flex-column gap-3">
                      <div className="row g-3">
                        {form.images.map((img, idx) => (
                          <div key={idx} className="col-12 col-md-6">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, overflow: 'hidden' }}>
                              {/* Preview sahəsi */}
                              <div style={{ height: 200, background: '#f0f0f0', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {img ? (
                                  <>
                                    <img src={img}
                                      style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
                                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'; }}
                                    />
                                    <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#adb5bd', position: 'absolute', inset: 0 }}>
                                      <ImageIcon size={28} opacity={0.3} />
                                      <span style={{ fontSize: 11 }}>Şəkil yüklənmədi</span>
                                    </div>
                                    {/* Tam açmaq üçün link */}
                                    <a href={img} target="_blank" rel="noreferrer"
                                      style={{ position: 'absolute', bottom: 8, right: form.images.length > 1 ? 40 : 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 600, borderRadius: 6, padding: '3px 8px', textDecoration: 'none' }}>
                                      ↗ Tam
                                    </a>
                                  </>
                                ) : (
                                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted" style={{ gap: 6 }}>
                                    <ImageIcon size={28} opacity={0.3} />
                                    <span style={{ fontSize: 11 }}>Şəkil yoxdur</span>
                                  </div>
                                )}
                                {/* Sil düyməsi */}
                                {form.images.length > 1 && (
                                  <button type="button" onClick={() => rmImage(idx)}
                                    style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 8, background: 'rgba(220,53,69,0.9)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={12} />
                                  </button>
                                )}
                                {/* Sıra nömrəsi */}
                                <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 7px' }}>#{idx + 1}</span>
                              </div>

                              {/* Upload + URL */}
                              <div className="p-3 d-flex flex-column gap-2">
                                {/* Drag & drop */}
                                <label
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1.5px dashed', borderColor: uploadingIdx === idx ? '#e30613' : '#dee2e6', borderRadius: 9, padding: '10px 12px', textAlign: 'center', cursor: 'pointer', background: uploadingIdx === idx ? '#fff5f5' : '#fafafa', transition: '0.15s' }}
                                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#e30613'; e.currentTarget.style.background = '#fff5f5'; }}
                                  onDragLeave={e => { e.currentTarget.style.borderColor = '#dee2e6'; e.currentTarget.style.background = '#fafafa'; }}
                                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#dee2e6'; e.currentTarget.style.background = '#fafafa'; const f = e.dataTransfer.files[0]; if (f) uploadImage(f, idx); }}
                                >
                                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, idx); e.target.value = ''; }} />
                                  {uploadingIdx === idx ? (
                                    <><div className="spinner-border spinner-border-sm text-danger" style={{ width: 14, height: 14 }} /><span style={{ fontSize: 11, color: '#e30613', fontWeight: 600 }}>Yüklənir...</span></>
                                  ) : (
                                    <><ImageIcon size={13} color="#adb5bd" /><span style={{ fontSize: 11, color: '#6c757d' }}>Sürüklə və burax və ya <span style={{ color: '#e30613', fontWeight: 600 }}>seç</span></span></>
                                  )}
                                </label>
                                {/* Media picker + URL input */}
                                <div className="d-flex gap-1">
                                  <input className={inputCls} style={{ borderRadius: 8, fontSize: 11, flex: 1 }} value={img} onChange={e => setImage(idx, e.target.value)} placeholder="https://..." />
                                  <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center" style={{ borderRadius: 8, padding: '3px 9px', flexShrink: 0 }} title="Mediadan seç" onClick={() => setMediaPicker(idx)}>
                                    <ImageIcon size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Yeni şəkil əlavə et */}
                        <div className="col-12 col-md-6">
                          <button type="button" onClick={addImage}
                            style={{ width: '100%', height: '100%', minHeight: 240, border: '2px dashed #dee2e6', borderRadius: 14, background: '#fafafa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#adb5bd', transition: '0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e30613'; (e.currentTarget as HTMLElement).style.color = '#e30613'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#dee2e6'; (e.currentTarget as HTMLElement).style.color = '#adb5bd'; }}>
                            <Plus size={24} />
                            <span style={{ fontSize: 12, fontWeight: 600 }}>Şəkil əlavə et</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'specs' && (
                    <div className="d-flex flex-column gap-3">

                      {/* Şablon seç */}
                      {templates.length > 0 && (
                        <div style={{ background: '#f0f4ff', borderRadius: 12, padding: 14, border: '1px solid #dde3f5' }}>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#3b5bdb' }}>Şablondan əlavə et</div>
                            <button type="button" onClick={() => applyAllTemplates(templates)} className="btn btn-sm btn-outline-primary" style={{ borderRadius: 8, fontSize: 10, padding: '2px 10px' }}>Hamısını tətbiq et</button>
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            {templates.map(t => (
                              <button key={t.id} type="button" onClick={() => applyTemplate(t)}
                                style={{ border: form.technicalSpecs[t.name] !== undefined ? '1.5px solid #3b5bdb' : '1px solid #c5d0e6', background: form.technicalSpecs[t.name] !== undefined ? '#dde3f5' : '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: form.technicalSpecs[t.name] !== undefined ? '#3b5bdb' : '#495057', cursor: 'pointer', transition: '0.15s', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {form.technicalSpecs[t.name] !== undefined ? <Check size={10} /> : <Plus size={10} />}
                                {t.name}{t.unit ? ` (${t.unit})` : ''}
                                {t.category && <span style={{ fontSize: 9, color: '#adb5bd', marginLeft: 2 }}>{t.category}</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Manual əlavə et */}
                      <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '14px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#495057' }}>Yeni xüsusiyyət əlavə et</div>
                          <button type="button" onClick={() => setShowTemplateManager(true)} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ borderRadius: 8, fontSize: 10, padding: '3px 10px' }}>
                            <Tag size={10} /> Metrik şablonları
                          </button>
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                          <input className={inputCls} style={{ borderRadius: 9, flex: '1 1 140px' }} value={specKey} onChange={e => setSpecKey(e.target.value)} placeholder="Ad (məs: Güc, Ölçü)" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpec())} />
                          <input className={inputCls} style={{ borderRadius: 9, flex: '1 1 120px' }} value={specVal} onChange={e => setSpecVal(e.target.value)} placeholder="Dəyər (məs: 1000, 3×4)" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpec())} />
                          <input className={inputCls} style={{ borderRadius: 9, flex: '0 0 80px' }} value={specUnit} onChange={e => setSpecUnit(e.target.value)} placeholder="Vahid (W, m)" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpec())} />
                          <button type="button" onClick={addSpec} className="btn btn-danger btn-sm d-flex align-items-center gap-1 fw-semibold" style={{ borderRadius: 9, padding: '6px 14px', flexShrink: 0 }}>
                            <Plus size={13} /> Əlavə et
                          </button>
                        </div>
                        <div style={{ fontSize: 10, color: '#adb5bd', marginTop: 6 }}>Enter ilə sürətli əlavə. Vahid avtomatik birləşir.</div>
                      </div>

                      {/* Mövcud xüsusiyyətlər */}
                      {Object.entries(form.technicalSpecs).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: '#adb5bd' }}>
                          <Tag size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Hələ xüsusiyyət yoxdur</div>
                          <div style={{ fontSize: 11 }}>Yuxarıdan əlavə edin və ya şablondan seçin</div>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {Object.entries(form.technicalSpecs).map(([k, v], i) => (
                            <div key={k} className="d-flex align-items-center gap-2" style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 10, padding: '8px 12px' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', minWidth: 20 }}>#{i+1}</span>
                              <input className="form-control form-control-sm fw-semibold" style={{ borderRadius: 8, fontSize: 12, flex: '0 0 35%', border: '1px solid #dee2e6', background: '#f8f9fa' }} value={k}
                                onChange={e => { const newKey = e.target.value; setForm(f => { const entries = Object.entries(f.technicalSpecs); const updated: Record<string, string> = {}; entries.forEach(([ek, ev]) => { updated[ek === k ? newKey : ek] = ev; }); return { ...f, technicalSpecs: updated }; }); }} />
                              <span style={{ color: '#dee2e6' }}>:</span>
                              <input className="form-control form-control-sm" style={{ borderRadius: 8, fontSize: 12, flex: 1, border: '1px solid #dee2e6' }} value={v}
                                onChange={e => setForm(f => ({ ...f, technicalSpecs: { ...f.technicalSpecs, [k]: e.target.value } }))} />
                              <button type="button" onClick={() => {
                                const t = templates.find(t => t.name === k);
                                if (!t && window.confirm(`"${k}" şablon kimi yadda saxlansın?`)) {
                                  fetch('/api/spec-templates', { method: 'POST', headers: h, body: JSON.stringify({ name: k, unit: '', category: '' }) })
                                    .then(r => r.ok && loadTemplates());
                                }
                              }} className="btn btn-sm btn-outline-secondary d-flex align-items-center" style={{ borderRadius: 8, padding: '3px 7px', flexShrink: 0 }} title="Şablon kimi saxla"><Tag size={10} /></button>
                              <button type="button" onClick={() => rmSpec(k)} className="btn btn-sm btn-outline-danger d-flex align-items-center" style={{ borderRadius: 8, padding: '3px 7px', flexShrink: 0 }}><X size={11} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'tags' && (
                    <div className="d-flex flex-column gap-3">
                      {/* Input */}
                      <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '16px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#495057', marginBottom: 10 }}>Teq əlavə et</div>
                        <div className="d-flex gap-2">
                          <input
                            className={inputCls}
                            style={{ borderRadius: 9, flex: 1 }}
                            placeholder="Teq yazın (Enter ilə əlavə edin)"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val && !form.tags.includes(val)) {
                                  setForm(f => ({ ...f, tags: [...f.tags, val] }));
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <button type="button"
                            className="btn btn-danger btn-sm d-flex align-items-center gap-1 fw-semibold"
                            style={{ borderRadius: 9, padding: '6px 14px', flexShrink: 0 }}
                            onClick={e => {
                              const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                              const val = input?.value.trim();
                              if (val && !form.tags.includes(val)) {
                                setForm(f => ({ ...f, tags: [...f.tags, val] }));
                                if (input) input.value = '';
                              }
                            }}>
                            <Plus size={13} /> Əlavə et
                          </button>
                        </div>
                        <div style={{ fontSize: 10, color: '#adb5bd', marginTop: 6 }}>İpucu: Enter ilə sürətli əlavə edin</div>
                      </div>
                      {/* Teqlər */}
                      {form.tags.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: '#adb5bd' }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🏷️</div>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Hələ teq yoxdur</div>
                          <div style={{ fontSize: 11 }}>Teqlər məhsulun axtarışını asanlaşdırır</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 8 }}>{form.tags.length} teq</div>
                          <div className="d-flex flex-wrap gap-2">
                            {form.tags.map((tag, i) => (
                              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff0f0', color: '#e30613', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, border: '1px solid #ffd6d6' }}>
                                {tag}
                                <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#e30613', display: 'flex', alignItems: 'center', opacity: 0.7 }}><X size={11} /></button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-footer border-top py-3 px-4 gap-2">
                  <button type="button" onClick={closeModal} className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 9 }}>Ləğv Et</button>
                  <button type="submit" disabled={saving} className="btn btn-sm btn-danger fw-semibold d-flex align-items-center gap-1" style={{ borderRadius: 9 }}>
                    <Check size={13} /> {saving ? 'Saxlanır...' : editId ? 'Yenilə' : 'Əlavə et'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {mediaPicker !== null && <MediaPicker token={token} onPick={url => setImage(mediaPicker!, url)} onClose={() => setMediaPicker(null)} />}

      {/* ── Metriklər Offcanvas ── */}
      {showTemplateManager && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1040 }} onClick={() => setShowTemplateManager(false)} />
          <div style={{ position: 'fixed', top: 0, right: 0, width: 420, height: '100vh', background: '#fff', zIndex: 1045, boxShadow: '-4px 0 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', borderRadius: '16px 0 0 16px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Metrik Şablonları</div>
                <div style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>Məhsullara tətbiq edilə bilən xüsusiyyət şablonları</div>
              </div>
              <button onClick={() => { setShowTemplateManager(false); setTmplEditId(null); setTmplForm({ name: '', unit: '', category: '', description: '' }); }}
                style={{ border: 'none', background: '#f8f9fa', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* Yeni şablon formu */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f3f5', background: '#f8f9ff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#3b5bdb', marginBottom: 10 }}>
                {tmplEditId ? '✏️ Şablonu Redaktə Et' : '+ Yeni Şablon'}
              </div>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex gap-2">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#6c757d', marginBottom: 3 }}>Ad *</div>
                    <input className="form-control form-control-sm" style={{ borderRadius: 8 }} value={tmplForm.name} onChange={e => setTmplForm(f => ({ ...f, name: e.target.value }))} placeholder="məs: Güc, Ölçü, Çəki" onKeyDown={e => e.key === 'Enter' && saveTmpl()} />
                  </div>
                  <div style={{ width: 90 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#6c757d', marginBottom: 3 }}>Vahid</div>
                    <input className="form-control form-control-sm" style={{ borderRadius: 8 }} value={tmplForm.unit} onChange={e => setTmplForm(f => ({ ...f, unit: e.target.value }))} placeholder="W, m, kg" />
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#6c757d', marginBottom: 3 }}>Qrup</div>
                    <input className="form-control form-control-sm" style={{ borderRadius: 8 }} value={tmplForm.category} onChange={e => setTmplForm(f => ({ ...f, category: e.target.value }))} placeholder="Elektrik, Ölçü, Görünüş..." />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#6c757d', marginBottom: 3 }}>Açıqlama</div>
                    <input className="form-control form-control-sm" style={{ borderRadius: 8 }} value={tmplForm.description} onChange={e => setTmplForm(f => ({ ...f, description: e.target.value }))} placeholder="İstəyə bağlı..." />
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button onClick={saveTmpl} className="btn btn-sm btn-primary fw-semibold d-flex align-items-center gap-1 flex-grow-1" style={{ borderRadius: 8 }}>
                    <Check size={13} /> {tmplEditId ? 'Yenilə' : 'Şablon Yarat'}
                  </button>
                  {tmplEditId && (
                    <button onClick={() => { setTmplEditId(null); setTmplForm({ name: '', unit: '', category: '', description: '' }); }} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 8 }}>
                      <X size={12} /> Ləğv
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Şablon siyahısı */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {templates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#adb5bd' }}>
                  <Tag size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Hələ şablon yoxdur</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Yuxarıdan ilk şablonu yaradın</div>
                </div>
              ) : (
                <>
                  {/* Qruplara görə */}
                  {Array.from(new Set(templates.map(t => t.category || 'Digər'))).map(cat => (
                    <div key={cat} style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{cat}</div>
                      <div className="d-flex flex-column gap-2">
                        {templates.filter(t => (t.category || 'Digər') === cat).map(t => (
                          <div key={t.id} style={{ background: '#f8f9fa', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e9ecef' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                              <div style={{ fontSize: 11, color: '#6c757d', marginTop: 1 }}>
                                {t.unit && <span style={{ background: '#e9ecef', borderRadius: 4, padding: '1px 6px', marginRight: 6, fontSize: 10 }}>{t.unit}</span>}
                                {t.description && <span>{t.description}</span>}
                              </div>
                            </div>
                            <button onClick={() => { setTmplEditId(t.id); setTmplForm({ name: t.name, unit: t.unit, category: t.category, description: t.description }); }}
                              style={{ border: '1px solid #dee2e6', background: '#fff', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Redaktə et">
                              <Pencil size={12} color="#6c757d" />
                            </button>
                            <button onClick={() => deleteTmpl(t.id)}
                              style={{ border: '1px solid #fee2e2', background: '#fff5f5', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Sil">
                              <Trash2 size={12} color="#dc3545" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid #f1f3f5', background: '#f8f9fa', fontSize: 11, color: '#adb5bd', textAlign: 'center' }}>
              {templates.length} şablon · Məhsul redaktəsindən tətbiq edin
            </div>
          </div>
        </>
      )}
    </div>
  );
}