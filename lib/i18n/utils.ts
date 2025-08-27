import { type Locale, routing } from '@/i18n/routing';
import { getLangDir } from 'rtl-detect';

/**
 * Utility functions for internationalization and RTL support
 */

/**
 * Check if a locale is RTL (Right-to-Left)
 */
export function isRTL(locale: string): boolean {
  return getLangDir(locale) === 'rtl';
}

/**
 * Get text direction for a locale
 */
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return getLangDir(locale) as 'ltr' | 'rtl';
}

/**
 * Get the appropriate CSS class for RTL/LTR
 */
export function getDirectionClass(locale: string): string {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Check if a locale is supported
 */
export function isSupportedLocale(locale: string): locale is Locale {
  return routing.locales.includes(locale as Locale);
}

/**
 * Get the default locale
 */
export function getDefaultLocale(): Locale {
  return routing.defaultLocale;
}

/**
 * Normalize locale (fallback to default if not supported)
 */
export function normalizeLocale(locale?: string): Locale {
  if (!locale || !isSupportedLocale(locale)) {
    return getDefaultLocale();
  }
  return locale;
}

/**
 * Get locale-aware CSS properties for spacing/positioning
 */
export function getLogicalProperties(locale: string) {
  const isRtl = isRTL(locale);

  return {
    // Margin properties
    marginStart: isRtl ? 'marginRight' : 'marginLeft',
    marginEnd: isRtl ? 'marginLeft' : 'marginRight',

    // Padding properties
    paddingStart: isRtl ? 'paddingRight' : 'paddingLeft',
    paddingEnd: isRtl ? 'paddingLeft' : 'paddingRight',

    // Border properties
    borderStart: isRtl ? 'borderRight' : 'borderLeft',
    borderEnd: isRtl ? 'borderLeft' : 'borderRight',

    // Position properties
    insetStart: isRtl ? 'right' : 'left',
    insetEnd: isRtl ? 'left' : 'right',

    // Text align
    textAlignStart: isRtl ? 'right' : 'left',
    textAlignEnd: isRtl ? 'left' : 'right',

    // Flex properties
    justifyStart: isRtl ? 'flex-end' : 'flex-start',
    justifyEnd: isRtl ? 'flex-start' : 'flex-end',
  };
}

/**
 * Get calendar-specific layout properties for RTL support
 */
export function getCalendarLayoutProps(locale: string) {
  const isRtl = isRTL(locale);

  return {
    // Calendar layout
    monthLabelPosition: isRtl ? 'right' : 'left',
    timelineDirection: isRtl ? 'row-reverse' : 'row',
    eventAlignment: isRtl ? 'flex-end' : 'flex-start',

    // Navigation arrows
    nextArrow: isRtl ? '←' : '→',
    prevArrow: isRtl ? '→' : '←',

    // Breadcrumb separator
    breadcrumbSeparator: isRtl ? '←' : '→',

    // Week start (cultural consideration)
    weekStartsOn: getWeekStartForLocale(locale),

    // Date format preferences
    dateFormat: getDateFormatForLocale(locale),
  };
}

/**
 * Get week start day for a locale (cultural calendar preferences)
 */
export function getWeekStartForLocale(locale: string): 0 | 1 | 6 {
  // 0 = Sunday, 1 = Monday, 6 = Saturday
  const localeWeekStarts: Record<string, 0 | 1 | 6> = {
    en: 0, // Sunday (US/Canada)
    ar: 6, // Saturday (Middle East)
    he: 0, // Sunday (Israel)
    de: 1, // Monday (Germany)
    fr: 1, // Monday (France)
    es: 1, // Monday (Spain)
    it: 1, // Monday (Italy)
    pt: 1, // Monday (Portugal)
    ru: 1, // Monday (Russia)
    ja: 0, // Sunday (Japan)
    ko: 0, // Sunday (South Korea)
    zh: 1, // Monday (China)
  };

  return localeWeekStarts[locale] || 1; // Default to Monday
}

/**
 * Get preferred date format for locale
 */
export function getDateFormatForLocale(locale: string): string {
  const formats: Record<string, string> = {
    en: 'MM/dd/yyyy', // US format
    'en-GB': 'dd/MM/yyyy', // UK format
    de: 'dd.MM.yyyy', // German format
    fr: 'dd/MM/yyyy', // French format
    es: 'dd/MM/yyyy', // Spanish format
    it: 'dd/MM/yyyy', // Italian format
    pt: 'dd/MM/yyyy', // Portuguese format
    ru: 'dd.MM.yyyy', // Russian format
    ja: 'yyyy/MM/dd', // Japanese format
    ko: 'yyyy.MM.dd', // Korean format
    zh: 'yyyy/MM/dd', // Chinese format
    ar: 'dd/MM/yyyy', // Arabic format
    he: 'dd/MM/yyyy', // Hebrew format
  };

  return formats[locale] || 'dd/MM/yyyy';
}

/**
 * Get calendar system for locale (Gregorian, Islamic, Hebrew, etc.)
 */
export function getCalendarSystemForLocale(
  locale: string
): 'gregory' | 'islamic' | 'hebrew' | 'chinese' {
  const systems: Record<string, 'gregory' | 'islamic' | 'hebrew' | 'chinese'> = {
    ar: 'gregory', // Most Arabic regions use Gregorian for civil purposes
    he: 'gregory', // Israel uses Gregorian for civil calendar
    zh: 'gregory', // China uses Gregorian officially
    // Add specific overrides for regions that prefer other systems
  };

  return systems[locale] || 'gregory';
}

/**
 * Format locale name for display
 */
export function formatLocaleName(locale: string, displayLocale?: string): string {
  try {
    return (
      new Intl.DisplayNames(displayLocale || locale, { type: 'language' }).of(locale) || locale
    );
  } catch {
    return locale;
  }
}

/**
 * Get reading direction class names
 */
export function getReadingDirectionClasses(locale: string) {
  const isRtl = isRTL(locale);

  return {
    container: isRtl ? 'rtl' : 'ltr',
    textAlign: isRtl ? 'text-right' : 'text-left',
    marginStart: isRtl ? 'mr-auto' : 'ml-auto',
    marginEnd: isRtl ? 'ml-auto' : 'mr-auto',
    paddingStart: isRtl ? 'pr-4' : 'pl-4',
    paddingEnd: isRtl ? 'pl-4' : 'pr-4',
  };
}
