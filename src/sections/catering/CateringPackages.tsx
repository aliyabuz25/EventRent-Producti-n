import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, CheckCircle2, ChefHat, MapPin, Calendar, Clock, Users, FileText, ShieldCheck, X, RefreshCw, MessageCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

type Step = 'form' | 'otp' | 'success';

export default function CateringRequest() {
  const toast = useToast();
  const { content, locale } = useSiteContent();
  const s = content.catering.request;
  const firstRef = useRef<HTMLInputElement>(null);
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const [step, setStep] = useState<Step>('form');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [devCode, setDevCode] = useState('');

  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    guests: '', location: '', date: '',
    time_range: '', format: '', menu_note: '',
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  // OTP göndər
  const sendOtp = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Ad və telefon mütləqdir.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'OTP göndərilmədi.'); return; }
      if (data._dev_code) setDevCode(data._dev_code);
      setStep('otp');
      setOtp(['', '', '', '']);
      setOtpError('');
      // 60 saniyə geri sayım
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(c => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
      }, 1000);
      setTimeout(() => otpRefs[0].current?.focus(), 200);
    } catch {
      toast.error('Xəta baş verdi. Yenidən cəhd edin.');
    } finally {
      setSending(false);
    }
  };

  // OTP daxil etmə
  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setOtpError('');
    if (digit && idx < 3) otpRefs[idx + 1].current?.focus();
    if (!digit && idx > 0) otpRefs[idx - 1].current?.focus();
    // Avtomatik doğrula
    if (digit && idx === 3) {
      const code = [...next.slice(0, 3), digit].join('');
      if (code.length === 4) verifyAndSubmit(code);
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs[idx - 1].current?.focus();
    if (e.key === 'Enter') verifyAndSubmit(otp.join(''));
  };

  // OTP yoxla + sifariş göndər
  const verifyAndSubmit = async (code?: string) => {
    const finalCode = code || otp.join('');
    if (finalCode.length < 4) { setOtpError('4 rəqəmli kodu daxil edin.'); return; }
    setVerifying(true);
    setOtpError('');
    try {
      // 1. OTP yoxla
      const verRes = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, code: finalCode }),
      });
      const verData = await verRes.json();
      if (!verRes.ok) { setOtpError(verData.error || 'Yanlış kod.'); setVerifying(false); return; }

      // 2. Sifariş göndər
      const orderRes = await fetch('/api/catering/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, package_name: 'Fərdi Sifariş' }),
      });
      if (!orderRes.ok) throw new Error();
      setStep('success');
    } catch {
      toast.error('Xəta baş verdi. Yenidən cəhd edin.');
    } finally {
      setVerifying(false);
    }
  };

  const inp = 'w-full px-5 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-premium-orange/50 focus:bg-white/[0.07] transition-[border-color,background-color] duration-200';

  const fields = [
    { key: 'name' as const,      label: t(locale, s.fields.name),      placeholder: 'Adınız',              icon: Users,    required: true,  type: 'text',  span: false },
    { key: 'phone' as const,     label: t(locale, s.fields.phone),     placeholder: '+994 50 000 00 00',   icon: Send,     required: true,  type: 'tel',   span: false },
    { key: 'email' as const,     label: t(locale, s.fields.email),     placeholder: 'email@domain.com',    icon: FileText, required: false, type: 'email', span: true },
    { key: 'guests' as const,    label: t(locale, s.fields.guests),    placeholder: 'məs: 50 nəfər',       icon: Users,    required: false, type: 'text',  span: false },
    { key: 'location' as const,  label: t(locale, s.fields.location),  placeholder: 'Tədbir keçiriləcək yer', icon: MapPin, required: false, type: 'text', span: true },
    { key: 'date' as const,      label: t(locale, s.fields.date),      placeholder: '',                    icon: Calendar, required: false, type: 'date',  span: false },
    { key: 'time_range' as const,label: t(locale, s.fields.timeRange), placeholder: 'məs: 18:00 – 23:00', icon: Clock,    required: false, type: 'text',  span: false },
    { key: 'format' as const,    label: t(locale, s.fields.format),    placeholder: 'Korporativ, Toy...',  icon: ChefHat,  required: false, type: 'text',  span: true },
  ];

  return (
    <section className="relative bg-[#050505] py-28 md:py-36 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-premium-orange/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-premium-orange/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-10 bg-premium-orange" />
              <span className="text-[10px] font-black uppercase tracking-[0.38em] text-premium-orange">{t(locale, s.eyebrow)}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[0.9] mb-8">
              {t(locale, s.titleLine1)}<br />
              <em className="not-italic text-premium-orange">{t(locale, s.titleLine2)}</em>
            </h2>
            <p className="text-white/45 text-lg font-light leading-relaxed mb-10 max-w-lg">
              {t(locale, s.subtitle)}
            </p>

            <ul className="space-y-4">
              {s.features.map((f, i) => {
                const icons = [ChefHat, Users, Calendar, CheckCircle2];
                const Icon = icons[i % icons.length];
                return (
                  <li key={i} className="flex items-center gap-4 text-white/60 text-sm font-medium">
                    <span className="w-9 h-9 rounded-xl bg-premium-orange/10 border border-premium-orange/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-premium-orange" />
                    </span>
                    {t(locale, f)}
                  </li>
                );
              })}
            </ul>

            <div className="mt-12 pt-8 border-t border-white/[0.06]">
              <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em] mb-4">Bilavasitə əlaqə</p>
              <div className="flex flex-wrap gap-4">
                <a href="tel:+994102553555" className="flex items-center gap-2 text-white/50 hover:text-premium-orange text-sm font-bold transition-colors duration-200">
                  <Send className="w-3.5 h-3.5" /> +994 10 255 35 55
                </a>
                <a href="mailto:sales@eventrent.az" className="flex items-center gap-2 text-white/50 hover:text-premium-orange text-sm font-bold transition-colors duration-200">
                  <FileText className="w-3.5 h-3.5" /> sales@eventrent.az
                </a>
              </div>
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, delay: 0.1, ease: 'easeOut' }}
          >
            <div className="relative bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-premium-orange/[0.06] rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-premium-orange/25 to-transparent" />

              <AnimatePresence mode="wait">

                {/* STEP 1: FORM */}
                {step === 'form' && (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 md:p-10">
                    <div className="mb-8">
                      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-premium-orange mb-2">Sifariş formu</p>
                      <h3 className="text-2xl font-black tracking-tight text-white">{t(locale, s.formTitle)}</h3>
                      <p className="text-white/35 text-sm mt-1">{t(locale, s.formSubtitle)}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {fields.map(({ key, label, placeholder, icon: Icon, required, type, span }, i) => (
                        <div key={key} className={span ? 'sm:col-span-2' : ''}>
                          <label className="flex items-center gap-1.5 text-[9px] font-black text-white/35 uppercase tracking-[0.25em] mb-2">
                            <Icon className="w-3 h-3 text-premium-orange/70" />
                            {label} {required && <span className="text-premium-orange">*</span>}
                          </label>
                          <input
                            ref={i === 0 ? firstRef : undefined}
                            type={type}
                            placeholder={placeholder}
                            value={form[key]}
                            onChange={set(key)}
                            className={inp}
                            min={type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
                          />
                        </div>
                      ))}

                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-1.5 text-[9px] font-black text-white/35 uppercase tracking-[0.25em] mb-2">
                          <ChefHat className="w-3 h-3 text-premium-orange/70" />
                          {t(locale, s.fields.menuNote)}
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Allerji, xüsusi diyet, menyu üstünlükləri..."
                          value={form.menu_note}
                          onChange={set('menu_note')}
                          className={`${inp} resize-none`}
                        />
                      </div>
                    </div>

                    {/* WhatsApp OTP note */}
                    <div className="mt-5 flex items-start gap-3 p-3.5 bg-green-500/5 border border-green-500/15 rounded-2xl">
                      <MessageCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <p className="text-white/40 text-xs leading-relaxed">
                        Formu göndərəndə telefon nömrənizə <span className="text-green-400 font-bold">WhatsApp</span> vasitəsilə 4 rəqəmli təsdiq kodu göndəriləcək.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={sending}
                      onClick={sendOtp}
                      className="w-full mt-5 py-4 bg-premium-orange hover:bg-premium-orange/90 disabled:opacity-50 text-white font-black text-sm uppercase tracking-[0.22em] rounded-2xl flex items-center justify-center gap-3 transition-[background-color] duration-200 shadow-[0_16px_48px_rgba(227,6,19,0.28)]"
                    >
                      {sending
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Göndərilir...</>
                        : <><ShieldCheck className="w-4 h-4" /> Kodu al və davam et</>
                      }
                    </button>
                    <p className="text-center text-white/20 text-xs mt-3">{t(locale, s.waNote)}</p>
                  </motion.div>
                )}

                {/* STEP 2: OTP */}
                {step === 'otp' && (
                  <motion.div key="otp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 md:p-10">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-green-400 mb-2">Təsdiq kodu</p>
                        <h3 className="text-2xl font-black tracking-tight text-white">WhatsApp kodu</h3>
                        <p className="text-white/35 text-sm mt-1">
                          <span className="text-white/60 font-bold">{form.phone}</span> nömrəsinə göndərildi
                        </p>
                      </div>
                      <button onClick={() => setStep('form')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Telefon nömrəsi */}
                    <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/15 rounded-2xl mb-8">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40">WhatsApp-a kod göndərildi</p>
                        <p className="text-sm font-bold text-white">{form.phone}</p>
                      </div>
                    </div>

                    {/* Dev mode code hint */}
                    {devCode && (
                      <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400 font-bold text-center">
                        Dev mode kodu: {devCode}
                      </div>
                    )}

                    {/* 4 rəqəmli OTP input */}
                    <div className="flex gap-3 justify-center mb-6">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={otpRefs[idx]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(idx, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(idx, e)}
                          className={`w-16 h-20 text-center text-3xl font-black bg-white/[0.04] border-2 rounded-2xl text-white focus:outline-none transition-all duration-200 ${
                            otpError
                              ? 'border-red-500/50 bg-red-500/5'
                              : digit
                              ? 'border-green-500/50 bg-green-500/5'
                              : 'border-white/[0.08] focus:border-premium-orange/60 focus:bg-white/[0.07]'
                          }`}
                        />
                      ))}
                    </div>

                    {otpError && (
                      <p className="text-center text-red-400 text-sm font-bold mb-4">{otpError}</p>
                    )}

                    <button
                      type="button"
                      disabled={verifying || otp.join('').length < 4}
                      onClick={() => verifyAndSubmit()}
                      className="w-full py-4 bg-premium-orange hover:bg-premium-orange/90 disabled:opacity-50 text-white font-black text-sm uppercase tracking-[0.22em] rounded-2xl flex items-center justify-center gap-3 transition-[background-color] duration-200 shadow-[0_16px_48px_rgba(227,6,19,0.28)]"
                    >
                      {verifying
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Yoxlanılır...</>
                        : <><CheckCircle2 className="w-4 h-4" /> Təsdiqlə və Göndər</>
                      }
                    </button>

                    <div className="flex items-center justify-center gap-2 mt-4">
                      <p className="text-white/30 text-xs">Kodu almadınız?</p>
                      {resendCooldown > 0 ? (
                        <span className="text-white/30 text-xs font-bold">{resendCooldown}s sonra yenidən göndər</span>
                      ) : (
                        <button
                          type="button"
                          onClick={sendOtp}
                          className="text-premium-orange text-xs font-bold hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Yenidən göndər
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: SUCCESS */}
                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.93 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                    className="flex flex-col items-center justify-center py-20 px-8 text-center gap-5"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 18, stiffness: 280, delay: 0.1 }}
                      className="w-20 h-20 bg-green-500/10 border-2 border-green-500/25 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight mb-2">{t(locale, s.successTitle)}</h3>
                      <p className="text-white/45 text-sm max-w-xs leading-relaxed">{t(locale, s.successSubtitle)}</p>
                    </div>
                    {(form.date || form.location || form.guests) && (
                      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-6 py-4 text-sm text-white/50 space-y-1.5 w-full max-w-xs text-left">
                        {form.guests   && <p><span className="text-white/30">{t(locale, s.fields.guests)}:</span> <span className="text-white">{form.guests}</span></p>}
                        {form.date     && <p><span className="text-white/30">{t(locale, s.fields.date)}:</span> <span className="text-white">{form.date}</span></p>}
                        {form.location && <p><span className="text-white/30">{t(locale, s.fields.location)}:</span> <span className="text-white">{form.location}</span></p>}
                      </div>
                    )}
                    <button
                      onClick={() => { setStep('form'); setForm({ name:'',phone:'',email:'',guests:'',location:'',date:'',time_range:'',format:'',menu_note:'' }); setOtp(['','','','']); }}
                      className="mt-2 px-10 py-3.5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-premium-orange hover:text-white transition-[background-color,color] duration-300"
                    >
                      {t(locale, s.newOrderBtn)}
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
