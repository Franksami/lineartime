import type { Event } from '@/types/calendar'
import type { DragDropMetrics, DragDropEvent } from '@/lib/analytics/dragDropAnalytics'

// Export analytics data to CSV format
export function exportAnalyticsToCSV(analytics: any, year: number): void {
  try {
    const csvContent = generateAnalyticsCSV(analytics, year)
    downloadCSV(csvContent, `calendar-analytics-${year}.csv`)
  } catch (error) {
    console.error('Error exporting analytics:', error)
    alert('Error exporting analytics data. Please try again.')
  }
}

// Export events to CSV format  
export function exportEventsToCSV(events: Event[], filename: string = 'calendar-events.csv'): void {
  try {
    const csvContent = generateEventsCSV(events)
    downloadCSV(csvContent, filename)
  } catch (error) {
    console.error('Error exporting events:', error)
    alert('Error exporting events data. Please try again.')
  }
}

// Generate CSV content for analytics data
function generateAnalyticsCSV(analytics: any, year: number): string {
  const headers = ['Metric', 'Value', 'Description']
  const rows = [
    ['Year', year.toString(), `Analytics for ${year}`],
    ['Total Events', analytics.totalEvents.toString(), 'Total number of events created'],
    ['Total Days', analytics.totalDays.toString(), 'Total days with scheduled events'],
    ['Avg Events Per Month', analytics.avgEventsPerMonth.toString(), 'Average events scheduled per month'],
    ['Most Productive Month', analytics.mostProductiveMonth.month, `${analytics.mostProductiveMonth.events} events`],
    ['Productivity Score', `${Math.round((analytics.totalEvents / 365) * 100)}%`, 'Percentage of year with scheduled events'],
    ['', '', ''], // Empty row separator
    ['Category Breakdown', '', ''],
    ...Object.entries(analytics.categoryStats).map(([category, count]) => [
      `Category: ${category}`, 
      (count as number).toString(), 
      `Events in ${category} category`
    ]),
    ['', '', ''], // Empty row separator
    ['Priority Breakdown', '', ''],
    ...Object.entries(analytics.priorityStats).map(([priority, count]) => [
      `Priority: ${priority}`, 
      (count as number).toString(), 
      `Events with ${priority} priority`
    ]),
    ['', '', ''], // Empty row separator
    ['Monthly Distribution', '', ''],
    ...analytics.monthlyStats.map((month: any) => [
      month.month,
      month.events.toString(),
      `${month.days} total days scheduled`
    ])
  ]

  return [headers, ...rows]
    .map(row => row.map((field: string) => `"${field.toString().replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

// Generate CSV content for events data
function generateEventsCSV(events: Event[]): string {
  const headers = [
    'Title',
    'Start Date', 
    'End Date',
    'Category',
    'Priority', 
    'Description',
    'Duration (hours)',
    'All Day',
    'Tags'
  ]
  
  const rows = events.map(event => [
    event.title,
    formatDateForCSV(event.startDate),
    formatDateForCSV(event.endDate),
    event.category || '',
    (event as any).priority || '',
    event.description || '',
    calculateDurationHours(event.startDate, event.endDate).toString(),
    (event as any).allDay ? 'Yes' : 'No',
    ((event as any).tags || []).join('; ')
  ])

  return [headers, ...rows]
    .map(row => row.map((field: string) => `"${field.toString().replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

// Helper function to format date for CSV
function formatDateForCSV(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
}

// Helper function to calculate duration in hours
function calculateDurationHours(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime()
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 // Round to 2 decimal places
}

// Helper function to trigger CSV download
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } else {
    // Fallback for older browsers
    alert('CSV export is not supported in this browser. Please use a modern browser.')
  }
}

// Export analytics report as formatted text (future PDF generation base)
export function generateAnalyticsReport(analytics: any, year: number): string {
  return `
CALENDAR ANALYTICS REPORT
Year: ${year}
Generated: ${new Date().toLocaleDateString()}

=== OVERVIEW ===
Total Events: ${analytics.totalEvents}
Total Days Scheduled: ${analytics.totalDays}
Average Events per Month: ${analytics.avgEventsPerMonth}
Productivity Score: ${Math.round((analytics.totalEvents / 365) * 100)}%

=== TOP INSIGHTS ===
Most Productive Month: ${analytics.mostProductiveMonth.month} (${analytics.mostProductiveMonth.events} events)
Least Productive Month: ${analytics.leastProductiveMonth.month} (${analytics.leastProductiveMonth.events} events)
Year Utilization: ${Math.round((analytics.totalDays / 365) * 100)}% of days scheduled

=== CATEGORY BREAKDOWN ===
${Object.entries(analytics.categoryStats)
  .sort(([,a], [,b]) => (b as number) - (a as number))
  .map(([category, count]) => 
    `${category.charAt(0).toUpperCase() + category.slice(1)}: ${count} events (${Math.round(((count as number) / analytics.totalEvents) * 100)}%)`
  ).join('\n')}

=== PRIORITY DISTRIBUTION ===
${Object.entries(analytics.priorityStats)
  .sort(([,a], [,b]) => (b as number) - (a as number))
  .map(([priority, count]) => 
    `${priority.charAt(0).toUpperCase() + priority.slice(1)}: ${count} events (${Math.round(((count as number) / analytics.totalEvents) * 100)}%)`
  ).join('\n')}

=== MONTHLY ACTIVITY ===
${analytics.monthlyStats
  .filter((month: any) => month.events > 0)
  .map((month: any) => 
    `${month.month}: ${month.events} events, ${month.days} days scheduled`
  ).join('\n')}
`.trim()
}

// ==========================================
// DRAG & DROP ANALYTICS EXPORT FUNCTIONS
// ==========================================

/**
 * Export drag & drop metrics to CSV format
 */
export function exportDragDropMetricsToCSV(metrics: DragDropMetrics, filename: string = 'dragdrop-metrics.csv'): void {
  try {
    const csvContent = generateDragDropMetricsCSV(metrics)
    downloadCSV(csvContent, filename)
  } catch (error) {
    console.error('Error exporting drag & drop metrics:', error)
    alert('Error exporting drag & drop metrics. Please try again.')
  }
}

/**
 * Export detailed drag & drop events to CSV
 */
export function exportDragDropEventsToCSV(events: DragDropEvent[], filename: string = 'dragdrop-events.csv'): void {
  try {
    const csvContent = generateDragDropEventsCSV(events)
    downloadCSV(csvContent, filename)
  } catch (error) {
    console.error('Error exporting drag & drop events:', error)
    alert('Error exporting drag & drop events. Please try again.')
  }
}

/**
 * Export drag & drop analytics as comprehensive JSON
 */
export function exportDragDropToJSON(
  metrics: DragDropMetrics,
  events: DragDropEvent[],
  filename: string = 'dragdrop-analytics.json'
): void {
  try {
    const jsonData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      metrics,
      events: events.map(event => ({
        ...event,
        timestamp: event.timestamp.toISOString(),
        sourceDate: event.sourceDate.toISOString(),
        targetDate: event.targetDate?.toISOString()
      })),
      summary: {
        totalEvents: events.length,
        uniqueEventIds: [...new Set(events.map(e => e.eventId))].length,
        dateRange: {
          earliest: events.length > 0 ? new Date(Math.min(...events.map(e => e.timestamp.getTime()))).toISOString() : null,
          latest: events.length > 0 ? new Date(Math.max(...events.map(e => e.timestamp.getTime()))).toISOString() : null
        }
      }
    }
    
    const jsonString = JSON.stringify(jsonData, null, 2)
    downloadJSON(jsonString, filename)
  } catch (error) {
    console.error('Error exporting drag & drop JSON:', error)
    alert('Error exporting drag & drop data as JSON. Please try again.')
  }
}

/**
 * Export drag & drop metrics as formatted report
 */
export function generateDragDropReport(metrics: DragDropMetrics, events: DragDropEvent[]): string {
  const totalEvents = events.length
  const successfulDrops = events.filter(e => e.eventType === 'drop_success').length
  const cancelledDrags = events.filter(e => e.eventType === 'drop_cancel').length
  
  // Category breakdown from events
  const categoryBreakdown = events.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Performance insights
  const aiUsageRate = Math.round(metrics.aiSuggestionUsageRate * 100)
  const conflictRate = Math.round(metrics.conflictResolutionRate * 100) 
  const optimizationRate = Math.round(metrics.optimizationAcceptanceRate * 100)

  return `
DRAG & DROP ANALYTICS REPORT
Generated: ${new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

=== PERFORMANCE OVERVIEW ===
Total Drag Operations: ${metrics.totalDragOperations}
Successful Drops: ${metrics.successfulDrops}
Cancelled Operations: ${metrics.cancelledDrags}
Success Rate: ${metrics.totalDragOperations > 0 ? Math.round((metrics.successfulDrops / metrics.totalDragOperations) * 100) : 0}%
Average Duration: ${metrics.averageDragDuration}ms
Efficiency Score: ${metrics.dragEfficiencyScore}/100

=== AI INTEGRATION INSIGHTS ===
AI Suggestions Utilized: ${aiUsageRate}% of successful drops
Conflict Resolution: ${conflictRate}% of drops had conflicts resolved
Smart Optimization: ${optimizationRate}% accepted optimized time slots
Most Dragged Category: ${metrics.mostDraggedCategory}

=== USAGE PATTERNS ===
Weekly Activity:
${Object.entries(metrics.dragsByDayOfWeek)
  .sort(([,a], [,b]) => b - a)
  .map(([day, count]) => `  ${day}: ${count} operations`)
  .join('\n')}

Daily Activity:
${Object.entries(metrics.dragsByTimeOfDay)
  .sort(([,a], [,b]) => b - a)
  .map(([time, count]) => `  ${time}: ${count} operations`)
  .join('\n')}

=== CATEGORY BREAKDOWN ===
${Object.entries(categoryBreakdown)
  .sort(([,a], [,b]) => b - a)
  .map(([category, count]) => 
    `${category.charAt(0).toUpperCase() + category.slice(1)}: ${count} operations (${totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0}%)`
  ).join('\n')}

=== RECOMMENDATIONS ===
${generateDragDropRecommendations(metrics, events)}
`.trim()
}

/**
 * Generate intelligent recommendations based on drag & drop patterns
 */
function generateDragDropRecommendations(metrics: DragDropMetrics, events: DragDropEvent[]): string {
  const recommendations = []
  
  if (metrics.dragEfficiencyScore < 50) {
    recommendations.push('• Consider using AI suggestions more often to improve efficiency')
  }
  
  if (metrics.aiSuggestionUsageRate < 0.3) {
    recommendations.push('• Try using AI-powered time slot suggestions for better scheduling')
  }
  
  if (metrics.conflictResolutionRate > 0.5) {
    recommendations.push('• High conflict rate detected - consider spacing events further apart')
  }
  
  if (metrics.averageDragDuration > 5000) {
    recommendations.push('• Long drag durations detected - practice quick event placement for better workflow')
  }
  
  const mostActiveDay = Object.entries(metrics.dragsByDayOfWeek)
    .sort(([,a], [,b]) => b - a)[0]
  if (mostActiveDay && mostActiveDay[1] > 0) {
    recommendations.push(`• Peak activity on ${mostActiveDay[0]} - consider batch scheduling on this day`)
  }
  
  if (recommendations.length === 0) {
    recommendations.push('• Great job! Your drag & drop efficiency is excellent')
    recommendations.push('• Continue using AI suggestions to maintain optimal scheduling')
  }
  
  return recommendations.join('\n')
}

/**
 * Export combined calendar + drag-drop analytics
 */
export function exportComprehensiveAnalytics(
  calendarAnalytics: any,
  dragDropMetrics: DragDropMetrics,
  events: Event[],
  dragDropEvents: DragDropEvent[],
  year: number,
  format: 'csv' | 'json' | 'txt' = 'json'
): void {
  const filename = `comprehensive-analytics-${year}`
  
  switch (format) {
    case 'csv':
      // Create combined CSV with multiple sheets concept
      const calendarCSV = generateAnalyticsCSV(calendarAnalytics, year)
      const dragDropCSV = generateDragDropMetricsCSV(dragDropMetrics)
      const combinedCSV = `
CALENDAR ANALYTICS
${calendarCSV}

DRAG & DROP ANALYTICS
${dragDropCSV}
`.trim()
      downloadCSV(combinedCSV, `${filename}.csv`)
      break
      
    case 'json':
      const combinedJSON = {
        exportedAt: new Date().toISOString(),
        year,
        version: '1.0',
        calendarAnalytics,
        dragDropAnalytics: {
          metrics: dragDropMetrics,
          events: dragDropEvents.map(event => ({
            ...event,
            timestamp: event.timestamp.toISOString(),
            sourceDate: event.sourceDate.toISOString(),
            targetDate: event.targetDate?.toISOString()
          }))
        },
        events: events.map(event => ({
          ...event,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString()
        }))
      }
      downloadJSON(JSON.stringify(combinedJSON, null, 2), `${filename}.json`)
      break
      
    case 'txt':
      const calendarReport = generateAnalyticsReport(calendarAnalytics, year)
      const dragDropReport = generateDragDropReport(dragDropMetrics, dragDropEvents)
      const combinedReport = `${calendarReport}\n\n${'='.repeat(60)}\n\n${dragDropReport}`
      downloadText(combinedReport, `${filename}.txt`)
      break
  }
}

// ==========================================
// HELPER FUNCTIONS FOR DRAG & DROP EXPORT
// ==========================================

/**
 * Generate CSV content for drag & drop metrics
 */
function generateDragDropMetricsCSV(metrics: DragDropMetrics): string {
  const headers = ['Metric', 'Value', 'Description']
  const rows = [
    ['Total Drag Operations', metrics.totalDragOperations.toString(), 'Total number of drag operations initiated'],
    ['Successful Drops', metrics.successfulDrops.toString(), 'Number of successful drop operations'],
    ['Cancelled Drags', metrics.cancelledDrags.toString(), 'Number of cancelled drag operations'],
    ['Success Rate', `${metrics.totalDragOperations > 0 ? Math.round((metrics.successfulDrops / metrics.totalDragOperations) * 100) : 0}%`, 'Percentage of successful drag operations'],
    ['Average Duration', `${metrics.averageDragDuration}ms`, 'Average time per drag operation'],
    ['Efficiency Score', `${metrics.dragEfficiencyScore}/100`, 'Overall drag & drop efficiency rating'],
    ['Most Dragged Category', metrics.mostDraggedCategory, 'Category with most drag operations'],
    ['AI Suggestion Usage', `${Math.round(metrics.aiSuggestionUsageRate * 100)}%`, 'Percentage of drops that used AI suggestions'],
    ['Conflict Resolution Rate', `${Math.round(metrics.conflictResolutionRate * 100)}%`, 'Percentage of drops that had conflicts resolved'],
    ['Optimization Acceptance', `${Math.round(metrics.optimizationAcceptanceRate * 100)}%`, 'Percentage of optimized time slots accepted'],
    ['', '', ''], // Empty row separator
    ['Weekly Activity Distribution', '', ''],
    ...Object.entries(metrics.dragsByDayOfWeek).map(([day, count]) => [
      day, 
      count.toString(), 
      `Drag operations on ${day}`
    ]),
    ['', '', ''], // Empty row separator
    ['Daily Time Distribution', '', ''],
    ...Object.entries(metrics.dragsByTimeOfDay).map(([time, count]) => [
      time, 
      count.toString(), 
      `Drag operations during ${time}`
    ])
  ]

  return [headers, ...rows]
    .map(row => row.map((field: string) => `"${field.toString().replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

/**
 * Generate CSV content for detailed drag & drop events
 */
function generateDragDropEventsCSV(events: DragDropEvent[]): string {
  const headers = [
    'Event ID',
    'Event Title', 
    'Timestamp',
    'Event Type',
    'Category',
    'Source Date',
    'Target Date',
    'Duration (ms)',
    'AI Suggestion Used',
    'Conflict Resolved',
    'Optimized Time Slot'
  ]
  
  const rows = events.map(event => [
    event.id,
    event.eventTitle,
    formatDateForCSV(event.timestamp),
    event.eventType,
    event.category,
    formatDateForCSV(event.sourceDate),
    event.targetDate ? formatDateForCSV(event.targetDate) : '',
    event.duration.toString(),
    event.aiSuggestionUsed ? 'Yes' : 'No',
    event.conflictResolved ? 'Yes' : 'No', 
    event.optimizedTimeSlot ? 'Yes' : 'No'
  ])

  return [headers, ...rows]
    .map(row => row.map((field: string) => `"${field.toString().replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

/**
 * Helper function to trigger JSON download
 */
function downloadJSON(jsonContent: string, filename: string): void {
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } else {
    alert('JSON export is not supported in this browser. Please use a modern browser.')
  }
}

/**
 * Helper function to trigger text file download
 */
function downloadText(textContent: string, filename: string): void {
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } else {
    alert('Text export is not supported in this browser. Please use a modern browser.')
  }
}