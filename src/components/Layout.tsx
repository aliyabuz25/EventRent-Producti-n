import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import SiteFooter from './SiteFooter';
import SmoothScroll from './SmoothScroll';
import ScrollToTop from './ScrollToTop';
import Cursor from './Cursor';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg font-sans selection:bg-premium-orange selection:text-white" style={{ overflowX: 'clip' }}>
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[10000] bg-premium-orange flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center"
              >
                <span className="text-premium-orange font-black text-5xl uppercase">E</span>
              </motion.div>
              <div className="overflow-hidden">
                <motion.p 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white font-black uppercase tracking-[0.6em] text-[10px]"
                >
                  Engineering Experience
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollToTop />
      <Cursor />
      <SmoothScroll>
        <div className="relative z-10">
          <Navbar />
          
          <main className="min-h-screen relative z-10" style={{ paddingTop: 'var(--navbar-h, 72px)' }}>
            {children}
          </main>

        <SiteFooter />

      </div>
    </SmoothScroll>
  </div>
);
}
