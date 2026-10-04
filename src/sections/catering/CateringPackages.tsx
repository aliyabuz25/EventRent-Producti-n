import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, CheckCircle2, ChefHat, MapPin, Calendar, Clock, Users, FileText, ShieldCheck, X, RefreshCw, MessageCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';
import PhoneInput from '../../components/PhoneInput';

type Step = 'form' | 'otp' | 'success';
const OTP_LENGTH = 6;
const FORMATS = ['Korporativ', 'Toy', 'Nişan', 'Ad günü', 'Məzuniyyət', 'Açılış', 'Digər'];
const GUEST_OPTIONS = ['10-20', '20-50', '50-100', '100-200', '200-500', '500+'];
const TIME_SLOTS = ['08:00–12:00', '10:00–14:00', '12:00–16:00', '14:00–18:00', '16:00–20:00', '18:00–22:00', '19:00–23:00', '20:00–00:00', 'Xüsusi saat'];

export default function CateringRequest() {
  const toast = useToast();
  const { content, locale } = useSiteContent();
  const s = content.catering.request;
  const firstRef = useRef<HTMLInputElement>(null);
  const otpRefs = Array.from({ length: OTP_LENGTH }, () => useRef<HTMLInputElement>(null));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [devCode, setDevCode] = useState('');

  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationDrop, setShowLocationDrop] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const locationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    guests: '', location: '', date: '',
    time_range: '', format: '', menu_note: '',
  });

  const searchLocation = (q: string) => {
    setForm(f => ({ ...f, location: q }));
    if (locationTimer.current) clearTimeout(locationTimer.current);
    if (q.length < 2) { setLocationResults([]); setShowLocationDrop(false); return; }
    setLocationLoading(true);
    locationTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=az`);
        const data = await r.json();
        setLocationResults(data);
        setShowLocationDrop(true);
      } catch { setLocationResults([]); }
      finally { setLocationLoading(false); }
    }, 400);
  };

  const selectLocation = (display: string) => {
    const short = display.split(',').slice(0, 3).join(',').trim();
    setForm(f => ({ ...f, location: short }));
    setShowLocationDrop(false);
    setLocationResults([]);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setShowLocationDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sendOtp = async () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error('Ad və telefon mütləqdir.'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'OTP göndərilmədi.'); return; }
      if (data._dev_code) setDevCode(data._dev_code);
      setStep('otp'); setOtp(Array(OTP_LENGTH).fill('')); setOtpError('');
      setResendCooldown(60);
      const iv = setInterval(() => setResendCooldown(c => { if (c <= 1) { clearInterval(iv); return 0; } return c - 1; }), 1000);
      setTimeout(() => otpRefs[0].current?.focus(), 200);
    } catch { toast.error('Xəta baş verdi.'); }
    finally { setSending(false); }
  };

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[idx] = digit; setOtp(next); setOtpError('');
    if (digit && idx < OTP_LENGTH - 1) otpRefs[idx + 1].current?.focus();
    if (digit && idx === OTP_LENGTH - 1) {
      const code = next.join('');
      if (code.length === OTP_LENGTH) verifyAndSubmit(code);
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs[idx - 1].current?.focus();
    if (e.key === 'Enter') verifyAndSubmit(otp.join(''));
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (text.length > 0) {
      const next = Array(OTP_LENGTH).fill('');
      text.split('').forEach((d, i) => { if (i < OTP_LENGTH) next[i] = d; });
      setOtp(next); setOtpError('');
      const focusIdx = Math.min(text.length, OTP_LENGTH - 1);
      otpRefs[focusIdx].current?.focus();
      if (text.length === OTP_LENGTH) verifyAndSubmit(text);
    }
  };

  const verifyAndSubmit = async (code?: string) => {
    const finalCode = code || otp.join('');
    if (finalCode.length < OTP_LENGTH) { setOtpError(`${OTP_LENGTH} rəqəmli kodu daxil edin.`); return; }
    setVerifying(true); setOtpError('');
    try {
      const verRes = await fetch('/api/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, code: finalCode }),
      });
      const verData = await verRes.json();
      if (!verRes.ok) { setOtpError(verData.error || 'Yanlış kod.'); setVerifying(false); return; }
      const orderRes = await fetch('/api/catering/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, package_name: 'Fərdi Sifariş' }),
      });
      if (!orderRes.ok) throw new Error();
      setStep('success');
    } catch { toast.error('Xəta baş verdi. Yenidən cəhd edin.'); }
    finally { setVerifying(false); }
  };

  const inpLight = "w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

  return (
    <section className="relative bg-[#050505] py-28 md:py-36 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-premium-orange/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-premium-orange/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* LEFT */}
          <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.65, ease: 'easeOut' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-10 bg-premium-orange" />
              <span className="text-[10px] font-black uppercase tracking-[0.38em] text-premium-orange">{t(locale, s.eyebrow)}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[0.9] mb-8">
              {t(locale, s.titleLine1)}<br />
              <em className="not-italic text-premium-orange">{t(locale, s.titleLine2)}</em>
            </h2>
            <p className="text-white/45 text-lg font-light leading-relaxed mb-10 max-w-lg">{t(locale, s.subtitle)}</p>
            <ul className="space-y-4">
              {s.features.map((f, i) => {
                const icons = [ChefHat, Users, Calendar, CheckCircle2];
                const Icon = icons[i % icons.length];
                return (
                  <li key={i} className="flex items-center gap-4 text-white/60 text-sm font-medium">
                    <span className="w-9 h-9 rounded-xl bg-premium-orange/10 border border-premium-orange/20 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-premium-orange" /></span>
                    {t(locale, f)}
                  </li>
                );
              })}
            </ul>
            <div className="mt-12 pt-8 border-t border-white/[0.06]">
              <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em] mb-4">Bilavasitə əlaqə</p>
              <div className="flex flex-wrap gap-4">
                <a href="tel:+994102553555" className="flex items-center gap-2 text-white/50 hover:text-premium-orange text-sm font-bold transition-colors duration-200"><Send className="w-3.5 h-3.5" /> +994 10 255 35 55</a>
                <a href="mailto:sales@eventrent.az" className="flex items-center gap-2 text-white/50 hover:text-premium-orange text-sm font-bold transition-colors duration-200"><FileText className="w-3.5 h-3.5" /> sales@eventrent.az</a>
              </div>
            </div>
          </motion.div>

          {/* RIGHT - Məlumat Kartı */}
          <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.65, delay: 0.1, ease: 'easeOut' }}
            className="flex flex-col justify-center">
            
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2rem] p-10 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-premium-orange/[0.05] rounded-full blur-[80px] pointer-events-none" />
              <h3 className="text-3xl font-black tracking-tight text-white mb-4">Sifariş üçün hazırsınız?</h3>
              <p className="text-white/50 leading-relaxed mb-8">
                Tədbirinizin detallarını bizimlə paylaşın. Xüsusi hazırladığımız form vasitəsilə ehtiyaclarınızı qısa zamanda komandamıza çatdıra bilərsiniz.
              </p>
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 text-sm font-semibold text-white/70">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><CheckCircle2 size={16} className="text-premium-orange" /></div>
                  Sürətli və asan sifariş
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold text-white/70">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><MessageCircle size={16} className="text-premium-orange" /></div>
                  WhatsApp ilə anında təsdiq
                </div>
              </div>
              <button onClick={() => { setIsModalOpen(true); setStep('form'); }}
                className="w-full py-5 bg-premium-orange hover:bg-premium-orange/90 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-colors duration-300 shadow-[0_20px_40px_rgba(227,6,19,0.25)] flex items-center justify-center gap-3">
                <ChefHat size={18} /> Sifariş Formunu Aç
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Sifariş Modalı (Light/Bootstrap Theme) ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ perspective: 1000 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-[#f8f9fa] border border-gray-200 rounded-[20px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {step !== 'success' && (
                <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              )}

              <div className="overflow-y-auto overflow-x-hidden p-6 md:p-8 custom-scrollbar">
                <AnimatePresence mode="wait">

                  {/* FORM */}
                  {step === 'form' && (
                    <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <div className="mb-6 pr-8 border-b border-gray-200 pb-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 mb-1">Ketrinq Sifarişi</p>
                        <h3 className="text-xl font-bold text-gray-900">Zəhmət olmasa məlumatları doldurun</h3>
                      </div>

                      <div className="space-y-5 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        {/* Ad + Telefon */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Ad Soyad <span className="text-red-500">*</span></label>
                            <input ref={firstRef} type="text" placeholder="Adınız" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inpLight} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Telefon <span className="text-red-500">*</span></label>
                            <PhoneInput theme="light" value={form.phone} onChange={val => setForm(f => ({ ...f, phone: val }))} className="w-full bg-white border border-gray-300 rounded-lg transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20" />
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Email</label>
                          <input type="email" placeholder="email@domain.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inpLight} />
                        </div>

                        {/* Qonaq sayı */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Qonaq sayı</label>
                          <div className="flex flex-wrap gap-2">
                            {GUEST_OPTIONS.map(g => (
                              <button key={g} type="button" onClick={() => setForm(f => ({ ...f, guests: g }))}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all duration-150 ${form.guests === g ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                {g}
                              </button>
                            ))}
                            <input type="text" placeholder="Özəl say" value={GUEST_OPTIONS.includes(form.guests) ? '' : form.guests}
                              onChange={e => setForm(f => ({ ...f, guests: e.target.value }))}
                              className="flex-1 min-w-[80px] px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                          </div>
                        </div>

                        {/* Məkan */}
                        <div ref={locationRef}>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Məkan</label>
                          <div className="relative">
                            <input type="text" placeholder="Şəhər, küçə, yer adı..." value={form.location}
                              onChange={e => searchLocation(e.target.value)}
                              onFocus={() => { if (locationResults.length > 0) setShowLocationDrop(true); }}
                              className={inpLight} autoComplete="off" />
                            {locationLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
                            {showLocationDrop && locationResults.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
                                {locationResults.map((r: any) => (
                                  <button key={r.place_id} type="button" onClick={() => selectLocation(r.display_name)}
                                    className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2 leading-snug">{r.display_name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tarix + Saat */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tarix</label>
                            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                              min={new Date().toISOString().split('T')[0]} className={inpLight} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Saat aralığı</label>
                            <div className="flex flex-wrap gap-1.5">
                              {TIME_SLOTS.map(slot => (
                                <button key={slot} type="button" onClick={() => setForm(f => ({ ...f, time_range: slot === 'Xüsusi saat' ? '' : slot }))}
                                  className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all duration-150 ${form.time_range === slot ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                                  {slot}
                                </button>
                              ))}
                            </div>
                            {(form.time_range === '' || !TIME_SLOTS.slice(0, -1).includes(form.time_range)) && (
                              <input type="text" placeholder="məs: 18:00 – 23:00" value={form.time_range}
                                onChange={e => setForm(f => ({ ...f, time_range: e.target.value }))}
                                className={`${inpLight} mt-2`} />
                            )}
                          </div>
                        </div>

                        {/* Format */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tədbir formatı</label>
                          <div className="flex flex-wrap gap-2">
                            {FORMATS.map(fmt => (
                              <button key={fmt} type="button" onClick={() => setForm(f => ({ ...f, format: fmt }))}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all duration-150 ${form.format === fmt ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                {fmt}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Menyu qeyd */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Menyu haqqında xüsusi istək</label>
                          <textarea rows={2} placeholder="Allerji, xüsusi diyet..." value={form.menu_note}
                            onChange={e => setForm(f => ({ ...f, menu_note: e.target.value }))} className={`${inpLight} resize-none`} />
                        </div>
                      </div>

                      {/* WhatsApp note */}
                      <div className="mt-5 flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <MessageCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <p className="text-green-800 text-xs leading-relaxed">
                          Formu göndərəndə telefon nömrənizə <span className="font-bold">WhatsApp</span> vasitəsilə <b>{OTP_LENGTH}</b> rəqəmli təsdiq kodu göndəriləcək.
                        </p>
                      </div>

                      <button type="button" disabled={sending} onClick={sendOtp}
                        className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 shadow-sm">
                        {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Göndərilir...</> : <>Kodu al və davam et</>}
                      </button>
                      <p className="text-center text-gray-400 text-[10px] mt-3 uppercase tracking-wider">WhatsApp bildirişi sizə və adminə göndəriləcək</p>
                    </motion.div>
                  )}

                  {/* OTP */}
                  {step === 'otp' && (
                    <motion.div key="otp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4">
                      <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><MessageCircle className="w-7 h-7 text-green-600" /></div>
                        <h3 className="text-xl font-bold text-gray-900">WhatsApp Kodu</h3>
                        <p className="text-gray-500 text-sm mt-2">Kod <span className="text-gray-900 font-bold">{form.phone}</span> nömrəsinə göndərildi</p>
                      </div>

                      {devCode && (
                        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 font-bold text-center shadow-sm">
                          Dev mode kodu: {devCode}
                        </div>
                      )}

                      {/* OTP inputs */}
                      <div className="flex gap-2 sm:gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
                        {otp.map((digit, idx) => (
                          <input key={idx} ref={otpRefs[idx]} type="text" inputMode="numeric" maxLength={1} value={digit}
                            onChange={e => handleOtpChange(idx, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(idx, e)}
                            className={`w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold bg-white border-2 rounded-xl text-gray-900 focus:outline-none transition-colors duration-200 shadow-sm ${
                              otpError ? 'border-red-500 bg-red-50' : digit ? 'border-green-500 bg-green-50' : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                            }`}
                          />
                        ))}
                      </div>

                      {otpError && <p className="text-center text-red-500 text-sm font-bold mb-4">{otpError}</p>}

                      <button type="button" disabled={verifying || otp.join('').length < OTP_LENGTH} onClick={() => verifyAndSubmit()}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 shadow-sm">
                        {verifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Yoxlanılır...</> : <>Təsdiqlə və Göndər</>}
                      </button>

                      <div className="flex items-center justify-center gap-2 mt-6">
                        <p className="text-gray-500 text-xs">Kodu almadınız?</p>
                        {resendCooldown > 0
                          ? <span className="text-gray-500 text-xs font-bold">{resendCooldown}s gözləyin</span>
                          : <button type="button" onClick={sendOtp} className="text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors">Yenidən göndər</button>
                        }
                      </div>
                    </motion.div>
                  )}

                  {/* SUCCESS */}
                  {step === 'success' && (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 text-center gap-4">
                      <div className="w-20 h-20 bg-green-50 border-4 border-green-100 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Sifarişiniz qəbul edildi!</h3>
                        <p className="text-gray-500 text-sm max-w-sm leading-relaxed">Komandamız ən qısa zamanda sizinlə əlaqə saxlayaraq detalları dəqiqləşdirəcək.</p>
                      </div>
                      {(form.date || form.location || form.guests) && (
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-6 py-4 text-sm text-gray-600 space-y-2 w-full max-w-sm text-left mt-4">
                          {form.guests   && <p className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-400">Qonaq:</span> <span className="text-gray-900 font-medium">{form.guests}</span></p>}
                          {form.date     && <p className="flex justify-between border-b border-gray-100 pb-2 pt-1"><span className="text-gray-400">Tarix:</span> <span className="text-gray-900 font-medium">{form.date}</span></p>}
                          {form.location && <p className="flex justify-between pt-1"><span className="text-gray-400">Məkan:</span> <span className="text-gray-900 font-medium">{form.location}</span></p>}
                        </div>
                      )}
                      <button onClick={() => { setStep('form'); setForm({ name:'',phone:'',email:'',guests:'',location:'',date:'',time_range:'',format:'',menu_note:'' }); setOtp(Array(OTP_LENGTH).fill('')); setIsModalOpen(false); }}
                        className="mt-6 px-10 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl transition-colors duration-200 shadow-md">
                        Pəncərəni Bağla
                      </button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
