import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Pencil, Trash2, Check, X, Tag, RefreshCw, Package, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../components/Toast';

interface Category {
  id: string;
  name: string;
  sort_order: number;
  active: number;
}

interface SortableItemProps {
  cat: Category;
  productCount: number;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onToggle: (cat: Category) => void;
  toggling: boolean;
}

function SortableItem({ cat, productCount, onEdit, onDelete, onToggle, toggling }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });

  const isActive = cat.active !== 0;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{
        background: isDragging ? '#fff8f8' : isActive ? '#fff' : '#f8f9fa',
        border: isDragging ? '2px dashed #e30613' : isActive ? '1px solid #e9ecef' : '1px dashed #dee2e6',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : isActive ? '0 2px 6px rgba(0,0,0,0.03)' : 'none',
        cursor: 'default',
        userSelect: 'none',
        transition: 'all 0.2s',
      }}>
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', color: isActive ? '#adb5bd' : '#dee2e6', display: 'flex', alignItems: 'center', flexShrink: 0, touchAction: 'none' }}
          title="Sürükle"
        >
          <GripVertical size={18} />
        </div>

        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: isActive ? '#fff5f5' : '#f1f3f5',
          border: `1px solid ${isActive ? '#ffd6d6' : '#dee2e6'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Tag size={16} color={isActive ? '#e30613' : '#adb5bd'} />
        </div>

        {/* Name + count */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 14,
            color: isActive ? '#212529' : '#adb5bd',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            textDecoration: isActive ? 'none' : 'line-through',
          }}>{cat.name}</div>
          <div style={{ fontSize: 11, color: '#adb5bd', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Package size={11} /> {productCount} məhsul
            {!isActive && <span style={{ background: '#fff3cd', color: '#856404', borderRadius: 6, padding: '0px 6px', fontSize: 10, fontWeight: 700, marginLeft: 4 }}>GİZLİ</span>}
          </div>
        </div>

        {/* Sort badge */}
        <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: '2px 8px', fontSize: 11, color: '#6c757d', fontWeight: 600, flexShrink: 0 }}>
          #{cat.sort_order + 1}
        </div>

        {/* Toggle active */}
        <button
          onClick={() => onToggle(cat)}
          disabled={toggling}
          style={{
            border: 'none',
            background: isActive ? '#d1fae5' : '#f1f3f5',
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: '0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          title={isActive ? 'Gizlə' : 'Göstər'}
        >
          {isActive ? <Eye size={14} color="#059669" /> : <EyeOff size={14} color="#adb5bd" />}
        </button>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(cat)}
            style={{ border: 'none', background: '#f8f9fa', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e9ecef')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f8f9fa')}
            title="Redaktə et"
          >
            <Pencil size={14} color="#495057" />
          </button>
          <button
            onClick={() => onDelete(cat)}
            style={{ border: 'none', background: '#fff5f5', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff5f5')}
            title="Sil"
          >
            <Trash2 size={14} color="#dc3545" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesTab({ token }: { token: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const toast = useToast();
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories', { headers: h }),
        fetch('/api/products'),
      ]);
      const cats: Category[] = catRes.ok ? await catRes.json() : [];
      const prods: { category: string }[] = prodRes.ok ? await prodRes.json() : [];
      const counts: Record<string, number> = {};
      prods.forEach(p => { if (p.category) counts[p.category] = (counts[p.category] || 0) + 1; });
      setCategories(cats);
      setProductCounts(counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex(c => c.id === active.id);
    const newIndex = categories.findIndex(c => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    const r = await fetch('/api/categories/reorder', {
      method: 'PATCH', headers: h,
      body: JSON.stringify({ ids: reordered.map(c => c.id) }),
    });
    if (r.ok) { toast.success('Sıralama saxlanıldı.'); await load(); }
    else { toast.error('Sıralama saxlanmadı.'); await load(); }
  };

  const handleToggle = async (cat: Category) => {
    setTogglingId(cat.id);
    try {
      const r = await fetch(`/api/categories/${cat.id}/toggle`, { method: 'PATCH', headers: h });
      if (r.ok) {
        const updated = await r.json();
        setCategories(prev => prev.map(c => c.id === cat.id ? updated : c));
        toast.success(updated.active ? `"${cat.name}" aktiv edildi.` : `"${cat.name}" gizlədildi.`);
      } else toast.error('Xəta baş verdi.');
    } finally { setTogglingId(null); }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const r = await fetch('/api/categories', { method: 'POST', headers: h, body: JSON.stringify({ name: newName.trim() }) });
      if (r.ok) { toast.success('Kateqoriya əlavə edildi.'); setNewName(''); setAdding(false); await load(); }
      else { const d = await r.json(); toast.error(d.error || 'Xəta baş verdi.'); }
    } finally { setSaving(false); }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/categories/${id}`, { method: 'PUT', headers: h, body: JSON.stringify({ name: editName.trim() }) });
      if (r.ok) { toast.success('Kateqoriya yeniləndi.'); setEditId(null); setEditName(''); await load(); }
      else { const d = await r.json(); toast.error(d.error || 'Xəta baş verdi.'); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (cat: Category) => {
    const count = productCounts[cat.name] || 0;
    const msg = count > 0
      ? `"${cat.name}" kateqoriyasını silmək istəyirsiniz? Bu kateqoriyaya aid ${count} məhsul var — onların kateqoriyası boş qalacaq.`
      : `"${cat.name}" kateqoriyasını silmək istəyirsiniz?`;
    if (!window.confirm(msg)) return;
    const r = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE', headers: h });
    if (r.ok) { toast.success('Kateqoriya silindi.'); await load(); }
    else toast.error('Silmək alınmadı.');
  };

  const activeCount = categories.filter(c => c.active !== 0).length;
  const hiddenCount = categories.length - activeCount;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h5 style={{ margin: 0, fontWeight: 800 }}>Kateqoriyalar</h5>
          <div style={{ fontSize: 12, color: '#6c757d', marginTop: 2, display: 'flex', gap: 8 }}>
            <span>Sürükle-bırak ilə sıranı dəyişin</span>
            <span style={{ color: '#dee2e6' }}>·</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>{activeCount} aktiv</span>
            {hiddenCount > 0 && <><span style={{ color: '#dee2e6' }}>·</span><span style={{ color: '#adb5bd' }}>{hiddenCount} gizli</span></>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ border: '1px solid #dee2e6', background: '#fff', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw size={13} color="#6c757d" />
          </button>
          <button
            onClick={() => { setAdding(true); setEditId(null); }}
            style={{ border: 'none', background: '#e30613', color: '#fff', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <Plus size={14} /> Yeni Kateqoriya
          </button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ background: '#fff', border: '2px solid #e30613', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Tag size={16} color="#e30613" style={{ flexShrink: 0 }} />
          <input
            autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewName(''); } }}
            placeholder="Kateqoriya adı..."
            style={{ flex: 1, border: '1px solid #dee2e6', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
          />
          <button onClick={handleAdd} disabled={saving || !newName.trim()}
            style={{ border: 'none', background: '#e30613', color: '#fff', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: saving || !newName.trim() ? 0.6 : 1 }}>
            <Check size={14} /> Əlavə et
          </button>
          <button onClick={() => { setAdding(false); setNewName(''); }}
            style={{ border: '1px solid #dee2e6', background: '#fff', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#6c757d' }}>
            <X size={14} /> Ləğv
          </button>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 11, color: '#6c757d' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} color="#059669" /> Aktiv — kataloquda görünür</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><EyeOff size={12} color="#adb5bd" /> Gizli — kataloquda görünmür</span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner-border text-danger" style={{ width: 28, height: 28 }} />
        </div>
      ) : categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px dashed #dee2e6' }}>
          <Tag size={40} color="#adb5bd" style={{ opacity: 0.4, marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#495057' }}>Kateqoriya yoxdur</div>
          <div style={{ fontSize: 12, color: '#adb5bd', marginTop: 4 }}>Yeni kateqoriya əlavə edin</div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categories.map(cat => (
                editId === cat.id ? (
                  <div key={cat.id} style={{ background: '#fff', border: '2px solid #e30613', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Tag size={16} color="#e30613" style={{ flexShrink: 0 }} />
                    <input
                      autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') { setEditId(null); setEditName(''); } }}
                      style={{ flex: 1, border: '1px solid #dee2e6', borderRadius: 8, padding: '7px 11px', fontSize: 13, outline: 'none' }}
                    />
                    <button onClick={() => handleEdit(cat.id)} disabled={saving || !editName.trim()}
                      style={{ border: 'none', background: '#e30613', color: '#fff', borderRadius: 8, padding: '7px 13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: saving || !editName.trim() ? 0.6 : 1 }}>
                      <Check size={13} /> Saxla
                    </button>
                    <button onClick={() => { setEditId(null); setEditName(''); }}
                      style={{ border: '1px solid #dee2e6', background: '#fff', borderRadius: 8, padding: '7px 13px', cursor: 'pointer', color: '#6c757d', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <X size={13} /> Ləğv
                    </button>
                  </div>
                ) : (
                  <SortableItem
                    key={cat.id}
                    cat={cat}
                    productCount={productCounts[cat.name] || 0}
                    onEdit={c => { setEditId(c.id); setEditName(c.name); setAdding(false); }}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    toggling={togglingId === cat.id}
                  />
                )
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Info */}
      {categories.length > 0 && (
        <div style={{ marginTop: 20, padding: '12px 16px', background: '#f8f9fa', borderRadius: 10, border: '1px solid #e9ecef', fontSize: 12, color: '#6c757d', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GripVertical size={14} />
          Sürükle-bırak ilə kateqoriyaların sırasını dəyişə bilərsiniz. Gizli kateqoriyalar kataloquda göstərilmir.
        </div>
      )}
    </div>
  );
}
