import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TimelineState {
  // View state
  currentDate: Date;
  zoomLevel: number; // 1-100
  scrollPosition: { x: number; y: number };
  viewType: 'year' | 'quarter' | 'month' | 'week' | 'day';
  selectedDate?: Date;
  
  // Actions
  setCurrentDate: (date: Date) => void;
  setZoomLevel: (level: number) => void;
  setScrollPosition: (position: { x: number; y: number }) => void;
  setViewType: (type: 'year' | 'quarter' | 'month' | 'week' | 'day') => void;
  setSelectedDate: (date: Date | undefined) => void;
  
  // Computed helpers
  getZoomViewType: () => 'year' | 'quarter' | 'month' | 'week' | 'day';
}

export const useTimelineStore = create<TimelineState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentDate: new Date(),
      zoomLevel: 20, // Start with quarter view
      scrollPosition: { x: 0, y: 0 },
      viewType: 'quarter',
      selectedDate: undefined,
      
      // Actions
      setCurrentDate: (date) => set({ currentDate: date }),
      setZoomLevel: (level) => {
        const clampedLevel = Math.max(1, Math.min(100, level));
        
        // Auto-update view type based on zoom level
        let viewType: TimelineState['viewType'] = 'year';
        if (clampedLevel > 80) viewType = 'day';
        else if (clampedLevel > 60) viewType = 'week';
        else if (clampedLevel > 40) viewType = 'month';
        else if (clampedLevel > 20) viewType = 'quarter';
        
        set({ 
          zoomLevel: clampedLevel,
          viewType 
        });
      },
      setScrollPosition: (position) => set({ scrollPosition: position }),
      setViewType: (type) => set({ viewType: type }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      
      // Computed helpers
      getZoomViewType: () => {
        const { zoomLevel } = get();
        if (zoomLevel > 80) return 'day';
        if (zoomLevel > 60) return 'week';
        if (zoomLevel > 40) return 'month';
        if (zoomLevel > 20) return 'quarter';
        return 'year';
      }
    }),
    {
      name: 'timeline-store'
    }
  )
);