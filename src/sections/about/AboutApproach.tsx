import { useRef } from 'react';
import { useGsap, gsap } from '../../motion/useGsap';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

export default function AboutApproach() {
  const sectionRef = useRef<HTMLElement>(null);
  const { content, locale } = useSiteContent();
  const s = content.about.approach;

  useGsap(() => {
    gsap.from('.ap-eyebrow', {
      y: 20, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none none' },
    });
    gsap.fromTo('.ap-card', {
      y: 30, opacity: 0,
    }, {
      y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.ap-grid', start: 'top 78%', toggleActions: 'play none none none' },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative bg-[#060606]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-14 md:py-20">

        <div className="ap-eyebrow flex items-center gap-4 mb-6">
          <div className="w-5 h-px bg-premium-orange" />
          <span className="text-[9px] tracking-[0.35em] uppercase font-inter text-white/60">{t(locale, s.badge)}</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-none mb-12">
          {t(locale, s.titleLine1)}<br />
          <span className="text-white/50 italic">{t(locale, s.titleLine2)}</span>
        </h2>

        <div className="ap-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.08]">
          {s.steps.map((step) => (
            <div
              key={step.n}
              className="ap-card group relative bg-[#060606] hover:bg-white/[0.04] transition-all duration-500 p-10 md:p-12 space-y-5 overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 h-[1px] w-0 group-hover:w-full bg-premium-orange transition-all duration-500 ease-out" />
              <span className="text-[10px] font-black tracking-[0.3em] text-premium-orange">{step.n}</span>
              <h3 className="text-xl md:text-2xl font-black tracking-tight text-white leading-snug group-hover:translate-x-1 transition-transform duration-400">{t(locale, step.title)}</h3>
              <p className="text-[15px] text-white/50 group-hover:text-white/75 leading-[1.8] font-light transition-colors duration-400">{t(locale, step.text)}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}