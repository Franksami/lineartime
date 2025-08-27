'use client';

import type { CalendarDimensions, ZoomLevel } from '@/components/ui/calendar';
import { useMemo } from 'react';

export function useCalendarDimensions(zoomLevel: ZoomLevel): CalendarDimensions {
  return useMemo(() => {
    const baseConfig = {
      month: { dayWidth: 120, monthHeight: 80 },
      quarter: { dayWidth: 80, monthHeight: 60 },
      year: { dayWidth: 40, monthHeight: 50 },
      fullYear: { dayWidth: 20, monthHeight: 40 },
    };

    const config = baseConfig[zoomLevel];
    const daysInWeek = 7;
    const monthsInYear = 12;

    const totalWidth = daysInWeek * config.dayWidth;
    const totalHeight = monthsInYear * config.monthHeight;

    return {
      dayWidth: config.dayWidth,
      monthHeight: config.monthHeight,
      totalWidth,
      totalHeight,
    };
  }, [zoomLevel]);
}
