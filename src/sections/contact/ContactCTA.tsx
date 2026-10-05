import { useRef, useState, useEffect, useCallback } from 'react';
import { Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react';
import { useGsap, gsap } from '../../motion/useGsap';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

function FloatingOrb({ style }: { style: React.CSSProperties }) {
  return <div className="absolute rounded-full pointer-events-none" style={style} />;
}

export default function ContactCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const { content, locale } = useSiteContent();
  const s = content.contact.cta;

  const footer = content.footer;
  const CHANNELS = [
    { icon: Phone,     label: t(locale, s.channelPhone),     value: t(locale, s.channelPhoneValue),     href: `tel:${t(locale, s.channelPhoneValue).replace(/\s/g,'')}`,   color: '#e30613', tag: t(locale, s.channelTagPhone) },
    { icon: Mail,      label: t(locale, s.channelEmail),     value: t(locale, s.channelEmailValue),     href: `mailto:${t(locale, s.channelEmailValue)}`,                   color: '#ff6b35', tag: t(locale, s.channelTagEmail) },
    { icon: MapPin,    label: t(locale, s.channelMap),       value: t(locale, s.channelAddressValue),   href: `https://maps.google.com/?q=${encodeURIComponent(t(locale, s.channelAddressValue))}`, color: '#c2185b', tag: t(locale, s.channelTagMap) },
    { icon: Instagram, label: t(locale, s.channelInstagram), value: t(locale, s.channelInstagramValue), href: footer.instagramHref || 'https://instagram.com/eventrent.az', color: '#9c27b0', tag: t(locale, s.channelTagInstagram) },
    { icon: Facebook,  label: t(locale, s.channelFacebook),  value: t(locale, s.channelFacebookValue),  href: 'https://facebook.com/eventrent',                             color: '#1565c0', tag: t(locale, s.channelTagFacebook) },
  ];

  // Direct DOM update — no setState, no re-render on every mousemove
  const rectCache = useRef<DOMRect | null>(null);
  const handleMouse = useCallback((e: MouseEvent) => {
    if (!rectCache.current) rectCache.current = sectionRef.current?.getBoundingClientRect() ?? null;
    const rect = rectCache.current;
    if (!rect || !orbRef.current) return;
    const x = ((e.clientX - rect.left) / rect.width) * 30;
    const y = ((e.clientY - rect.top) / rect.height) * 20 - 10;
    orbRef.current.style.left = `${x}%`;
    orbRef.current.style.top = `${y}%`;
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    const resetRect = () => { rectCache.current = null; }; // invalidate on resize
    el?.addEventListener('mousemove', handleMouse, { passive: true });
    window.addEventListener('resize', resetRect);
    return () => {
      el?.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('resize', resetRect);
    };
  }, [handleMouse]);

  useGsap(() => {
    gsap.fromTo('.hc-char',
      { yPercent: 120, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.05,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none none' } }
    );
    gsap.fromTo('.hc-badge',
      { scale: 0, opacity: 0, rotate: -15 },
      { scale: 1, opacity: 1, rotate: 0, duration: 0.8, ease: 'back.out(2)', delay: 0.6,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none none' } }
    );
    gsap.fromTo('.hc-card',
      { opacity: 0, y: 48, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.4,
        scrollTrigger: { trigger: '.hc-cards-grid', start: 'top 85%', toggleActions: 'play none none none' } }
    );
    gsap.fromTo('.hc-bottom',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.2,
        scrollTrigger: { trigger: '.hc-bottom', start: 'top 90%', toggleActions: 'play none none none' } }
    );
  }, { scope: sectionRef });

  const letters = t(locale, content.contact.ctaHeroWord).split('');

  return (
    <section ref={sectionRef} className="relative bg-[#060606] overflow-hidden" style={{ isolation: 'isolate' }}>
      <div className="absolute top-0 left-0 right-0 h-px bg-white/[0.06]" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          ref={orbRef}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 600, height: 600,
            left: '50%', top: '0%',
            background: 'radial-gradient(circle, rgba(227,6,19,0.08) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            transition: 'left 1.2s cubic-bezier(0.25,0.46,0.45,0.94), top 1.2s cubic-bezier(0.25,0.46,0.45,0.94)',
            filter: 'blur(40px)',
            willChange: 'transform',
          }}
        />
        <FloatingOrb style={{
          width: 400, height: 400, right: '20%', bottom: '10%',
          background: 'radial-gradient(circle, rgba(227,6,19,0.05) 0%, transparent 70%)',
          filter: 'blur(60px)', animation: 'orbFloat 6s ease-in-out infinite',
        }} />
        <FloatingOrb style={{
          width: 200, height: 200, left: '5%', top: '30%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)',
          filter: 'blur(30px)', animation: 'orbFloat 8s ease-in-out infinite reverse',
        }} />
        <div className="absolute inset-0 grid-lines opacity-30" />
      </div>

      <div className="relative px-6 md:px-16 pt-24 pb-0">
        <div className="hc-badge inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full"
          style={{ background: 'rgba(227,6,19,0.1)', border: '1px solid rgba(227,6,19,0.25)' }}>
          <span className="block w-1.5 h-1.5 rounded-full bg-[#e30613] animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.4em] uppercase text-[#e30613]">
            {t(locale, s.badge)}
          </span>
        </div>

        <div className="flex items-end gap-0 overflow-hidden"
          style={{ fontSize: 'clamp(5rem, 14vw, 14rem)', fontWeight: 900, lineHeight: 0.85, letterSpacing: '-0.04em' }}>
          {letters.map((ch, i) => (
            <div key={i} className="overflow-hidden">
              <span
                className="hc-char inline-block"
                style={{
                  background: i < 4
                    ? 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)'
                    : 'linear-gradient(135deg, #e30613 0%, #ff4a53 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: i >= 4 ? 'drop-shadow(0 0 30px rgba(227,6,19,0.5))' : 'none',
                }}
              >
                {ch}
              </span>
            </div>
          ))}
        </div>

        <p className="hc-badge mt-5 text-white/60 text-[13px] font-normal tracking-wide max-w-sm leading-relaxed">
          {t(locale, s.subText)}
        </p>
      </div>

      <div className="hc-cards-grid relative max-w-[1400px] mx-auto px-6 md:px-16 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <ContactCard ch={CHANNELS[0]} i={0} active={active} setActive={setActive} span="md:col-span-2" />
          <ContactCard ch={CHANNELS[2]} i={2} active={active} setActive={setActive} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ContactCard ch={CHANNELS[1]} i={1} active={active} setActive={setActive} />
          <ContactCard ch={CHANNELS[3]} i={3} active={active} setActive={setActive} />
          <ContactCard ch={CHANNELS[4]} i={4} active={active} setActive={setActive} />
        </div>
      </div>

      <div className="hc-bottom relative max-w-[1400px] mx-auto px-6 md:px-16 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-t border-white/[0.05]">
        <div>
          <p className="text-white/50 text-[11px] font-black tracking-[0.35em] uppercase mb-1">{t(locale, s.bottomLabel)}</p>
          <p className="text-white/70 text-[13px] font-normal leading-relaxed max-w-xs">{t(locale, s.bottomTagline)}</p>
        </div>
        <a
          href="/contact"
          className="group relative inline-flex items-center gap-4 px-9 py-4 rounded-full overflow-hidden transition-all duration-300"
          style={{ background: '#e30613', border: '1px solid #e30613' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = '#ff2233';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(227,6,19,0.5)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = '#e30613';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          <span className="text-[11px] font-black tracking-[0.35em] uppercase text-white relative z-10">{t(locale, s.bottomCta)}</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">
            <path d="M2 12L12 2M12 2H5M12 2V9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
}

function ContactCard({
  ch, i, active, setActive, span = ''
}: {
  ch: { icon: any; label: string; value: string; href: string; color: string; tag: string };
  i: number;
  active: number | null;
  setActive: (v: number | null) => void;
  span?: string;
}) {
  const Icon = ch.icon;
  const isActive = active === i;

  return (
    <a
      href={ch.href}
      target={ch.href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      className={`hc-card group relative flex flex-col justify-between p-7 rounded-2xl overflow-hidden transition-all duration-400 ${span}`}
      style={{
        background: isActive
          ? `linear-gradient(135deg, rgba(${hexToRgb(ch.color)},0.12) 0%, rgba(0,0,0,0.6) 100%)`
          : 'rgba(255,255,255,0.025)',
        border: isActive ? `1px solid rgba(${hexToRgb(ch.color)},0.35)` : '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)', minHeight: '180px',
        boxShadow: isActive
          ? `0 20px 60px rgba(${hexToRgb(ch.color)},0.15), inset 0 1px 0 rgba(255,255,255,0.05)`
          : 'inset 0 1px 0 rgba(255,255,255,0.03)',
        transform: isActive ? 'translateY(-3px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setActive(i)}
      onMouseLeave={() => setActive(null)}
    >
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 20% 80%, rgba(${hexToRgb(ch.color)},0.15) 0%, transparent 60%)`,
          opacity: isActive ? 1 : 0,
        }} />

      <div className="relative flex items-start justify-between mb-8">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300"
          style={{
            background: isActive ? `rgba(${hexToRgb(ch.color)},0.2)` : 'rgba(255,255,255,0.05)',
            border: isActive ? `1px solid rgba(${hexToRgb(ch.color)},0.4)` : '1px solid rgba(255,255,255,0.08)',
          }}>
          <Icon style={{ width: 18, height: 18, color: isActive ? ch.color : 'rgba(255,255,255,0.35)', transition: 'color 0.3s' }} />
        </div>
        <span className="text-[9px] font-black tracking-[0.4em] px-3 py-1 rounded-full transition-all duration-300"
          style={{
            background: isActive ? `rgba(${hexToRgb(ch.color)},0.15)` : 'rgba(255,255,255,0.04)',
            color: isActive ? ch.color : 'rgba(255,255,255,0.2)',
            border: isActive ? `1px solid rgba(${hexToRgb(ch.color)},0.3)` : '1px solid rgba(255,255,255,0.06)',
          }}>
          {ch.tag}
        </span>
      </div>

      <div className="relative">
        <p className="text-[10px] font-black tracking-[0.35em] uppercase mb-2 transition-colors duration-300"
          style={{ color: isActive ? `rgba(${hexToRgb(ch.color)},0.7)` : 'rgba(255,255,255,0.2)' }}>
          {ch.label}
        </p>
        <p className="font-semibold text-[15px] md:text-[17px] tracking-tight leading-snug transition-colors duration-300"
          style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.55)' }}>
          {ch.value}
        </p>
      </div>

      <div className="absolute bottom-6 right-6 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300"
        style={{
          background: isActive ? ch.color : 'transparent',
          border: isActive ? `1px solid ${ch.color}` : '1px solid rgba(255,255,255,0.1)',
          transform: isActive ? 'scale(1.1)' : 'scale(1)',
        }}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M2 12L12 2M12 2H5M12 2V9"
            stroke={isActive ? '#fff' : 'rgba(255,255,255,0.25)'}
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="absolute top-0 left-0 w-full h-[2px] rounded-t-2xl transition-all duration-400"
        style={{
          background: `linear-gradient(90deg, ${ch.color}, transparent)`,
          opacity: isActive ? 1 : 0,
        }} />
    </a>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '227,6,19';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}