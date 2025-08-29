// Linear Calendar specific types following the design specification

export type EventCategory = 'personal' | 'work' | 'effort' | 'note' | 'meeting' | 'deadline' | 'milestone';
export type EventPriority = 'critical' | 'high' | 'medium' | 'low' | 'optional';
export type EventStatus = 'tentative' | 'confirmed' | 'cancelled';
export type ViewMode = 'full' | 'compact';
export type ZoomLevel = 'compact' | 'standard' | 'expanded';
export type DisplayMode = 'all' | 'conflicts' | 'free-time';

// Core Event interface following PRD specification
export interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  category: EventCategory;
  priority?: EventPriority;
  color?: string;
  description?: string;
  recurring?: RecurrenceRule;
  status?: EventStatus;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

// Date range for selection
export interface DateRange {
  start: Date;
  end: Date;
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

// Filter state for the filter panel
export interface FilterState {
  personal: boolean;
  work: boolean;
  efforts: boolean;
  notes: boolean;
}

// View options for calendar display
export interface ViewOptions {
  showWeekends: boolean;
  showToday: boolean;
  compactMode: boolean;
}

// Calendar state management
export interface CalendarState {
  currentYear: number;
  events: Map<string, Event[]>;
  filters: FilterState;
  viewMode: ViewMode;
  viewOptions: ViewOptions;
  selectedDates: Set<string>;
  hoveredDate: Date | null;
  selectedRange: DateRange | null;
  reflections: Reflection[];
}

// Reflection data structure
export interface Reflection {
  id: string;
  date: Date;
  prompts: {
    clustered: string;
    reschedule: string;
    missing: string;
  };
  createdAt: Date;
}

// Props interfaces for each component
export interface CommandCenterCalendarGridProps {
  year: number;
  events: Event[];
  selectedDateRange?: DateRange;
  onDateSelect: (date: Date) => void;
  onDateRangeSelect: (range: DateRange) => void;
  filters: FilterState;
  viewOptions: ViewOptions;
  className?: string;
}

export interface MonthRowProps {
  month: number;
  year: number;
  events: Map<string, Event[]>;
  selectedDates: Set<string>;
  selectedRange: DateRange | null;
  hoveredDate: Date | null;
  onDateSelect: (date: Date) => void;
  onDateHover: (date: Date | null) => void;
  onEventClick: (event: Event) => void;
  className?: string;
}

export interface DayCellProps {
  date: Date;
  dayNumber: number;
  events: Event[];
  isSelected: boolean;
  isInRange: boolean;
  isToday: boolean;
  isHovered: boolean;
  isCurrentMonth: boolean;
  isWeekend?: boolean;
  onSelect?: (date: Date) => void;
  onHover?: (date: Date | null) => void;
  onEventClick?: (event: Event) => void;
  className?: string;
}

export interface EventBarProps {
  type: EventCategory;
  duration: number;
  startOffset: number;
  title: string;
  color: string;
  onClick?: () => void;
  className?: string;
}

export interface FilterPanelProps {
  filters: FilterState;
  viewOptions: ViewOptions;
  onFilterChange: (filters: FilterState) => void;
  onViewOptionsChange: (options: ViewOptions) => void;
  className?: string;
}

// Day cell visual states
export interface DayCellState {
  hasEvents: boolean;
  hasOverlap: boolean;
  isHovered: boolean;
  isSelected: boolean;
  eventCount: number;
}

// Event category colors following PRD specification
export const EVENT_COLORS: Record<EventCategory, string> = {
  personal: '#4CAF50',    // Green
  work: '#2196F3',        // Blue
  effort: '#FF9800',      // Orange
  note: '#9C27B0',        // Purple
  meeting: '#00BCD4',     // Cyan
  deadline: '#F44336',    // Red
  milestone: '#9C27B0',   // Deep Purple
};

// Category colors for the new category tag manager
export const CATEGORY_COLORS: Record<EventCategory, string> = {
  personal: 'hsl(var(--chart-4))',
  work: 'hsl(var(--chart-1))',
  effort: 'hsl(var(--chart-3))',
  note: 'hsl(var(--chart-5))',
  meeting: 'hsl(var(--chart-2))',
  deadline: 'hsl(var(--destructive))',
  milestone: 'hsl(var(--chart-1))',
};

// Calendar theme colors following PRD design spec
export const CALENDAR_COLORS = {
  background: '#F5F2ED',         // Warm beige
  gridLines: '#E0D9D1',         // Subtle borders
  text: '#2C2825',              // Dark brown
  todayHighlight: '#FFE4B5',    // Soft yellow
  selectedOutline: '#2196F3',   // Blue outline
  selectedBackground: '#E3F2FD', // Light blue background
  hoverBorder: '#B8A798',       // Darker border on hover
  rangeBackground: '#F5F5F5',   // Light gray for range
  conflict: '#EF4444',          // Red for overlaps
} as const;

// Calendar cell dimensions following PRD specification
export const CELL_DIMENSIONS = {
  desktop: { width: 40, height: 36 },
  tablet: { width: 30, height: 36 },
  mobile: { width: 20, height: 36 },
} as const;

// Typography sizes
export const TYPOGRAPHY_SIZES = {
  yearTitle: 24,
  monthLabel: 16,
  dayNumber: 11,
  dayHeader: 10,
} as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;

export const WEEKDAY_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
] as const;

export const WEEKDAY_ABBREVIATIONS = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
] as const;
