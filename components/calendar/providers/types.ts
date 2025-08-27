export type CalendarLibrary =
  | 'linear' // LinearCalendarHorizontal (foundation)
  | 'fullcalendar' // FullCalendar Pro
  | 'toastui' // Toast UI Calendar
  | 'reactbigcalendar' // React Big Calendar
  | 'reactinfinite' // React Infinite Calendar
  | 'primereact' // PrimeReact Calendar
  | 'muix' // MUI X Date Pickers
  | 'reactcalendar' // React Calendar
  | 'reactdatepicker' // React DatePicker
  | 'reactdaypicker'; // React Day Picker

export type CalendarView =
  | 'day'
  | 'week'
  | 'month'
  | 'year'
  | 'agenda'
  | 'timeline'
  | 'progress'
  | 'linear';

export type CalendarTheme = 'light' | 'dark' | 'auto' | 'custom';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  recurring?: boolean;
  recurringPattern?: string;
  location?: string;
  attendees?: string[];
  url?: string;
  editable?: boolean;
  deletable?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  resourceId?: string;
  extendedProps?: Record<string, any>;

  // Toast UI Calendar specific properties
  isPrivate?: boolean;
  isPending?: boolean;
  isFocused?: boolean;
  isReadOnly?: boolean;
  isVisible?: boolean;
  state?: 'Busy' | 'Free';
  dragBackgroundColor?: string;
  goingDuration?: number;
  comingDuration?: number;
  calendarId?: string;
  recurrenceRule?: string;
  customStyle?: React.CSSProperties;
  raw?: any;
  completed?: boolean;
}

export interface CalendarLibraryConfig {
  name: string;
  displayName: string;
  version: string;
  features: {
    views: CalendarView[];
    eventCrud: boolean;
    dragDrop: boolean;
    resize: boolean;
    recurring: boolean;
    timezone: boolean;
    resources: boolean;
    print: boolean;
    export: boolean;
    accessibility: boolean;
    mobile: boolean;
  };
  performance: {
    virtualScrolling: boolean;
    lazyLoading: boolean;
    maxEvents: number;
    renderTime: number; // in ms
  };
  styling: {
    themes: CalendarTheme[];
    customizable: boolean;
    cssOverrides: boolean;
    responsive: boolean;
  };
}

export interface CalendarProviderProps {
  children: React.ReactNode;
  initialLibrary?: CalendarLibrary;
  initialView?: CalendarView;
  initialDate?: Date;
  initialTheme?: CalendarTheme;
}

export interface CalendarContextType {
  // Library management
  selectedLibrary: CalendarLibrary;
  switchLibrary: (library: CalendarLibrary) => void;

  // View management
  currentView: CalendarView;
  switchView: (view: CalendarView) => void;

  // Date management
  selectedDate: Date;
  navigateToDate: (date: Date) => void;

  // Theme management
  theme: CalendarTheme;
  switchTheme: (theme: CalendarTheme) => void;

  // Event management
  events: CalendarEvent[];
  onEventCreate: (event: Partial<CalendarEvent>) => Promise<void>;
  onEventUpdate: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  onEventDelete: (eventId: string) => Promise<void>;
  loading: boolean;

  // Sync management
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncCalendar: (providerId: string) => Promise<void>;
  providers: any[];
}

export interface CalendarViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onEventCreate: (event: Partial<CalendarEvent>) => Promise<void>;
  onEventUpdate: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  onEventDelete: (eventId: string) => Promise<void>;
  onDateChange: (date: Date) => void;
  theme: CalendarTheme;
  loading?: boolean;
  className?: string;
}

export interface CalendarLibraryAdapter {
  component: React.ComponentType<CalendarViewProps>;
  config: CalendarLibraryConfig;
  transformEvents: (events: CalendarEvent[]) => any;
  transformEventBack: (event: any) => CalendarEvent;
  formatDate: (date: Date) => any;
  parseDate: (date: any) => Date;
}

// Event transformation utilities
export interface EventTransformOptions {
  library: CalendarLibrary;
  theme: CalendarTheme;
  view: CalendarView;
}
