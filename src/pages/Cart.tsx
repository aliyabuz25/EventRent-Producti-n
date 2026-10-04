import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CartItems from '../sections/cart/CartItems';
import CartCheckout from '../sections/cart/CartCheckout';
import CartEmpty from '../sections/cart/CartEmpty';
import CartSuccess from '../sections/cart/CartSuccess';
import { useCart } from '../hooks/useCart';
import { useSiteContent } from '../content.context';
import { t } from '../content';

const TOKEN_KEY = 'er_admin_token';

export default function Cart() {
  const navigate = useNavigate();
  const { locale, content } = useSiteContent();
  const [cart, setCart]           = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; } });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [apiProducts, setApiProducts] = useState<Record<string, any>>({});
  const { clearCart } = useCart();

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

  /* sync cart from localStorage */
  useEffect(() => {
    const sync = () => { try { setCart(JSON.parse(localStorage.getItem('cart') || '[]')); } catch { setCart([]); } };
    window.addEventListener('cart-updated', sync);
    return () => window.removeEventListener('cart-updated', sync);
  }, []);

  /* fetch product details from API for images */
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.ok ? r.json() : [])
      .then((products: any[]) => {
        const map: Record<string, any> = {};
        products.forEach(p => { map[p.id] = p; });
        setApiProducts(map);
      }).catch(() => {});
  }, []);

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
        technicalSpecs: item.technicalAnswers || {},
        tags: [],
        relatedProducts: [],
      };
      return { ...item, product };
    });
  }, [cart, apiProducts]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setError(null);

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
          items:      cart,
          source:     'website',
          lang:       locale,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || t(locale, content.cart.errorSend));
        return;
      }

      setIsSuccess(true);
      clearCart();
      setTimeout(() => navigate('/'), 3000);
    } catch {
      setError(t(locale, content.cart.errorServer));
    } finally {
      setIsSubmitting(false);
    }
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
            />
            <CartCheckout
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              error={error}
              itemsCount={cartItems.length}
            />
          </>
        )}
      </div>
    </div>
  );
}