import React from 'react';
import { motion } from 'motion/react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

interface CartItemsProps {
  items: any[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
}

export default function CartItems({ items, onUpdateQuantity, onRemoveItem }: CartItemsProps) {
  const { content, locale } = useSiteContent();
  const c = content.cart;
  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tighter">{t(locale, c.heading)}</h1>
        <span className="text-white/70 font-bold">{items.length} {t(locale, c.itemCount)}</span>
      </div>

      <div className="space-y-4">
        {items.map((item: any) => (
          <motion.div
            key={item.productId || item.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-[40px] shadow-xl shadow-black/20 group"
          >
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
              {item.technicalAnswers && Object.keys(item.technicalAnswers).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(item.technicalAnswers).map(([key, value]) => (
                    <span key={key} className="px-3 py-1 bg-white/5 text-[10px] font-bold text-white/50 rounded-lg border border-white/10">
                      <span className="text-red-500/60 mr-1">{key}:</span> {value as string}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/10">
                <button
                  onClick={() => onUpdateQuantity(item.productId || item.id, -1)}
                  className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-premium-orange transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-bold">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.productId || item.id, 1)}
                  className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-premium-orange transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => onRemoveItem(item.productId || item.id)}
                className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
