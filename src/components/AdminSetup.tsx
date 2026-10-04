import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, CheckCircle2, Loader2, ShieldCheck, Lock, Mail, User } from 'lucide-react';

interface AdminSetupProps {
  onComplete: (token: string) => void;
}

export default function AdminSetup({ onComplete }: AdminSetupProps) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const strength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const pw = form.password;
  const pwStr = strength(pw);
  const pwColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-green-400'];
  const pwLabels = ['Zəif', 'Orta', 'Yaxşı', 'Güclü'];

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Bütün sahələr mütləqdir.'); return;
    }
    if (form.password !== form.confirm) {
      setError('Şifrələr uyğun gəlmir.'); return;
    }
    if (form.password.length < 8) {
      setError('Şifrə ən az 8 simvol olmalıdır.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Xəta baş verdi.'); return; }
      setDone(true);
      setTimeout(() => onComplete(data.token), 1500);
    } catch {
      setError('Serverə qoşulma alınmadı.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-premium-orange/50 focus:bg-white/[0.07] transition-[border-color,background-color] duration-200';

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-premium-orange/[0.06] blur-[120px] rounded-full" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-premium-orange/20 to-transparent" />
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative w-full max-w-md"
          >
            {/* Logo / Brand */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-premium-orange/10 border border-premium-orange/25 rounded-2xl mb-5">
                <ShieldCheck className="w-8 h-8 text-premium-orange" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-white mb-2">
                İlk Qurulum
              </h1>
              <p className="text-white/40 text-sm font-medium">
                EventRent Admin panelinə xoş gəlmisiniz.<br />
                Admin hesabınızı yaradın.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.08] rounded-[2rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-premium-orange/20 to-transparent" />

              <form onSubmit={handleSubmit} className="p-8 space-y-4">
                {/* Name */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    autoFocus
                    value={form.name}
                    onChange={set('name')}
                    className={inp}
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="admin@siteniz.az"
                    value={form.email}
                    onChange={set('email')}
                    className={inp}
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Şifrə (min 8 simvol)"
                    value={form.password}
                    onChange={set('password')}
                    className={`${inp} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength */}
                {pw.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[0,1,2,3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < pwStr ? pwColors[pwStr - 1] : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-bold ${pw.length > 0 ? 'text-white/50' : ''}`}>
                      {pw.length > 0 ? pwLabels[pwStr - 1] || 'Çox zəif' : ''}
                    </p>
                  </div>
                )}

                {/* Confirm */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Şifrəni təkrar daxil edin"
                    value={form.confirm}
                    onChange={set('confirm')}
                    className={`${inp} pr-12 ${form.confirm && form.confirm !== form.password ? 'border-red-500/40' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 font-medium"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-4 bg-premium-orange hover:bg-premium-orange/90 disabled:opacity-50 text-white font-black text-sm uppercase tracking-[0.22em] rounded-2xl flex items-center justify-center gap-3 transition-[background-color] duration-200 shadow-[0_16px_48px_rgba(227,6,19,0.28)]"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Yaradılır...</>
                    : <>Admin Hesabı Yarat</>
                  }
                </button>
              </form>
            </div>

            <p className="text-center text-white/20 text-xs mt-6">
              Bu forma yalnız ilk qurulumda görünür. Hesab yaradıldıqdan sonra bu endpoint deaktiv olur.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center gap-5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 16, stiffness: 260, delay: 0.1 }}
              className="w-20 h-20 bg-green-500/10 border-2 border-green-500/25 rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">Admin hesabı yaradıldı!</h2>
              <p className="text-white/40 text-sm">Admin panelinə yönləndirilirsiniz...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
