import React from 'react';
import { Search, Filter } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { cn } from '../../lib/utils';
import { Product } from '../../types';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

interface CatalogMainProps {
  search: string;
  setSearch: (value: string) => void;
  selectedCategory: string;
  onCategorySelect: (cat: string) => void;
  filteredProducts: Product[];
  categories: string[];
  loading?: boolean;
}

export default function CatalogMain({
  search,
  setSearch,
  selectedCategory,
  onCategorySelect,
  filteredProducts,
  categories,
  loading = false,
}: CatalogMainProps) {
  const { content, locale } = useSiteContent();
  const c = content.catalog;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="space-y-4">
          <span className="text-premium-orange text-[10px] font-black uppercase tracking-[0.4em]">{t(locale, c.hub)}</span>
          <h2 className="text-4xl md:text-6xl font-black tracking-ultra-tight uppercase">
            <span className="text-premium-orange">{t(locale, c.collection)}</span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder={t(locale, c.searchPlaceholder)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-brand-card border border-white/5 rounded-3xl text-sm font-bold text-white placeholder:text-white/70 focus:outline-none focus:ring-4 focus:ring-premium-orange/5 focus:border-premium-orange transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="lg:w-72 shrink-0">
          <div className="sticky top-24 space-y-12 bg-brand-card p-10 rounded-[3rem] border border-white/5 shadow-2xl">
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">{t(locale, c.categories)}</h3>
                <Filter className="w-4 h-4 text-premium-orange" />
              </div>
              <div className="flex flex-col gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => onCategorySelect(cat)}
                    className={cn(
                      "text-left px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden group",
                      selectedCategory === cat
                        ? "bg-premium-orange text-white shadow-xl shadow-premium-orange/20"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="relative z-10">{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-40">
              <div className="w-10 h-10 border-2 border-premium-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-[4rem]">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
                <Search className="w-10 h-10 text-white/70" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{t(locale, c.noGear)}</h3>
              <p className="text-white/50 font-medium mb-10 uppercase text-xs tracking-widest">{t(locale, c.noGearSub)}</p>
              <button
                onClick={() => { setSearch(''); onCategorySelect(t(locale, c.all)); }}
                className="px-10 py-4 bg-premium-orange text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
              >
                {t(locale, c.clearFilters)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}