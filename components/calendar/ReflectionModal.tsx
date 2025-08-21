'use client'

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react"
import { isWithinInterval, getWeek, startOfYear, endOfYear } from "date-fns"
import type { Event } from "@/types/calendar"

interface ReflectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: Event[]
  year: number
}

export function ReflectionModal({ 
  open, 
  onOpenChange, 
  events, 
  year 
}: ReflectionModalProps) {
  const [reflections, setReflections] = React.useState({
    clustered: '',
    reschedule: '',
    missing: ''
  })

  // Calculate statistics
  const stats = React.useMemo(() => {
    const workEvents = events.filter(e => e.category === 'work')
    const personalEvents = events.filter(e => e.category === 'personal')
    const effortEvents = events.filter(e => e.category === 'effort')
    const noteEvents = events.filter(e => e.category === 'note')
    
    // Find overlapping events
    const overlaps = findOverlappingEvents(events)
    
    // Calculate weeks without personal events
    const weeksWithoutPersonal = calculateWeeksWithoutPersonal(events, year)
    
    return {
      totalEvents: events.length,
      workPercentage: events.length > 0 ? Math.round((workEvents.length / events.length) * 100) : 0,
      personalPercentage: events.length > 0 ? Math.round((personalEvents.length / events.length) * 100) : 0,
      effortPercentage: events.length > 0 ? Math.round((effortEvents.length / events.length) * 100) : 0,
      notePercentage: events.length > 0 ? Math.round((noteEvents.length / events.length) * 100) : 0,
      overlappingEvents: overlaps.length,
      weeksWithoutPersonal
    }
  }, [events, year])

  const handleSave = () => {
    // Save reflections to local storage
    const reflectionData = {
      date: new Date().toISOString(),
      year,
      reflections,
      stats
    }
    
    // Get existing reflections
    const existingReflections = localStorage.getItem(`reflections-${year}`)
    const allReflections = existingReflections ? JSON.parse(existingReflections) : []
    
    // Add new reflection
    allReflections.push(reflectionData)
    
    // Save back to localStorage
    localStorage.setItem(`reflections-${year}`, JSON.stringify(allReflections))
    
    // Reset and close
    onOpenChange(false)
    setReflections({ clustered: '', reschedule: '', missing: '' })
  }

  const handleRemindLater = () => {
    // Store a reminder timestamp
    localStorage.setItem(`reflection-reminder-${year}`, new Date().toISOString())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Reflection
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Overlapping Events</p>
                <p className="text-2xl font-bold">{stats.overlappingEvents}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Work Events</p>
                <p className="text-2xl font-bold">{stats.workPercentage}%</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Weeks Without Personal Time</p>
                <p className="text-2xl font-bold">{stats.weeksWithoutPersonal}</p>
              </div>
            </div>
          </div>

          {/* Event Category Breakdown */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Event Breakdown</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                  Personal
                </span>
                <span className="text-sm font-medium">{stats.personalPercentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                  Work
                </span>
                <span className="text-sm font-medium">{stats.workPercentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm">
                  <span className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
                  Effort
                </span>
                <span className="text-sm font-medium">{stats.effortPercentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm">
                  <span className="w-3 h-3 rounded-full bg-purple-500 mr-2" />
                  Notes
                </span>
                <span className="text-sm font-medium">{stats.notePercentage}%</span>
              </div>
            </div>
          </div>

          {/* Reflection Questions */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="clustered" className="text-base font-medium mb-2">
                1. What feels overly clustered?
              </Label>
              <Textarea
                id="clustered"
                value={reflections.clustered}
                onChange={(e) => setReflections({ ...reflections, clustered: e.target.value })}
                placeholder="Identify periods or areas where your schedule feels too packed..."
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="reschedule" className="text-base font-medium mb-2">
                2. What can be rescheduled?
              </Label>
              <Textarea
                id="reschedule"
                value={reflections.reschedule}
                onChange={(e) => setReflections({ ...reflections, reschedule: e.target.value })}
                placeholder="Consider which events could be moved to create better balance..."
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="missing" className="text-base font-medium mb-2">
                3. What's missing from your year?
              </Label>
              <Textarea
                id="missing"
                value={reflections.missing}
                onChange={(e) => setReflections({ ...reflections, missing: e.target.value })}
                placeholder="Think about important activities or goals not yet scheduled..."
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleRemindLater}>
            Remind Me Later
          </Button>
          <Button onClick={handleSave}>
            Save Reflection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper functions
function findOverlappingEvents(events: Event[]): Event[][] {
  const overlaps: Event[][] = []
  
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i]
      const event2 = events[j]
      
      const event1Start = new Date(event1.startDate)
      const event1End = new Date(event1.endDate)
      const event2Start = new Date(event2.startDate)
      const event2End = new Date(event2.endDate)
      
      if (
        (event1Start <= event2End && event1End >= event2Start) ||
        (event2Start <= event1End && event2End >= event1Start)
      ) {
        overlaps.push([event1, event2])
      }
    }
  }
  
  return overlaps
}

function calculateWeeksWithoutPersonal(events: Event[], year: number): number {
  const personalEvents = events.filter(e => e.category === 'personal')
  const weeks = new Set<number>()
  
  personalEvents.forEach(event => {
    const eventStart = new Date(event.startDate)
    const eventEnd = new Date(event.endDate)
    
    // Make sure the event is within the year
    const yearStart = startOfYear(new Date(year, 0, 1))
    const yearEnd = endOfYear(new Date(year, 0, 1))
    
    if (isWithinInterval(eventStart, { start: yearStart, end: yearEnd }) ||
        isWithinInterval(eventEnd, { start: yearStart, end: yearEnd })) {
      
      // Get week numbers for the event duration
      let currentDate = new Date(eventStart)
      while (currentDate <= eventEnd) {
        if (currentDate.getFullYear() === year) {
          const weekNum = getWeek(currentDate, { weekStartsOn: 0 })
          weeks.add(weekNum)
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }
  })
  
  // Total weeks in a year is typically 52 or 53
  const totalWeeks = 52
  return totalWeeks - weeks.size
}