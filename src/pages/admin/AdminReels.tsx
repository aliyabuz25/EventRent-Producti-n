import React, { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, X, Save, Youtube, Instagram, Video, Link, Upload, Loader2 } from 'lucide-react';

const TOKEN_KEY = 'er_admin_token';
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` });

type Reel = {
  id: string;
  title: string;
  client: string;
  date_label: string;
  location: string;
  category: string;
  tags: string[];
  media_type: 'video' | 'youtube' | 'instagram' | 'image';
  media_url: string;
  poster_url: string;
  sort_order: number;
  active: boolean;
};

const EMPTY_FORM: Omit<Reel, 'id'> = {
  title: '',
  client: '',
  date_label: '',
  location: '',
  category: '',
  tags: [],
  media_type: 'youtube',
  media_url: '',
  poster_url: '',
  sort_order: 0,
  active: true,
};

const MEDIA_TYPES = [
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-400' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400' },
  { value: 'video', label: 'MP4 / Link', icon: Video, color: 'text-blue-400' },
  { value: 'image', label: 'Şəkil', icon: Link, color: 'text-green-400' },
];

function getEmbedUrl(type: string, url: string): string | null {
  if (type === 'youtube') {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`;
  }
  if (type === 'instagram') {
    const clean = url.replace(/\/$/, '');
    return `${clean}/embed`;
  }
  return null;
}

function MediaPreview({ type, url, poster }: { type: string; url: string; poster: string }) {
  const embed = getEmbedUrl(type, url);
  if (!url) return <div className="flex items-center justify-center h-full text-gray-300 text-sm">Önizləmə yoxdur</div>;

  if (embed) {
    return (
      <iframe
        src={embed}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: 'none' }}
      />
    );
  }
  if (type === 'video') {
    return <video src={url} poster={poster} controls className="w-full h-full object-cover" />;
  }
  return <img src={url} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />;
}

function PosterUploader({ value, onChange, mediaType }: {
  value: string;
  onChange: (url: string) => void;
  mediaType: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('er_admin_token')}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yükləmə uğursuz.');
      onChange(data.url);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        Kapak Şəkli
        {mediaType === 'youtube' && <span className="ml-2 text-gray-400 normal-case font-normal">(boş buraxılsa YouTube thumbnail avtomatik istifadə edilir)</span>}
        {(mediaType === 'video' || mediaType === 'image') && <span className="ml-2 text-gray-400 normal-case font-normal">(isteğe bağlı)</span>}
        {mediaType === 'instagram' && <span className="ml-2 text-gray-400 normal-case font-normal">(Instagram üçün önizləmə şəkli)</span>}
      </label>
      <div className="flex gap-2 items-start">
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://... və ya aşağıdan yüklə"
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-premium-orange/40 transition-all"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl border border-gray-200 transition-all text-sm disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Yüklənir...' : 'Yüklə'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-400 rounded-xl border border-gray-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {uploadError && <p className="text-xs text-red-500 font-bold">{uploadError}</p>}
      {value && (
        <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
          <img src={value} alt="kapak" className="w-full h-full object-cover" referrerPolicy="no-referrer"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="absolute bottom-1 left-1 right-1 text-center">
            <span className="text-[8px] text-white font-bold bg-black/60 px-1.5 py-0.5 rounded">kapak</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim().toLowerCase().replace(/\s+/g, '-');
    if (!val) return;
    const tag = val.startsWith('#') ? val : `#${val}`;
    if (!tags.includes(tag)) onChange([...tags, tag]);
    setInput('');
  };

  const remove = (t: string) => onChange(tags.filter(x => x !== t));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder="#etiket əlavə et"
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-premium-orange/40 transition-all"
        />
        <button type="button" onClick={add} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl text-sm font-bold transition-all">
          +
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-premium-orange/10 border border-premium-orange/30 rounded-lg text-[11px] text-premium-orange font-bold">
              {tag}
              <button type="button" onClick={() => remove(tag)} className="hover:text-gray-900 transition-colors"><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ReelForm({ initial, onSave, onCancel }: {
  initial: Omit<Reel, 'id'>;
  onSave: (data: Omit<Reel, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Reel, 'id'>>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof Omit<Reel, 'id'>, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Başlıq mütləqdir.');
    if (!form.media_url.trim()) return setError('Media URL mütləqdir.');
    setError(null);
    setLoading(true);
    try { await onSave(form); }
    catch (err: any) { setError(err.message || 'Xəta baş verdi.'); }
    finally { setLoading(false); }
  };

  const selectedType = MEDIA_TYPES.find(t => t.value === form.media_type);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Media Type Selector */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Media Növü</label>
        <div className="grid grid-cols-4 gap-2">
          {MEDIA_TYPES.map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => set('media_type', value as any)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                form.media_type === value
                  ? 'border-premium-orange bg-premium-orange/10 text-gray-900'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${form.media_type === value ? color : ''}`} />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* URL */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          {form.media_type === 'youtube' ? 'YouTube URL (watch, shorts, embed)' :
           form.media_type === 'instagram' ? 'Instagram Post/Reel URL' :
           form.media_type === 'video' ? 'Video URL (mp4)' : 'Şəkil URL'}
        </label>
        <input
          type="url"
          value={form.media_url}
          onChange={e => set('media_url', e.target.value)}
          placeholder={
            form.media_type === 'youtube' ? 'https://youtube.com/watch?v=...' :
            form.media_type === 'instagram' ? 'https://www.instagram.com/p/...' :
            'https://...'
          }
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-premium-orange/40 transition-all"
        />
        {form.media_type === 'instagram' && (
          <p className="text-[10px] text-gray-400">Instagram embeds yalnız public postlar üçün işləyir.</p>
        )}
      </div>

      {/* Preview */}
      {form.media_url && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Önizləmə</label>
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-gray-200">
            <MediaPreview type={form.media_type} url={form.media_url} poster={form.poster_url} />
          </div>
        </div>
      )}

      {/* Poster / Kapak şəkli — bütün media növləri üçün */}
      <PosterUploader
        value={form.poster_url}
        onChange={v => set('poster_url', v)}
        mediaType={form.media_type}
      />

      {/* Title + Client */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Başlıq *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Layihənin adı"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-premium-orange/40 transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Müştəri</label>
          <input value={form.client} onChange={e => set('client', e.target.value)} placeholder="Şirkət / müştəri adı"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-premium-orange/40 transition-all" />
        </div>
      </div>

      {/* Date + Location + Category */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tarix</label>
          <input value={form.date_label} onChange={e => set('date_label', e.target.value)} placeholder="İyun 2024"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-premium-orange/40 transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Məkan</label>
          <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Bakı"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-premium-orange/40 transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Kateqoriya</label>
          <input value={form.category} onChange={e => set('category', e.target.value)} placeholder="Konfrans"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-premium-orange/40 transition-all" />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Etiketlər</label>
        <TagInput tags={form.tags} onChange={tags => set('tags', tags)} />
      </div>

      {/* Sort + Active */}
      <div className="flex items-center gap-4">
        <div className="space-y-2 w-32">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sıra</label>
          <input type="number" value={form.sort_order} onChange={e => set('sort_order', Number(e.target.value))} min={0}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-premium-orange/40 transition-all" />
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button type="button" onClick={() => set('active', !form.active)}
            className={`w-12 h-6 rounded-full transition-all relative ${form.active ? 'bg-premium-orange' : 'bg-gray-100'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.active ? 'left-7' : 'left-1'}`} />
          </button>
          <span className="text-sm font-bold text-gray-600">{form.active ? 'Aktiv' : 'Gizli'}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-premium-orange hover:bg-premium-orange/90 text-gray-900 font-black rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-premium-orange/20">
          <Save className="w-4 h-4" /> {loading ? 'Saxlanılır...' : 'Saxla'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 font-bold rounded-xl transition-all border border-gray-200">
          Ləğv et
        </button>
      </div>
    </form>
  );
}

export default function AdminReels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editing, setEditing] = useState<Reel | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reels', { headers: auth() });
      const data = res.ok ? await res.json() : [];
      setReels(Array.isArray(data) ? data : []);
    } catch { setReels([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (form: Omit<Reel, 'id'>) => {
    const res = await fetch('/api/reels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    await load();
    setMode('list');
  };

  const handleEdit = async (form: Omit<Reel, 'id'>) => {
    if (!editing) return;
    const res = await fetch(`/api/reels/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    await load();
    setMode('list');
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/reels/${id}`, { method: 'DELETE', headers: auth() });
    await load();
    setDeleteId(null);
  };

  const toggleActive = async (reel: Reel) => {
    await fetch(`/api/reels/${reel.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ ...reel, active: !reel.active }),
    });
    await load();
  };

  const MEDIA_ICON: Record<string, React.ReactNode> = {
    youtube: <Youtube className="w-4 h-4 text-red-400" />,
    instagram: <Instagram className="w-4 h-4 text-pink-400" />,
    video: <Video className="w-4 h-4 text-blue-400" />,
    image: <Link className="w-4 h-4 text-green-400" />,
  };

  if (mode === 'add') return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => setMode('list')} className="text-gray-500 hover:text-gray-900 transition-colors"><X className="w-5 h-5" /></button>
        <h2 className="text-2xl font-black tracking-tight text-gray-900">Yeni Reel / Portfolio</h2>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
        <ReelForm initial={EMPTY_FORM} onSave={handleAdd} onCancel={() => setMode('list')} />
      </div>
    </div>
  );

  if (mode === 'edit' && editing) return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => { setMode('list'); setEditing(null); }} className="text-gray-500 hover:text-gray-900 transition-colors"><X className="w-5 h-5" /></button>
        <h2 className="text-2xl font-black tracking-tight text-gray-900">Redaktə: {editing.title}</h2>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
        <ReelForm
          initial={{ title: editing.title, client: editing.client, date_label: editing.date_label, location: editing.location, category: editing.category, tags: editing.tags, media_type: editing.media_type, media_url: editing.media_url, poster_url: editing.poster_url, sort_order: editing.sort_order, active: editing.active }}
          onSave={handleEdit}
          onCancel={() => { setMode('list'); setEditing(null); }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Portfolio / Reels</h2>
          <p className="text-gray-500 text-sm mt-1">{reels.length} reel — YouTube, Instagram, video və şəkil dəstəklənir</p>
        </div>
        <button
          onClick={() => setMode('add')}
          className="flex items-center gap-2 px-5 py-3 bg-premium-orange hover:bg-premium-orange/90 text-gray-900 font-black rounded-xl transition-all shadow-lg shadow-premium-orange/20"
        >
          <Plus className="w-4 h-4" /> Yeni Reel
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-premium-orange border-t-transparent animate-spin" />
        </div>
      ) : reels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Video className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500 font-bold">Hələ reel əlavə edilməyib</p>
          <button onClick={() => setMode('add')} className="text-premium-orange font-bold hover:underline text-sm">İlk reeli əlavə et</button>
        </div>
      ) : (
        <div className="space-y-3">
          {reels.map(reel => (
            <div key={reel.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${reel.active ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-100 opacity-50'}`}>
              <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />

              {/* Thumb */}
              <div className="w-16 h-10 rounded-xl overflow-hidden bg-black shrink-0 border border-gray-200">
                {reel.poster_url || reel.media_type === 'image' ? (
                  <img src={reel.poster_url || reel.media_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">{MEDIA_ICON[reel.media_type]}</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {MEDIA_ICON[reel.media_type]}
                  <p className="text-sm font-black text-gray-900 truncate">{reel.title}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {reel.client && <span className="text-[10px] text-gray-500 font-bold">{reel.client}</span>}
                  {reel.category && <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 font-bold">{reel.category}</span>}
                  {reel.tags.slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] text-premium-orange/60 font-bold">{t}</span>
                  ))}
                  {reel.tags.length > 3 && <span className="text-[10px] text-gray-400">+{reel.tags.length - 3}</span>}
                </div>
              </div>

              {/* URL truncated */}
              <p className="text-[10px] text-gray-400 font-mono truncate max-w-[180px] hidden xl:block">{reel.media_url}</p>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(reel)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all" title={reel.active ? 'Gizlət' : 'Aktiv et'}>
                  {reel.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => { setEditing(reel); setMode('edit'); }} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(reel.id)} className="p-2 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-gray-900 mb-2">Silmək istəyirsiniz?</h3>
            <p className="text-gray-500 text-sm mb-6">Bu əməliyyat geri alına bilməz.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-gray-900 font-black rounded-xl transition-all">Sil</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-xl transition-all border border-gray-200">Ləğv et</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}