import React, { useRef } from 'react';
import { Award, Zap, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useGsap, gsap } from '../../motion/useGsap';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

const ICONS: LucideIcon[] = [Award, Zap, ShieldCheck];

export default function AboutBento() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { content, locale } = useSiteContent();
  const s = content.about.bento;

  useGsap(() => {
    gsap.from('.bento-card', {
      y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: containerRef.current, start: 'top 78%', toggleActions: 'play none none none' },
    });
    gsap.from('.bento-img', {
      scale: 1.06, opacity: 0, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 78%', toggleActions: 'play none none none' },
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative bg-[#060606]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28">

        <div className="flex items-center gap-3 mb-14">
          <div className="w-5 h-px bg-premium-orange" />
          <span className="text-[9px] tracking-[0.35em] uppercase font-inter text-white/60">{t(locale, s.badge)}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 flex flex-col gap-4">
            {s.cards.map((card, i) => {
              const Icon = ICONS[i] ?? Award;
              return (
                <div
                  key={i}
                  className="bento-card group border border-white/[0.07] hover:border-premium-orange/30 rounded-2xl p-8 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 flex items-start gap-6"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-white/[0.05] group-hover:bg-premium-orange/10 flex items-center justify-center transition-colors duration-400">
                    <Icon className="w-5 h-5 text-white/50 group-hover:text-premium-orange transition-colors duration-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold tracking-tight text-white">{t(locale, card.title)}</h3>
                    <p className="text-[15px] text-[#a0a0a0] leading-[1.75] font-normal">{t(locale, card.desc)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-2 border border-white/[0.07] rounded-2xl overflow-hidden relative min-h-[380px]">
            <img
              src={s.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=900&auto=format&fit=crop'}
              className="bento-img absolute inset-0 w-full h-full object-cover opacity-40"
              alt={t(locale, s.imageTitle)}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 space-y-2">
              <div className="w-5 h-px bg-premium-orange mb-4" />
              <h3 className="text-2xl font-black tracking-tight text-white leading-tight">
                {t(locale, s.imageTitle)}<br />
                <span className="text-white/70 italic">{t(locale, s.imageTitleAccent)}</span>
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}