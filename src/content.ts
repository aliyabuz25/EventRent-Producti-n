import { SiteContent } from './types';
import { DEFAULT_SITE_CONTENT } from './content.default';

export const DEFAULT_LOCALE = 'az';

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return Boolean(val && typeof val === 'object' && !Array.isArray(val));
}

function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) return base;
  const result: Record<string, unknown> = { ...base as Record<string, unknown> };
  for (const key of Object.keys(override)) {
    const baseVal = (base as Record<string, unknown>)[key];
    const overrideVal = override[key];
    if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
      result[key] = deepMerge(baseVal, overrideVal);
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal;
    }
  }
  return result as T;
}

function isSiteContent(value: unknown): value is SiteContent {
  return Boolean(value && typeof value === 'object' && (value as SiteContent).home && (value as SiteContent).services);
}

export async function loadSiteContent(): Promise<SiteContent> {
  try {
    const response = await fetch('/api/content', { cache: 'no-store' });
    if (!response.ok) {
      return DEFAULT_SITE_CONTENT;
    }

    const payload = await response.json();
    if (isSiteContent(payload)) {
      return deepMerge(DEFAULT_SITE_CONTENT, payload);
    }

    return DEFAULT_SITE_CONTENT;
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export function t(locale: string | undefined, value: { az: string; en: string; ru: string; tr: string }): string {
  const normalized = (locale || DEFAULT_LOCALE).toLocaleLowerCase('en-US');
  if (normalized === 'en') return value.en;
  if (normalized === 'ru') return value.ru;
  if (normalized === 'tr') return value.tr;
  return value.az;
}

export function ta(locale: string | undefined, value: { az: string[]; en: string[]; ru: string[]; tr: string[] }): string[] {
  const normalized = (locale || DEFAULT_LOCALE).toLocaleLowerCase('en-US');
  if (normalized === 'en') return value.en;
  if (normalized === 'ru') return value.ru;
  if (normalized === 'tr') return value.tr;
  return value.az;
}

export function getServiceCategories(content: SiteContent) {
  return content.services?.categories ?? [];
}

export function getServiceCategoryBySlug(content: SiteContent, slug: string) {
  return getServiceCategories(content).find(c => c.id === slug) ?? null;
}

export function getServiceSubItemBySlug(
  content: SiteContent,
  categorySlug: string,
  itemSlug: string
) {
  const category = getServiceCategoryBySlug(content, categorySlug);
  return category?.subItems?.find(item => item.id === itemSlug) ?? null;
}
