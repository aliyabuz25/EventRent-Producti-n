import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, CheckCircle2, ChefHat, MapPin, Calendar, Clock, Users, FileText } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

export default function CateringRequest() {
  const toast = useToast();
  const { content, locale } = useSiteContent();
  const s = content.catering.request;
  const firstRef = useRef<HTMLInputElement>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    guests: '', location: '', date: '',
    time_range: '', format: '', menu_note: '',
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error(`${t(locale, s.fields.name)} ${t(locale, s.fields.phone)}`);
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/catering/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, package_name: 'Fərdi Sifariş' }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      toast.success(t(locale, s.successTitle));
    } catch {
      toast.error('Xəta baş verdi. Yenidən cəhd edin.');
    } finally {
      setSending(false);
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

          {/* RIGHT — form */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, delay: 0.1, ease: 'easeOut' }}
          >
            <div className="relative bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-premium-orange/[0.06] rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-premium-orange/25 to-transparent" />

              {!sent ? (
                <div className="p-8 md:p-10">
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

                  <button
                    type="button"
                    disabled={sending}
                    onClick={handleSubmit}
                    className="w-full mt-6 py-4 bg-premium-orange hover:bg-premium-orange/90 disabled:opacity-50 text-white font-black text-sm uppercase tracking-[0.22em] rounded-2xl flex items-center justify-center gap-3 transition-[background-color] duration-200 shadow-[0_16px_48px_rgba(227,6,19,0.28)]"
                  >
                    {sending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Göndərilir...</>
                      : <><Send className="w-4 h-4" /> {t(locale, s.submitBtn)}</>
                    }
                  </button>
                  <p className="text-center text-white/20 text-xs mt-3">{t(locale, s.waNote)}</p>
                </div>
              ) : (
                <motion.div
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
                    onClick={() => { setSent(false); setForm({ name:'',phone:'',email:'',guests:'',location:'',date:'',time_range:'',format:'',menu_note:'' }); }}
                    className="mt-2 px-10 py-3.5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-premium-orange hover:text-white transition-[background-color,color] duration-300"
                  >
                    {t(locale, s.newOrderBtn)}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
