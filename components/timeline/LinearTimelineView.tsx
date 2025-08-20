'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GlassButton } from '@/components/glass';
import { ChevronLeft, ChevronRight, Calendar, ZoomIn, ZoomOut } from 'lucide-react';

interface LinearTimelineViewProps {
  year?: number;
  events?: any[];
  className?: string;
  onDateClick?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
  dayWidth?: number;
}

const MONTHS = [
  { name: 'JANUARY', short: 'JAN', days: 31 },
  { name: 'FEBRUARY', short: 'FEB', days: 28 }, // Will adjust for leap years
  { name: 'MARCH', short: 'MAR', days: 31 },
  { name: 'APRIL', short: 'APR', days: 30 },
  { name: 'MAY', short: 'MAY', days: 31 },
  { name: 'JUNE', short: 'JUN', days: 30 },
  { name: 'JULY', short: 'JUL', days: 31 },
  { name: 'AUGUST', short: 'AUG', days: 31 },
  { name: 'SEPTEMBER', short: 'SEP', days: 30 },
  { name: 'OCTOBER', short: 'OCT', days: 31 },
  { name: 'NOVEMBER', short: 'NOV', days: 30 },
  { name: 'DECEMBER', short: 'DEC', days: 31 }
];

export function LinearTimelineView({
  year = new Date().getFullYear(),
  events = [],
  className,
  onDateClick,
  onEventClick,
  dayWidth: initialDayWidth = 45
}: LinearTimelineViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [dayWidth, setDayWidth] = useState(initialDayWidth); // Controlled from parent
  const [viewportPosition, setViewportPosition] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  
  // Check if leap year
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const monthsData = MONTHS.map((m, i) => ({
    ...m,
    days: i === 1 && isLeapYear ? 29 : m.days
  }));
  
  // Calculate total days
  const totalDays = monthsData.reduce((sum, m) => sum + m.days, 0);
  const totalWidth = totalDays * dayWidth;
  
  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const percentage = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
    setViewportPosition(Math.min(100, Math.max(0, percentage)));
  }, []);
  
  // Zoom controls with minimum touch-friendly size
  const handleZoomIn = () => setDayWidth(Math.min(100, dayWidth + 10));
  const handleZoomOut = () => setDayWidth(Math.max(30, dayWidth - 10)); // Minimum 30px for touch
  
  // Navigate to today
  const navigateToToday = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const today = new Date();
    const dayOfYear = getDayOfYear(today);
    const scrollPosition = dayOfYear * dayWidth - (scrollContainerRef.current.clientWidth / 2);
    scrollContainerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
  }, [dayWidth]);
  
  // Get day of year
  const getDayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };
  
  // Get event density for heat map
  const getEventDensity = (month: number, day: number) => {
    const date = new Date(year, month, day);
    const dayEvents = events.filter(e => {
      const eventDate = new Date(e.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
    return dayEvents.length;
  };
  
  // Get heat map color - Enhanced visibility for better event discovery
  const getHeatMapColor = (density: number) => {
    if (density === 0) return '';
    // More visible opacity levels for better event discovery
    const intensities = [
      'rgba(33, 150, 243, 0.2)',  // 1 event
      'rgba(33, 150, 243, 0.35)', // 2 events
      'rgba(33, 150, 243, 0.5)',  // 3 events
      'rgba(33, 150, 243, 0.65)', // 4 events
      'rgba(33, 150, 243, 0.8)',  // 5+ events
    ];
    return intensities[Math.min(density - 1, 4)];
  };
  
  // Navigate to today on mount
  useEffect(() => {
    if (new Date().getFullYear() === year) {
      navigateToToday();
    }
  }, [year, navigateToToday]);
  
  // Update dayWidth when prop changes
  useEffect(() => {
    setDayWidth(initialDayWidth);
  }, [initialDayWidth]);
  
  // Drag-to-scroll handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only start drag if not clicking on a day cell
    if ((e.target as HTMLElement).closest('[role="gridcell"]')) {
      return;
    }
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      scrollLeft: scrollContainerRef.current?.scrollLeft || 0
    });
    
    // Change cursor
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grabbing';
      scrollContainerRef.current.style.userSelect = 'none';
    }
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    e.preventDefault();
    const dx = e.clientX - dragStart.x;
    scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - dx;
  }, [isDragging, dragStart]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    
    // Reset cursor
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'default';
      scrollContainerRef.current.style.userSelect = 'auto';
    }
  }, []);
  
  // Add global mouse up listener
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => handleMouseUp();
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging, handleMouseUp]);

  return (
    <div className={cn('relative flex flex-col h-full', className)}>
      {/* Header Controls */}
      <div className="glass rounded-glass p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold bg-gradient-to-r from-glass-accent to-glass-secondary bg-clip-text text-transparent">
            LINEAR CALENDAR {year}
          </h2>
          <div className="flex items-center gap-1">
            <GlassButton size="sm" variant="ghost">
              <ChevronLeft className="h-4 w-4" />
            </GlassButton>
            <GlassButton size="sm" variant="ghost">
              <ChevronRight className="h-4 w-4" />
            </GlassButton>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <GlassButton size="sm" variant="secondary" onClick={navigateToToday}>
            <Calendar className="h-4 w-4 mr-1" />
            Today
          </GlassButton>
          <div className="flex items-center gap-1">
            <GlassButton size="sm" variant="ghost" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </GlassButton>
            <span className="text-xs px-2">{dayWidth}px</span>
            <GlassButton size="sm" variant="ghost" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </GlassButton>
          </div>
        </div>
      </div>
      
      {/* Main Calendar Container */}
      <div className="flex-1 glass rounded-glass overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className={cn(
            "h-full overflow-x-auto overflow-y-auto custom-scrollbar smooth-scroll",
            isDragging && "cursor-grabbing"
          )}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ 
            scrollBehavior: isDragging ? 'auto' : 'smooth', 
            WebkitOverflowScrolling: 'touch',
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          {/* Calendar Table Structure */}
          <div className="min-w-fit" role="grid" aria-label={`Calendar for year ${year}`}>
            {monthsData.map((month, monthIndex) => (
              <div key={monthIndex} className="flex border-b border-glass-border/20 h-16" role="row">
                {/* Month Label - Enhanced visibility */}
                <div className="sticky left-0 z-20 w-24 min-w-[96px] glass-heavy border-r border-glass-border/30 flex flex-col items-center justify-center bg-glass-primary/10" role="rowheader" aria-label={`${month.name} ${year}`}>
                  <div className="text-base font-extrabold text-white drop-shadow-md tracking-wider">{month.short}</div>
                  <div className="flex gap-px mt-1" aria-hidden="true">
                    <div className="w-1 h-3 bg-glass-accent/60 rounded-sm"></div>
                    <div className="w-1 h-3 bg-glass-accent/40 rounded-sm"></div>
                    <div className="w-1 h-3 bg-glass-accent/20 rounded-sm"></div>
                  </div>
                </div>
                
                {/* Days Container - Horizontally scrolling */}
                <div className="flex flex-nowrap">
                  {Array.from({ length: month.days }, (_, dayIndex) => {
                    const day = dayIndex + 1;
                    const date = new Date(year, monthIndex, day);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const density = getEventDensity(monthIndex, day);
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    
                    return (
                      <div
                        key={day}
                        className={cn(
                          'border-r border-glass-border/10 cursor-pointer transition-all duration-200 relative flex-shrink-0',
                          'hover:bg-glass-accent/10 hover:scale-105 hover:z-10',
                          isWeekend && 'bg-glass-secondary/5',
                          isToday && 'ring-2 ring-glass-accent ring-inset bg-glass-accent/5',
                          isSelected && 'bg-glass-accent/20 shadow-lg',
                          density > 0 && 'border-l-2 border-l-glass-primary/30'
                        )}
                        style={{ 
                          width: `${dayWidth}px`,
                          minWidth: `${dayWidth}px`,
                          height: '100%'
                        }}
                        onClick={() => {
                          setSelectedDate(date);
                          onDateClick?.(date);
                        }}
                        title={`${date.toLocaleDateString()} - ${density} events`}
                        role="gridcell"
                        tabIndex={0}
                        aria-label={`${date.toLocaleDateString()}, ${density} ${density === 1 ? 'event' : 'events'}`}
                        aria-selected={isSelected}
                        aria-current={isToday ? 'date' : undefined}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedDate(date);
                            onDateClick?.(date);
                          }
                        }}
                      >
                        {/* Background Heat Map - Enhanced for better event discovery */}
                        {density > 0 && (
                          <div 
                            className="absolute inset-0 rounded-sm"
                            style={{ 
                              background: getHeatMapColor(density),
                              boxShadow: density > 2 ? 'inset 0 0 8px rgba(33, 150, 243, 0.3)' : 'none'
                            }}
                          />
                        )}
                        
                        {/* Day Number - Enhanced visibility */}
                        {dayWidth >= 18 && (
                          <div className={cn(
                            'absolute top-1 left-1 text-xs font-semibold z-10',
                            'drop-shadow-md',
                            isToday ? 'text-glass-accent font-bold text-sm' : 
                            density > 2 ? 'text-white' : 'text-oklch-gray-200'
                          )}>
                            {day}
                          </div>
                        )}
                        
                        {/* Event Indicators - Small Dots for Narrow Days */}
                        {density > 0 && dayWidth < 30 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {Array.from({ length: Math.min(density, 3) }, (_, i) => (
                              <div key={i} className={cn(
                                'w-1 h-1 rounded-full',
                                i === 0 && 'bg-glass-primary',
                                i === 1 && 'bg-glass-accent', 
                                i === 2 && 'bg-glass-secondary'
                              )} />
                            ))}
                            {density > 3 && (
                              <div className="text-xs text-glass-accent font-bold ml-0.5">+</div>
                            )}
                          </div>
                        )}
                        
                        {/* Event Count - Clear Text for Wide Days */}
                        {density > 0 && dayWidth >= 30 && (
                          <div className={cn(
                            'absolute bottom-1 right-1 text-xs font-medium px-1 py-0.5 rounded',
                            'bg-glass-primary/80 text-white shadow-sm',
                            density > 5 && 'bg-glass-accent/80',
                            density > 10 && 'bg-glass-secondary/80'
                          )}>
                            {density}
                          </div>
                        )}
                        
                        {/* Today Indicator */}
                        {isToday && (
                          <div className="absolute top-0 left-0 w-2 h-2 bg-glass-accent rounded-br-lg opacity-80" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Viewport Indicator */}
      <div className="glass rounded-glass p-2 mt-2">
        <div className="relative h-3 bg-glass-primary/10 rounded-full overflow-hidden">
          {/* Month Divisions */}
          <div className="absolute inset-0 flex">
            {monthsData.map((month, i) => (
              <div 
                key={i}
                className="border-r border-glass-border/20 last:border-0 flex items-center justify-center"
                style={{ width: `${(month.days / totalDays) * 100}%` }}
              >
                {(month.days / totalDays) * 100 > 6 && (
                  <span className="text-xs text-glass-accent/60 font-medium">
                    {month.short}
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {/* Current Viewport */}
          <div 
            className="absolute top-0 h-full bg-gradient-to-r from-glass-accent/80 to-glass-secondary/80 rounded-full transition-all duration-300 shadow-sm"
            style={{ 
              left: `${viewportPosition}%`,
              width: `${Math.min(25, Math.max(5, scrollContainerRef.current ? (scrollContainerRef.current.clientWidth / totalWidth) * 100 : 15))}%`
            }}
          />
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-oklch-gray-500">
          <span>Scroll Position: {Math.round(viewportPosition)}%</span>
          <span>Day Width: {dayWidth}px</span>
        </div>
      </div>
    </div>
  );
}