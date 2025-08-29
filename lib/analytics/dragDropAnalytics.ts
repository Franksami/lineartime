/**
 * Drag & Drop Analytics Tracking System
 * Tracks user interaction patterns with drag-and-drop functionality
 */

export interface DragDropEvent {
  id: string;
  timestamp: Date;
  eventType: 'drag_start' | 'drag_end' | 'drop_success' | 'drop_cancel' | 'drag_hover';
  eventId: string;
  eventTitle: string;
  sourceDate: Date;
  targetDate?: Date;
  duration: number; // milliseconds
  category: string;
  aiSuggestionUsed?: boolean;
  conflictResolved?: boolean;
  optimizedTimeSlot?: boolean;
}

export interface DragDropMetrics {
  totalDragOperations: number;
  successfulDrops: number;
  cancelledDrags: number;
  averageDragDuration: number;
  mostDraggedCategory: string;
  aiSuggestionUsageRate: number;
  conflictResolutionRate: number;
  optimizationAcceptanceRate: number;
  dragsByDayOfWeek: Record<string, number>;
  dragsByTimeOfDay: Record<string, number>;
  dragEfficiencyScore: number;
}

export interface DragDropHeatmapData {
  date: string;
  dragCount: number;
  successRate: number;
  averageDuration: number;
}

class DragDropAnalytics {
  private events: DragDropEvent[] = [];
  private currentDragStart: number | null = null;
  private currentEventId: string | null = null;

  // Storage key for persisting analytics data
  private readonly STORAGE_KEY = 'lineartime_dragdrop_analytics';

  constructor() {
    // Only load from storage on client-side
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * Track the start of a drag operation
   */
  trackDragStart(eventId: string, eventTitle: string, sourceDate: Date, category: string): void {
    this.currentDragStart = Date.now();
    this.currentEventId = eventId;

    const dragEvent: DragDropEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      eventType: 'drag_start',
      eventId,
      eventTitle,
      sourceDate,
      duration: 0,
      category,
    };

    this.events.push(dragEvent);
    this.saveToStorage();
  }

  /**
   * Track a successful drop operation
   */
  trackDropSuccess(
    eventId: string,
    eventTitle: string,
    sourceDate: Date,
    targetDate: Date,
    category: string,
    options: {
      aiSuggestionUsed?: boolean;
      conflictResolved?: boolean;
      optimizedTimeSlot?: boolean;
    } = {}
  ): void {
    const duration = this.currentDragStart ? Date.now() - this.currentDragStart : 0;

    const dropEvent: DragDropEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      eventType: 'drop_success',
      eventId,
      eventTitle,
      sourceDate,
      targetDate,
      duration,
      category,
      ...options,
    };

    this.events.push(dropEvent);
    this.currentDragStart = null;
    this.currentEventId = null;
    this.saveToStorage();
  }

  /**
   * Track a cancelled drag operation
   */
  trackDragCancel(eventId: string, eventTitle: string, sourceDate: Date, category: string): void {
    const duration = this.currentDragStart ? Date.now() - this.currentDragStart : 0;

    const cancelEvent: DragDropEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      eventType: 'drop_cancel',
      eventId,
      eventTitle,
      sourceDate,
      duration,
      category,
    };

    this.events.push(cancelEvent);
    this.currentDragStart = null;
    this.currentEventId = null;
    this.saveToStorage();
  }

  /**
   * Track drag hover events (for heatmap data)
   */
  trackDragHover(
    eventId: string,
    eventTitle: string,
    sourceDate: Date,
    targetDate: Date,
    category: string
  ): void {
    // Only track hover events every 100ms to avoid spam
    if (this.currentDragStart && Date.now() - this.currentDragStart > 100) {
      const hoverEvent: DragDropEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        eventType: 'drag_hover',
        eventId,
        eventTitle,
        sourceDate,
        targetDate,
        duration: Date.now() - this.currentDragStart,
        category,
      };

      this.events.push(hoverEvent);
    }
  }

  /**
   * Generate comprehensive drag & drop metrics
   */
  generateMetrics(startDate?: Date, endDate?: Date): DragDropMetrics {
    const filteredEvents = this.filterEventsByDateRange(startDate, endDate);

    const dragStarts = filteredEvents.filter((e) => e.eventType === 'drag_start');
    const successfulDrops = filteredEvents.filter((e) => e.eventType === 'drop_success');
    const cancelledDrags = filteredEvents.filter((e) => e.eventType === 'drop_cancel');

    // Calculate averages and rates
    const totalDragOperations = dragStarts.length;
    const successRate = totalDragOperations > 0 ? successfulDrops.length / totalDragOperations : 0;
    const averageDragDuration = this.calculateAverageDuration(
      successfulDrops.concat(cancelledDrags)
    );

    // AI suggestion metrics
    const dropsWithAI = successfulDrops.filter((e) => e.aiSuggestionUsed);
    const aiSuggestionUsageRate =
      successfulDrops.length > 0 ? dropsWithAI.length / successfulDrops.length : 0;

    // Conflict resolution metrics
    const dropsWithConflicts = successfulDrops.filter((e) => e.conflictResolved);
    const conflictResolutionRate =
      successfulDrops.length > 0 ? dropsWithConflicts.length / successfulDrops.length : 0;

    // Optimization metrics
    const dropsWithOptimization = successfulDrops.filter((e) => e.optimizedTimeSlot);
    const optimizationAcceptanceRate =
      successfulDrops.length > 0 ? dropsWithOptimization.length / successfulDrops.length : 0;

    // Category analysis
    const categoryStats = this.calculateCategoryStats(successfulDrops);
    const mostDraggedCategory = categoryStats.length > 0 ? categoryStats[0].category : 'none';

    // Time-based analysis
    const dragsByDayOfWeek = this.calculateDragsByDayOfWeek(successfulDrops);
    const dragsByTimeOfDay = this.calculateDragsByTimeOfDay(successfulDrops);

    // Efficiency score (0-100): success rate * average optimization acceptance
    const dragEfficiencyScore = Math.round(successRate * optimizationAcceptanceRate * 100);

    return {
      totalDragOperations,
      successfulDrops: successfulDrops.length,
      cancelledDrags: cancelledDrags.length,
      averageDragDuration,
      mostDraggedCategory,
      aiSuggestionUsageRate,
      conflictResolutionRate,
      optimizationAcceptanceRate,
      dragsByDayOfWeek,
      dragsByTimeOfDay,
      dragEfficiencyScore,
    };
  }

  /**
   * Generate heatmap data for calendar visualization
   */
  generateHeatmapData(startDate?: Date, endDate?: Date): DragDropHeatmapData[] {
    const filteredEvents = this.filterEventsByDateRange(startDate, endDate);
    const dropEvents = filteredEvents.filter(
      (e) => e.eventType === 'drop_success' || e.eventType === 'drop_cancel'
    );

    // Group by date
    const dateGroups = dropEvents.reduce(
      (acc, event) => {
        const dateKey = event.timestamp.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(event);
        return acc;
      },
      {} as Record<string, DragDropEvent[]>
    );

    // Calculate metrics per date
    return Object.entries(dateGroups).map(([date, events]) => {
      const successfulDrops = events.filter((e) => e.eventType === 'drop_success');
      const successRate = events.length > 0 ? successfulDrops.length / events.length : 0;
      const averageDuration = this.calculateAverageDuration(events);

      return {
        date,
        dragCount: events.length,
        successRate,
        averageDuration,
      };
    });
  }

  /**
   * Get recent drag & drop activity for quick insights
   */
  getRecentActivity(hours = 24): DragDropEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.events
      .filter((e) => e.timestamp >= cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear all analytics data (useful for testing or privacy)
   */
  clearData(): void {
    this.events = [];
    this.currentDragStart = null;
    this.currentEventId = null;

    // Only clear storage on client-side
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Export analytics data as JSON
   */
  exportData(): string {
    return JSON.stringify(
      {
        events: this.events,
        generatedAt: new Date().toISOString(),
        version: '1.0',
      },
      null,
      2
    );
  }

  // Private helper methods
  private filterEventsByDateRange(startDate?: Date, endDate?: Date): DragDropEvent[] {
    if (!startDate && !endDate) return this.events;

    return this.events.filter((event) => {
      if (startDate && event.timestamp < startDate) return false;
      if (endDate && event.timestamp > endDate) return false;
      return true;
    });
  }

  private calculateAverageDuration(events: DragDropEvent[]): number {
    if (events.length === 0) return 0;
    const totalDuration = events.reduce((sum, event) => sum + event.duration, 0);
    return Math.round(totalDuration / events.length);
  }

  private calculateCategoryStats(
    events: DragDropEvent[]
  ): Array<{ category: string; count: number }> {
    const categoryCount = events.reduce(
      (acc, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateDragsByDayOfWeek(events: DragDropEvent[]): Record<string, number> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCount = days.reduce((acc, day) => ({ ...acc, [day]: 0 }), {});

    events.forEach((event) => {
      const dayName = days[event.timestamp.getDay()];
      dayCount[dayName]++;
    });

    return dayCount;
  }

  private calculateDragsByTimeOfDay(events: DragDropEvent[]): Record<string, number> {
    const timeSlots = {
      'Morning (6-12)': 0,
      'Afternoon (12-17)': 0,
      'Evening (17-22)': 0,
      'Night (22-6)': 0,
    };

    events.forEach((event) => {
      const hour = event.timestamp.getHours();
      if (hour >= 6 && hour < 12) timeSlots['Morning (6-12)']++;
      else if (hour >= 12 && hour < 17) timeSlots['Afternoon (12-17)']++;
      else if (hour >= 17 && hour < 22) timeSlots['Evening (17-22)']++;
      else timeSlots['Night (22-6)']++;
    });

    return timeSlots;
  }

  private saveToStorage(): void {
    // Only save to storage on client-side
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
      } catch (error) {
        console.warn('Failed to save drag & drop analytics to localStorage:', error);
      }
    }
  }

  private loadFromStorage(): void {
    // Only load from storage on client-side
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.events = parsed.map((event: any) => ({
            ...event,
            timestamp: new Date(event.timestamp),
            sourceDate: new Date(event.sourceDate),
            targetDate: event.targetDate ? new Date(event.targetDate) : undefined,
          }));
        }
      } catch (error) {
        console.warn('Failed to load drag & drop analytics from localStorage:', error);
        this.events = [];
      }
    }
  }
}

// Export singleton instance
export const dragDropAnalytics = new DragDropAnalytics();

// Export hooks for React components
export function useDragDropAnalytics() {
  return {
    trackDragStart: dragDropAnalytics.trackDragStart.bind(dragDropAnalytics),
    trackDropSuccess: dragDropAnalytics.trackDropSuccess.bind(dragDropAnalytics),
    trackDragCancel: dragDropAnalytics.trackDragCancel.bind(dragDropAnalytics),
    trackDragHover: dragDropAnalytics.trackDragHover.bind(dragDropAnalytics),
    generateMetrics: dragDropAnalytics.generateMetrics.bind(dragDropAnalytics),
    generateHeatmapData: dragDropAnalytics.generateHeatmapData.bind(dragDropAnalytics),
    getRecentActivity: dragDropAnalytics.getRecentActivity.bind(dragDropAnalytics),
    clearData: dragDropAnalytics.clearData.bind(dragDropAnalytics),
    exportData: dragDropAnalytics.exportData.bind(dragDropAnalytics),
  };
}
