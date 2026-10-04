import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadSiteContent, DEFAULT_LOCALE } from './content';
import { DEFAULT_SITE_CONTENT } from './content.default';
import { Locale, SiteContent } from './types';

interface SiteContentContextValue {
  content: SiteContent;
  setContent: React.Dispatch<React.SetStateAction<SiteContent>>;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isLoading: boolean;
  reloadContent: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

const SUPPORTED_LOCALES: Locale[] = ['az', 'en', 'ru', 'tr'];

function normalizeLocale(value: string | null | undefined): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE as Locale;
}

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_LOCALE as Locale;
    }

    const urlLocale = new URLSearchParams(window.location.search).get('lang');
    if (urlLocale) {
      return normalizeLocale(urlLocale);
    }

    const storedLocale = (() => { try { return localStorage.getItem('site_locale'); } catch { return null; } })();
    return normalizeLocale(storedLocale);
  });

  const reloadContent = useCallback(async () => {
    setIsLoading(true);
    const loaded = await loadSiteContent();
    setContent(loaded);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reloadContent();
  }, [reloadContent]);

  /* Geolocation-based locale — only if user hasn't chosen manually */
  useEffect(() => {
    const stored = (() => { try { return localStorage.getItem('site_locale'); } catch { return null; } })();
    const urlLocale = new URLSearchParams(window.location.search).get('lang');
    if (stored || urlLocale) return;

    function detectFromCountry(cc: string) {
      const c = cc.toLowerCase();
      if (c === 'az') return 'az' as Locale;
      if (c === 'tr') return 'tr' as Locale;
      if (['ru', 'kz', 'uz', 'kg', 'tj', 'tm', 'by', 'md', 'am', 'ge'].includes(c)) return 'ru' as Locale;
      return 'en' as Locale;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2`,
              { headers: { 'User-Agent': 'Eventrent.az/1.0 (info@eventrent.az)' } }
            );
            const data = await res.json();
            const cc = data?.address?.country_code || '';
            setLocaleState(detectFromCountry(cc));
          } catch {
            fallbackToIp();
          }
        },
        () => fallbackToIp(),
        { timeout: 5000 }
      );
    } else {
      fallbackToIp();
    }

    function fallbackToIp() {
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then((data: { country_code?: string }) => {
          setLocaleState(detectFromCountry(data.country_code || ''));
        })
        .catch(() => {});
    }
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    const normalized = normalizeLocale(nextLocale);
    setLocaleState(normalized);
    localStorage.setItem('site_locale', normalized);
  }, []);

  const value = useMemo(
    () => ({
      content,
      setContent,
      locale,
      setLocale,
      isLoading,
      reloadContent,
    }),
    [content, locale, setLocale, isLoading, reloadContent],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within SiteContentProvider');
  }
  return context;
}
