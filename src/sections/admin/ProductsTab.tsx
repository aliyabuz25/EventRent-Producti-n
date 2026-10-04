import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Package, X, Check, Image as ImageIcon, Tag, Search, RefreshCw, Eye, EyeOff, ChevronRight, LayoutGrid, List, Type, Hash, ListFilter, CheckSquare, ToggleLeft, Box, Palette } from 'lucide-react';
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

type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'dimensions' | 'color';

interface SpecTemplate {
  id: string; name: string; unit: string; category: string; description: string;
  field_type: FieldType; options: string[]; sort_order: number;
}

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'text',        label: 'Mətn',       icon: <Type size={18} />,        desc: 'Sərbəst mətn girişi' },
  { value: 'number',      label: 'Rəqəm',      icon: <Hash size={18} />,        desc: 'Ədədi dəyər + vahid' },
  { value: 'select',      label: 'Seçim',       icon: <ListFilter size={18} />,  desc: 'Bir seçim (dropdown)' },
  { value: 'multiselect', label: 'Çox seçim',   icon: <CheckSquare size={18} />, desc: 'Bir neçə seçim' },
  { value: 'boolean',     label: 'Bəli/Xeyr',   icon: <ToggleLeft size={18} />,  desc: 'Hə/Yox toggle' },
  { value: 'dimensions',  label: 'Ölçülər',     icon: <Box size={18} />,         desc: 'En × Boy × Hündürlük' },
  { value: 'color',       label: 'Rəng',         icon: <Palette size={18} />,     desc: 'Rəng seçimi + ad' },
];

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
  const [tmplForm, setTmplForm] = useState<{ name: string; unit: string; category: string; description: string; field_type: FieldType; options: string[] }>({ name: '', unit: '', category: '', description: '', field_type: 'text', options: [] });
  const [tmplOptionInput, setTmplOptionInput] = useState('');
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
    if (form.technicalSpecs[t.name] !== undefined) return;
    const defaultVal = t.field_type === 'boolean' ? 'Bəli' : t.field_type === 'dimensions' ? '0 × 0 × 0' : '';
    setForm(f => ({ ...f, technicalSpecs: { ...f.technicalSpecs, [t.name]: defaultVal } }));
    setSpecKey(t.name); setSpecVal(defaultVal); setSpecUnit(t.unit);
  };

  const TMPL_EMPTY = { name: '', unit: '', category: '', description: '', field_type: 'text' as FieldType, options: [] };

  const saveTmpl = async () => {
    if (!tmplForm.name.trim()) return;
    const isEdit = tmplEditId && tmplEditId !== 'new';
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `/api/spec-templates/${tmplEditId}` : '/api/spec-templates';
    const r = await fetch(url, { method, headers: h, body: JSON.stringify(tmplForm) });
    if (r.ok) { toast.success(tmplEditId ? 'Metrik yeniləndi.' : 'Metrik yaradıldı.'); setTmplForm(TMPL_EMPTY); setTmplOptionInput(''); setTmplEditId(null); await loadTemplates(); }
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

              <form onSubmit={handleSubmit}>
                <div className="modal-body px-4 py-3" style={{ minHeight: 320 }}>
                  
                  {/* Basic Info */}
                    <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: 12, marginBottom: 20 }}>
                      <h6 style={{ fontSize: 13, fontWeight: 700, color: '#495057', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Package size={14} /> Məhsul Məlumatları</h6>
                      <div className="row g-3">
                        <div className="col-md-8">
                          <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Məhsul Adı *</label>
                          <input required className={inputCls} style={{ borderRadius: 9 }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Məs: LED Ekran 3×4m" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Kateqoriya *</label>
                          <input required className={inputCls} style={{ borderRadius: 9 }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="LED, Səs, Səhnə..." />
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Təsvir</label>
                          <textarea className="form-control form-control-sm" style={{ borderRadius: 9, resize: 'none' }} rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Məhsul haqqında ətraflı məlumat yazın..." />
                        </div>
                      </div>
                    </div>

                    {/* Images */}
                    <div style={{ padding: '16px', background: '#fff', border: '1px solid #e9ecef', borderRadius: 12, marginBottom: 20 }}>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 style={{ fontSize: 13, fontWeight: 700, color: '#495057', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><ImageIcon size={14} /> Şəkillər ({form.images.filter(Boolean).length})</h6>
                      </div>
                      <div className="row g-3">
                        {form.images.map((img, idx) => (
                          <div key={idx} className="col-12 col-md-6">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #f1f3f5' }}>
                              <div style={{ height: 160, background: '#f8f9fa', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {img ? (
                                  <>
                                    <img src={img} style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block', padding: 6 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'; }} />
                                    <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#adb5bd', position: 'absolute', inset: 0 }}>
                                      <ImageIcon size={28} opacity={0.3} />
                                      <span style={{ fontSize: 11 }}>Şəkil yüklənmədi</span>
                                    </div>
                                    <a href={img} target="_blank" rel="noreferrer" style={{ position: 'absolute', bottom: 8, right: form.images.length > 1 ? 40 : 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 600, borderRadius: 6, padding: '3px 8px', textDecoration: 'none' }}>↗ Tam</a>
                                  </>
                                ) : (
                                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted" style={{ gap: 6 }}>
                                    <ImageIcon size={28} opacity={0.3} />
                                    <span style={{ fontSize: 11 }}>Şəkil yoxdur</span>
                                  </div>
                                )}
                                {form.images.length > 1 && (
                                  <button type="button" onClick={() => rmImage(idx)} style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 8, background: 'rgba(220,53,69,0.9)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={12} />
                                  </button>
                                )}
                                <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 7px' }}>#{idx + 1}</span>
                              </div>
                              <div className="p-3 d-flex flex-column gap-2">
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
                        <div className="col-12 col-md-6">
                          <button type="button" onClick={addImage}
                            style={{ width: '100%', height: '100%', minHeight: 180, border: '2px dashed #dee2e6', borderRadius: 14, background: '#fafafa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#adb5bd', transition: '0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e30613'; (e.currentTarget as HTMLElement).style.color = '#e30613'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#dee2e6'; (e.currentTarget as HTMLElement).style.color = '#adb5bd'; }}>
                            <Plus size={24} />
                            <span style={{ fontSize: 12, fontWeight: 600 }}>Şəkil əlavə et</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Specs & Metrics */}
                    <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: 12, marginBottom: 20 }}>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 style={{ fontSize: 13, fontWeight: 700, color: '#495057', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><ListFilter size={14} /> Metriklər & Texniki Xüsusiyyətlər</h6>
                        <button type="button" onClick={() => setShowTemplateManager(true)} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 bg-white" style={{ borderRadius: 8, fontSize: 10, padding: '4px 10px' }}>
                          <Tag size={10} /> Metrik Şablonları
                        </button>
                      </div>

                      {/* Şablondan seç */}
                      {templates.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', background: '#fff', borderRadius: 10, border: '1px dashed #dee2e6', marginBottom: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#6c757d' }}>Sistemdə metrik yoxdur</div>
                          <div style={{ fontSize: 11, color: '#adb5bd', marginTop: 4 }}>"Metrik Şablonları" düyməsinə klikləyərək yeni metrik yaradın.</div>
                        </div>
                      ) : (
                        <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #dee2e6', marginBottom: 16 }}>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#6c757d' }}>Metrikləri əlavə et</div>
                            <button type="button" onClick={() => applyAllTemplates(templates)} className="btn btn-sm btn-light" style={{ borderRadius: 6, fontSize: 10, padding: '2px 8px', color: '#495057' }}>Hamısını əlavə et</button>
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            {templates.map(t => (
                              <button key={t.id} type="button" onClick={() => applyTemplate(t)}
                                style={{ border: form.technicalSpecs[t.name] !== undefined ? '1.5px solid #3b5bdb' : '1px solid #dee2e6', background: form.technicalSpecs[t.name] !== undefined ? '#e8edff' : '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: form.technicalSpecs[t.name] !== undefined ? '#3b5bdb' : '#495057', cursor: 'pointer', transition: '0.15s', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {form.technicalSpecs[t.name] !== undefined ? <Check size={10} /> : <Plus size={10} />}
                                {t.name}{t.unit ? ` (${t.unit})` : ''}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Siyahı */}
                      {Object.entries(form.technicalSpecs).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#adb5bd', background: '#fff', borderRadius: 10, border: '1px dashed #dee2e6' }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>Hələ heç bir metrik seçilməyib</div>
                          <div style={{ fontSize: 11, marginTop: 4 }}>Yuxarıdakı siyahıdan məhsula aid xüsusiyyətləri seçin</div>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {Object.entries(form.technicalSpecs).map(([k, v], i) => (
                            <div key={k} className="d-flex align-items-center gap-2" style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 10, padding: '8px 12px' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', minWidth: 20 }}>#{i+1}</span>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#212529', flex: '0 0 35%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {k}
                              </div>
                              <span style={{ color: '#dee2e6' }}>:</span>
                              {(() => {
                                const tmpl = templates.find(t => t.name === k);
                                const ft = tmpl?.field_type || 'text';
                                const setVal = (val: string) => setForm(f => ({ ...f, technicalSpecs: { ...f.technicalSpecs, [k]: val } }));
                                if (ft === 'boolean') return (
                                  <select className="form-select form-select-sm" style={{ borderRadius: 8, fontSize: 12, flex: 1, background: '#f8f9fa' }} value={v} onChange={e => setVal(e.target.value)}>
                                    <option>Bəli</option><option>Xeyr</option>
                                  </select>
                                );
                                if ((ft === 'select' || ft === 'color') && tmpl?.options?.length) return (
                                  <select className="form-select form-select-sm" style={{ borderRadius: 8, fontSize: 12, flex: 1, background: '#f8f9fa' }} value={v} onChange={e => setVal(e.target.value)}>
                                    <option value="">Seçin...</option>
                                    {tmpl.options.map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                );
                                if (ft === 'multiselect' && tmpl?.options?.length) return (
                                  <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {tmpl.options.map(o => {
                                      const selected = v.split(',').map(s => s.trim()).includes(o);
                                      return <button key={o} type="button" onClick={() => { const cur = v.split(',').map(s => s.trim()).filter(Boolean); const next = selected ? cur.filter(x => x !== o) : [...cur, o]; setVal(next.join(', ')); }}
                                        style={{ border: selected ? '1.5px solid #3b5bdb' : '1px solid #dee2e6', background: selected ? '#e8edff' : '#f8f9fa', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 600, color: selected ? '#3b5bdb' : '#6c757d', cursor: 'pointer', transition: '0.1s' }}>{o}</button>;
                                    })}
                                  </div>
                                );
                                if (ft === 'dimensions') return (
                                  <input className="form-control form-control-sm" style={{ borderRadius: 8, fontSize: 12, flex: 1, background: '#f8f9fa' }} value={v} onChange={e => setVal(e.target.value)} placeholder="Məs: 100 × 50 × 20" />
                                );
                                return <input className="form-control form-control-sm" style={{ borderRadius: 8, fontSize: 12, flex: 1, background: '#f8f9fa' }} value={v} onChange={e => setVal(e.target.value)} placeholder={tmpl?.unit ? `Dəyər (${tmpl.unit})` : 'Dəyər yazın...'} />;
                              })()}
                              <button type="button" onClick={() => rmSpec(k)} className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center" style={{ borderRadius: 8, padding: 0, width: 26, height: 26, flexShrink: 0 }}><X size={12} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div style={{ padding: '16px', background: '#fff', border: '1px solid #e9ecef', borderRadius: 12 }}>
                      <h6 style={{ fontSize: 13, fontWeight: 700, color: '#495057', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={14} /> Teqlər</h6>
                      <div className="d-flex gap-2 mb-3">
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
                          className="btn btn-dark btn-sm d-flex align-items-center gap-1 fw-semibold"
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
                      
                      <div className="d-flex flex-wrap gap-2">
                        {form.tags.length === 0 ? (
                          <div style={{ fontSize: 11, color: '#adb5bd' }}>Teq yoxdur. Axtarış üçün teq əlavə etmək faydalıdır.</div>
                        ) : (
                          form.tags.map((tag, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff0f0', color: '#e30613', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, border: '1px solid #ffd6d6' }}>
                              {tag}
                              <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#e30613', display: 'flex', alignItems: 'center', opacity: 0.7 }}><X size={11} /></button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    
                  </div>
                  
                  {/* Modal Footer */}
                  <div className="modal-footer border-top py-3 px-4 gap-2" style={{ background: '#f8f9fa', borderRadius: '0 0 18px 18px' }}>
                    <button type="button" onClick={closeModal} className="btn btn-outline-secondary fw-semibold" style={{ borderRadius: 10, padding: '8px 20px' }}>Ləğv Et</button>
                    <button type="submit" disabled={saving} className="btn btn-danger fw-bold d-flex align-items-center gap-2" style={{ borderRadius: 10, padding: '8px 24px' }}>
                      {saving ? <div className="spinner-border spinner-border-sm" /> : <Check size={16} />}
                      {saving ? 'Saxlanır...' : editId ? 'Dəyişiklikləri Yadda Saxla' : 'Məhsulu Yarat'}
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
          <div style={{ position: 'fixed', top: 0, right: 0, width: 440, height: '100vh', background: '#f8f9fa', zIndex: 1045, boxShadow: '-4px 0 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', borderRadius: '16px 0 0 16px', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '20px 24px', background: '#fff', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h5 style={{ margin: 0, fontWeight: 800, color: '#212529', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag size={18} color="#e30613" /> Metrik Şablonları
                </h5>
                <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>Bütün məhsullar üçün ortaq xüsusiyyətlər yaradın</div>
              </div>
              <button onClick={() => { setShowTemplateManager(false); setTmplEditId(null); setTmplForm(TMPL_EMPTY); setTmplOptionInput(''); }}
                style={{ border: 'none', background: '#f1f3f5', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e9ecef')} onMouseLeave={e => (e.currentTarget.style.background = '#f1f3f5')}>
                <X size={16} color="#495057" />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Form Sahəsi (Edit və ya Yeni yaradıldıqda görünür) */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e9ecef', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                {/* Form Toggle Header */}
                <div 
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: tmplEditId ? '#fff5f5' : '#fff' }}
                  onClick={() => { if (!tmplEditId) { setTmplForm(TMPL_EMPTY); setTmplEditId(tmplEditId === 'new' ? null : 'new'); } }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: tmplEditId ? '#e30613' : '#495057', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {tmplEditId === 'new' ? <><Plus size={15} /> Yeni Metrik Yarat</> : tmplEditId ? <><Pencil size={15} /> Şablonu Redaktə Et</> : <><Plus size={15} /> Yeni Metrik Yarat</>}
                  </div>
                  {!tmplEditId && <ChevronRight size={16} color="#adb5bd" style={{ transform: tmplEditId === 'new' ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />}
                </div>

                {/* Form İçəriyi */}
                {(tmplEditId) && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f1f3f5' }}>
                    
                    {/* Tip seçimi */}
                    <div style={{ marginTop: 16, marginBottom: 16 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#495057', marginBottom: 8, display: 'block' }}>Giriş Tipi *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {FIELD_TYPES.map(ft => (
                          <button key={ft.value} type="button" onClick={() => setTmplForm(f => ({ ...f, field_type: ft.value, options: [] }))}
                            style={{ 
                              border: tmplForm.field_type === ft.value ? '2px solid #e30613' : '1px solid #dee2e6', 
                              background: tmplForm.field_type === ft.value ? '#fff5f5' : '#fff', 
                              borderRadius: 12, padding: '10px 6px', cursor: 'pointer', transition: 'all 0.15s', 
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                            }}>
                            <span style={{ fontSize: 18, marginBottom: 4 }}>{ft.icon}</span>
                            <span style={{ fontSize: 11, fontWeight: tmplForm.field_type === ft.value ? 700 : 500, color: tmplForm.field_type === ft.value ? '#e30613' : '#495057' }}>{ft.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-8">
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#495057', marginBottom: 4 }}>Ad (məs: Rəng, Çəki) *</label>
                        <input className="form-control form-control-sm" style={{ borderRadius: 8, padding: '8px 12px' }} value={tmplForm.name} onChange={e => setTmplForm(f => ({ ...f, name: e.target.value }))} placeholder="Metrik adı" />
                      </div>
                      {(tmplForm.field_type === 'number' || tmplForm.field_type === 'dimensions') && (
                        <div className="col-4">
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#495057', marginBottom: 4 }}>Vahid</label>
                          <input className="form-control form-control-sm" style={{ borderRadius: 8, padding: '8px 12px' }} value={tmplForm.unit} onChange={e => setTmplForm(f => ({ ...f, unit: e.target.value }))} placeholder="m, kg, W" />
                        </div>
                      )}
                      
                      <div className="col-6">
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#495057', marginBottom: 4 }}>Qrup</label>
                        <input className="form-control form-control-sm" style={{ borderRadius: 8, padding: '8px 12px' }} value={tmplForm.category} onChange={e => setTmplForm(f => ({ ...f, category: e.target.value }))} placeholder="Ölçü, Səs..." list="cat-list" />
                        <datalist id="cat-list">
                          {Array.from(new Set(templates.map(t => t.category).filter(Boolean))).map(c => <option key={c} value={c} />)}
                        </datalist>
                      </div>
                      <div className="col-6">
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#495057', marginBottom: 4 }}>Açıqlama (opt.)</label>
                        <input className="form-control form-control-sm" style={{ borderRadius: 8, padding: '8px 12px' }} value={tmplForm.description} onChange={e => setTmplForm(f => ({ ...f, description: e.target.value }))} placeholder="İzah..." />
                      </div>
                    </div>

                    {/* Seçim dəyərləri (select/multiselect/color) */}
                    {(tmplForm.field_type === 'select' || tmplForm.field_type === 'multiselect' || tmplForm.field_type === 'color') && (
                      <div style={{ background: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#495057', marginBottom: 8, display: 'block' }}>
                          {tmplForm.field_type === 'color' ? 'Rəng Variantları' : 'Seçim Variantları'}
                        </label>
                        <div className="d-flex gap-2 mb-3">
                          <input className="form-control form-control-sm" style={{ borderRadius: 8 }} value={tmplOptionInput} onChange={e => setTmplOptionInput(e.target.value)}
                            placeholder={tmplForm.field_type === 'color' ? 'Ad, Hex (məs: Qırmızı, #FF0000)' : 'Yeni variant yaz və Enter-ə bas...'}
                            onKeyDown={e => { if (e.key === 'Enter' && tmplOptionInput.trim()) { e.preventDefault(); setTmplForm(f => ({ ...f, options: [...f.options, tmplOptionInput.trim()] })); setTmplOptionInput(''); }}} />
                          <button type="button" onClick={() => { if (tmplOptionInput.trim()) { setTmplForm(f => ({ ...f, options: [...f.options, tmplOptionInput.trim()] })); setTmplOptionInput(''); }}}
                            className="btn btn-sm btn-dark d-flex align-items-center" style={{ borderRadius: 8, padding: '0 12px' }}><Plus size={14} /></button>
                        </div>
                        {tmplForm.options.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {tmplForm.options.map((opt, i) => (
                              <span key={i} style={{ background: '#fff', border: '1px solid #dee2e6', color: '#495057', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                {tmplForm.field_type === 'color' && <span style={{ width: 10, height: 10, borderRadius: '50%', background: opt.includes('#') ? opt.split(',')[1]?.trim() || opt : '#ccc', border: '1px solid rgba(0,0,0,0.1)' }} />}
                                {opt}
                                <button type="button" onClick={() => setTmplForm(f => ({ ...f, options: f.options.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#adb5bd', display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: '#adb5bd', fontStyle: 'italic' }}>Hələ heç bir variant əlavə edilməyib.</div>
                        )}
                      </div>
                    )}

                    <div className="d-flex gap-2 pt-3 border-top">
                      <button onClick={saveTmpl} className="btn btn-danger fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: 10, padding: '10px' }}>
                        <Check size={16} /> {tmplEditId && tmplEditId !== 'new' ? 'Yenilə və Saxla' : 'Şablonu Yarat'}
                      </button>
                      <button onClick={() => { setTmplEditId(null); setTmplForm(TMPL_EMPTY); setTmplOptionInput(''); }} className="btn btn-light fw-semibold" style={{ borderRadius: 10, padding: '10px 16px', color: '#495057' }}>
                        Ləğv
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Siyahı Sahəsi */}
              <div style={{ flex: 1 }}>
                <h6 style={{ fontSize: 14, fontWeight: 800, color: '#212529', marginBottom: 16 }}>Mövcud Şablonlar</h6>
                {templates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16, border: '1px dashed #dee2e6' }}>
                    <Tag size={32} color="#adb5bd" style={{ opacity: 0.5, marginBottom: 12 }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#495057' }}>Siyahı boşdur</div>
                    <div style={{ fontSize: 12, color: '#adb5bd', marginTop: 4 }}>Yeni metrik yaradaraq siyahını doldurun.</div>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-4">
                    {Array.from(new Set(templates.map(t => t.category || 'Ümumi'))).map(cat => (
                      <div key={cat}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, paddingLeft: 4 }}>{cat}</div>
                        <div className="d-flex flex-column gap-2">
                          {templates.filter(t => (t.category || 'Ümumi') === cat).map(t => (
                            <div key={t.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #e9ecef', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8f9fa', border: '1px solid #f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                                {FIELD_TYPES.find(f => f.value === t.field_type)?.icon || <Type size={18} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                  <span style={{ fontWeight: 700, fontSize: 13, color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                                  {t.unit && <span style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 6, padding: '1px 6px', fontSize: 10, color: '#6c757d', fontWeight: 600 }}>{t.unit}</span>}
                                </div>
                                <div style={{ fontSize: 11, color: '#adb5bd', display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span>{FIELD_TYPES.find(f => f.value === t.field_type)?.label}</span>
                                  {t.options?.length > 0 && <span>• {t.options.length} variant</span>}
                                </div>
                              </div>
                              <div className="d-flex gap-1 flex-shrink-0">
                                <button onClick={() => { setTmplEditId(t.id); setTmplForm({ name: t.name, unit: t.unit, category: t.category, description: t.description, field_type: t.field_type, options: t.options }); setTmplOptionInput(''); }}
                                  style={{ border: 'none', background: '#f8f9fa', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.15s' }} title="Redaktə et"
                                  onMouseEnter={e => (e.currentTarget.style.background = '#e9ecef')} onMouseLeave={e => (e.currentTarget.style.background = '#f8f9fa')}>
                                  <Pencil size={14} color="#495057" />
                                </button>
                                <button onClick={() => deleteTmpl(t.id)}
                                  style={{ border: 'none', background: '#fff5f5', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.15s' }} title="Sil"
                                  onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')} onMouseLeave={e => (e.currentTarget.style.background = '#fff5f5')}>
                                  <Trash2 size={14} color="#dc3545" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer Summary */}
            <div style={{ padding: '12px 24px', background: '#fff', borderTop: '1px solid #e9ecef', fontSize: 12, color: '#6c757d', fontWeight: 500, textAlign: 'center' }}>
              Toplam {templates.length} metrik şablonu
            </div>
          </div>
        </>
      )}
    </div>
  );
}