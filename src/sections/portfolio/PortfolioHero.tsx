import React from 'react';
import { motion } from 'motion/react';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

export default function PortfolioHero() {
  const { content, locale } = useSiteContent();
  const s = content.portfolio.hero;

  return (
    <section className="relative -mt-[72px] pt-32 pb-16 md:pt-40 md:pb-20 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-card overflow-hidden">
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
          <div className="w-5 h-px bg-premium-orange" />
          <span className="text-[9px] tracking-[0.35em] uppercase font-inter text-white/60">{t(locale, s.eyebrow)}</span>
        </motion.div>
        <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-none mb-8">
          {t(locale, s.title)}<br />
          <span className="text-white/50 italic">{t(locale, s.subtitle)}</span>
        </motion.h1>
      </div>
    </section>
  );
}
