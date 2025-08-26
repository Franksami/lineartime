'use client';

import React, { lazy } from 'react';
import { CalendarLibrary, CalendarLibraryAdapter, CalendarLibraryConfig, CalendarEvent } from './types';

// Lazy load all calendar components for performance
const LinearCalendarHorizontal = lazy(() => 
  import('@/components/calendar/LinearCalendarHorizontal').then(module => ({
    default: module.LinearCalendarHorizontal
  }))
);

const FullCalendarView = lazy(() => 
  import('@/components/calendar/FullCalendarView').then(module => ({
    default: module.default
  }))
);


const ReactBigCalendarView = lazy(() => 
  import('@/components/calendar/ReactBigCalendarView').then(module => ({
    default: module.default
  }))
);

const ReactInfiniteCalendarView = lazy(() => 
  import('@/components/calendar/ReactInfiniteCalendarView').then(module => ({
    default: module.default
  }))
);

const PrimeReactCalendarView = lazy(() => 
  import('@/components/calendar/PrimeReactCalendarView').then(module => ({
    default: module.default
  }))
);

const MUIXCalendarView = lazy(() => 
  import('@/components/calendar/MUIXCalendarView').then(module => ({
    default: module.default
  }))
);

const ReactCalendarView = lazy(() => 
  import('@/components/calendar/ReactCalendarView').then(module => ({
    default: module.default
  }))
);

const ReactDatePickerView = lazy(() => 
  import('@/components/calendar/ReactDatePickerView').then(module => ({
    default: module.default
  }))
);

const ReactDayPickerView = lazy(() => 
  import('@/components/calendar/ReactDayPickerView').then(module => ({
    default: module.default
  }))
);

const ToastUICalendarView = lazy(() => 
  import('@/components/calendar/ToastUICalendarView').then(module => ({
    default: module.default
  }))
);

// Library configurations
const libraryConfigs: Record<CalendarLibrary, CalendarLibraryConfig> = {
  linear: {
    name: 'linear',
    displayName: 'Linear Calendar Horizontal',
    version: '3.0.0',
    features: {
      views: ['year', 'linear'],
      eventCrud: true,
      dragDrop: true,
      resize: true,
      recurring: true,
      timezone: false,
      resources: false,
      print: true,
      export: true,
      accessibility: true,
      mobile: true,
    },
    performance: {
      virtualScrolling: true,
      lazyLoading: true,
      maxEvents: 10000,
      renderTime: 150,
    },
    styling: {
      themes: ['light', 'dark', 'auto', 'custom'],
      customizable: true,
      cssOverrides: true,
      responsive: true,
    },
  },
  fullcalendar: {
    name: 'fullcalendar',
    displayName: 'FullCalendar Pro',
    version: '6.1.19',
    features: {
      views: ['day', 'week', 'month', 'agenda', 'timeline'],
      eventCrud: true,
      dragDrop: true,
      resize: true,
      recurring: true,
      timezone: true,
      resources: true,
      print: true,
      export: true,
      accessibility: true,
      mobile: true,
    },
    performance: {
      virtualScrolling: true,
      lazyLoading: true,
      maxEvents: 50000,
      renderTime: 100,
    },
    styling: {
      themes: ['light', 'dark', 'auto', 'custom'],
      customizable: true,
      cssOverrides: true,
      responsive: true,
    },
  },
  reactbigcalendar: {
    name: 'reactbigcalendar',
    displayName: 'React Big Calendar',
    version: '1.15.0',
    features: {
      views: ['day', 'week', 'month', 'agenda'],
      eventCrud: true,
      dragDrop: true,
      resize: true,
      recurring: false,
      timezone: false,
      resources: true,
      print: false,
      export: false,
      accessibility: true,
      mobile: false,
    },
    performance: {
      virtualScrolling: false,
      lazyLoading: false,
      maxEvents: 3000,
      renderTime: 250,
    },
    styling: {
      themes: ['light', 'dark', 'custom'],
      customizable: true,
      cssOverrides: true,
      responsive: false,
    },
  },
  reactinfinite: {
    name: 'reactinfinite',
    displayName: 'React Infinite Calendar',
    version: '2.3.1',
    features: {
      views: ['month', 'year'],
      eventCrud: false,
      dragDrop: false,
      resize: false,
      recurring: false,
      timezone: false,
      resources: false,
      print: false,
      export: false,
      accessibility: false,
      mobile: true,
    },
    performance: {
      virtualScrolling: true,
      lazyLoading: true,
      maxEvents: 1000,
      renderTime: 100,
    },
    styling: {
      themes: ['light', 'dark', 'custom'],
      customizable: true,
      cssOverrides: true,
      responsive: true,
    },
  },
  primereact: {
    name: 'primereact',
    displayName: 'PrimeReact Calendar',
    version: '10.9.7',
    features: {
      views: ['day', 'month'],
      eventCrud: false,
      dragDrop: false,
      resize: false,
      recurring: false,
      timezone: false,
      resources: false,
      print: false,
      export: false,
      accessibility: true,
      mobile: true,
    },
    performance: {
      virtualScrolling: false,
      lazyLoading: false,
      maxEvents: 500,
      renderTime: 150,
    },
    styling: {
      themes: ['light', 'dark', 'auto', 'custom'],
      customizable: true,
      cssOverrides: true,
      responsive: true,
    },
  },
  muix: {
    name: 'muix',
    displayName: 'MUI X Date Pickers',
    version: '8.10.2',
    features: {
      views: ['day', 'month', 'year'],
      eventCrud: false,
      dragDrop: false,
      resize: false,
      recurring: false,
      timezone: true,
      resources: false,
      print: false,
      export: false,
      accessibility: true,
      mobile: true,
    },
    performance: {
      virtualScrolling: false,
      lazyLoading: false,
      maxEvents: 100,
      renderTime: 50,
    },
    styling: {
      themes: ['light', 'dark', 'auto', 'custom'],
      customizable: true,
      cssOverrides: true,
      responsive: true,
    },
  },
  reactcalendar: {
    name: 'reactcalendar',
    displayName: 'React Calendar',
    version: '6.0.0',
    features: {
      views: ['month', 'year'],
      eventCrud: false,
      dragDrop: false,
      resize: false,
      recurring: false,
      timezone: false,
      resources: false,
      print: false,
      export: false,
      accessibility: true,
      mobile: true,
    },
    performance: {
      virtualScrolling: false,
      lazyLoading: false,
      maxEvents: 100,
      renderTime: 75,
    },
    styling: {
      themes: ['light', 'dark', 'custom'],
      customizable: true,
      cssOverrides: true,
      responsive: true,
    },
  },
  reactdatepicker: {
    name: 'reactdatepicker',
    displayName: 'React DatePicker',
    version: '8.7.0',
    features: {
      views: ['day', 'month', 'year'],
      eventCrud: false,
      dragDrop: false,
      resize: false,
      recurring: false,
      timezone: false,
      resources: false,
      print: false,
      export: false,
      accessibility: true,
      mobile: true,
    },
    performance: {
      virtualScrolling: false,
      lazyLoading: false,
      maxEvents: 50,
      renderTime: 50,
    },
    styling: {
      themes: ['light', 'dark', 'custom'],
      customizable: true,
      cssOverrides: true,
      responsive: true,
    },
  },
  reactdaypicker: {
    name: 'reactdaypicker',
    displayName: 'React Day Picker',
    version: '9.9.0',
    features: {
      views: ['day', 'month'],
      eventCrud: false,
      dragDrop: false,
      resize: false,
      recurring: false,
      timezone: false,
      resources: false,
      print: false,
      export: false,
      accessibility: true,
      mobile: true,
    },
    performance: {
      virtualScrolling: false,
      lazyLoading: false,
      maxEvents: 100,
      renderTime: 75,
    },
    styling: {
      themes: ['light', 'dark', 'auto', 'custom'],
      customizable: true,
      cssOverrides: true,
      responsive: true,
    },
  },
  toastui: {
    name: 'toastui',
    displayName: 'Toast UI Calendar',
    version: '2.1.3',
    features: {
      views: ['day', 'week', 'month'],
      eventCrud: true,
      dragDrop: true,
      resize: true,
      recurring: true,
      timezone: true,
      resources: false,
      print: true,
      export: true,
      accessibility: true,
      mobile: true,
    },
    performance: {
      virtualScrolling: false,
      lazyLoading: true,
      maxEvents: 5000,
      renderTime: 120,
    },
    styling: {
      themes: ['light', 'dark', 'auto', 'custom'],
      customizable: true,
      cssOverrides: true,
      responsive: true,
    },
  },
};

// Event transformation utilities
const transformEventsForLibrary = (events: CalendarEvent[], library: CalendarLibrary): any => {
  switch (library) {
    case 'linear':
      return events; // Already in correct format
    
    case 'fullcalendar':
      return events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        textColor: event.textColor,
        editable: event.editable,
        extendedProps: {
          description: event.description,
          category: event.category,
          priority: event.priority,
          ...event.extendedProps,
        },
      }));
    
    case 'reactbigcalendar':
      return events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        resource: event.resourceId,
        color: event.backgroundColor,
      }));
    
    case 'toastui':
      return events.map(event => ({
        id: event.id,
        calendarId: event.category || 'primary',
        title: event.title,
        body: event.description,
        start: event.start,
        end: event.end,
        category: event.allDay ? 'allday' : 'time',
        isAllday: event.allDay,
        location: event.location,
        attendees: event.attendees,
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        color: event.textColor,
        dragBackgroundColor: event.backgroundColor,
        isReadOnly: !event.editable,
        isPrivate: event.isPrivate,
        state: 'Busy'
      }));
    
    default:
      return events;
  }
};

const transformEventBackFromLibrary = (event: any, library: CalendarLibrary): CalendarEvent => {
  const baseEvent: CalendarEvent = {
    id: event.id || '',
    title: event.title || '',
    start: event.start,
    end: event.end,
    allDay: event.allDay || false,
  };

  switch (library) {
    case 'fullcalendar':
      return {
        ...baseEvent,
        description: event.extendedProps?.description,
        category: event.extendedProps?.category,
        priority: event.extendedProps?.priority,
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        textColor: event.textColor,
        editable: event.editable,
        extendedProps: event.extendedProps,
      };
    
    case 'reactbigcalendar':
      return {
        ...baseEvent,
        resourceId: event.resource,
        backgroundColor: event.color,
      };
    
    case 'toastui':
      return {
        ...baseEvent,
        description: event.body,
        category: event.calendarId,
        location: event.location,
        attendees: event.attendees,
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        textColor: event.color,
        editable: !event.isReadOnly,
        isPrivate: event.isPrivate,
        allDay: event.isAllday,
      };
    
    default:
      return baseEvent;
  }
};

// Calendar adapters registry
export const calendarAdapters: Record<CalendarLibrary, CalendarLibraryAdapter> = {
  linear: {
    component: LinearCalendarHorizontal as any,
    config: libraryConfigs.linear,
    transformEvents: (events) => transformEventsForLibrary(events, 'linear'),
    transformEventBack: (event) => transformEventBackFromLibrary(event, 'linear'),
    formatDate: (date) => date,
    parseDate: (date) => date,
  },
  fullcalendar: {
    component: FullCalendarView as any,
    config: libraryConfigs.fullcalendar,
    transformEvents: (events) => transformEventsForLibrary(events, 'fullcalendar'),
    transformEventBack: (event) => transformEventBackFromLibrary(event, 'fullcalendar'),
    formatDate: (date) => date.toISOString(),
    parseDate: (date) => new Date(date),
  },
  toastui: {
    component: ToastUICalendarView as any,
    config: libraryConfigs.toastui,
    transformEvents: (events) => transformEventsForLibrary(events, 'toastui'),
    transformEventBack: (event) => transformEventBackFromLibrary(event, 'toastui'),
    formatDate: (date) => date,
    parseDate: (date) => date,
  },
  reactbigcalendar: {
    component: ReactBigCalendarView as any,
    config: libraryConfigs.reactbigcalendar,
    transformEvents: (events) => transformEventsForLibrary(events, 'reactbigcalendar'),
    transformEventBack: (event) => transformEventBackFromLibrary(event, 'reactbigcalendar'),
    formatDate: (date) => date,
    parseDate: (date) => date,
  },
  reactinfinite: {
    component: ReactInfiniteCalendarView as any,
    config: libraryConfigs.reactinfinite,
    transformEvents: (events) => transformEventsForLibrary(events, 'reactinfinite'),
    transformEventBack: (event) => transformEventBackFromLibrary(event, 'reactinfinite'),
    formatDate: (date) => date,
    parseDate: (date) => date,
  },
  primereact: {
    component: PrimeReactCalendarView as any,
    config: libraryConfigs.primereact,
    transformEvents: (events) => transformEventsForLibrary(events, 'primereact'),
    transformEventBack: (event) => transformEventBackFromLibrary(event, 'primereact'),
    formatDate: (date) => date,
    parseDate: (date) => date,
  },
  muix: {
    component: MUIXCalendarView as any,
    config: libraryConfigs.muix,
    transformEvents: (events) => transformEventsForLibrary(events, 'muix'),
    transformEventBack: (event) => transformEventBackFromLibrary(event, 'muix'),
    formatDate: (date) => date,
    parseDate: (date) => date,
  },
  reactcalendar: {
    component: ReactCalendarView as any,
    config: libraryConfigs.reactcalendar,
    transformEvents: (events) => transformEventsForLibrary(events, 'reactcalendar'),
    transformEventBack: (event) => transformEventBackFromLibrary(event, 'reactcalendar'),
    formatDate: (date) => date,
    parseDate: (date) => date,
  },
  reactdatepicker: {
    component: ReactDatePickerView as any,
    config: libraryConfigs.reactdatepicker,
    transformEvents: (events) => transformEventsForLibrary(events, 'reactdatepicker'),
    transformEventBack: (event) => transformEventBackFromLibrary(event, 'reactdatepicker'),
    formatDate: (date) => date,
    parseDate: (date) => date,
  },
  reactdaypicker: {
    component: ReactDayPickerView as any,
    config: libraryConfigs.reactdaypicker,
    transformEvents: (events) => transformEventsForLibrary(events, 'reactdaypicker'),
    transformEventBack: (event) => transformEventBackFromLibrary(event, 'reactdaypicker'),
    formatDate: (date) => date,
    parseDate: (date) => date,
  },
};

// Helper functions
export function getCalendarAdapter(library: CalendarLibrary): CalendarLibraryAdapter {
  return calendarAdapters[library];
}

export function getSupportedLibraries(): CalendarLibrary[] {
  return Object.keys(calendarAdapters) as CalendarLibrary[];
}

export function getLibraryConfig(library: CalendarLibrary): CalendarLibraryConfig {
  return libraryConfigs[library];
}

export function isLibrarySupported(library: string): library is CalendarLibrary {
  return library in calendarAdapters;
}