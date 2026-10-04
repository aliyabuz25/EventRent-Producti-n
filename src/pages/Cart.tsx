import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import CartItems from '../sections/cart/CartItems';
import CartCheckout from '../sections/cart/CartCheckout';
import CartEmpty from '../sections/cart/CartEmpty';
import CartSuccess from '../sections/cart/CartSuccess';
import { useCart } from '../hooks/useCart';
import { useSiteContent } from '../content.context';
import { t } from '../content';

const TOKEN_KEY = 'er_admin_token';
const OTP_LENGTH = 6;

export default function Cart() {
  const navigate = useNavigate();
  const { locale, content } = useSiteContent();
  const [cart, setCart] = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; } });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiProducts, setApiProducts] = useState<Record<string, any>>({});
  const { clearCart } = useCart();

  // OTP state
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [devCode, setDevCode] = useState('');
  const otpRefs = Array.from({ length: OTP_LENGTH }, () => useRef<HTMLInputElement>(null));

  /* Pre-fill form from JWT user */
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', eventDate: '', location: '', note: ''
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(u => {
        if (!u) return;
        setFormData(prev => ({ ...prev, name: u.name || prev.name, email: u.email || prev.email }));
      }).catch(() => {});
  }, []);

  useEffect(() => {
    const sync = () => { try { setCart(JSON.parse(localStorage.getItem('cart') || '[]')); } catch { setCart([]); } };
    window.addEventListener('cart-updated', sync);
    return () => window.removeEventListener('cart-updated', sync);
  }, []);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.ok ? r.json() : [])
      .then((products: any[]) => {
        const map: Record<string, any> = {};
        products.forEach(p => { map[p.id] = p; });
        setApiProducts(map);
      }).catch(() => {});
  }, []);

  const [technicalAnswers, setTechnicalAnswers] = useState<Record<string, Record<string, string>>>({});

  const setAnswer = (productId: string, key: string, value: string) => {
    setTechnicalAnswers(prev => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [key]: value }
    }));
  };

  const cartItems = useMemo(() => {
    return cart.map((item: any) => {
      const pid = item.productId || item.id;
      const apiP = apiProducts[pid];
      const product = {
        id:          pid,
        name:        apiP?.name     || item.name     || 'Xidmət',
        category:    apiP?.category || item.category || 'Xidmət',
        description: apiP?.description || item.description || '',
        images:      apiP?.images?.length ? apiP.images : (item.image ? [item.image] : []),
        technicalSpecs: apiP?.technicalSpecs || {},
        tags: [],
        relatedProducts: [],
      };
      return { ...item, product, technicalAnswers: technicalAnswers[pid] || {} };
    });
  }, [cart, apiProducts, technicalAnswers]);

  const updateQuantity = (id: string, delta: number) => {
    const newCart = cart.map((item: any) => {
      const itemId = item.productId || item.id;
      if (itemId === id) return { ...item, quantity: Math.max(1, item.quantity + delta) };
      return item;
    });
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (id: string) => {
    const newCart = cart.filter((item: any) => (item.productId || item.id) !== id);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  // Step 1: form submit → OTP göndər, modal aç
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!formData.phone.trim()) { setError('Telefon nömrəsi mütləqdir.'); return; }
    setError(null);
    setOtpSending(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'OTP göndərilmədi.'); return; }
      if (data._dev_code) setDevCode(data._dev_code);
      setOtp(Array(OTP_LENGTH).fill(''));
      setOtpError('');
      setOtpOpen(true);
      setOtpCooldown(60);
      const iv = setInterval(() => setOtpCooldown(c => { if (c <= 1) { clearInterval(iv); return 0; } return c - 1; }), 1000);
      setTimeout(() => otpRefs[0].current?.focus(), 300);
    } catch { setError('Xəta baş verdi.'); }
    finally { setOtpSending(false); }
  };

  // Step 2: OTP doğrulandıqdan sonra sifarişi göndər
  const submitOrder = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem(TOKEN_KEY) || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name:       formData.name,
          phone:      formData.phone,
          email:      formData.email,
          event_date: formData.eventDate,
          location:   formData.location,
          note:       formData.note,
          items: cart.map((item: any) => {
            const pid = item.productId || item.id;
            return { ...item, technicalAnswers: technicalAnswers[pid] || {} };
          }),
          source: 'website',
          lang:   locale,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || t(locale, content.cart.errorSend));
        setOtpOpen(false);
        return;
      }
      setOtpOpen(false);
      setIsSuccess(true);
      clearCart();
      setTimeout(() => navigate('/'), 3000);
    } catch {
      setError(t(locale, content.cart.errorServer));
      setOtpOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[idx] = digit; setOtp(next); setOtpError('');
    if (digit && idx < OTP_LENGTH - 1) otpRefs[idx + 1].current?.focus();
    if (digit && idx === OTP_LENGTH - 1) {
      const code = next.join('');
      if (code.length === OTP_LENGTH) verifyOtp(code);
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs[idx - 1].current?.focus();
    if (e.key === 'Enter') verifyOtp(otp.join(''));
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    const next = Array(OTP_LENGTH).fill('');
    text.split('').forEach((d, i) => { if (i < OTP_LENGTH) next[i] = d; });
    setOtp(next); setOtpError('');
    otpRefs[Math.min(text.length, OTP_LENGTH - 1)].current?.focus();
    if (text.length === OTP_LENGTH) verifyOtp(text);
  };

  const verifyOtp = async (code?: string) => {
    const finalCode = code || otp.join('');
    if (finalCode.length < OTP_LENGTH) { setOtpError(`${OTP_LENGTH} rəqəmli kodu daxil edin.`); return; }
    setOtpVerifying(true); setOtpError('');
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone, code: finalCode }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.error || 'Yanlış kod.'); return; }
      await submitOrder();
    } catch { setOtpError('Xəta baş verdi.'); }
    finally { setOtpVerifying(false); }
  };

  const resendOtp = async () => {
    setOtpSending(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
      });
      const data = await res.json();
      if (data._dev_code) setDevCode(data._dev_code);
      setOtp(Array(OTP_LENGTH).fill('')); setOtpError('');
      setOtpCooldown(60);
      const iv = setInterval(() => setOtpCooldown(c => { if (c <= 1) { clearInterval(iv); return 0; } return c - 1; }), 1000);
      setTimeout(() => otpRefs[0].current?.focus(), 200);
    } catch {} finally { setOtpSending(false); }
  };

  if (isSuccess) return <CartSuccess />;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-12">
        {cartItems.length === 0 ? (
          <CartEmpty onNavigate={() => navigate('/catalog')} />
        ) : (
          <>
            <CartItems
              items={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              technicalAnswers={technicalAnswers}
              onSetAnswer={setAnswer}
            />
            <CartCheckout
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isSubmitting={otpSending}
              error={error}
              itemsCount={cartItems.length}
            />
          </>
        )}
      </div>

      {/* OTP Modal */}
      <AnimatePresence>
        {otpOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOtpOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              {/* Close */}
              <button onClick={() => setOtpOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-green-400 mb-0.5">WhatsApp OTP</p>
                  <h3 className="text-lg font-black text-white">Təsdiq kodu</h3>
                </div>
              </div>

              <p className="text-white/40 text-xs mb-6 leading-relaxed">
                <span className="text-white/70 font-bold">{formData.phone}</span> nömrəsinə {OTP_LENGTH} rəqəmli kod göndərildi.
              </p>

              {devCode && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400 font-bold text-center">
                  Dev kodu: {devCode}
                </div>
              )}

              {/* OTP inputs */}
              <div className="flex gap-2 justify-center mb-4" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input key={idx} ref={otpRefs[idx]} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className={`w-11 h-14 text-center text-2xl font-black bg-white/[0.04] border-2 rounded-xl text-white focus:outline-none transition-colors duration-200 ${
                      otpError ? 'border-red-500/50 bg-red-500/5' : digit ? 'border-green-500/40 bg-green-500/5' : 'border-white/[0.08] focus:border-premium-orange/60'
                    }`}
                  />
                ))}
              </div>

              {otpError && <p className="text-center text-red-400 text-xs font-bold mb-4">{otpError}</p>}

              <button type="button"
                disabled={otpVerifying || isSubmitting || otp.join('').length < OTP_LENGTH}
                onClick={() => verifyOtp()}
                className="w-full py-4 bg-premium-orange hover:bg-premium-orange/90 disabled:opacity-50 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 transition-colors duration-200 shadow-[0_12px_32px_rgba(227,6,19,0.25)]">
                {(otpVerifying || isSubmitting)
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Yoxlanılır...</>
                  : <><CheckCircle2 className="w-4 h-4" /> Təsdiqlə</>}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4">
                <p className="text-white/30 text-xs">Kodu almadınız?</p>
                {otpCooldown > 0
                  ? <span className="text-white/30 text-xs font-bold">{otpCooldown}s</span>
                  : <button type="button" onClick={resendOtp} disabled={otpSending}
                      className="text-premium-orange text-xs font-bold hover:underline flex items-center gap-1 disabled:opacity-50">
                      <RefreshCw className="w-3 h-3" /> Yenidən göndər
                    </button>
                }
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
