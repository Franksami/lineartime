/**
 * Settings and Preferences Type Definitions
 * Defines the structure for user settings stored in LocalStorage
 */

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  highContrast: boolean;
  reducedMotion: boolean;
  colorScheme: 'default' | 'blue' | 'green' | 'purple' | 'orange';
  fontSize: 'small' | 'medium' | 'large';
}

export interface CalendarSettings {
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  defaultView: 'year' | 'timeline' | 'manage';
  showWeekNumbers: boolean;
  showWeekends: boolean;
  calendarDayStyle: 'number' | 'dot'; // Display style for day cells
  showDaysLeft: boolean; // Show days remaining counter in dot mode
  eventDefaultDuration: number; // in minutes
  workingHours: {
    enabled: boolean;
    start: string; // "09:00"
    end: string; // "17:00"
    days: number[]; // [1,2,3,4,5] for Mon-Fri
  };
  defaultEventCategory: 'personal' | 'work' | 'effort' | 'note';
}

export interface TimeSettings {
  format: '12h' | '24h';
  timezone: string; // IANA timezone identifier
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  firstDayOfYear: 'january1' | 'fiscalYear' | 'custom';
  fiscalYearStart?: string; // "04-01" for April 1st
}

export interface NotificationSettings {
  enabled: boolean;
  eventReminders: boolean;
  reminderMinutes: number[]; // [5, 15, 30, 60] minutes before event
  sound: boolean;
  soundVolume: number; // 0-1, default 0.3
  soundTypes: {
    success: boolean; // Event creation, updates
    error: boolean; // Failures, sync errors
    notification: boolean; // Sync complete, reminders
  };
  desktop: boolean;
  email: boolean;
  dailyDigest: boolean;
  dailyDigestTime: string; // "08:00"
}

export interface KeyboardShortcuts {
  enabled: boolean;
  customBindings: Record<string, string>;
  defaultBindings: {
    newEvent: string; // "n" or "cmd+n"
    search: string; // "/" or "cmd+k"
    toggleView: string; // "v"
    nextPeriod: string; // "j" or "ArrowRight"
    prevPeriod: string; // "k" or "ArrowLeft"
    today: string; // "t"
    delete: string; // "Delete" or "Backspace"
    escape: string; // "Escape"
    save: string; // "cmd+s" or "ctrl+s"
    settings: string; // ","
  };
}

export interface PrivacySettings {
  analytics: boolean;
  crashReports: boolean;
  usageData: boolean;
}

export interface UserSettings {
  version: number; // Schema version for migrations
  appearance: AppearanceSettings;
  calendar: CalendarSettings;
  time: TimeSettings;
  notifications: NotificationSettings;
  shortcuts: KeyboardShortcuts;
  privacy: PrivacySettings;
  lastUpdated: string; // ISO timestamp
}

// Default settings factory
export const createDefaultSettings = (): UserSettings => ({
  version: 1,
  appearance: {
    theme: 'system',
    highContrast: false,
    reducedMotion: false,
    colorScheme: 'default',
    fontSize: 'medium',
  },
  calendar: {
    weekStartsOn: 0, // Sunday
    defaultView: 'year',
    showWeekNumbers: false,
    showWeekends: true,
    calendarDayStyle: 'dot', // Default to dot view
    showDaysLeft: true, // Show days left counter in dot mode
    eventDefaultDuration: 60,
    workingHours: {
      enabled: false,
      start: '09:00',
      end: '17:00',
      days: [1, 2, 3, 4, 5], // Mon-Fri
    },
    defaultEventCategory: 'personal',
  },
  time: {
    format: '12h',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    firstDayOfYear: 'january1',
  },
  notifications: {
    enabled: false,
    eventReminders: true,
    reminderMinutes: [15],
    sound: false,
    soundVolume: 0.3,
    soundTypes: {
      success: true,
      error: true,
      notification: true,
    },
    desktop: false,
    email: false,
    dailyDigest: false,
    dailyDigestTime: '08:00',
  },
  shortcuts: {
    enabled: true,
    customBindings: {},
    defaultBindings: {
      newEvent: 'n',
      search: '/',
      toggleView: 'v',
      nextPeriod: 'j',
      prevPeriod: 'k',
      today: 't',
      delete: 'Delete',
      escape: 'Escape',
      save: 'cmd+s',
      settings: ',',
    },
  },
  privacy: {
    analytics: false,
    crashReports: false,
    usageData: false,
  },
  lastUpdated: new Date().toISOString(),
});

// Type guards
export const isValidTheme = (theme: string): theme is AppearanceSettings['theme'] =>
  ['light', 'dark', 'system'].includes(theme);

export const isValidTimeFormat = (format: string): format is TimeSettings['format'] =>
  ['12h', '24h'].includes(format);

export const isValidDateFormat = (format: string): format is TimeSettings['dateFormat'] =>
  ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(format);

export const isValidCalendarView = (view: string): view is CalendarSettings['defaultView'] =>
  ['year', 'timeline', 'manage'].includes(view);

export const isValidCalendarDayStyle = (
  style: string
): style is CalendarSettings['calendarDayStyle'] => ['number', 'dot'].includes(style);
