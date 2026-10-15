import React, { useRef } from 'react';
import { useGsap, gsap } from '../../motion/useGsap';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

export default function AboutTeam() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { content, locale } = useSiteContent();
  const s = content.about.team;
  const members = content.home.team.members;

  useGsap(() => {
    gsap.from('.team-eyebrow', {
      y: 16, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 80%', toggleActions: 'play none none none' },
    });
    gsap.fromTo('.team-card', {
      y: 30, opacity: 0,
    }, {
      y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: '.team-grid', start: 'top 78%', toggleActions: 'play none none none' },
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative bg-[#060606]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28">

        <div className="team-eyebrow flex items-center gap-3 mb-6">
          <div className="w-5 h-px bg-premium-orange" />
          <span className="text-[9px] tracking-[0.35em] uppercase font-inter text-white/60">{t(locale, s.badge)}</span>
        </div>

        <h2 className="team-eyebrow text-4xl md:text-6xl font-black tracking-tighter text-white leading-none mb-14">
          {t(locale, s.titleLine1)}<br />
          <span className="text-white/50 italic">{t(locale, s.titleLine2)}</span>
        </h2>

        <div className="team-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {members.map((member, i) => (
            <div key={i} className="team-card group relative overflow-hidden rounded-2xl border border-white/[0.07] hover:border-premium-orange/30 transition-all duration-500">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={member.image}
                  alt={t(locale, member.name)}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-400">
                <div className="w-4 h-px bg-premium-orange mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                <h3 className="text-base font-bold text-white tracking-tight">{t(locale, member.name)}</h3>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/45 mt-1">{t(locale, member.role)}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}