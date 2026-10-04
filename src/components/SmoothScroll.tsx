import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { ScrollTrigger } from '../motion/useGsap';
import gsap from 'gsap';

interface SmoothScrollProps {
  children: React.ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (mediaQuery.matches) {
      document.documentElement.classList.remove('lenis');
      document.documentElement.classList.remove('lenis-smooth');
      document.documentElement.classList.remove('lenis-stopped');
      document.body.classList.remove('lenis');
      return undefined;
    }

    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 2,
      infinite: false,
    });

    // Bridge Lenis virtual scroll to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    // Store ticker reference to correctly remove it on cleanup (stale closure fix)
    const ticker = (time: number) => { lenis.raf(time * 1000); };
    gsap.ticker.add(ticker);
    // Restore lag smoothing protection (0 disables it, causing frame jumps on tab focus)
    gsap.ticker.lagSmoothing(300, 0.5);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(ticker); // same reference — removes correctly
    };
  }, []);

  return <>{children}</>;
}
