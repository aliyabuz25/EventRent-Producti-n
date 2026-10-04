import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Check, X, Image as ImageIcon, Search, Eye, Upload } from 'lucide-react';
import { useToast } from '../../components/Toast';

interface TBGame {
  id: string; name: string; category: 'Indoor' | 'Outdoor';
  image: string; description: string; details: string;
  sort_order: number; active: number;
}
interface TBConcept {
  id: string; name: string; image: string;
  sort_order: number; active: number;
}

const EMPTY_GAME: Omit<TBGame, 'id' | 'active'> = { name: '', category: 'Indoor', image: '', description: '', details: '', sort_order: 0 };
const EMPTY_CONCEPT: Omit<TBConcept, 'id' | 'active'> = { name: '', image: '', sort_order: 0 };
const inputCls = 'form-control form-control-sm';
const CATS = ['Indoor', 'Outdoor'] as const;

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

/* ── Smart Image Input: drag&drop + fayl seç + URL + media picker ── */
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
      {/* Preview */}
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
      {/* Drag & drop / klik */}
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
      {/* URL + Media picker */}
      <div className="d-flex gap-2">
        <input className={inputCls} style={{ borderRadius: 9, fontSize: 11 }} value={value} onChange={e => onChange(e.target.value)} placeholder="https://..." />
        <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 9, padding: '4px 10px', flexShrink: 0, fontSize: 11 }} onClick={() => setPicker(true)} title="Mediadan seç">
          <ImageIcon size={12} /> Seç
        </button>
      </div>
      {picker && <MediaPicker token={token} onPick={v => { onChange(v); setPicker(false); }} onClose={() => setPicker(false)} />}
    </div>
  );
}

export default function TeambuildingTab({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState<'games' | 'concepts'>('games');
  const [games, setGames]         = useState<TBGame[]>([]);
  const [concepts, setConcepts]   = useState<TBConcept[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState<'all' | 'Indoor' | 'Outdoor'>('all');

  const [showGameModal, setShowGameModal]   = useState(false);
  const [editGame, setEditGame]             = useState<TBGame | null>(null);
  const [gameForm, setGameForm]             = useState({ ...EMPTY_GAME });
  const [gameSaving, setGameSaving]         = useState(false);

  const [showConceptModal, setShowConceptModal] = useState(false);
  const [editConcept, setEditConcept]           = useState<TBConcept | null>(null);
  const [conceptForm, setConceptForm]           = useState({ ...EMPTY_CONCEPT });
  const [conceptSaving, setConceptSaving]       = useState(false);

  const toast = useToast();
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    try {
      const [gRes, cRes] = await Promise.all([
        fetch('/api/tb/games').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/tb/concepts').then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      setGames(Array.isArray(gRes) ? gRes : []);
      setConcepts(Array.isArray(cRes) ? cRes : []);
    } catch { setGames([]); setConcepts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  /* ── Games ── */
  const openCreateGame = () => { setEditGame(null); setGameForm({ ...EMPTY_GAME, sort_order: games.length + 1 }); setShowGameModal(true); };
  const openEditGame   = (g: TBGame) => { setEditGame(g); setGameForm({ name: g.name, category: g.category, image: g.image, description: g.description, details: g.details, sort_order: g.sort_order }); setShowGameModal(true); };
  const closeGameModal = () => { setShowGameModal(false); setEditGame(null); };

  const handleGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setGameSaving(true);
    try {
      const res = await fetch(editGame ? `/api/tb/games/${editGame.id}` : '/api/tb/games', {
        method: editGame ? 'PUT' : 'POST', headers: h, body: JSON.stringify({ ...gameForm, active: editGame?.active ?? 1 }),
      });
      if (!res.ok) { toast.error((await res.json()).error); return; }
      toast.success(editGame ? 'Oyun yeniləndi ✓' : 'Oyun əlavə edildi ✓');
      await load(); closeGameModal();
    } finally { setGameSaving(false); }
  };

  const handleDeleteGame = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" oyununu silmək istədiyinizə əminsiniz?`)) return;
    const res = await fetch(`/api/tb/games/${id}`, { method: 'DELETE', headers: h });
    if (res.ok) { toast.success('Oyun silindi.'); await load(); }
    else toast.error('Silmək alınmadı.');
  };

  const handleToggleGame = async (g: TBGame) => {
    await fetch(`/api/tb/games/${g.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ ...g, active: g.active ? 0 : 1 }) });
    await load();
  };

  /* ── Concepts ── */
  const openCreateConcept = () => { setEditConcept(null); setConceptForm({ ...EMPTY_CONCEPT, sort_order: concepts.length + 1 }); setShowConceptModal(true); };
  const openEditConcept   = (c: TBConcept) => { setEditConcept(c); setConceptForm({ name: c.name, image: c.image, sort_order: c.sort_order }); setShowConceptModal(true); };
  const closeConceptModal = () => { setShowConceptModal(false); setEditConcept(null); };

  const handleConceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setConceptSaving(true);
    try {
      const res = await fetch(editConcept ? `/api/tb/concepts/${editConcept.id}` : '/api/tb/concepts', {
        method: editConcept ? 'PUT' : 'POST', headers: h, body: JSON.stringify({ ...conceptForm, active: editConcept?.active ?? 1 }),
      });
      if (!res.ok) { toast.error((await res.json()).error); return; }
      toast.success(editConcept ? 'Konsepsiya yeniləndi ✓' : 'Konsepsiya əlavə edildi ✓');
      await load(); closeConceptModal();
    } finally { setConceptSaving(false); }
  };

  const handleDeleteConcept = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" konsepsiyasını silmək istədiyinizə əminsiniz?`)) return;
    const res = await fetch(`/api/tb/concepts/${id}`, { method: 'DELETE', headers: h });
    if (res.ok) { toast.success('Konsepsiya silindi.'); await load(); }
    else toast.error('Silmək alınmadı.');
  };

  const handleToggleConcept = async (c: TBConcept) => {
    await fetch(`/api/tb/concepts/${c.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ ...c, active: c.active ? 0 : 1 }) });
    await load();
  };

  const filteredGames = games.filter(g => {
    const q = search.toLowerCase();
    return (!q || g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)) &&
           (filterCat === 'all' || g.category === filterCat);
  });
  const filteredConcepts = concepts.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-0 fw-bold">Teambuilding</h5>
          <div style={{ fontSize: 12, color: '#6c757d' }}>{games.length} oyun · {concepts.length} konsepsiya</div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={load} className="btn btn-sm btn-outline-secondary d-flex align-items-center" style={{ borderRadius: 10 }}><RefreshCw size={13} /></button>
          {activeTab === 'games'
            ? <button onClick={openCreateGame} className="btn btn-danger btn-sm fw-semibold d-flex align-items-center gap-2" style={{ borderRadius: 10, padding: '8px 16px' }}><Plus size={14} /> Yeni Oyun</button>
            : <button onClick={openCreateConcept} className="btn btn-danger btn-sm fw-semibold d-flex align-items-center gap-2" style={{ borderRadius: 10, padding: '8px 16px' }}><Plus size={14} /> Yeni Konsepsiya</button>
          }
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4">
        {(['games', 'concepts'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`btn btn-sm fw-semibold ${activeTab === t ? 'btn-danger' : 'btn-outline-secondary'}`}
            style={{ borderRadius: 10 }}>
            {t === 'games' ? `Oyunlar (${games.length})` : `Konsepsiyalar (${concepts.length})`}
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="d-flex gap-2 mb-4">
        <div className="position-relative flex-grow-1">
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
          <input className="form-control form-control-sm" style={{ borderRadius: 10, paddingLeft: 30 }} placeholder="Axtar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {activeTab === 'games' && (
          <div className="d-flex gap-1">
            {(['all', 'Indoor', 'Outdoor'] as const).map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`btn btn-sm ${filterCat === c ? 'btn-danger' : 'btn-outline-secondary'}`}
                style={{ borderRadius: 10, fontSize: 11 }}>
                {c === 'all' ? 'Hamısı' : c}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" style={{ width: 28, height: 28 }} /></div>
      ) : activeTab === 'games' ? (
        <div className="row g-3">
          {filteredGames.map(game => (
            <div key={game.id} className="col-6 col-md-4 col-lg-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, overflow: 'hidden', opacity: game.active ? 1 : 0.5, transition: 'transform 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ''}>
                <div style={{ height: 130, background: '#f8f9fa', position: 'relative', overflow: 'hidden' }}>
                  {game.image ? <img src={game.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="d-flex align-items-center justify-content-center h-100 text-muted"><ImageIcon size={32} opacity={0.3} /></div>}
                  <span style={{ position: 'absolute', top: 8, left: 8, background: game.category === 'Indoor' ? '#0d6efd' : '#198754', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>{game.category}</span>
                  {!game.active && <span style={{ position: 'absolute', top: 8, right: 8, background: '#dc3545', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>Deaktiv</span>}
                </div>
                <div className="p-3">
                  <div className="fw-bold mb-1" style={{ fontSize: 13 }}>{game.name}</div>
                  <div style={{ fontSize: 11, color: '#6c757d', lineHeight: 1.4, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{game.description}</div>
                  <div className="d-flex gap-1">
                    <button onClick={() => openEditGame(game)} className="btn btn-sm btn-outline-secondary flex-grow-1 d-flex align-items-center justify-content-center gap-1" style={{ borderRadius: 8, fontSize: 11 }}><Pencil size={11} /> Düzəlt</button>
                    <button onClick={() => handleToggleGame(game)} className={`btn btn-sm ${game.active ? 'btn-outline-warning' : 'btn-outline-success'} d-flex align-items-center`} style={{ borderRadius: 8, padding: '4px 8px' }} title={game.active ? 'Deaktiv et' : 'Aktiv et'}><Eye size={12} /></button>
                    <button onClick={() => handleDeleteGame(game.id, game.name)} className="btn btn-sm btn-outline-danger d-flex align-items-center" style={{ borderRadius: 8, padding: '4px 8px' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredGames.length === 0 && <div className="col-12 text-center py-5 text-muted"><ImageIcon size={36} style={{ opacity: 0.2, marginBottom: 10 }} /><div>Oyun tapılmadı</div></div>}
        </div>
      ) : (
        <div className="row g-3">
          {filteredConcepts.map(concept => (
            <div key={concept.id} className="col-6 col-md-4 col-lg-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, overflow: 'hidden', opacity: concept.active ? 1 : 0.5, transition: 'transform 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ''}>
                <div style={{ height: 130, background: '#f8f9fa', position: 'relative', overflow: 'hidden' }}>
                  {concept.image ? <img src={concept.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="d-flex align-items-center justify-content-center h-100 text-muted"><ImageIcon size={32} opacity={0.3} /></div>}
                  {!concept.active && <span style={{ position: 'absolute', top: 8, right: 8, background: '#dc3545', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>Deaktiv</span>}
                </div>
                <div className="p-3">
                  <div className="fw-bold mb-2" style={{ fontSize: 13 }}>{concept.name}</div>
                  <div className="d-flex gap-1">
                    <button onClick={() => openEditConcept(concept)} className="btn btn-sm btn-outline-secondary flex-grow-1 d-flex align-items-center justify-content-center gap-1" style={{ borderRadius: 8, fontSize: 11 }}><Pencil size={11} /> Düzəlt</button>
                    <button onClick={() => handleToggleConcept(concept)} className={`btn btn-sm ${concept.active ? 'btn-outline-warning' : 'btn-outline-success'} d-flex align-items-center`} style={{ borderRadius: 8, padding: '4px 8px' }}><Eye size={12} /></button>
                    <button onClick={() => handleDeleteConcept(concept.id, concept.name)} className="btn btn-sm btn-outline-danger d-flex align-items-center" style={{ borderRadius: 8, padding: '4px 8px' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredConcepts.length === 0 && <div className="col-12 text-center py-5 text-muted">Konsepsiya tapılmadı</div>}
        </div>
      )}

      {/* ── Game Modal ── */}
      {showGameModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 18 }}>
              <div className="modal-header border-0 px-4 pt-4 pb-0">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: editGame ? '#fff3cd' : '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editGame ? <Pencil size={18} color="#664d03" /> : <Plus size={18} color="#e30613" />}
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">{editGame ? 'Oyunu Düzəlt' : 'Yeni Oyun'}</h6>
                    <div style={{ fontSize: 11, color: '#adb5bd' }}>{editGame ? editGame.id : 'Teambuilding oyunu əlavə et'}</div>
                  </div>
                </div>
                <button className="btn-close" onClick={closeGameModal} />
              </div>
              <form onSubmit={handleGameSubmit}>
                <div className="modal-body px-4 py-3">
                  <div className="row g-3">
                    {/* Ad + Kateqoriya */}
                    <div className="col-md-7">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Oyun adı *</label>
                      <input required className={inputCls} style={{ borderRadius: 9 }} value={gameForm.name} onChange={e => setGameForm({ ...gameForm, name: e.target.value })} placeholder="Oyun adı daxil edin..." autoFocus />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Kateqoriya</label>
                      <div className="d-flex gap-2">
                        {CATS.map(cat => (
                          <div key={cat} onClick={() => setGameForm({ ...gameForm, category: cat })}
                            style={{ flex: 1, padding: '8px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${gameForm.category === cat ? (cat === 'Indoor' ? '#0d6efd' : '#198754') : '#dee2e6'}`, background: gameForm.category === cat ? (cat === 'Indoor' ? '#e7f0ff' : '#d1f0e0') : '#fff', textAlign: 'center', fontSize: 12, fontWeight: 700, color: gameForm.category === cat ? (cat === 'Indoor' ? '#0d6efd' : '#198754') : '#6c757d', transition: '0.15s' }}>
                            {cat === 'Indoor' ? '🏠 Indoor' : '🌿 Outdoor'}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Şəkil */}
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Şəkil</label>
                      <ImgInput value={gameForm.image} onChange={v => setGameForm({ ...gameForm, image: v })} token={token} />
                    </div>

                    {/* Qısa açıqlama */}
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Qısa açıqlama</label>
                      <input className={inputCls} style={{ borderRadius: 9 }} value={gameForm.description} onChange={e => setGameForm({ ...gameForm, description: e.target.value })} placeholder="Kartda görünəcək qısa mətn..." />
                    </div>

                    {/* Ətraflı */}
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Ətraflı məlumat</label>
                      <textarea className="form-control form-control-sm" style={{ borderRadius: 9, resize: 'none' }} rows={4} value={gameForm.details} onChange={e => setGameForm({ ...gameForm, details: e.target.value })} placeholder="Oyunun qaydaları, müddəti, iştirakçı sayı..." />
                    </div>

                    {/* Sıra */}
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Sıra nömrəsi</label>
                      <input type="number" className={inputCls} style={{ borderRadius: 9 }} value={gameForm.sort_order} onChange={e => setGameForm({ ...gameForm, sort_order: Number(e.target.value) })} />
                      <div style={{ fontSize: 10, color: '#adb5bd', marginTop: 4 }}>Kiçik rəqəm öncə göstərilir</div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top py-3 px-4 gap-2">
                  <button type="button" onClick={closeGameModal} className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 9 }}>Ləğv Et</button>
                  <button type="submit" disabled={gameSaving} className="btn btn-danger btn-sm fw-semibold d-flex align-items-center gap-1" style={{ borderRadius: 9, padding: '7px 18px' }}>
                    <Check size={13} /> {gameSaving ? 'Saxlanır...' : editGame ? 'Yenilə' : 'Əlavə et'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Concept Modal ── */}
      {showConceptModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: 520 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 18 }}>
              <div className="modal-header border-0 px-4 pt-4 pb-0">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: editConcept ? '#fff3cd' : '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editConcept ? <Pencil size={18} color="#664d03" /> : <Plus size={18} color="#e30613" />}
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">{editConcept ? 'Konsepsiya Düzəlt' : 'Yeni Konsepsiya'}</h6>
                    <div style={{ fontSize: 11, color: '#adb5bd' }}>{editConcept ? editConcept.id : 'Yeni konsepsiya əlavə et'}</div>
                  </div>
                </div>
                <button className="btn-close" onClick={closeConceptModal} />
              </div>
              <form onSubmit={handleConceptSubmit}>
                <div className="modal-body px-4 py-3">
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Konsepsiya adı *</label>
                      <input required className={inputCls} style={{ borderRadius: 9 }} value={conceptForm.name} onChange={e => setConceptForm({ ...conceptForm, name: e.target.value })} placeholder="Konsepsiya adı daxil edin..." autoFocus />
                    </div>
                    <div>
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Şəkil</label>
                      <ImgInput value={conceptForm.image} onChange={v => setConceptForm({ ...conceptForm, image: v })} token={token} />
                    </div>
                    <div>
                      <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Sıra nömrəsi</label>
                      <input type="number" className={inputCls} style={{ borderRadius: 9 }} value={conceptForm.sort_order} onChange={e => setConceptForm({ ...conceptForm, sort_order: Number(e.target.value) })} />
                      <div style={{ fontSize: 10, color: '#adb5bd', marginTop: 4 }}>Kiçik rəqəm öncə göstərilir</div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top py-3 px-4 gap-2">
                  <button type="button" onClick={closeConceptModal} className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 9 }}>Ləğv Et</button>
                  <button type="submit" disabled={conceptSaving} className="btn btn-danger btn-sm fw-semibold d-flex align-items-center gap-1" style={{ borderRadius: 9, padding: '7px 18px' }}>
                    <Check size={13} /> {conceptSaving ? 'Saxlanır...' : editConcept ? 'Yenilə' : 'Əlavə et'}
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
