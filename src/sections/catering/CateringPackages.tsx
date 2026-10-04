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
const TIME_SLOTS = [
  '08:00–12:00', '10:00–14:00', '12:00–16:00',
  '14:00–18:00', '16:00–20:00', '18:00–22:00',
  '19:00–23:00', '20:00–00:00', 'Xüsusi saat'
];

export default function CateringRequest() {
  const toast = useToast();
  const { content, locale } = useSiteContent();
  const s = content.catering.request;
  const firstRef = useRef<HTMLInputElement>(null);
  const otpRefs = Array.from({ length: OTP_LENGTH }, () => useRef<HTMLInputElement>(null));

  const [step, setStep] = useState<Step>('form');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [devCode, setDevCode] = useState('');

  // Location autocomplete
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

  const set = (k: keyof typeof form, val?: string) =>
    (e?: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: val ?? e!.target.value }));

  // Location search
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

  // OTP göndər
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

  // OTP daxil etmə
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

  // Paste handler
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

  // OTP yoxla + sifariş göndər
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

  const inp = 'w-full px-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-premium-orange/60 focus:bg-white/[0.05] transition-all duration-200';

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

          {/* RIGHT */}
          <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.65, delay: 0.1, ease: 'easeOut' }}>
            <div className="relative bg-[#0a0a0a] border border-white/[0.08] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-premium-orange/[0.05] rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-premium-orange/40 to-transparent" />

              <AnimatePresence mode="wait">

                {/* FORM */}
                {step === 'form' && (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 md:p-10">
                    <div className="mb-8">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-premium-orange mb-1">Ketrinq Sifarişi</p>
                      <h3 className="text-xl font-bold text-white">Zəhmət olmasa məlumatları doldurun</h3>
                    </div>

                    <div className="space-y-5">
                      {/* Ad + Telefon */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Ad Soyad <span className="text-premium-orange">*</span></label>
                          <input ref={firstRef} type="text" placeholder="Adınız" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Telefon <span className="text-premium-orange">*</span></label>
                          <PhoneInput value={form.phone} onChange={val => setForm(f => ({ ...f, phone: val }))} className="w-full bg-white/[0.03] border border-white/[0.1] rounded-lg transition-colors focus-within:border-premium-orange/60 focus-within:bg-white/[0.05]" />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Email</label>
                        <input type="email" placeholder="email@domain.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inp} />
                      </div>

                      {/* Qonaq sayı — chip seçimi */}
                      <div>
                        <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Qonaq sayı</label>
                        <div className="flex flex-wrap gap-2">
                          {GUEST_OPTIONS.map(g => (
                            <button key={g} type="button" onClick={() => setForm(f => ({ ...f, guests: g }))}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all duration-150 ${form.guests === g ? 'bg-premium-orange border-premium-orange text-white' : 'bg-white/[0.02] border-white/[0.1] text-white/60 hover:border-premium-orange/40 hover:text-white'}`}>
                              {g}
                            </button>
                          ))}
                          <input type="text" placeholder="Özəl say" value={GUEST_OPTIONS.includes(form.guests) ? '' : form.guests}
                            onChange={e => setForm(f => ({ ...f, guests: e.target.value }))}
                            className="flex-1 min-w-[80px] px-3 py-1.5 bg-white/[0.02] border border-white/[0.1] rounded-md text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-premium-orange/60" />
                        </div>
                      </div>

                      {/* Məkan — autocomplete */}
                      <div ref={locationRef}>
                        <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Məkan</label>
                        <div className="relative">
                          <input type="text" placeholder="Şəhər, küçə, yer adı..." value={form.location}
                            onChange={e => searchLocation(e.target.value)}
                            onFocus={() => { if (locationResults.length > 0) setShowLocationDrop(true); }}
                            className={inp} autoComplete="off" />
                          {locationLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin" />}
                          {showLocationDrop && locationResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#111] border border-white/10 rounded-lg overflow-hidden shadow-2xl">
                              {locationResults.map((r: any) => (
                                <button key={r.place_id} type="button" onClick={() => selectLocation(r.display_name)}
                                  className="w-full text-left px-4 py-3 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-start gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-premium-orange mt-0.5 shrink-0" />
                                  <span className="line-clamp-2 leading-snug">{r.display_name}</span>
                                </button>
                              ))}
                              <div className="px-4 py-1.5 text-[9px] text-white/20 border-t border-white/5 bg-black/50">© OpenStreetMap</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tarix + Saat */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Tarix</label>
                          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]} className={inp} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Saat aralığı</label>
                          <div className="flex flex-wrap gap-1.5">
                            {TIME_SLOTS.map(slot => (
                              <button key={slot} type="button" onClick={() => setForm(f => ({ ...f, time_range: slot === 'Xüsusi saat' ? '' : slot }))}
                                className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all duration-150 ${form.time_range === slot ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/70'}`}>
                                {slot}
                              </button>
                            ))}
                          </div>
                          {(form.time_range === '' || !TIME_SLOTS.slice(0, -1).includes(form.time_range)) && (
                            <input type="text" placeholder="məs: 18:00 – 23:00" value={form.time_range}
                              onChange={e => setForm(f => ({ ...f, time_range: e.target.value }))}
                              className={`${inp} mt-2`} />
                          )}
                        </div>
                      </div>

                      {/* Format — chip seçimi */}
                      <div>
                        <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Tədbir formatı</label>
                        <div className="flex flex-wrap gap-2">
                          {FORMATS.map(fmt => (
                            <button key={fmt} type="button" onClick={() => setForm(f => ({ ...f, format: fmt }))}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all duration-150 ${form.format === fmt ? 'bg-premium-orange border-premium-orange text-white' : 'bg-white/[0.02] border-white/[0.1] text-white/60 hover:border-premium-orange/40 hover:text-white'}`}>
                              {fmt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Menyu qeyd */}
                      <div>
                        <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Menyu haqqında xüsusi istək</label>
                        <textarea rows={2} placeholder="Allerji, xüsusi diyet..." value={form.menu_note}
                          onChange={e => setForm(f => ({ ...f, menu_note: e.target.value }))} className={`${inp} resize-none`} />
                      </div>
                    </div>

                    {/* WhatsApp note */}
                    <div className="mt-6 flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                      <MessageCircle className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
                      <p className="text-white/40 text-xs leading-relaxed">
                        Formu göndərəndə telefon nömrənizə WhatsApp vasitəsilə {OTP_LENGTH} rəqəmli təsdiq kodu göndəriləcək.
                      </p>
                    </div>

                    <button type="button" disabled={sending} onClick={sendOtp}
                      className="w-full mt-4 py-4 bg-white hover:bg-gray-100 disabled:opacity-50 text-black font-bold text-sm uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors duration-200">
                      {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Göndərilir...</> : <>Kodu al və davam et</>}
                    </button>
                    <p className="text-center text-white/20 text-[10px] mt-3 uppercase tracking-widest">WhatsApp bildirişi sizə və adminə göndəriləcək</p>
                  </motion.div>
                )}

                {/* OTP */}
                {step === 'otp' && (
                  <motion.div key="otp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 md:p-10">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-premium-orange mb-1">Təsdiq kodu</p>
                        <h3 className="text-xl font-bold text-white">WhatsApp kodu</h3>
                        <p className="text-white/40 text-sm mt-1"><span className="text-white/80">{form.phone}</span> nömrəsinə göndərildi</p>
                      </div>
                      <button onClick={() => setStep('form')} className="w-8 h-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {devCode && (
                      <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400 font-bold text-center">
                        Dev mode kodu: {devCode}
                      </div>
                    )}

                    {/* OTP inputs */}
                    <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
                      {otp.map((digit, idx) => (
                        <input key={idx} ref={otpRefs[idx]} type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={e => handleOtpChange(idx, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(idx, e)}
                          className={`w-12 h-14 text-center text-xl font-bold bg-white/[0.02] border rounded-lg text-white focus:outline-none transition-colors duration-200 ${
                            otpError ? 'border-red-500/50 bg-red-500/5' : digit ? 'border-premium-orange/50 bg-premium-orange/5' : 'border-white/[0.1] focus:border-white/30 focus:bg-white/[0.05]'
                          }`}
                        />
                      ))}
                    </div>

                    {otpError && <p className="text-center text-red-400 text-xs font-bold mb-4">{otpError}</p>}

                    <button type="button" disabled={verifying || otp.join('').length < OTP_LENGTH} onClick={() => verifyAndSubmit()}
                      className="w-full py-4 bg-white hover:bg-gray-100 disabled:opacity-50 text-black font-bold text-sm uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors duration-200">
                      {verifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Yoxlanılır...</> : <>Təsdiqlə və Göndər</>}
                    </button>

                    <div className="flex items-center justify-center gap-2 mt-6">
                      <p className="text-white/30 text-xs">Kodu almadınız?</p>
                      {resendCooldown > 0
                        ? <span className="text-white/30 text-xs font-bold">{resendCooldown}s gözləyin</span>
                        : <button type="button" onClick={sendOtp} className="text-white hover:text-premium-orange text-xs font-bold transition-colors">Yenidən göndər</button>
                      }
                    </div>
                  </motion.div>
                )}

                {/* SUCCESS */}
                {step === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 px-8 text-center gap-5">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight mb-2">Sifarişiniz qəbul edildi!</h3>
                      <p className="text-white/40 text-sm max-w-xs leading-relaxed">Komandamız ən qısa zamanda sizinlə əlaqə saxlayacaq.</p>
                    </div>
                    {(form.date || form.location || form.guests) && (
                      <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg px-6 py-4 text-sm text-white/50 space-y-2 w-full max-w-xs text-left mt-2">
                        {form.guests   && <p><span className="text-white/30">Qonaq:</span> <span className="text-white font-medium ml-2">{form.guests}</span></p>}
                        {form.date     && <p><span className="text-white/30">Tarix:</span> <span className="text-white font-medium ml-2">{form.date}</span></p>}
                        {form.location && <p><span className="text-white/30">Məkan:</span> <span className="text-white font-medium ml-2">{form.location}</span></p>}
                      </div>
                    )}
                    <button onClick={() => { setStep('form'); setForm({ name:'',phone:'',email:'',guests:'',location:'',date:'',time_range:'',format:'',menu_note:'' }); setOtp(Array(OTP_LENGTH).fill('')); }}
                      className="mt-6 px-8 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors duration-200">
                      Yeni Sifariş
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
