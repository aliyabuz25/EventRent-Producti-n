import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Minus, Plus, Trash2, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

interface CartItemsProps {
  items: any[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  technicalAnswers: Record<string, Record<string, string>>;
  onSetAnswer: (productId: string, key: string, value: string) => void;
}

export default function CartItems({ items, onUpdateQuantity, onRemoveItem, technicalAnswers, onSetAnswer }: CartItemsProps) {
  const { locale, content } = useSiteContent();
  const c = content.cart;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/spec-templates')
      .then(r => r.ok ? r.json() : [])
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const toggleExpand = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const getTemplate = (name: string) => templates.find(t => t.name === name);

  const renderInput = (pid: string, key: string, value: string) => {
    const tmpl = getTemplate(key);
    const ft = tmpl?.field_type || 'text';
    const options: string[] = tmpl?.options || [];
    const unit = tmpl?.unit || '';

    const baseInput = "w-full bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-premium-orange focus:bg-white/10 transition-all";

    if (ft === 'boolean') {
      return (
        <div className="flex gap-3">
          {['Bəli', 'Xeyr'].map(opt => (
            <button key={opt} type="button" onClick={() => onSetAnswer(pid, key, opt)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all ${value === opt ? 'bg-premium-orange border-premium-orange text-white' : 'bg-white/5 border-white/10 text-white/50 hover:border-premium-orange/40'}`}>
              {value === opt ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (ft === 'select' && options.length > 0) {
      return (
        <select value={value} onChange={e => onSetAnswer(pid, key, e.target.value)}
          className={`${baseInput} px-4 py-2.5 bg-[#1a1a1a] appearance-none`}>
          <option value="">Seçin...</option>
          {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }

    if (ft === 'multiselect' && options.length > 0) {
      const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {options.map((opt: string) => {
            const isOn = selected.includes(opt);
            return (
              <button key={opt} type="button"
                onClick={() => {
                  const next = isOn ? selected.filter(s => s !== opt) : [...selected, opt];
                  onSetAnswer(pid, key, next.join(', '));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isOn ? 'bg-premium-orange border-premium-orange text-white' : 'bg-white/5 border-white/10 text-white/50 hover:border-premium-orange/40'}`}>
                {opt}
              </button>
            );
          })}
        </div>
      );
    }

    if (ft === 'dimensions') {
      const parts = value ? value.split('x').map(s => s.trim()) : ['', '', ''];
      const [en, boy, hund] = [parts[0] || '', parts[1] || '', parts[2] || ''];
      const update = (idx: number, v: string) => {
        const arr = [en, boy, hund];
        arr[idx] = v;
        onSetAnswer(pid, key, arr.filter(Boolean).join(' x '));
      };
      return (
        <div className="grid grid-cols-3 gap-2">
          {[['En', en, 0], ['Boy', boy, 1], ['Hünd.', hund, 2]].map(([label, val, idx]) => (
            <div key={label as string}>
              <p className="text-[9px] text-white/30 font-bold uppercase mb-1">{label}</p>
              <input type="number" value={val as string} onChange={e => update(idx as number, e.target.value)}
                placeholder="0" className={`${baseInput} px-3 py-2 text-center`} />
            </div>
          ))}
        </div>
      );
    }

    if (ft === 'color') {
      if (options.length > 0) {
        return (
          <div className="flex flex-wrap gap-2">
            {options.map((opt: string) => (
              <button key={opt} type="button" onClick={() => onSetAnswer(pid, key, opt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${value === opt ? 'bg-premium-orange border-premium-orange text-white' : 'bg-white/5 border-white/10 text-white/50 hover:border-premium-orange/40'}`}>
                {opt}
              </button>
            ))}
          </div>
        );
      }
      return (
        <input type="text" value={value} onChange={e => onSetAnswer(pid, key, e.target.value)}
          placeholder={`Rəng daxil edin${unit ? ` (${unit})` : ''}`}
          className={`${baseInput} px-4 py-2.5`} />
      );
    }

    if (ft === 'number') {
      return (
        <div className="flex items-center gap-2">
          <input type="number" value={value} onChange={e => onSetAnswer(pid, key, e.target.value)}
            placeholder="0" className={`${baseInput} px-4 py-2.5 flex-1`} />
          {unit && <span className="text-white/40 text-sm font-bold shrink-0">{unit}</span>}
        </div>
      );
    }

    // default: text
    return (
      <input type="text" value={value} onChange={e => onSetAnswer(pid, key, e.target.value)}
        placeholder={`${key} daxil edin${unit ? ` (${unit})` : ''}`}
        className={`${baseInput} px-4 py-2.5`} />
    );
  };

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tighter">{t(locale, c.heading)}</h1>
        <span className="text-white/70 font-bold">{items.length} {t(locale, c.itemCount)}</span>
      </div>

      <div className="space-y-4">
        {items.map((item: any) => {
          const pid = item.productId || item.id;
          const specs: Record<string, string> = item.product?.technicalSpecs || {};
          const specKeys = Object.keys(specs);
          const answers = technicalAnswers[pid] || {};
          const isExpanded = expanded[pid];
          const answeredCount = Object.keys(answers).filter(k => answers[k]).length;

          return (
            <motion.div key={pid} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 rounded-[40px] shadow-xl shadow-black/20 overflow-hidden">

              {/* Main row */}
              <div className="flex items-center gap-6 p-6 group">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center">
                  {item.product?.images?.[0] ? (
                    <img src={item.product.images[0]} alt={item.product?.name ?? ''}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <span className="text-white/20 text-3xl font-black">{(item.product?.name ?? item.name ?? '?')[0]}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white truncate">{item.product?.name ?? item.name ?? '—'}</h3>
                  <p className="text-sm text-white/70 font-medium">{item.product?.category ?? item.category ?? ''}</p>

                  {/* Answered preview */}
                  {answeredCount > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(answers).filter(([, v]) => v).map(([key, value]) => (
                        <span key={key} className="px-3 py-1 bg-white/5 text-[10px] font-bold text-white/50 rounded-lg border border-white/10">
                          <span className="text-premium-orange/70 mr-1">{key}:</span> {value as string}
                        </span>
                      ))}
                    </div>
                  )}

                  {specKeys.length > 0 && (
                    <button type="button" onClick={() => toggleExpand(pid)}
                      className="mt-2 flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-premium-orange transition-colors">
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? 'Xüsusiyyətləri gizlət' : `Xüsusiyyətləri doldur (${specKeys.length})`}
                      {answeredCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-premium-orange/20 text-premium-orange rounded-md">
                          {answeredCount}/{specKeys.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/10">
                    <button onClick={() => onUpdateQuantity(pid, -1)}
                      className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-premium-orange transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(pid, 1)}
                      className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-premium-orange transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => onRemoveItem(pid)}
                    className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Spec input panel */}
              {isExpanded && specKeys.length > 0 && (
                <div className="border-t border-white/10 px-6 pb-6 pt-4">
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4">Sifariş detalları</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {specKeys.map(key => {
                      const tmpl = getTemplate(key);
                      const ft = tmpl?.field_type || 'text';
                      const isFullWidth = ['dimensions', 'multiselect', 'boolean'].includes(ft);
                      return (
                        <div key={key} className={isFullWidth ? 'sm:col-span-2' : ''}>
                          <label className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                            {key}
                            {tmpl?.unit && <span className="text-white/20 normal-case font-normal">({tmpl.unit})</span>}
                          </label>
                          {renderInput(pid, key, answers[key] || '')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
