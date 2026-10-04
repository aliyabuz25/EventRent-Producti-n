import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, CheckCircle2, Loader2, Phone, Mail, MapPin } from 'lucide-react';
import { useToast } from './Toast';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus ilk input açılanda
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 150);
    } else {
      setSent(false);
      setForm({ name: '', phone: '', email: '', message: '' });
    }
  }, [open]);

  // ESC ilə bağla
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Body scroll kilidlə
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Ad və telefon mütləqdir.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message || 'Hero CTA vasitəsilə göndərildi',
          source: 'hero-cta',
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      toast.success('Müraciətiniz qəbul edildi!');
    } catch {
      toast.error('Xəta baş verdi. Yenidən cəhd edin.');
    } finally {
      setSending(false);
    }
  };

  const inputCls = 'w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-premium-orange/60 focus:bg-white/8 transition-[border-color,background-color] duration-200';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">

              {/* Top glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-premium-orange/10 blur-[80px] pointer-events-none" />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 z-10 w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-[color,background-color] duration-200"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-8 md:p-10">
                {!sent ? (
                  <>
                    {/* Header */}
                    <div className="mb-8">
                      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-premium-orange mb-2">EventRent.az</p>
                      <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white leading-tight">Layihənizi Başladın</h2>
                      <p className="text-sm text-white/40 mt-2 font-medium">Məlumatlarınızı doldurun, biz sizinlə əlaqə saxlayaq.</p>
                    </div>

                    {/* Form */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 block mb-1.5">Ad *</label>
                          <input
                            ref={firstInputRef}
                            type="text"
                            placeholder="Adınız"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 block mb-1.5">Telefon *</label>
                          <input
                            type="tel"
                            placeholder="+994 XX XXX XX XX"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 block mb-1.5">Email</label>
                        <input
                          type="email"
                          placeholder="email@domain.com"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 block mb-1.5">Mesaj</label>
                        <textarea
                          rows={3}
                          placeholder="Layihəniz haqqında qısaca məlumat..."
                          value={form.message}
                          onChange={e => setForm({ ...form, message: e.target.value })}
                          className={`${inputCls} resize-none`}
                        />
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="button"
                      disabled={sending}
                      onClick={handleSubmit}
                      className="w-full mt-6 py-4 bg-premium-orange hover:bg-premium-orange/90 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-[background-color] duration-200 disabled:opacity-60 shadow-[0_12px_40px_rgba(227,6,19,0.25)]"
                    >
                      {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sending ? 'Göndərilir...' : 'Göndər'}
                    </button>

                    {/* Quick contact */}
                    <div className="mt-6 pt-5 border-t border-white/[0.06] flex flex-wrap gap-4 justify-center">
                      {[
                        { icon: Phone, label: '+994 10 255 35 55', href: 'tel:+994102553555' },
                        { icon: Mail, label: 'sales@eventrent.az', href: 'mailto:sales@eventrent.az' },
                        { icon: MapPin, label: 'Xocalı pr. 55, Bakı', href: 'https://maps.google.com/?q=Xocalı+Prospekti+55+Bakı' },
                      ].map(({ icon: Icon, label, href }) => (
                        <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-bold transition-colors duration-200">
                          <Icon className="w-3.5 h-3.5 text-premium-orange" />{label}
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Success state */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 text-center gap-4"
                  >
                    <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight">Müraciətiniz qəbul edildi!</h3>
                    <p className="text-white/50 text-sm max-w-xs">Tezliklə sizinlə əlaqə saxlayacağıq. Vaxtınız üçün təşəkkür edirik.</p>
                    <button
                      onClick={onClose}
                      className="mt-2 px-8 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-premium-orange hover:text-white transition-[background-color,color] duration-300"
                    >
                      Bağla
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}