import { useState, useCallback, useEffect } from 'react'
import type { Event, FilterState } from '@/types/calendar'

interface CalendarRange {
  from: Date
  to: Date
}

export function useLinearCalendar(year: number) {
  const [events, setEvents] = useState<Event[]>([])
  const [filters, setFilters] = useState<FilterState>({
    personal: true,
    work: true,
    efforts: true,
    notes: true
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedRange, setSelectedRange] = useState<CalendarRange | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full')
  const [showEventModal, setShowEventModal] = useState(false)
  const [showReflectionModal, setShowReflectionModal] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)

  // Load events from localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem(`events-${year}`)
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents)
        setEvents(parsed.map((e: Event) => ({
          ...e,
          startDate: new Date(e.startDate),
          endDate: new Date(e.endDate)
        })))
      } catch (error) {
        console.error('Failed to load events:', error)
        setEvents(generateSampleEvents(year))
      }
    } else {
      // Load sample events
      setEvents(generateSampleEvents(year))
    }
  }, [year])

  // Save events to localStorage
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem(`events-${year}`, JSON.stringify(events))
    }
  }, [events, year])

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setSelectedRange(null)
    setCurrentEvent(null)
    setShowEventModal(true)
  }, [])

  const handleRangeSelect = useCallback((range: CalendarRange) => {
    setSelectedRange(range)
    setSelectedDate(null)
    setCurrentEvent(null)
    setShowEventModal(true)
  }, [])

  const handleEventSave = useCallback((event: Partial<Event>) => {
    if (event.id) {
      // Update existing event
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, ...event } as Event : e))
    } else {
      // Add new event
      const newEvent: Event = {
        id: crypto.randomUUID(),
        title: event.title || '',
        startDate: event.startDate || new Date(),
        endDate: event.endDate || new Date(),
        category: event.category || 'personal',
        description: event.description
      }
      setEvents(prev => [...prev, newEvent])
    }
  }, [])

  const handleEventDelete = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])

  const handleFilterChange = useCallback((newFilters: FilterState | { viewOptions: { compactMode: boolean } }) => {
    if ('viewOptions' in newFilters && newFilters.viewOptions) {
      setViewMode(newFilters.viewOptions.compactMode ? 'compact' : 'full')
    }
    if ('personal' in newFilters) {
      setFilters(newFilters as FilterState)
    }
  }, [])

  const startSelection = useCallback((date: Date) => {
    setIsSelecting(true)
    setSelectionStart(date)
    setSelectedDate(null)
    setSelectedRange(null)
  }, [])

  const updateSelection = useCallback((date: Date) => {
    if (isSelecting && selectionStart) {
      setSelectedRange({
        from: selectionStart < date ? selectionStart : date,
        to: selectionStart > date ? selectionStart : date
      })
    }
  }, [isSelecting, selectionStart])

  const endSelection = useCallback(() => {
    if (isSelecting && selectedRange) {
      setIsSelecting(false)
      setSelectionStart(null)
      setCurrentEvent(null)
      setShowEventModal(true)
    }
  }, [isSelecting, selectedRange])

  const scrollToToday = useCallback((scrollArea: HTMLDivElement | null) => {
    if (!scrollArea) return
    
    const today = new Date()
    const monthIndex = today.getMonth()
    const dayOfMonth = today.getDate()
    
    // Calculate approximate scroll position
    const cellWidth = viewMode === 'compact' ? 30 : 40
    let scrollPosition = 0
    
    // Add up days from previous months
    for (let i = 0; i < monthIndex; i++) {
      const daysInMonth = new Date(year, i + 1, 0).getDate()
      scrollPosition += daysInMonth * cellWidth
    }
    
    // Add days from current month
    scrollPosition += (dayOfMonth - 15) * cellWidth // Center the current day
    
    // Find the scroll container and scroll
    const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollContainer) {
      scrollContainer.scrollLeft = Math.max(0, scrollPosition)
    }
  }, [year, viewMode])

  const checkForOverlaps = useCallback((start: Date, end: Date, excludeId?: string) => {
    return events.filter(event => {
      if (excludeId && event.id === excludeId) return false
      
      // Check if the date ranges overlap
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      
      return (
        (start <= eventEnd && end >= eventStart) ||
        (eventStart <= end && eventEnd >= start)
      )
    })
  }, [events])

  return {
    events,
    filters,
    selectedDate,
    selectedRange,
    hoveredDate,
    isSelecting,
    selectionStart,
    viewMode,
    showEventModal,
    showReflectionModal,
    currentEvent,
    handleDateSelect,
    handleRangeSelect,
    handleEventSave,
    handleEventDelete,
    handleFilterChange,
    setHoveredDate,
    setShowEventModal,
    setShowReflectionModal,
    setCurrentEvent,
    startSelection,
    updateSelection,
    endSelection,
    scrollToToday,
    checkForOverlaps
  }
}

// Generate sample events for demonstration
function generateSampleEvents(year: number): Event[] {
  return [
    {
      id: '1',
      title: 'New Year Planning',
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 0, 5),
      category: 'personal',
      description: 'Annual goal setting and planning'
    },
    {
      id: '2',
      title: 'Q1 Sprint',
      startDate: new Date(year, 0, 8),
      endDate: new Date(year, 0, 26),
      category: 'work',
      description: 'First quarter development sprint'
    },
    {
      id: '3',
      title: 'Fitness Challenge',
      startDate: new Date(year, 0, 15),
      endDate: new Date(year, 1, 15),
      category: 'effort',
      description: '30-day fitness transformation'
    },
    {
      id: '4',
      title: 'Conference',
      startDate: new Date(year, 2, 10),
      endDate: new Date(year, 2, 12),
      category: 'work',
      description: 'Annual tech conference'
    },
    {
      id: '5',
      title: 'Vacation',
      startDate: new Date(year, 5, 15),
      endDate: new Date(year, 5, 25),
      category: 'personal',
      description: 'Summer vacation'
    },
    {
      id: '6',
      title: 'Product Launch',
      startDate: new Date(year, 8, 1),
      endDate: new Date(year, 8, 3),
      category: 'work',
      description: 'Major product release'
    },
    {
      id: '7',
      title: 'Learning Sprint',
      startDate: new Date(year, 9, 10),
      endDate: new Date(year, 9, 20),
      category: 'effort',
      description: 'Intensive learning period'
    },
    {
      id: '8',
      title: 'Year Review',
      startDate: new Date(year, 11, 26),
      endDate: new Date(year, 11, 31),
      category: 'note',
      description: 'Annual review and reflection'
    }
  ]
}