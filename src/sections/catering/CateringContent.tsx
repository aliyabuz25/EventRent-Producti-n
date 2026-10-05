import React, { useRef } from 'react';
import { ChefHat, CheckCircle2 } from 'lucide-react';
import { useGsap, gsap } from '../../motion/useGsap';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

export default function CateringContent() {
  const containerRef = useRef<HTMLElement>(null);
  const { content, locale } = useSiteContent();
  const s = content.catering.content;
  const menuItems = s.menuItems;

  useGsap(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });
    tl.fromTo('.cat-badge', { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' })
      .fromTo('.cat-desc', { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, '-=0.4')
      .fromTo('.cat-card', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.07 }, '-=0.48');

    gsap.fromTo('.cat-heading',
      { x: 50, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: containerRef.current, start: 'top 75%', toggleActions: 'play none none none' },
      }
    );

    gsap.fromTo('.cat-img',
      { y: 60, opacity: 0, scale: 0.95 },
      {
        y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out', stagger: 0.12,
        scrollTrigger: { trigger: containerRef.current, start: 'top 65%', toggleActions: 'play none none none' },
      }
    );
  }, { dependencies: [], scope: containerRef });

  return (
    <>
      <section ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-12 -mt-16">
          <div className="space-y-6">
            <div className="cat-badge opacity-0 inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20 backdrop-blur-sm">
              <ChefHat className="w-4 h-4" /> {t(locale, s.eyebrow)}
            </div>
            <p className="cat-desc opacity-0 text-xl text-white/70 font-light leading-relaxed">
              {t(locale, s.subtitle)}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {menuItems.map((item, i) => (
              <div key={i} className="cat-card opacity-0 space-y-4 p-8 bg-white/5 border border-white/8 rounded-5xl hover:bg-white/10 hover:border-white/15 transition-[background-color,border-color] duration-500 group">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-premium-orange">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold tracking-tight text-white">{t(locale, item.title)}</h4>
                  <p className="text-sm text-white/60 font-light leading-relaxed">{t(locale, item.desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-8">
          <h2 className="cat-heading opacity-0 text-4xl md:text-6xl font-bold tracking-tighter leading-tight text-white">
            {t(locale, s.title)}
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {(() => {
              const imgs = s.galleryImages?.length ? s.galleryImages : [
                'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=600&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=600&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1530103043960-ef38714abb15?q=80&w=600&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=600&auto=format&fit=crop',
              ];
              const col1 = imgs.filter((_, i) => i % 2 === 0);
              const col2 = imgs.filter((_, i) => i % 2 === 1);
              return (
                <>
                  <div className="space-y-6">
                    {col1.map((src, i) => (
                      <div key={i} className="cat-img opacity-0 aspect-square rounded-[60px] overflow-hidden shadow-2xl border-4 border-white/10">
                        <img src={src} loading="lazy" decoding="async" className="w-full h-full object-cover" alt={`Catering ${i * 2 + 1}`} referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-6 pt-12">
                    {col2.map((src, i) => (
                      <div key={i} className="cat-img opacity-0 aspect-square rounded-[60px] overflow-hidden shadow-2xl border-4 border-white/10">
                        <img src={src} loading="lazy" decoding="async" className="w-full h-full object-cover" alt={`Catering ${i * 2 + 2}`} referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </section>
    </>
  );
}
