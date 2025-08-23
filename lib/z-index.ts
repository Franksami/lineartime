// Centralized Z-Index Management System for LinearCalendar
// Fixes overlapping UI issues reported by user

import React from 'react'

export const CALENDAR_LAYERS = {
  // Base layers (Foundation)
  GRID: 0,
  EVENTS: 1,
  EVENT_RESIZE: 2,
  SELECTED_EVENT: 3,
  
  // Interaction layers
  DRAG_PREVIEW: 10,
  DROP_ZONES: 11,
  CREATING_EVENT: 12,
  
  // UI layers (Fix overlapping issues)
  FLOATING_TOOLBAR: 20,
  COLOR_PICKER: 30,
  DROPDOWN_MENU: 31,
  CONTEXT_MENU: 32,
  
  // Overlay layers
  TOOLTIP: 40,
  POPOVER: 41,
  HOVER_CARD: 42,
  
  // Modal layers
  DIALOG: 50,
  COMMAND_BAR: 51,
  AI_ASSISTANT: 52,
  
  // System layers
  TOAST: 60,
  NOTIFICATION: 61,
  MOBILE_MENU: 62,
  
  // Critical system layers
  ERROR_BOUNDARY: 70,
  LOADING_OVERLAY: 71
} as const;

export type CalendarLayer = typeof CALENDAR_LAYERS[keyof typeof CALENDAR_LAYERS];

// Helper function to get z-index value
export const getZIndex = (layer: keyof typeof CALENDAR_LAYERS): number => {
  return CALENDAR_LAYERS[layer];
};

// Helper function to create z-index style
export const zIndexStyle = (layer: keyof typeof CALENDAR_LAYERS) => ({
  zIndex: CALENDAR_LAYERS[layer]
});

// CSS class names for Tailwind (to be added to tailwind.config.js)
export const Z_INDEX_CLASSES = {
  'z-calendar-grid': CALENDAR_LAYERS.GRID,
  'z-calendar-events': CALENDAR_LAYERS.EVENTS,
  'z-calendar-drag': CALENDAR_LAYERS.DRAG_PREVIEW,
  'z-calendar-toolbar': CALENDAR_LAYERS.FLOATING_TOOLBAR,
  'z-calendar-dropdown': CALENDAR_LAYERS.DROPDOWN_MENU,
  'z-calendar-tooltip': CALENDAR_LAYERS.TOOLTIP,
  'z-calendar-modal': CALENDAR_LAYERS.DIALOG,
  'z-calendar-command': CALENDAR_LAYERS.COMMAND_BAR,
  'z-calendar-toast': CALENDAR_LAYERS.TOAST,
} as const;

// Debug utility to visualize z-index hierarchy
export const debugZIndex = () => {
  if (typeof window === 'undefined') return;
  
  const elements = document.querySelectorAll('*');
  const stackingContexts: Array<{
    element: string;
    zIndex: string;
    position: string;
    layer?: string;
  }> = [];
  
  elements.forEach(el => {
    const styles = getComputedStyle(el);
    const zIndex = styles.zIndex;
    const position = styles.position;
    
    if (zIndex !== 'auto' || position !== 'static') {
      // Find matching layer
      const layerName = Object.entries(CALENDAR_LAYERS).find(
        ([, value]) => value === parseInt(zIndex)
      )?.[0];
      
      stackingContexts.push({
        element: el.className || el.tagName,
        zIndex,
        position,
        layer: layerName
      });
    }
  });
  
  console.table(
    stackingContexts.sort((a, b) => 
      parseInt(a.zIndex || '0') - parseInt(b.zIndex || '0')
    )
  );
};

// Component wrapper to enforce z-index isolation
export const CalendarLayerProvider = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        isolation: 'isolate', // Creates new stacking context
        zIndex: CALENDAR_LAYERS.GRID 
      }}
    >
      {children}
    </div>
  );
};