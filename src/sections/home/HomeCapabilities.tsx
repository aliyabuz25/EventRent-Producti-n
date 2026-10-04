import React, { useMemo, useRef } from 'react';
import { useGsap, gsap, ScrollTrigger } from '../../motion/useGsap';
import { Monitor, Volume2, Lightbulb, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

const capabilityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  led: Monitor,
  sound: Volume2,
  stage: Layers,
  lighting: Lightbulb,
};

const fallbackCapabilities = [
  {
    title: 'LED Displays',
    description: 'High-resolution indoor and outdoor LED screens for crystal clear visual impact.',
    icon: Monitor,
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1000',
  },
  {
    title: 'Sound Systems',
    description: 'Professional audio engineering and premium sound reinforcement for any scale.',
    icon: Volume2,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1000',
  },
  {
    title: 'Stage & Truss',
    description: 'Architectural stage design and safe, modular trussing systems.',
    icon: Layers,
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000',
  },
  {
    title: 'Event Lighting',
    description: 'Atmospheric and dynamic lighting solutions that transform spaces.',
    icon: Lightbulb,
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000',
  },
];

export default function HomeCapabilities() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const { content, locale } = useSiteContent();

  const capabilities = useMemo(() => {
    if (content.home.capabilities.items.length > 0) {
      return content.home.capabilities.items.map((item) => ({
        key: item.key,
        title: t(locale, item.title),
        description: t(locale, item.description),
        icon: capabilityIcons[item.key] || Monitor,
        image: item.image,
      }));
    }

    return fallbackCapabilities;
  }, [content.home.capabilities.items, locale]);

  useGsap(() => {
    const totalSlides = capabilities.length;
    const scrollDistance = (totalSlides - 1) * window.innerWidth;
    const snapPoints = Array.from({ length: totalSlides }, (_, i) => i / (totalSlides - 1));

    gsap.to(sectionRef.current, {
      x: () => `-${(totalSlides - 1) * 100}vw`,
      ease: 'none',
      scrollTrigger: {
        trigger: triggerRef.current,
        start: 'top top',
        end: () => `+=${scrollDistance}`,
        pin: true,
        scrub: 1,
        snap: {
          snapTo: snapPoints,
          delay: 0,
          ease: 'power1.inOut',
        },
        invalidateOnRefresh: true,
      },
    });
  }, { dependencies: [capabilities.length], scope: triggerRef });

  return (
    <div ref={triggerRef} className="overflow-hidden bg-black">
      <div
        ref={sectionRef}
        className="flex h-screen relative will-change-transform"
        style={{ width: `${capabilities.length * 100}vw` }}
      >
        {capabilities.map((cap, i) => (
          <div
            key={cap.key || i}
            className="h-screen w-screen shrink-0 relative flex items-center justify-center px-6 md:px-20"
          >
            {/* Background Image with Parallax */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={cap.image}
                className="w-full h-full object-cover opacity-30 grayscale hover:grayscale-0 transition-[filter,opacity] duration-1000"
                referrerPolicy="no-referrer"
                alt={cap.title}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-16 h-16 rounded-[1.25rem] bg-premium-red/95 shadow-[0_18px_40px_rgba(255,59,48,0.18)] flex items-center justify-center backdrop-blur-sm">
                    <cap.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.26em] text-premium-red/90">{t(locale, content.home.capabilities.badge)} 0{i + 1}</span>
                </div>

                <h2 className="text-6xl md:text-8xl font-black tracking-ultra-tight uppercase leading-[0.94]">
                  {cap.title.split(' ').map((word, idx) => (
                    <span key={idx} className={cn("block", idx === 1 && "text-premium-red")}>{word}</span>
                  ))}
                </h2>

                <p className="text-lg md:text-xl text-white/70 max-w-md font-medium leading-[1.75]">
                  {cap.description}
                </p>

                <button className="group flex min-h-12 items-center gap-4 rounded-full border border-white/10 px-6 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-white hover:border-premium-red/40 hover:text-premium-red transition-colors duration-300">
                  {t(locale, content.home.capabilities.cta)}
                  <div className="w-10 h-px bg-white/20 group-hover:bg-premium-red group-hover:w-16 transition-[width,background-color] duration-300" />
                </button>
              </div>

              <div className="hidden lg:block relative aspect-square">
                <div className="absolute inset-0 border border-white/10 rounded-[2.75rem] rotate-6" />
                <div className="absolute inset-0 border border-premium-red/20 rounded-[2.75rem] -rotate-3" />
                <img
                  src={cap.image}
                  className="w-full h-full object-cover rounded-[2.75rem] shadow-[0_28px_80px_rgba(0,0,0,0.32)] relative z-10"
                  referrerPolicy="no-referrer"
                  alt={cap.title}
                />
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="absolute bottom-12 left-20 flex items-center gap-4">
              <span className="text-xs font-bold text-white">0{i + 1}</span>
              <div className="w-40 h-px bg-white/10 relative">
                <div
                  className="absolute inset-0 bg-premium-red origin-left"
                  style={{ transform: `scaleX(${(i + 1) / capabilities.length})` }}
                />
              </div>
              <span className="text-xs font-bold text-white/50">0{capabilities.length}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}