import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Phone as PhoneIcon, MapPin, Calendar, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useLocationAutocomplete } from '../../hooks/useLocationAutocomplete';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';
import PhoneInput from '../../components/PhoneInput';

interface CartCheckoutProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  error: string | null;
  itemsCount: number;
}

export default function CartCheckout({
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  error,
  itemsCount,
}: CartCheckoutProps) {
  const { content, locale } = useSiteContent();
  const c = content.cart;
  const { results, loading: locLoading, search, clear } = useLocationAutocomplete();
  const [showDropdown, setShowDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        clear();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [clear]);

  const handleLocationChange = (val: string) => {
    setFormData({ ...formData, location: val });
    search(val);
    setShowDropdown(true);
  };

  const handleSelect = (displayName: string) => {
    const short = displayName.split(',').slice(0, 2).join(',').trim();
    setFormData({ ...formData, location: short });
    setShowDropdown(false);
    clear();
  };

  const inputCls = "w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[24px] text-sm font-bold text-white focus:outline-none focus:bg-white/10 focus:border-premium-orange focus:shadow-[0_0_20px_rgba(227,6,19,0.1)] transition-all duration-300 placeholder:text-white/50";

  return (
    <aside className="lg:w-[450px]">
      <div className="bg-white/5 border border-white/10 rounded-[60px] p-10 shadow-2xl shadow-black/20 sticky top-32 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tighter">{t(locale, c.checkoutTitle)}</h2>
          <p className="text-sm text-white/70 font-medium">{t(locale, c.checkoutSub)}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">

            {/* Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] ml-1">{t(locale, c.labelName)}</label>
              <div className="relative">
                <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder={t(locale, c.placeholderName)} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] ml-1">{t(locale, c.labelEmail)}</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} placeholder="email@example.com" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2 z-10">
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] ml-1">{t(locale, c.labelPhone)}</label>
              <PhoneInput 
                value={formData.phone} 
                onChange={(val) => setFormData({ ...formData, phone: val })} 
                className="w-full bg-white/5 border border-white/10 rounded-[24px] focus-within:bg-white/10 focus-within:border-premium-orange focus-within:shadow-[0_0_20px_rgba(227,6,19,0.1)] transition-all duration-300" 
              />
            </div>

            {/* Location */}
            <div className="space-y-2" ref={locationRef}>
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] ml-1">{t(locale, c.labelLocation)}</label>
              <div className="relative">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 z-10" />
                {locLoading && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 animate-spin" />}
                <input type="text" value={formData.location} onChange={(e) => handleLocationChange(e.target.value)} onFocus={() => { if (results.length > 0) setShowDropdown(true); }} className={inputCls} placeholder={t(locale, c.placeholderLocation)} autoComplete="off" />
                {showDropdown && results.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    {results.map((r) => (
                      <button key={r.place_id} type="button" onClick={() => handleSelect(r.display_name)} className="w-full text-left px-5 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-start gap-3">
                        <MapPin className="w-3.5 h-3.5 text-premium-orange mt-0.5 shrink-0" />
                        <span className="line-clamp-2 leading-snug">{r.display_name}</span>
                      </button>
                    ))}
                    <div className="px-5 py-2 text-[10px] text-white/30 border-t border-white/5">© OpenStreetMap contributors</div>
                  </div>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] ml-1">{t(locale, c.labelDate)}</label>
              <div className="relative">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <input type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} className={inputCls} />
              </div>
            </div>

          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold backdrop-blur-md">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || itemsCount === 0}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
              e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
            }}
            onMouseLeave={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
              e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
            }}
            className="group relative overflow-hidden cursor-pointer w-full bg-white text-black py-6 rounded-[24px] font-black text-lg hover:text-white transition-colors duration-500 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(227,6,19,0.3)] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <div className="absolute inset-0 bg-premium-orange pointer-events-none z-0 [clip-path:circle(0px_at_var(--x,50%)_var(--y,50%))] group-hover:[clip-path:circle(150%_at_var(--x,50%)_var(--y,50%))] transition-[clip-path] duration-500 ease-out" />
            <span className="relative z-10 flex items-center gap-3">
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black group-hover:border-white border-t-transparent rounded-full animate-spin transition-colors" />
                  {t(locale, c.submitting)}
                </>
              ) : (
                <>
                  {t(locale, c.submitBtn)} <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </>
              )}
            </span>
          </button>
        </form>
      </div>
    </aside>
  );
}