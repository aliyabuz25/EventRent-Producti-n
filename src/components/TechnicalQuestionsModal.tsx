import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingBag, CheckSquare, Square } from 'lucide-react';
import { useSiteContent } from '../content.context';
import { t } from '../content';

interface TechnicalQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (answers: Record<string, string>) => void;
  productName: string;
  category: string;
  technicalSpecs?: Record<string, string>;
}

interface SpecTemplate {
  id: string; name: string; unit: string; field_type: string; options: string[];
}

export default function TechnicalQuestionsModal({
  isOpen, onClose, onConfirm, productName, technicalSpecs = {}
}: TechnicalQuestionsModalProps) {
  const { content, locale } = useSiteContent();
  const c = content.product;
  const [quantity, setQuantity] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<SpecTemplate[]>([]);

  useEffect(() => {
    fetch('/api/spec-templates')
      .then(r => r.ok ? r.json() : [])
      .then(setTemplates)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      const init: Record<string, string> = {};
      Object.keys(technicalSpecs).forEach(k => { init[k] = ''; });
      setAnswers(init);
      setQuantity(1);
    }
  }, [isOpen, technicalSpecs]);

  const getTemplate = (name: string) => templates.find(t => t.name === name);

  const handleConfirm = () => {
    onConfirm({ ...answers, quantity: quantity.toString() });
  };

  const specKeys = Object.keys(technicalSpecs);

  const baseInput = "w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:outline-none focus:bg-white/10 focus:border-premium-orange focus:shadow-[0_0_20px_rgba(227,6,19,0.1)] transition-all duration-300 placeholder:text-white/50";

  const renderInput = (key: string) => {
    const tmpl = getTemplate(key);
    const ft = tmpl?.field_type || 'text';
    const options: string[] = tmpl?.options || [];
    const unit = tmpl?.unit || '';
    const value = answers[key] || '';
    const setVal = (v: string) => setAnswers(prev => ({ ...prev, [key]: v }));

    if (ft === 'boolean') {
      return (
        <div className="flex gap-3">
          {['Bəli', 'Xeyr'].map(opt => (
            <button key={opt} type="button" onClick={() => setVal(opt)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-bold transition-all ${value === opt ? 'bg-premium-orange border-premium-orange text-white' : 'bg-white/5 border-white/10 text-white/50 hover:border-premium-orange/40'}`}>
              {value === opt ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (ft === 'select' && options.length > 0) {
      return (
        <select value={value} onChange={e => setVal(e.target.value)}
          className="w-full px-6 py-4 bg-[#1a1a2e] border border-white/10 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-premium-orange transition-all appearance-none">
          <option value="">Seçin...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }

    if (ft === 'multiselect' && options.length > 0) {
      const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {options.map(o => {
            const isOn = selected.includes(o);
            return (
              <button key={o} type="button"
                onClick={() => {
                  const next = isOn ? selected.filter(s => s !== o) : [...selected, o];
                  setVal(next.join(', '));
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${isOn ? 'bg-premium-orange border-premium-orange text-white' : 'bg-white/5 border-white/10 text-white/50 hover:border-premium-orange/40'}`}>
                {o}
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
        const arr = [en, boy, hund]; arr[idx] = v;
        setVal(arr.filter(Boolean).join(' x '));
      };
      return (
        <div className="grid grid-cols-3 gap-2">
          {[['En', en, 0], ['Boy', boy, 1], ['Hünd.', hund, 2]].map(([label, val, idx]) => (
            <div key={label as string}>
              <p className="text-[9px] text-white/30 font-bold uppercase mb-1">{label}</p>
              <input type="number" value={val as string} onChange={e => update(idx as number, e.target.value)}
                placeholder="0" className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white text-center focus:outline-none focus:border-premium-orange transition-all" />
            </div>
          ))}
        </div>
      );
    }

    if (ft === 'color' && options.length > 0) {
      return (
        <div className="flex flex-wrap gap-2">
          {options.map(o => (
            <button key={o} type="button" onClick={() => setVal(o)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${value === o ? 'bg-premium-orange border-premium-orange text-white' : 'bg-white/5 border-white/10 text-white/50 hover:border-premium-orange/40'}`}>
              {o}
            </button>
          ))}
        </div>
      );
    }

    if (ft === 'number') {
      return (
        <div className="flex items-center gap-2">
          <input type="number" value={value} onChange={e => setVal(e.target.value)}
            placeholder="0" className={`${baseInput} flex-1`} />
          {unit && <span className="text-white/40 text-sm font-bold shrink-0 min-w-[2rem]">{unit}</span>}
        </div>
      );
    }

    return (
      <input type="text" value={value} onChange={e => setVal(e.target.value)}
        placeholder={`${key}${unit ? ` (${unit})` : ''} daxil edin...`}
        className={baseInput} />
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-brand-card/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl shadow-black overflow-hidden"
          >
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">{t(locale, c.modalTitle)}</h3>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6 text-white/70 hover:text-white" />
              </button>
            </div>

            <div className="px-8 pb-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Say */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/70 uppercase tracking-widest">{t(locale, c.qty)}</label>
                <div className="flex items-center justify-between w-32 bg-white/5 rounded-2xl p-2 border border-white/10">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-black text-white">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic specs from product */}
              {specKeys.length > 0 ? specKeys.map(key => (
                <div key={key} className="space-y-3">
                  <label className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                    {key}{getTemplate(key)?.unit ? ` (${getTemplate(key)!.unit})` : ''}
                  </label>
                  {renderInput(key)}
                </div>
              )) : (
                <div className="text-white/30 text-sm text-center py-4">
                  Bu məhsul üçün xüsusiyyət təyin edilməyib.
                </div>
              )}

              <button
                onClick={handleConfirm}
                onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`); }}
                onMouseLeave={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`); }}
                className="group relative overflow-hidden cursor-pointer w-full bg-white text-black py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:text-white transition-colors duration-500 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(227,6,19,0.3)] mt-8"
              >
                <div className="absolute inset-0 bg-premium-orange pointer-events-none z-0 [clip-path:circle(0px_at_var(--x,50%)_var(--y,50%))] group-hover:[clip-path:circle(150%_at_var(--x,50%)_var(--y,50%))] transition-[clip-path] duration-500 ease-out" />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {t(locale, c.addToCartBtn)} <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
