import { useRef, useState, lazy, Suspense } from 'react';
import { useGsap, gsap } from '../../motion/useGsap';
import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

const ContactModal = lazy(() => import('../../components/ContactModal'));

export default function HomeHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const { content, locale } = useSiteContent();
  const [modalOpen, setModalOpen] = useState(false);

  useGsap(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.2 } });

    tl.to('.hero-title-reveal', {
      clipPath: 'inset(0% 0 0 0)',
      duration: 1.5,
      stagger: 0.14,
    });

    // Animate scale on bgRef — no filter on video container (GPU cost)
    tl.fromTo(bgRef.current,
      { scale: 1.2 },
      { scale: 1.08, duration: 2.6 },
      '0'
    );
    // Animate blur on a separate overlay div (no video compositing)
    tl.fromTo('.hero-blur-overlay',
      { opacity: 1 },
      { opacity: 0, duration: 2.0 },
      '0'
    );

    gsap.to(bgRef.current, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
      yPercent: -10,
      scale: 1.14,
      ease: 'none',
      force3D: true,
    });

    tl.from('.hero-sub', {
      y: 36,
      opacity: 0,
      duration: 1.3,
    }, '-=0.95');
  }, { scope: containerRef });

  return (
    <>
    <section
      ref={containerRef}
      className="relative h-svh w-full flex items-center justify-center overflow-hidden bg-brand-bg md:h-dvh -mt-[72px]"
    >
      {/* Background Layer */}
      <div
        ref={bgRef}
        className="absolute -inset-[6%] z-0 will-change-transform grayscale brightness-[0.42]"
      >
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=2070"
          aria-label="Concert atmosphere background"
        >
          <source src="https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4" type="video/mp4" />
        </video>

        {/* Single audience overlay — reduced from 3 stacked filtered images */}
        <div
          className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
          style={{
            opacity: 0.3,
            maskImage: 'linear-gradient(to top, black 20%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent 100%)',
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1600"
            className="w-full h-full object-cover"
            alt=""
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="absolute inset-0 bg-linear-to-b from-brand-bg/95 via-brand-bg/55 to-brand-bg" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Blur intro overlay — animated separately, not on video container */}
      <div className="hero-blur-overlay absolute inset-0 z-[1] pointer-events-none" style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }} />

      {/* Content Layer */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-center">
          <h1
            ref={titleRef}
            className="text-[14vw] md:text-[min(18vw,11rem)] xl:text-[min(16vw,10rem)] font-light leading-[0.82] tracking-ultra-tight uppercase flex flex-col items-center"
          >
            <div className="hero-title-reveal reveal-mask py-2">
              <span className="block drop-shadow-2xl">{t(locale, content.home.hero.titleLine1)}</span>
            </div>
            <div className="hero-title-reveal reveal-mask pt-3 pb-2 md:pt-4 md:pb-3" style={{ paddingRight: '0.25em', marginRight: '-0.25em' }}>
              <span className="block text-stroke-solid italic font-black leading-[1.02]">{t(locale, content.home.hero.titleLine2)}</span>
            </div>
            <div className="hero-title-reveal reveal-mask py-2">
              <span className="block text-premium-orange font-black">{t(locale, content.home.hero.titleLine3)}</span>
            </div>
          </h1>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="hero-sub absolute bottom-16 md:bottom-20 left-0 right-0 z-20 w-full space-y-6 md:space-y-8">
        <div className="flex w-full flex-col items-end gap-4 md:hidden sm:flex-row sm:justify-end mb-8">
          <button onClick={() => setModalOpen(true)} className="min-h-12 px-7 md:px-8 py-3 md:py-3.5 bg-premium-orange text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] border border-premium-orange/70 transition-[background-color,border-color] duration-300 hover:bg-premium-orange/90 hover:border-premium-orange/60 active:scale-95 shadow-[0_20px_50px_rgba(227,6,19,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg">
            <span className="flex items-center justify-center gap-2.5 md:gap-3">
              {t(locale, content.home.hero.primaryCta)} <ArrowRight className="w-4 h-4" />
            </span>
          </button>

          <button className="flex min-h-12 items-center justify-center gap-2.5 md:gap-3 px-7 md:px-8 py-3 md:py-3.5 glass-dark rounded-full text-white font-black text-[10px] uppercase tracking-[0.2em] border border-white/20 hover:border-premium-orange/60 hover:bg-black/60 transition-all duration-300 active:scale-95 shadow-[0_12px_36px_rgba(0,0,0,0.22)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg">
            <Play className="w-4 h-4 fill-current" />
            {t(locale, content.home.hero.secondaryCta)}
          </button>
        </div>

        <div className="hidden md:block relative left-1/2 w-screen -translate-x-1/2 px-3 md:px-6 lg:px-8 xl:px-10 2xl:px-12 mt-3 lg:mt-4">
          <div className="flex w-full flex-col items-start gap-4 lg:gap-5 pr-16 lg:pr-24 xl:pr-32">
            <div className="flex flex-col items-start gap-4 max-w-sm">
              <div className="h-px w-20 bg-premium-orange/40" />
              <p className="text-[11px] text-white/60 font-bold uppercase tracking-[0.7em] text-left leading-[1.8]">
                {t(locale, content.home.hero.subtitle)}
              </p>
            </div>

            <div className="flex w-full justify-between items-end gap-8 lg:gap-10">
              <div className="flex items-start gap-12 lg:gap-16">
                {(content.home.hero.stats || []).map((stat, i) => (
                  <div
                    key={i}
                    className={`space-y-1 text-left${i === 0 ? '' : ' border-l border-white/10 pl-6'}`}
                  >
                    <p className="text-left text-[9px] font-black uppercase tracking-widest text-premium-orange">{t(locale, stat.label)}</p>
                    <p className="text-left text-lg font-black text-white uppercase tracking-tighter">{t(locale, stat.value)}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col lg:flex-row items-end gap-4 lg:gap-5">
                <button onClick={() => setModalOpen(true)} className="min-h-12 px-7 md:px-8 py-3 md:py-3.5 bg-premium-orange text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] border border-premium-orange/70 transition-[background-color,border-color] duration-300 hover:bg-premium-orange/90 hover:border-premium-orange/60 active:scale-95 shadow-[0_20px_50px_rgba(227,6,19,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg">
                  <span className="flex items-center gap-2.5 md:gap-3">
                    {t(locale, content.home.hero.primaryCta)} <ArrowRight className="w-4 h-4" />
                  </span>
                </button>

                <button className="flex min-h-12 items-center gap-2.5 md:gap-3 px-7 md:px-8 py-3 md:py-3.5 glass-dark rounded-full text-white font-black text-[10px] uppercase tracking-[0.2em] border border-white/20 hover:border-premium-orange/60 hover:bg-black/60 transition-all duration-300 active:scale-95 shadow-[0_12px_36px_rgba(0,0,0,0.22)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg">
                  <Play className="w-4 h-4 fill-current" />
                  {t(locale, content.home.hero.secondaryCta)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30 pointer-events-none"
      >
        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/65">{t(locale, content.home.hero.scrollLabel)}</p>
        <div className="w-5 h-8 rounded-full border-2 border-white/20 bg-black/20 flex justify-center p-1">
          <motion.div
            animate={{ y: [0, 9, 0], opacity: [1, 0.35, 1] }}
            transition={{ repeat: Infinity, duration: 1.7, ease: 'easeInOut' }}
            className="w-1 h-1.5 bg-premium-orange rounded-full"
          />
        </div>
      </motion.div>

      {/* Grid Anchor Points */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 right-0 h-px bg-white/5" />
        <div className="absolute top-2/4 left-0 right-0 h-px bg-white/5" />
      </div>

      {/* Side Label */}
      <div className="hidden lg:block absolute left-12 top-1/2 -translate-y-1/2">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/50 vertical-text">
          {t(locale, content.home.hero.sideLabel)}
        </p>
      </div>
    </section>

    <Suspense fallback={null}>
      <ContactModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Suspense>
    </>
  );
}