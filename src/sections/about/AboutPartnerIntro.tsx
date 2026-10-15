import React, { useRef } from 'react';
import { useGsap, gsap } from '../../motion/useGsap';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

export default function AboutPartnerIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const { content, locale } = useSiteContent();
  const s = content.about.partnerIntro;

  useGsap(() => {
    gsap.from('.api-eyebrow', { y: 16, opacity: 0, duration: 0.8, ease: 'power3.out' });
    gsap.from('.api-title', { y: 40, opacity: 0, duration: 1, ease: 'power4.out', delay: 0.1 });
    gsap.from('.api-text-card', { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.2 });
    gsap.from('.api-stat-card', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12, delay: 0.3 });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="bg-[#060606] pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        <div className="api-eyebrow flex items-center gap-3 mb-10">
          <div className="w-5 h-px bg-premium-orange" />
          <span className="text-[9px] tracking-[0.35em] uppercase font-inter text-white/60">{t(locale, s.badge)}</span>
        </div>

        <h1 className="api-title text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-14">
          {t(locale, s.titleLine1)}<br />
          <span className="text-white/50 italic">{t(locale, s.titleLine2)}</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="api-text-card md:col-span-2 border border-white/[0.08] rounded-2xl p-10 md:p-12 bg-white/[0.02] border-l-2 border-l-premium-orange flex flex-col justify-center">
            <p className="text-[17px] md:text-[19px] text-[#c8c8c8] leading-[1.9] font-normal tracking-[0.01em]">
              {t(locale, s.quote)}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {s.stats.map((stat, i) => (
              <div
                key={i}
                className="api-stat-card group flex-1 border border-white/[0.08] hover:border-premium-orange/40 rounded-2xl p-8 md:p-10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 flex flex-col justify-between"
              >
                <span
                  className="text-5xl md:text-6xl font-black tracking-tighter text-white leading-none"
                  style={{ textShadow: '0 0 24px rgba(255, 255, 255, 0.5), 0 0 48px rgba(255, 255, 255, 0.25)' }}
                >
                  {stat.value}
                </span>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/90 group-hover:text-white transition-colors duration-400 mt-4">
                  {t(locale, stat.label)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}