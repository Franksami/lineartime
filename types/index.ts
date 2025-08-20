// Base types for LinearTime

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  allDay?: boolean;
  color?: string;
  categoryId?: string;
  recurrence?: RecurrenceRule;
  reminders?: Reminder[];
  attendees?: string[];
  location?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  count?: number;
  until?: Date;
  byDay?: string[];
  byMonth?: number[];
  byMonthDay?: number[];
}

export interface Reminder {
  type: 'notification' | 'email';
  minutesBefore: number;
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  userId: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  timeFormat: '12' | '24';
  timezone: string;
  defaultEventDuration: number; // in minutes
  defaultReminders: Reminder[];
  weekendDays: number[];
  workingHours: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}

export type ZoomLevel = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour';

export interface ViewState {
  currentDate: Date;
  zoomLevel: ZoomLevel;
  scrollPosition: number;
  selectedEventId?: string;
}

// LinearTime calendar-specific types
export interface CalendarDay {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  events: TimelineEvent[];
  eventDensity: number; // 0-1 scale for heatmap visualization
}

export interface MonthData {
  month: number; // 0-11
  year: number;
  name: string;
  abbreviation: string;
  days: CalendarDay[];
  totalEvents: number;
}

export interface YearViewData {
  year: number;
  months: MonthData[];
  totalEvents: number;
  maxEventsPerDay: number;
}

export interface CalendarViewport {
  startDate: Date;
  endDate: Date;
  visibleMonths: number[];
  scrollProgress: number; // 0-1
}

export interface NavigatorData {
  year: number;
  monthSummaries: Array<{
    month: number;
    eventCount: number;
    density: number;
  }>;
  currentViewport: CalendarViewport;
}