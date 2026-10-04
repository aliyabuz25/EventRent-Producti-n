import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, RefreshCw, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import LazyDatePicker from './LazyDatePicker';

interface TeambuildingDetailViewProps {
  selectedGame: any;
  selectedConcept: any;
  setSelectedConcept: (concept: any) => void;
  orderExtraData: any;
  setOrderExtraData: (data: any) => void;
  handleOrder: () => void;
  setStep: (step: any) => void;
  concepts: any[];
  sending?: boolean;
}

export default function TeambuildingDetailView({
  selectedGame, selectedConcept, setSelectedConcept,
  orderExtraData, setOrderExtraData, handleOrder, setStep, concepts, sending = false
}: TeambuildingDetailViewProps) {
  const inputCls = 'w-full px-8 py-5 bg-white/5 rounded-[2rem] border-2 border-transparent focus:border-premium-orange focus:bg-white/10 transition-all text-sm font-bold text-white placeholder:text-white/30';

  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (locationSelected || locationQuery.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(locationQuery)}&limit=7`);
        const data = await res.json();
        const suggestions = (data.features || []).map((f: any) => {
          const p = f.properties || {};
          const name = p.name || p.city || p.town || p.village || '';
          const sub = [p.city || p.town || p.village, p.state, p.country].filter(Boolean).join(', ');
          return { label: name, sub };
        }).filter((s: any) => s.label);
        setLocationSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch {
        setLocationSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [locationQuery, locationSelected]);

  const handleLocationSelect = (s: { label: string; sub: string }) => {
    const full = s.sub ? `${s.label}, ${s.sub}` : s.label;
    setLocationQuery(full);
    setOrderExtraData({ ...orderExtraData, location: full });
    setLocationSelected(true);
    setShowSuggestions(false);
  };

  const handleLocationChange = (val: string) => {
    setLocationQuery(val);
    setOrderExtraData({ ...orderExtraData, location: val });
    setLocationSelected(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12"
    >
      <button 
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStep('list'); }}
        className="flex items-center gap-2 text-white/70 hover:text-premium-orange font-bold uppercase text-[10px] tracking-widest mb-12 transition-colors group"
      >
        <X className="w-4 h-4 transition-transform group-hover:rotate-90" /> Oyunlara qayıt
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-12">
          <div className="relative aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white/5">
            <img src={selectedGame.image} loading="lazy" decoding="async" className="w-full h-full object-cover" alt={selectedGame.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-12 left-12 right-12">
              <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
                {selectedGame.category}
              </div>
              <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-none">{selectedGame.name}</h1>
            </div>
          </div>
        </div>

        <div className="space-y-16 py-8">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-premium-orange rounded-full" />
              <h2 className="text-[10px] font-black text-white/70 uppercase tracking-[0.4em]">Oyun Haqqında</h2>
            </div>
            <p className="text-white/70 text-xl font-medium leading-relaxed">{selectedGame.details}</p>
          </div>

          <div className="space-y-12 pt-12 border-t border-white/5">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-10 bg-premium-orange rounded-full" />
                  <h2 className="text-[10px] font-black text-white/70 uppercase tracking-[0.4em]">Konsepsiya Seçin</h2>
                </div>
                {selectedConcept && (
                  <span className="text-[10px] font-black text-premium-orange uppercase tracking-widest bg-premium-orange/5 px-4 py-2 rounded-full border border-premium-orange/10">
                    {selectedConcept.name}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-4">
                {concepts.map(concept => (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedConcept(concept); }}
                    className={cn(
                      "relative aspect-square rounded-3xl overflow-hidden border-2 transition-all group",
                      selectedConcept?.id === concept.id
                        ? "border-premium-orange scale-95 shadow-2xl shadow-premium-orange/20"
                        : "border-transparent opacity-40 hover:opacity-100"
                    )}
                  >
                    <img src={concept.image} loading="lazy" decoding="async" className="w-full h-full object-cover" alt={concept.name} />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] text-white font-black uppercase text-center px-1 leading-tight">{concept.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-premium-orange rounded-full" />
                <h2 className="text-[10px] font-black text-white/70 uppercase tracking-[0.4em]">Sifariş Detalları</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/70 uppercase tracking-widest ml-4">Ad Soyad *</label>
                  <input type="text" placeholder="Ad və Soyadınız" required
                    className={inputCls}
                    value={orderExtraData.name || ''} onChange={e => setOrderExtraData({...orderExtraData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/70 uppercase tracking-widest ml-4">Telefon *</label>
                  <input type="tel" placeholder="+994 XX XXX XX XX" required
                    className={inputCls}
                    value={orderExtraData.phone || ''} onChange={e => setOrderExtraData({...orderExtraData, phone: e.target.value})} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[9px] font-black text-white/70 uppercase tracking-widest ml-4">Şirkət (isteğe bağlı)</label>
                  <input type="text" placeholder="Şirkətinizin adı"
                    className={inputCls}
                    value={orderExtraData.company || ''} onChange={e => setOrderExtraData({...orderExtraData, company: e.target.value})} />
                </div>
                
                <div className="space-y-2 relative" ref={autocompleteRef}>
                  <label className="text-[9px] font-black text-white/70 uppercase tracking-widest ml-4">Məkan *</label>
                  <input type="text" placeholder="Məs: Şamaxı, Bakı..." required
                    className={inputCls}
                    value={locationQuery}
                    onChange={e => handleLocationChange(e.target.value)}
                    onFocus={() => { if (locationSuggestions.length > 0) setShowSuggestions(true); }}
                    autoComplete="off"
                  />
                  <AnimatePresence>
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                      >
                        {locationSuggestions.map((s, idx) => (
                          <div
                            key={idx}
                            onMouseDown={e => { e.preventDefault(); handleLocationSelect(s); }}
                            className="px-6 py-3.5 hover:bg-premium-orange/15 cursor-pointer transition-colors flex items-start gap-3 border-b border-white/5 last:border-0"
                          >
                            <MapPin className="w-4 h-4 text-premium-orange shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-white font-bold text-sm truncate">{s.label}</p>
                              {s.sub && <p className="text-white/40 text-xs mt-0.5 truncate">{s.sub}</p>}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/70 uppercase tracking-widest ml-4">İştirakçı sayı *</label>
                  <input type="text" placeholder="Məs: 50 nəfər" required
                    className={inputCls}
                    value={orderExtraData.participants || ''} onChange={e => setOrderExtraData({...orderExtraData, participants: e.target.value})} />
                </div>
                <div className="space-y-2 sm:col-span-2 flex flex-col">
                  <label className="text-[9px] font-black text-white/70 uppercase tracking-widest ml-4 mb-2">Tarix *</label>
                  <LazyDatePicker
                    value={orderExtraData.date || ''}
                    onChange={v => setOrderExtraData({...orderExtraData, date: v})}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="pt-12">
              <button 
                type="button"
                disabled={sending || !selectedConcept || !orderExtraData.location || !orderExtraData.participants || !orderExtraData.date || !orderExtraData.name || !orderExtraData.phone}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOrder(); }}
                className="w-full bg-white text-black py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] hover:bg-premium-orange hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_32px_64px_-16px_rgba(227,6,19,0.3)] flex items-center justify-center gap-6 group"
              >
                {sending ? (
                  <><RefreshCw className="w-6 h-6 animate-spin" /> Göndərilir...</>
                ) : (
                  <><ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" /> Sifarişi Tamamla</>
                )}
              </button>
              <p className="text-center text-[10px] text-white/50 font-bold uppercase tracking-[0.2em] mt-8">
                Təsdiq mesajı WhatsApp-ınıza göndəriləcək
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}