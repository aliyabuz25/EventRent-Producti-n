import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Copy, Image, RefreshCw, Check, X } from 'lucide-react';
import { useToast } from '../../components/Toast';

interface MediaFile {
  filename: string;
  url: string;
  size: number;
  created_at: string;
}

function MediaCard({ file, copied, onPreview, onCopy, onDelete }: {
  file: MediaFile; copied: string | null;
  onPreview: () => void; onCopy: () => void; onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div className="col-6 col-md-4 col-lg-3 col-xl-2">
      <div
        className="card border-0 shadow-sm h-100"
        style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', transform: hover ? 'translateY(-2px)' : '', boxShadow: hover ? '0 6px 20px rgba(0,0,0,0.1)' : '' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onPreview}
      >
        <div style={{ height: 110, background: '#f8f9fa', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {file.filename.endsWith('.svg') ? (
            <img src={file.url} style={{ maxWidth: '70%', maxHeight: '70%', objectFit: 'contain' }} />
          ) : (
            <img src={file.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {hover && (
            <div className="position-absolute top-0 end-0 d-flex gap-1 p-1" style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '0 0 0 10px' }}>
              <button onClick={ev => { ev.stopPropagation(); onCopy(); }} className="btn btn-sm btn-light d-flex align-items-center" style={{ borderRadius: 7, padding: '3px 6px' }} title="URL kopyala">
                {copied === file.url ? <Check size={11} color="#198754" /> : <Copy size={11} />}
              </button>
              <button onClick={ev => { ev.stopPropagation(); onDelete(); }} className="btn btn-sm btn-light d-flex align-items-center" style={{ borderRadius: 7, padding: '3px 6px', color: '#dc3545' }} title="Sil">
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>
        <div className="p-2">
          <div style={{ fontSize: 11, fontWeight: 600, color: '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.filename}</div>
          <div style={{ fontSize: 10, color: '#adb5bd' }}>{formatSize(file.size)}</div>
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaTab({ token }: { token: string }) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toast = useToast();
  const h = { Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/media', { headers: h });
    if (res.ok) setFiles(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await fetch('/api/media/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (res.ok) { toast.success(`${file.name} yükləndi.`); await load(); }
      else { const d = await res.json(); toast.error(d.error || 'Yükləmə xətası.'); }
    } finally { setUploading(false); }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach(uploadFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`"${filename}" faylını silmək istədiyinizə əminsiniz?`)) return;
    const res = await fetch(`/api/media/${encodeURIComponent(filename)}`, { method: 'DELETE', headers: h });
    if (res.ok) { toast.success('Fayl silindi.'); await load(); if (preview?.filename === filename) setPreview(null); }
    else toast.error('Silmək alınmadı.');
  };

  const copyUrl = (url: string) => {
    const full = window.location.origin + url; // keep origin for clipboard copy only — user needs full URL
    navigator.clipboard.writeText(full).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-0 fw-bold">Media & Görsellər</h5>
          <div style={{ fontSize: 12, color: '#6c757d' }}>{files.length} fayl · Logo, ikon, şəkil</div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={load} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 10 }}><RefreshCw size={13} /></button>
          <button onClick={() => inputRef.current?.click()} disabled={uploading} className="btn btn-danger btn-sm fw-semibold d-flex align-items-center gap-2" style={{ borderRadius: 10, padding: '8px 16px' }}>
            <Upload size={14} /> {uploading ? 'Yüklənir...' : 'Fayl Yüklə'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)} />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className="mb-4"
        style={{
          border: `2px dashed ${dragOver ? '#e30613' : '#dee2e6'}`,
          borderRadius: 14,
          padding: '28px 20px',
          textAlign: 'center',
          background: dragOver ? '#fff0f0' : '#fafafa',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <Upload size={28} color={dragOver ? '#e30613' : '#adb5bd'} style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 600, fontSize: 14, color: dragOver ? '#e30613' : '#495057', marginBottom: 4 }}>
          {uploading ? 'Yüklənir...' : 'Faylları buraya sürüklə və ya klik et'}
        </div>
        <div style={{ fontSize: 12, color: '#adb5bd' }}>JPG, PNG, SVG, WebP, GIF, ICO · Maks 8MB</div>
      </div>

      {/* File grid */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" style={{ width: 28, height: 28 }} /></div>
      ) : files.length === 0 ? (
        <div className="text-center py-5" style={{ color: '#adb5bd' }}>
          <Image size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 13 }}>Heç bir fayl yoxdur</div>
        </div>
      ) : (
        <div className="row g-3">
          {files.map(file => (
            <MediaCard
              key={file.filename}
              file={file}
              copied={copied}
              onPreview={() => setPreview(file)}
              onCopy={() => copyUrl(file.url)}
              onDelete={() => handleDelete(file.filename)}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setPreview(null)}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 18 }}>
              <div className="modal-header border-0 px-4 pt-4 pb-2">
                <div>
                  <h6 className="mb-0 fw-bold" style={{ fontSize: 14 }}>{preview.filename}</h6>
                  <div style={{ fontSize: 11, color: '#adb5bd' }}>{formatSize(preview.size)}</div>
                </div>
                <button onClick={() => setPreview(null)} className="btn-close" />
              </div>
              <div className="modal-body px-4 pb-2">
                <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                  <img src={preview.url} style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 8 }} onClick={e => e.stopPropagation()} />
                </div>
              </div>
              <div className="modal-footer border-0 px-4 pb-4 gap-2">
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  <input
                    className="form-control form-control-sm"
                    style={{ borderRadius: 9, fontSize: 12, fontFamily: 'monospace', background: '#f8f9fa' }}
                    value={window.location.origin + preview.url}
                    readOnly
                    onFocus={e => e.target.select()}
                  />
                  <button onClick={() => copyUrl(preview.url)} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 9, whiteSpace: 'nowrap' }}>
                    {copied === preview.url ? <><Check size={12} color="#198754" /> Kopyalandı</> : <><Copy size={12} /> URL</>}
                  </button>
                </div>
                <button onClick={() => handleDelete(preview.filename)} className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" style={{ borderRadius: 9 }}>
                  <Trash2 size={12} /> Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}