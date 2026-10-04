import React, { useRef } from 'react';
import { useGsap, gsap } from '../../motion/useGsap';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

export default function Metrics() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { content, locale } = useSiteContent();
  const metrics = content?.home?.metrics?.items || [];
  const eyebrow = content?.home?.metricsEyebrow?.text;

  useGsap(() => {
    gsap.from('.metrics-eyebrow', {
      y: 20, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 85%', once: true },
    });

    gsap.utils.toArray<HTMLElement>('.metric-item-raw').forEach((item, i) => {
      const line = item.querySelector('.metric-line');
      if (line) {
        gsap.fromTo(line, { scaleY: 0 }, {
          scaleY: 1, duration: 1.5, ease: 'expo.out', delay: i * 0.1,
          scrollTrigger: { trigger: containerRef.current, start: 'top 80%', once: true },
        });
      }
      const numWrapper = item.querySelector('.num-wrapper');
      if (numWrapper) {
        gsap.fromTo(numWrapper,
          { y: '100%', opacity: 0 },
          { y: '0%', opacity: 1, duration: 1.2, ease: 'power4.out', delay: i * 0.15 + 0.2,
            scrollTrigger: { trigger: containerRef.current, start: 'top 80%', once: true },
          }
        );
      }
      const label = item.querySelector('.metric-label-raw');
      if (label) {
        gsap.fromTo(label, { opacity: 0, x: -10 }, {
          opacity: 1, x: 0, duration: 1, ease: 'power2.out', delay: i * 0.15 + 0.5,
          scrollTrigger: { trigger: containerRef.current, start: 'top 80%', once: true },
        });
      }
      const valueEl = item.querySelector<HTMLElement>('.metric-value-raw');
      if (valueEl) {
        const raw = valueEl.dataset.raw ?? '0';
        const suffix = valueEl.dataset.suffix ?? '';
        const numericVal = parseFloat(raw.replace(/,/g, ''));
        const obj = { val: 0 };
        let lastRounded = -1;
        gsap.to(obj, {
          val: numericVal, duration: 2.5, ease: 'power2.out', delay: i * 0.15 + 0.4,
          scrollTrigger: { trigger: containerRef.current, start: 'top 80%', once: true },
          onUpdate() {
            const rounded = Math.round(obj.val);
            if (rounded !== lastRounded) {
              lastRounded = rounded;
              // textContent avoids DOM parse overhead vs innerHTML
              valueEl.textContent = rounded.toLocaleString('en-US') + suffix;
            }
          },
        });
      }
    });
  }, { scope: containerRef, dependencies: [metrics] });

  const parseValue = (v: string) => {
    const match = v.match(/^([\d.,]+)(.*)$/);
    if (!match) return { raw: '0', suffix: v };
    return { raw: match[1], suffix: match[2] };
  };

  return (
    <section ref={containerRef} className="relative bg-[#050505] py-24 md:py-36 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="w-full h-px bg-white absolute top-1/4" />
        <div className="w-full h-px bg-white absolute top-2/4" />
        <div className="w-full h-px bg-white absolute top-3/4" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        <div className="metrics-eyebrow flex items-center gap-6 mb-20 md:mb-28">
          <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white/70">
            {eyebrow ? t(locale, eyebrow) : '[ Rəqəmlərlə BİZ ]'}
          </span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-0 gap-y-16">
          {metrics.map((stat, i) => {
            const { raw, suffix } = parseValue(stat.value);
            const isAccent = i === 1 || i === 2;
            return (
              <div key={i} className="metric-item-raw relative pl-6 md:pl-10">
                <div
                  className="metric-line absolute left-0 top-0 bottom-0 w-[2px] origin-top"
                  style={{ background: isAccent ? '#e30613' : 'rgba(255,255,255,0.1)' }}
                />
                <div className="overflow-hidden mb-4">
                  <div className="num-wrapper inline-block">
                    <span
                      className={`metric-value-raw font-black tracking-tighter leading-none ${isAccent ? 'text-white' : 'text-white/60'}`}
                      style={{ fontSize: 'clamp(4rem, 6vw, 6.5rem)' }}
                      data-raw={raw}
                      data-suffix={suffix}
                      dangerouslySetInnerHTML={{ __html: `0${suffix}` }}
                    />
                  </div>
                </div>
                <div className="metric-label-raw">
                  <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/70 leading-relaxed max-w-[150px]">
                    {t(locale, stat.label)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}