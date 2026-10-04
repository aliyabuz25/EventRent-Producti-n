import React from 'react';
import { motion } from 'motion/react';
import { Trash2, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
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
  const { content, locale } = useSiteContent();
  const c = content.cart;
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-center justify-between">
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
            <motion.div
              key={pid}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 rounded-[40px] shadow-xl shadow-black/20 overflow-hidden"
            >
              {/* Main row */}
              <div className="flex items-center gap-6 p-6 group">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center">
                  {item.product?.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product?.name ?? ''}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-white/20 text-3xl font-black">{(item.product?.name ?? item.name ?? '?')[0]}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white truncate">{item.product?.name ?? item.name ?? '—'}</h3>
                  <p className="text-sm text-white/70 font-medium">{item.product?.category ?? item.category ?? ''}</p>

                  {/* Metric answers preview */}
                  {answeredCount > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(answers).filter(([,v]) => v).map(([key, value]) => (
                        <span key={key} className="px-3 py-1 bg-white/5 text-[10px] font-bold text-white/50 rounded-lg border border-white/10">
                          <span className="text-red-500/60 mr-1">{key}:</span> {value as string}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expand trigger */}
                  {specKeys.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(pid)}
                      className="mt-2 flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-premium-orange transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? 'Xüsusiyyətləri gizlət' : `Xüsusiyyətləri doldur (${specKeys.length})`}
                      {answeredCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-md">{answeredCount}/{specKeys.length}</span>}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/10">
                    <button
                      onClick={() => onUpdateQuantity(pid, -1)}
                      className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-premium-orange transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(pid, 1)}
                      className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-premium-orange transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(pid)}
                    className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Metric questions panel */}
              {isExpanded && specKeys.length > 0 && (
                <div className="border-t border-white/10 px-6 pb-6 pt-4">
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4">Məhsul xüsusiyyətləri</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {specKeys.map(key => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{key}</label>
                        <input
                          type="text"
                          value={answers[key] || ''}
                          onChange={e => onSetAnswer(pid, key, e.target.value)}
                          placeholder={specs[key] ? `Məs: ${specs[key]}` : `${key} daxil edin`}
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-premium-orange focus:bg-white/10 transition-all"
                        />
                      </div>
                    ))}
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
