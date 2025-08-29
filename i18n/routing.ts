/**
 * i18n Routing Configuration
 * 
 * Basic internationalization setup for Command Center enterprise interface.
 * Default English locale with support for future localization.
 */

export type Locale = 'en' | 'es' | 'fr' | 'de';

export const routing = {
  defaultLocale: 'en' as Locale,
  locales: ['en', 'es', 'fr', 'de'] as const,
  localePrefix: 'never' as const
} as const;

export const defaultLocale = routing.defaultLocale;