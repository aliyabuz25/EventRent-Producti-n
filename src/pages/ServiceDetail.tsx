import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { useSiteContent } from '../content.context';
import { t, ta, getServiceCategoryBySlug, getServiceSubItemBySlug } from '../content';
import { useCart } from '../hooks/useCart';

export default function ServiceDetail() {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const { content, locale } = useSiteContent();
  const [isOrdering, setIsOrdering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const { addItem } = useCart();

  const currentCategory = getServiceCategoryBySlug(content, category || '');
  const currentItem = id && category ? getServiceSubItemBySlug(content, category, id) : null;
  const p = content.product || {} as any;

  if (!currentCategory) return <div className="p-20 text-center">Xidmət tapılmadı.</div>;
  if (id && !currentItem) return <div className="p-20 text-center">Xidmət tapılmadı.</div>;

  const categoryTitle = t(locale, currentCategory.title);
  const categoryDescription = t(locale, currentCategory.description);

  const handleAddToCart = () => {
    addItem({
      productId: currentItem!.id,
      quantity,
      technicalAnswers: answers,
      name: t(locale, currentItem!.name),
      image: `https://picsum.photos/seed/${currentItem!.id}/800/800`,
      category: categoryTitle,
    } as any);

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsOrdering(false);
      navigate('/cart');
    }, 2000);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section — Minimalist */}
      <section className="relative -mt-[72px] pt-32 pb-16 md:pt-40 md:pb-20 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-card overflow-hidden">
        {/* Nazik ambient glow */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
          <div
            className="absolute top-0 left-1/4 w-[40vw] h-[50%]"
            style={{ background: 'radial-gradient(ellipse, rgba(227,6,19,0.06) 0%, transparent 70%)' }}
          />
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 right-0 h-px bg-white/5" />
          <div className="absolute top-2/4 left-0 right-0 h-px bg-white/5" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-12">
          <Link to="/services" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
            <ArrowLeft className="w-4 h-4" /> {t(locale, p.backToServices || { az: 'Xidmətlərə qayıt', en: 'Back to services', ru: 'К услугам', tr: 'Hizmetlere dön' })}
          </Link>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-5 h-px bg-premium-orange" />
            <span className="text-[9px] tracking-[0.35em] uppercase font-inter text-white/60">
              {categoryTitle}
            </span>
          </div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-none mb-8"
          >
            {currentItem ? t(locale, currentItem.name) : categoryTitle}
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/70 font-light max-w-2xl leading-relaxed"
          >
            {currentItem ? t(locale, currentItem.desc) : categoryDescription}
          </motion.p>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!id ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentCategory.subItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 bg-black border border-white/5 rounded-[40px] hover:border-premium-orange transition-all duration-500"
              >
                <div className="aspect-square rounded-3xl overflow-hidden mb-8 border-4 border-white/10 shadow-2xl">
                  <img
                    src={`https://picsum.photos/seed/${item.id}/800/800`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                    alt={t(locale, item.name)}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white mb-4">{t(locale, item.name)}</h3>
                <p className="text-white/60 font-light mb-8 min-h-[48px]">{t(locale, item.desc)}</p>
                <Link
                  to={`/services/${category}/${item.id}`}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-premium-orange"
                >
                  {t(locale, p.viewDetail || { az: 'Ətraflı', en: 'Details', ru: 'Подробнее', tr: 'Detaylar' })} <CheckCircle2 className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="aspect-square rounded-[60px] overflow-hidden border-8 border-white/5 shadow-2xl sticky top-24">
              <img
                src={`https://picsum.photos/seed/${currentItem!.id}/1000/1000`}
                className="w-full h-full object-cover"
                alt={t(locale, currentItem!.name)}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-12">
              <div className="space-y-8">
                <div className="inline-block px-6 py-2 bg-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                  {categoryTitle}
                </div>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white">{t(locale, currentItem!.name)}</h2>
                <p className="text-xl text-white/60 font-light leading-relaxed">
                  {t(locale, currentItem!.desc)}
                </p>
                <div className="space-y-4">
                  {(p.features ? [p.features.f1, p.features.f2, p.features.f3, p.features.f4].filter(Boolean).map((f: any) => t(locale, f)) : ['Yüksək keyfiyyət', 'Peşəkar yanaşma', 'Sürətli icra', 'Sərfəli qiymət']).map((feature: string) => (
                    <div key={feature} className="flex items-center gap-3 text-white/90 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-red-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {!isOrdering ? (
                <button
                  onClick={() => setIsOrdering(true)}
                  className="inline-flex items-center gap-3 bg-premium-orange text-white px-12 py-6 rounded-full font-bold text-xl hover:bg-orange-600 transition-all shadow-[0_8px_32px_rgba(227,6,19,0.3)] active:scale-95"
                >
                  {t(locale, p.orderBtn || { az: 'Sifariş et', en: 'Order', ru: 'Заказать', tr: 'Sipariş et' })} <ShoppingCart className="w-6 h-6" />
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/50 backdrop-blur-xl rounded-[40px] p-10 space-y-8 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold tracking-tight text-white">{t(locale, p.orderDetails || { az: 'Sifariş detalları', en: 'Order details', ru: 'Детали заказа', tr: 'Sipariş detayları' })}</h3>
                      <button onClick={() => setIsOrdering(false)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Quantity Selector */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{t(locale, p.quantityLabel || { az: 'Say', en: 'Qty', ru: 'Кол-во', tr: 'Adet' })}</label>
                      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 w-fit">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xl font-bold w-12 text-center text-white">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Questions */}
                    {ta(locale, currentItem!.questions).map((q: string) => (
                      <div key={q} className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{q}</label>
                        <input
                          type="text"
                          placeholder={`${q}...`}
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-premium-orange transition-all placeholder:text-white/30"
                          value={answers[q] || ''}
                          onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                        />
                      </div>
                    ))}

                    <div className="pt-4">
                      <button
                        onClick={handleAddToCart}
                        className="w-full bg-premium-orange text-white py-6 rounded-3xl font-bold text-lg hover:bg-orange-600 transition-all shadow-[0_8px_32px_rgba(227,6,19,0.2)] flex items-center justify-center gap-3"
                      >
                        {t(locale, p.addToCartBtn || { az: 'Səbətə əlavə et', en: 'Add to cart', ru: 'В корзину', tr: 'Sepete ekle' })} <ShoppingCart className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed bottom-10 right-10 z-50 bg-black text-white px-8 py-6 rounded-[32px] shadow-2xl flex items-center gap-4 border border-white/10"
                  >
                    <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold">{t(locale, p.addedToCart || { az: 'Səbətə əlavə olundu!', en: 'Added to cart!', ru: 'Добавлено в корзину!', tr: 'Sepete eklendi!' })}</p>
                      <p className="text-xs text-white/60">{t(locale, p.redirecting || { az: 'Yönləndirilirsiniz...', en: 'Redirecting...', ru: 'Перенаправление...', tr: 'Yönlendiriliyorsunuz...' })}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}