'use client';

import {
  getCalendarLayoutProps,
  getDateFormatForLocale,
  getLogicalProperties,
  getReadingDirectionClasses,
  getTextDirection,
  getWeekStartForLocale,
  isRTL,
} from '@/lib/i18n/utils';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

/**
 * Comprehensive internationalization hook with RTL support
 */
export function useI18n() {
  const locale = useLocale();
  const t = useTranslations();

  const i18nProps = useMemo(() => {
    const rtl = isRTL(locale);
    const direction = getTextDirection(locale);
    const logicalProps = getLogicalProperties(locale);
    const _calendarProps = getCalendarLayoutProps(locale);
    const directionClasses = getReadingDirectionClasses(locale);

    return {
      locale,
      isRTL: rtl,
      direction,
      weekStartsOn: getWeekStartForLocale(locale),
      dateFormat: getDateFormatForLocale(locale),

      // CSS Properties
      logical: logicalProps,
      classes: directionClasses,

      // Helper functions
      t,

      // Common translations
      common: {
        save: t('Common.save'),
        cancel: t('Common.cancel'),
        delete: t('Common.delete'),
        edit: t('Common.edit'),
        close: t('Common.close'),
        loading: t('Common.loading'),
        search: t('Common.search'),
        filter: t('Common.filter'),
        next: t('Common.next'),
        previous: t('Common.previous'),
      },

      // Calendar translations
      calendar: {
        title: (year: number) => t('Calendar.title', { year }),
        tagline: t('Calendar.tagline'),
        today: t('Calendar.today'),
        daysLeft: (count: number) => t('Calendar.daysLeft', { count }),
        events: (count: number) => t('Calendar.events', { count }),
        createEvent: t('Calendar.createEvent'),
        editEvent: t('Calendar.editEvent'),
        deleteEvent: t('Calendar.deleteEvent'),
        roleDescription: 'Linear Calendar - Year-at-a-glance timeline',
        navigationInstructions: 'Use arrow keys to navigate, Enter to interact with events',

        // Day names
        dayNames: {
          full: {
            sunday: t('Calendar.dayOfWeek.sunday'),
            monday: t('Calendar.dayOfWeek.monday'),
            tuesday: t('Calendar.dayOfWeek.tuesday'),
            wednesday: t('Calendar.dayOfWeek.wednesday'),
            thursday: t('Calendar.dayOfWeek.thursday'),
            friday: t('Calendar.dayOfWeek.friday'),
            saturday: t('Calendar.dayOfWeek.saturday'),
          },
          short: {
            su: t('Calendar.dayOfWeek.su'),
            mo: t('Calendar.dayOfWeek.mo'),
            tu: t('Calendar.dayOfWeek.tu'),
            we: t('Calendar.dayOfWeek.we'),
            th: t('Calendar.dayOfWeek.th'),
            fr: t('Calendar.dayOfWeek.fr'),
            sa: t('Calendar.dayOfWeek.sa'),
          },
        },

        // Month names
        monthNames: {
          full: {
            january: t('Calendar.monthNames.january'),
            february: t('Calendar.monthNames.february'),
            march: t('Calendar.monthNames.march'),
            april: t('Calendar.monthNames.april'),
            may: t('Calendar.monthNames.may'),
            june: t('Calendar.monthNames.june'),
            july: t('Calendar.monthNames.july'),
            august: t('Calendar.monthNames.august'),
            september: t('Calendar.monthNames.september'),
            october: t('Calendar.monthNames.october'),
            november: t('Calendar.monthNames.november'),
            december: t('Calendar.monthNames.december'),
          },
          short: {
            jan: t('Calendar.monthNames.jan'),
            feb: t('Calendar.monthNames.feb'),
            mar: t('Calendar.monthNames.mar'),
            apr: t('Calendar.monthNames.apr'),
            may: t('Calendar.monthNames.may'),
            jun: t('Calendar.monthNames.jun'),
            jul: t('Calendar.monthNames.jul'),
            aug: t('Calendar.monthNames.aug'),
            sep: t('Calendar.monthNames.sep'),
            oct: t('Calendar.monthNames.oct'),
            nov: t('Calendar.monthNames.nov'),
            dec: t('Calendar.monthNames.dec'),
          },
        },
      },

      // Navigation translations
      navigation: {
        home: t('Navigation.home'),
        calendar: t('Navigation.calendar'),
        dashboard: t('Navigation.dashboard'),
        settings: t('Navigation.settings'),
        menu: t('Navigation.menu'),
        openMenu: t('Navigation.openMenu'),
        closeMenu: t('Navigation.closeMenu'),
      },

      // Dashboard translations
      dashboard: {
        title: t('Dashboard.title'),
        overview: t('Dashboard.overview'),
        totalEvents: t('Dashboard.totalEvents'),
        upcomingEvents: t('Dashboard.upcomingEvents'),
        completedToday: t('Dashboard.completedToday'),
        focusTime: t('Dashboard.focusTime'),
        syncStatus: t('Dashboard.syncStatus'),
      },
    };
  }, [locale, t]);

  return i18nProps;
}

/**
 * Hook for getting localized date/time formatting functions
 */
export function useLocalizedFormat() {
  const locale = useLocale();

  return useMemo(() => {
    const dateFormat = getDateFormatForLocale(locale);

    return {
      // Date formatting
      formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => {
        return new Intl.DateTimeFormat(locale, options).format(date);
      },

      // Time formatting
      formatTime: (date: Date, options?: Intl.DateTimeFormatOptions) => {
        return new Intl.DateTimeFormat(locale, {
          hour: 'numeric',
          minute: 'numeric',
          ...options,
        }).format(date);
      },

      // Relative time formatting
      formatRelative: (date: Date, baseDate: Date = new Date()) => {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
        const diffInDays = Math.floor(
          (date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (Math.abs(diffInDays) < 1) {
          const diffInHours = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60));
          return rtf.format(diffInHours, 'hour');
        }

        return rtf.format(diffInDays, 'day');
      },

      // Number formatting
      formatNumber: (number: number, options?: Intl.NumberFormatOptions) => {
        return new Intl.NumberFormat(locale, options).format(number);
      },

      // Currency formatting
      formatCurrency: (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
        }).format(amount);
      },

      // List formatting
      formatList: (items: string[], options?: Intl.ListFormatOptions) => {
        return new Intl.ListFormat(locale, options).format(items);
      },

      // Properties
      locale,
      dateFormat,
      isRTL: isRTL(locale),
    };
  }, [locale]);
}

/**
 * Hook for RTL-aware styling
 */
export function useRTLStyles() {
  const locale = useLocale();

  return useMemo(() => {
    const rtl = isRTL(locale);
    const logical = getLogicalProperties(locale);
    const classes = getReadingDirectionClasses(locale);

    return {
      isRTL: rtl,
      direction: rtl ? 'rtl' : 'ltr',

      // CSS-in-JS helpers
      style: {
        textAlign: rtl ? 'right' : 'left',
        direction: rtl ? 'rtl' : 'ltr',
      },

      // Logical properties
      logical,

      // Tailwind classes
      classes: {
        ...classes,
        // Direction-aware Flexbox
        flexRow: rtl ? 'flex-row-reverse' : 'flex-row',
        justifyStart: rtl ? 'justify-end' : 'justify-start',
        justifyEnd: rtl ? 'justify-start' : 'justify-end',

        // Border
        borderStart: rtl ? 'border-r' : 'border-l',
        borderEnd: rtl ? 'border-l' : 'border-r',

        // Positioning
        left: rtl ? 'right-0' : 'left-0',
        right: rtl ? 'left-0' : 'right-0',
      },
    };
  }, [locale]);
}
