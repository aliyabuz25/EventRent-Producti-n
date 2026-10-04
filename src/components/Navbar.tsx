import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingCart, Menu, X, ShieldCheck, User as UserIcon, LogIn, ArrowRight, ChevronDown } from 'lucide-react';
import 'flag-icons/css/flag-icons.min.css';
import { cn } from '../lib/utils';
import { useSiteContent } from '../content.context';
import { t } from '../content';
import { Locale } from '../types';
import { navLinks, langLabels } from '../config/navConfig';
import { useCartCount } from '../hooks/useCartCount';
import { useNavbarAuth } from '../hooks/useNavbarAuth';

const NAV_VISIBILITY_KEY = 'nav_page_visibility';

function getNavVisibility(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(NAV_VISIBILITY_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const cartCount = useCartCount();
  const user = useNavbarAuth();
  const { content, locale, setLocale } = useSiteContent();
  const location = useLocation();
  const [navVisibility, setNavVisibility] = useState<Record<string, boolean>>(getNavVisibility);

  useEffect(() => {
    const handleVisibilityChange = () => setNavVisibility(getNavVisibility());
    window.addEventListener('nav-visibility-changed', handleVisibilityChange);
    return () => window.removeEventListener('nav-visibility-changed', handleVisibilityChange);
  }, []);

  const visibleNavLinks = navLinks.filter(link => {
    if (!link.hiddenByDefault) return true;
    return navVisibility[link.path] === true;
  });

  const logoLabel = { az: 'Ana səhifəyə keç', en: 'Go to homepage', ru: 'Перейти на главную', tr: 'Ana sayfaya git' };
  const cartLabel = { az: 'Səbətə keç', en: 'Open cart', ru: 'Открыть корзину', tr: 'Sepeti aç' };
  const profileLabel = { az: 'Profilə keç', en: 'Open profile', ru: 'Открыть профиль', tr: 'Profili aç' };
  const loginLabel = { az: 'Giriş səhifəsini aç', en: 'Open login page', ru: 'Открыть страницу входа', tr: 'Giriş sayfasını aç' };
  const menuLabel = { az: 'Menyunu aç', en: 'Open menu', ru: 'Открыть меню', tr: 'Menüyü aç' };
  const closeMenuLabel = { az: 'Menyunu bağla', en: 'Close menu', ru: 'Закрыть меню', tr: 'Menüyü kapat' };
  const languageLabel = { az: 'Dili dəyiş', en: 'Change language', ru: 'Сменить язык', tr: 'Dili değiştir' };
  const FLAG_CODES: Record<string, string> = { az: 'az', en: 'gb', ru: 'ru', tr: 'tr' };
  const Flag = ({ code, size = 20 }: { code: string; size?: number }) => (
    <span
      className={`fi fi-${code} fis`}
      style={{ width: size, height: size, borderRadius: '50%', display: 'inline-block', backgroundSize: 'cover', flexShrink: 0 }}
    />
  );
  const adminLabel = { az: 'Admin', en: 'Admin', ru: 'Админ', tr: 'Admin' };
  const inquiriesLabel = { az: 'Sorğular', en: 'Inquiries', ru: 'Запросы', tr: 'Talepler' };
  const cartItemsLabel = { az: 'Səbətdə məhsul sayı', en: 'Items in cart', ru: 'Количество товаров в корзине', tr: 'Sepetteki ürün sayısı' };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Close lang menu on outside click
  useEffect(() => {
    if (!isLangMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.lang-menu-container')) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isLangMenuOpen]);

  return (
    <>
      {/* ======== FIXED STICKY NAVBAR ======== */}
      <nav
        aria-label="Main navigation"
        className={cn(
          'fixed inset-x-0 top-0 z-[100] border-b transition-[background-color,border-color,box-shadow,padding] duration-500',
          isScrolled
            ? 'border-white/[0.08] bg-black/92 py-3 backdrop-blur-2xl shadow-xl shadow-black/30'
            : 'border-transparent bg-black/50 py-4 backdrop-blur-xl'
        )}
      >
        <div className="flex w-full items-center gap-4 px-4 lg:px-8 xl:px-12">

          {/* Logo — Bigger */}
          <Link
            to="/"
            aria-label={t(locale, logoLabel)}
            className="flex shrink-0 items-center gap-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md"
          >
            <span className="text-[28px] font-black lowercase leading-none tracking-[-0.04em] text-white">event</span>
            <span className="text-[28px] font-black lowercase leading-none tracking-[-0.04em] text-premium-orange">rent</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-5 xl:gap-7">
              {visibleNavLinks.map((link) => {
                const isActive =
                  link.path === '/'
                    ? location.pathname === '/'
                    : location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'group relative rounded-md py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors duration-300 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                      isActive ? 'text-white' : 'text-white/70 hover:text-white'
                    )}
                  >
                    {t(locale, link.name)}
                    <span
                      className={cn(
                        'absolute bottom-0 left-0 h-[1.5px] bg-premium-orange transition-[width] duration-300',
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2 lg:gap-3">

            {/* Language Dropdown — Hidden on mobile, dropdown on desktop */}
            <div className="relative lang-menu-container hidden md:block">
              <button
                type="button"
                onClick={() => setIsLangMenuOpen((prev) => !prev)}
                aria-label={t(locale, languageLabel)}
                aria-expanded={isLangMenuOpen ? 'true' : 'false'}
                aria-haspopup="true"
                className={cn(
                  'flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-[color,background-color,border-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-1 focus-visible:ring-offset-black',
                  isScrolled
                    ? 'text-gray-400 hover:bg-white/[0.08] hover:text-white'
                    : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                )}
              >
                <Flag code={FLAG_CODES[locale]} size={18} />
                <span>{locale.toUpperCase()}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'h-[13px] w-[13px] transition-transform duration-200',
                    isLangMenuOpen ? 'rotate-180' : ''
                  )}
                />
              </button>

              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      'absolute right-0 top-full mt-2 min-w-[140px] overflow-hidden rounded-xl border border-white/[0.08] bg-black/95 backdrop-blur-2xl py-1 shadow-xl shadow-black/50',
                      isScrolled ? 'bg-black/95' : 'bg-black/90'
                    )}
                  >
                    {(['az', 'en', 'ru', 'tr'] as Locale[]).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setLocale(lang);
                          setIsLangMenuOpen(false);
                        }}
                        aria-label={`${t(locale, languageLabel)}: ${langLabels[lang]}`}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left text-[12px] font-medium uppercase tracking-wide transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-inset',
                          locale === lang
                            ? 'bg-premium-orange/15 text-premium-orange'
                            : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                        )}
                      >
                        <Flag code={FLAG_CODES[lang]} size={20} />
                        <span className="font-black">{lang.toUpperCase()}</span>
                        <span className="text-gray-500">{langLabels[lang]}</span>
                        {locale === lang && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-premium-orange" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <Link
              to="/cart"
              aria-label={t(locale, cartLabel)}
              className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-gray-400 transition-[color,background-color,border-color] hover:border-premium-orange/30 hover:bg-premium-orange/10 hover:text-premium-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-1 focus-visible:ring-offset-black"
            >
              <ShoppingCart aria-hidden="true" className="h-[19px] w-[19px] transition-transform group-hover:scale-110" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-premium-orange px-1 text-[9px] font-black text-white shadow-lg shadow-premium-orange/30">
                  <span className="sr-only">{cartCount} {t(locale, cartItemsLabel)}</span>
                  <span aria-hidden="true">{cartCount}</span>
                </span>
              )}
            </Link>

            {/* User / Login */}
            {user ? (
              <Link
                to="/profile"
                aria-label={t(locale, profileLabel)}
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-gray-400 transition-[color,background-color,border-color] hover:border-premium-orange/30 hover:bg-premium-orange/10 hover:text-premium-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-1 focus-visible:ring-offset-black"
              >
                <UserIcon aria-hidden="true" className="h-[19px] w-[19px] transition-transform group-hover:scale-110" />
              </Link>
            ) : (
              <Link
                to="/login"
                aria-label={t(locale, loginLabel)}
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-gray-400 transition-[color,background-color,border-color] hover:border-premium-orange/30 hover:bg-premium-orange/10 hover:text-premium-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-1 focus-visible:ring-offset-black"
              >
                <LogIn aria-hidden="true" className="h-[19px] w-[19px] transition-transform group-hover:scale-110" />
              </Link>
            )}

            

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              data-testid="mobile-menu-btn"
              aria-label={isMobileMenuOpen ? t(locale, closeMenuLabel) : t(locale, menuLabel)}
              aria-expanded={isMobileMenuOpen ? 'true' : 'false'}
              aria-controls="mobile-navigation"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-gray-400 transition-[color,background-color,border-color] hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-1 focus-visible:ring-offset-black"
            >
              {isMobileMenuOpen ? (
                <X aria-hidden="true" className="h-[18px] w-[18px]" />
              ) : (
                <Menu aria-hidden="true" className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ======== MOBILE MENU ======== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={t(locale, menuLabel)}
            className="fixed inset-0 z-[200] flex flex-col overflow-y-auto bg-brand-bg px-6 py-8 md:px-10"
          >
            {/* Header */}
            <div className="mb-12 flex items-center justify-between">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={t(locale, logoLabel)}
                className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
              >
                <span className="text-[22px] font-black lowercase leading-none tracking-[-0.04em] text-white">event</span>
                <span className="text-[22px] font-black lowercase leading-none tracking-[-0.04em] text-premium-orange">rent</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={t(locale, closeMenuLabel)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-gray-400 transition-colors hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            {/* Language Switcher — Full visible in mobile */}
            <div className="mb-10 flex w-fit items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1">
              {(['az', 'en', 'ru', 'tr'] as Locale[]).map((lang) => (
                <button
                  key={`mobile-${lang}`}
                  type="button"
                  onClick={() => setLocale(lang)}
                  aria-label={`${t(locale, languageLabel)}: ${langLabels[lang]}`}
                  aria-pressed={locale === lang ? 'true' : 'false'}
                  className={cn(
                    'rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.1em] transition-[color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-1 focus-visible:ring-offset-brand-bg',
                    locale === lang
                      ? 'bg-premium-orange text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  <Flag code={FLAG_CODES[lang]} size={18} />
                  <span>{lang.toUpperCase()}</span>
                </button>
              ))}
            </div>

            {/* Nav Links */}
            <div className="flex flex-col gap-1">
              {visibleNavLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group flex items-center justify-between rounded-2xl px-5 py-5 text-[clamp(2rem,8vw,3.2rem)] font-black uppercase tracking-[-0.03em] text-white transition-colors hover:text-premium-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
                  >
                    {t(locale, link.name)}
                    <ArrowRight className="h-7 w-7 -translate-x-4 text-premium-orange opacity-0 transition-[transform,opacity] group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-auto space-y-4 border-t border-white/[0.06] pt-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">{t(locale, inquiriesLabel)}</p>
              <p className="text-xl font-bold uppercase tracking-tight text-white">{content.home.finalCta.email}</p>
              <p className="text-xl font-bold uppercase tracking-tight text-white">{content.home.finalCta.phone}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}