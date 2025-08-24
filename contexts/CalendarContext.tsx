'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type { Event } from '@/types/calendar'
import type { ZoomLevel } from '@/components/calendar/ZoomControls'

// Calendar State Interface
export interface CalendarState {
  // View State
  year: number
  zoomLevel: ZoomLevel
  
  // Selection State
  selectedDate: Date | null
  selectedEvent: Event | null
  hoveredDate: Date | null
  focusedDate: Date | null
  
  // UI State
  showEventModal: boolean
  showFloatingToolbar: boolean
  toolbarPosition: { x: number; y: number } | null
  keyboardMode: boolean
  announceMessage: string
  
  // Interaction State
  isDraggingEvent: boolean
  draggedEvent: Event | null
  isResizingEvent: boolean
  resizingEvent: Event | null
  resizeDirection: 'start' | 'end' | null
  
  // Mobile State
  isMobileMenuOpen: boolean
  
  // Performance State
  isVirtualizing: boolean
  visibleRange: { start: number; end: number } | null
}

// Calendar Actions
export type CalendarAction =
  | { type: 'SET_YEAR'; payload: number }
  | { type: 'SET_ZOOM_LEVEL'; payload: ZoomLevel }
  | { type: 'SET_SELECTED_DATE'; payload: Date | null }
  | { type: 'SET_SELECTED_EVENT'; payload: Event | null }
  | { type: 'SET_HOVERED_DATE'; payload: Date | null }
  | { type: 'SET_FOCUSED_DATE'; payload: Date | null }
  | { type: 'SHOW_EVENT_MODAL'; payload?: boolean }
  | { type: 'HIDE_EVENT_MODAL' }
  | { type: 'SHOW_FLOATING_TOOLBAR'; payload: { x: number; y: number } }
  | { type: 'HIDE_FLOATING_TOOLBAR' }
  | { type: 'SET_KEYBOARD_MODE'; payload: boolean }
  | { type: 'ANNOUNCE_MESSAGE'; payload: string }
  | { type: 'START_DRAG_EVENT'; payload: Event }
  | { type: 'END_DRAG_EVENT' }
  | { type: 'START_RESIZE_EVENT'; payload: { event: Event; direction: 'start' | 'end' } }
  | { type: 'END_RESIZE_EVENT' }
  | { type: 'SET_MOBILE_MENU_OPEN'; payload: boolean }
  | { type: 'SET_VIRTUALIZING'; payload: boolean }
  | { type: 'SET_VISIBLE_RANGE'; payload: { start: number; end: number } | null }
  | { type: 'RESET_SELECTION' }
  | { type: 'BATCH_UPDATE'; payload: Partial<CalendarState> }

// Initial State
const initialState: CalendarState = {
  year: new Date().getFullYear(),
  zoomLevel: 'fullYear',
  selectedDate: null,
  selectedEvent: null,
  hoveredDate: null,
  focusedDate: null,
  showEventModal: false,
  showFloatingToolbar: false,
  toolbarPosition: null,
  keyboardMode: false,
  announceMessage: '',
  isDraggingEvent: false,
  draggedEvent: null,
  isResizingEvent: false,
  resizingEvent: null,
  resizeDirection: null,
  isMobileMenuOpen: false,
  isVirtualizing: false,
  visibleRange: null,
}

// Calendar Reducer
function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'SET_YEAR':
      return {
        ...state,
        year: action.payload,
        // Reset selection when changing year
        selectedDate: null,
        selectedEvent: null,
        focusedDate: null,
      }
      
    case 'SET_ZOOM_LEVEL':
      return {
        ...state,
        zoomLevel: action.payload,
        // Close mobile menu when zoom changes
        isMobileMenuOpen: false,
      }
      
    case 'SET_SELECTED_DATE':
      return {
        ...state,
        selectedDate: action.payload,
        // Clear event selection when selecting date
        selectedEvent: action.payload ? null : state.selectedEvent,
        showFloatingToolbar: false,
        toolbarPosition: null,
      }
      
    case 'SET_SELECTED_EVENT':
      return {
        ...state,
        selectedEvent: action.payload,
        // Clear date selection when selecting event
        selectedDate: action.payload ? null : state.selectedDate,
      }
      
    case 'SET_HOVERED_DATE':
      return {
        ...state,
        hoveredDate: action.payload,
      }
      
    case 'SET_FOCUSED_DATE':
      return {
        ...state,
        focusedDate: action.payload,
      }
      
    case 'SHOW_EVENT_MODAL':
      return {
        ...state,
        showEventModal: action.payload !== false,
        // Hide floating toolbar when modal opens
        showFloatingToolbar: false,
        toolbarPosition: null,
      }
      
    case 'HIDE_EVENT_MODAL':
      return {
        ...state,
        showEventModal: false,
      }
      
    case 'SHOW_FLOATING_TOOLBAR':
      return {
        ...state,
        showFloatingToolbar: true,
        toolbarPosition: action.payload,
        // Hide modal when toolbar shows
        showEventModal: false,
      }
      
    case 'HIDE_FLOATING_TOOLBAR':
      return {
        ...state,
        showFloatingToolbar: false,
        toolbarPosition: null,
        selectedEvent: null,
      }
      
    case 'SET_KEYBOARD_MODE':
      return {
        ...state,
        keyboardMode: action.payload,
        // Set focus to today when entering keyboard mode
        focusedDate: action.payload && !state.focusedDate ? new Date() : state.focusedDate,
      }
      
    case 'ANNOUNCE_MESSAGE':
      return {
        ...state,
        announceMessage: action.payload,
      }
      
    case 'START_DRAG_EVENT':
      return {
        ...state,
        isDraggingEvent: true,
        draggedEvent: action.payload,
        // Hide toolbar during drag
        showFloatingToolbar: false,
        toolbarPosition: null,
      }
      
    case 'END_DRAG_EVENT':
      return {
        ...state,
        isDraggingEvent: false,
        draggedEvent: null,
      }
      
    case 'START_RESIZE_EVENT':
      return {
        ...state,
        isResizingEvent: true,
        resizingEvent: action.payload.event,
        resizeDirection: action.payload.direction,
        // Hide toolbar during resize
        showFloatingToolbar: false,
        toolbarPosition: null,
      }
      
    case 'END_RESIZE_EVENT':
      return {
        ...state,
        isResizingEvent: false,
        resizingEvent: null,
        resizeDirection: null,
      }
      
    case 'SET_MOBILE_MENU_OPEN':
      return {
        ...state,
        isMobileMenuOpen: action.payload,
      }
      
    case 'SET_VIRTUALIZING':
      return {
        ...state,
        isVirtualizing: action.payload,
      }
      
    case 'SET_VISIBLE_RANGE':
      return {
        ...state,
        visibleRange: action.payload,
      }
      
    case 'RESET_SELECTION':
      return {
        ...state,
        selectedDate: null,
        selectedEvent: null,
        hoveredDate: null,
        showEventModal: false,
        showFloatingToolbar: false,
        toolbarPosition: null,
      }
      
    case 'BATCH_UPDATE':
      return {
        ...state,
        ...action.payload,
      }
      
    default:
      return state
  }
}

// Calendar Context
interface CalendarContextType {
  state: CalendarState
  dispatch: React.Dispatch<CalendarAction>
  
  // Convenience action creators
  setYear: (year: number) => void
  setZoomLevel: (level: ZoomLevel) => void
  selectDate: (date: Date | null) => void
  selectEvent: (event: Event | null) => void
  setHoveredDate: (date: Date | null) => void
  showEventModal: (show?: boolean) => void
  hideEventModal: () => void
  showFloatingToolbar: (position: { x: number; y: number }) => void
  hideFloatingToolbar: () => void
  announceMessage: (message: string) => void
  startDragEvent: (event: Event) => void
  endDragEvent: () => void
  startResizeEvent: (event: Event, direction: 'start' | 'end') => void
  endResizeEvent: () => void
  resetSelection: () => void
  batchUpdate: (updates: Partial<CalendarState>) => void
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

// Calendar Provider
interface CalendarProviderProps {
  children: React.ReactNode
  initialYear?: number
  initialZoomLevel?: ZoomLevel
}

export function CalendarProvider({ 
  children, 
  initialYear = new Date().getFullYear(),
  initialZoomLevel = 'fullYear'
}: CalendarProviderProps) {
  const [state, dispatch] = useReducer(calendarReducer, {
    ...initialState,
    year: initialYear,
    zoomLevel: initialZoomLevel,
  })
  
  // Convenience action creators
  const setYear = useCallback((year: number) => {
    dispatch({ type: 'SET_YEAR', payload: year })
  }, [])
  
  const setZoomLevel = useCallback((level: ZoomLevel) => {
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: level })
  }, [])
  
  const selectDate = useCallback((date: Date | null) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date })
  }, [])
  
  const selectEvent = useCallback((event: Event | null) => {
    dispatch({ type: 'SET_SELECTED_EVENT', payload: event })
  }, [])
  
  const setHoveredDate = useCallback((date: Date | null) => {
    dispatch({ type: 'SET_HOVERED_DATE', payload: date })
  }, [])
  
  const showEventModal = useCallback((show = true) => {
    dispatch({ type: 'SHOW_EVENT_MODAL', payload: show })
  }, [])
  
  const hideEventModal = useCallback(() => {
    dispatch({ type: 'HIDE_EVENT_MODAL' })
  }, [])
  
  const showFloatingToolbar = useCallback((position: { x: number; y: number }) => {
    dispatch({ type: 'SHOW_FLOATING_TOOLBAR', payload: position })
  }, [])
  
  const hideFloatingToolbar = useCallback(() => {
    dispatch({ type: 'HIDE_FLOATING_TOOLBAR' })
  }, [])
  
  const announceMessage = useCallback((message: string) => {
    dispatch({ type: 'ANNOUNCE_MESSAGE', payload: message })
  }, [])
  
  const startDragEvent = useCallback((event: Event) => {
    dispatch({ type: 'START_DRAG_EVENT', payload: event })
  }, [])
  
  const endDragEvent = useCallback(() => {
    dispatch({ type: 'END_DRAG_EVENT' })
  }, [])
  
  const startResizeEvent = useCallback((event: Event, direction: 'start' | 'end') => {
    dispatch({ type: 'START_RESIZE_EVENT', payload: { event, direction } })
  }, [])
  
  const endResizeEvent = useCallback(() => {
    dispatch({ type: 'END_RESIZE_EVENT' })
  }, [])
  
  const resetSelection = useCallback(() => {
    dispatch({ type: 'RESET_SELECTION' })
  }, [])
  
  const batchUpdate = useCallback((updates: Partial<CalendarState>) => {
    dispatch({ type: 'BATCH_UPDATE', payload: updates })
  }, [])
  
  const contextValue: CalendarContextType = {
    state,
    dispatch,
    setYear,
    setZoomLevel,
    selectDate,
    selectEvent,
    setHoveredDate,
    showEventModal,
    hideEventModal,
    showFloatingToolbar,
    hideFloatingToolbar,
    announceMessage,
    startDragEvent,
    endDragEvent,
    startResizeEvent,
    endResizeEvent,
    resetSelection,
    batchUpdate,
  }
  
  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  )
}

// Custom Hook
export function useCalendarContext() {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error('useCalendarContext must be used within a CalendarProvider')
  }
  return context
}

// Specialized Hooks for specific concerns
export function useCalendarSelection() {
  const { state, selectDate, selectEvent, setHoveredDate, resetSelection } = useCalendarContext()
  return {
    selectedDate: state.selectedDate,
    selectedEvent: state.selectedEvent,
    hoveredDate: state.hoveredDate,
    selectDate,
    selectEvent,
    setHoveredDate,
    resetSelection,
  }
}

export function useCalendarUI() {
  const {
    state,
    showEventModal,
    hideEventModal,
    showFloatingToolbar,
    hideFloatingToolbar,
    announceMessage,
  } = useCalendarContext()
  
  return {
    showEventModal: state.showEventModal,
    showFloatingToolbar: state.showFloatingToolbar,
    toolbarPosition: state.toolbarPosition,
    keyboardMode: state.keyboardMode,
    announceMessage: state.announceMessage,
    isMobileMenuOpen: state.isMobileMenuOpen,
    showEventModal: showEventModal,
    hideEventModal,
    showFloatingToolbar,
    hideFloatingToolbar,
    announceMessage: announceMessage,
  }
}

export function useCalendarInteraction() {
  const {
    state,
    startDragEvent,
    endDragEvent,
    startResizeEvent,
    endResizeEvent,
  } = useCalendarContext()
  
  return {
    isDraggingEvent: state.isDraggingEvent,
    draggedEvent: state.draggedEvent,
    isResizingEvent: state.isResizingEvent,
    resizingEvent: state.resizingEvent,
    resizeDirection: state.resizeDirection,
    startDragEvent,
    endDragEvent,
    startResizeEvent,
    endResizeEvent,
  }
}