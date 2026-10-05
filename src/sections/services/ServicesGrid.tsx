import React, { useRef } from 'react';
import { Printer, Palette, Sparkles, CheckCircle2, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGsap, gsap } from '../../motion/useGsap';
import { useSiteContent } from '../../content.context';
import { t, getServiceCategories } from '../../content';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  printing: Printer, decor: Palette, other: Sparkles,
};

export default function ServicesGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { content, locale } = useSiteContent();
  const categories = getServiceCategories(content);
  const s = content.services.grid;

  useGsap(() => {
    gsap.from('.service-card', {
      y: 80, opacity: 0, duration: 1.1, stagger: 0.15, ease: 'power3.out',
      toggleActions: 'play none none none',
    });
    gsap.from('.service-card-img', {
      scale: 1.15, opacity: 0, duration: 1.4, stagger: 0.15, ease: 'power3.out',
      toggleActions: 'play none none none',
    });
    gsap.from('.service-card-icon', {
      scale: 0, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'back.out(1.7)',
      toggleActions: 'play none none none',
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-16">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-px bg-premium-orange" />
          <span className="text-[9px] tracking-[0.35em] uppercase font-inter text-white/60">{t(locale, s.badge)}</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
          {t(locale, s.titleLine1)}<br />
          <span className="text-white/55 italic">{t(locale, s.titleLine2)}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.id] ?? Sparkles;
          const title = t(locale, category.title);
          const description = t(locale, category.description);
          const path = category.path ?? `/services/${category.id}`;
          const subItems = (category.subItems ?? []).map((item) => t(locale, item.name));

          // Split title to max 2 parts so it's always symmetrical (e.g., "Çap" + "xidmətləri")
          const titleParts = title.split(' ');
          const firstWord = titleParts[0];
          const restWords = titleParts.slice(1).join(' ');

          return (
            <div key={category.id} className="service-card group flex flex-col">
              <Link to={path} className="relative aspect-square rounded-[60px] overflow-hidden bg-black shadow-2xl border-8 border-gray-50 mb-8 flex-shrink-0">
                <img
                  src={category.image}
                  alt={title}
                  className="service-card-img absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-0 p-10 md:p-12 flex flex-col justify-end">
                  <div className="service-card-icon w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-white border border-white/10 group-hover:bg-white group-hover:text-premium-orange transition-all duration-500 mb-6">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-4xl lg:text-[2.6rem] font-bold text-white tracking-tighter leading-[1.05]">
                    {firstWord}
                    {restWords && (
                      <>
                        <br />
                        <span className="text-white/80">{restWords}</span>
                      </>
                    )}
                  </h3>
                </div>
              </Link>

              <div className="px-4 space-y-6 flex flex-col flex-1">
                <p className="text-white/60 font-light leading-relaxed min-h-[48px]">{description}</p>
                <div className="space-y-3 flex-1 pt-2">
                  {subItems.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm font-semibold text-white/90">
                      <CheckCircle2 className="w-4 h-4 text-premium-orange shrink-0" />
                      <span>{sub}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to={path}
                  className="inline-flex items-center gap-3 px-6 py-3 mt-8 rounded-full border border-premium-orange/60 text-xs font-black uppercase tracking-widest text-premium-orange hover:bg-premium-orange hover:text-white transition-all duration-300 shadow-[0_8px_24px_rgba(227,6,19,0.2)] hover:shadow-[0_12px_32px_rgba(227,6,19,0.35)] w-fit"
                >
                  {t(locale, s.cta)} <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}