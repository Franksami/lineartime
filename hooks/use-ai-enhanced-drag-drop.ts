"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { useAdvancedDragDrop } from "./use-advanced-drag-drop"
import { AIDragDropService } from "@/lib/ai-drag-drop-service"

interface Event {
  id: string
  title: string
  startDate: Date
  endDate: Date
  color: string
  category?: string
}

interface AISuggestion {
  type: "conflict" | "optimization" | "grouping"
  message: string
  confidence: number
  actions?: Array<{
    label: string
    action: () => void
  }>
}

export function useAIEnhancedDragDrop(
  events: Event[],
  onEventsChange: (events: Event[]) => void,
  options: {
    enableAI?: boolean
    realTimeAnalysis?: boolean
    autoOptimize?: boolean
  } = {},
) {
  const { enableAI = true, realTimeAnalysis = true, autoOptimize = false } = options

  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dragFeedback, setDragFeedback] = useState<{
    message: string
    type: "success" | "warning" | "error"
  } | null>(null)

  const analysisTimeoutRef = useRef<NodeJS.Timeout>()

  const baseDragDrop = useAdvancedDragDrop(events, onEventsChange, {
    snapToGrid: true,
    multiSelect: true,
    touchSupport: true,
  })

  const handleAIDragStart = useCallback(
    async (itemId: string, event: React.MouseEvent | React.TouchEvent) => {
      baseDragDrop.handleDragStart(itemId, event)

      if (!enableAI) return

      const draggedEvent = events.find((e) => e.id === itemId)
      if (!draggedEvent) return

      setIsAnalyzing(true)

      try {
        // Get AI suggestions for optimal placement
        const suggestions = await AIDragDropService.suggestEventGrouping([draggedEvent])
        if (suggestions) {
          setAISuggestions([
            {
              type: "optimization",
              message: "AI analyzing optimal placement...",
              confidence: 0.8,
            },
          ])
        }
      } catch (error) {
        console.error("[v0] AI drag start error:", error)
      } finally {
        setIsAnalyzing(false)
      }
    },
    [baseDragDrop.handleDragStart, events, enableAI],
  )

  const handleAIDragMove = useCallback(
    (targetDate: Date, draggedEventIds: string[]) => {
      if (!enableAI || !realTimeAnalysis) return

      // Debounce analysis during drag
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }

      analysisTimeoutRef.current = setTimeout(async () => {
        const draggedEvents = events.filter((e) => draggedEventIds.includes(e.id))
        const conflictingEvents = events.filter(
          (e) => !draggedEventIds.includes(e.id) && e.startDate.toDateString() === targetDate.toDateString(),
        )

        const feedback = AIDragDropService.generateDragFeedback(draggedEvents, targetDate, conflictingEvents)

        setDragFeedback(feedback)

        if (conflictingEvents.length > 0) {
          try {
            const resolutions = await AIDragDropService.resolveConflicts(draggedEvents, conflictingEvents, targetDate)

            setAISuggestions([
              {
                type: "conflict",
                message: `Conflict detected. ${resolutions[0] || "Consider alternative timing."}`,
                confidence: 0.9,
                actions: [
                  {
                    label: "View Suggestions",
                    action: () => console.log("Show conflict resolution UI"),
                  },
                ],
              },
            ])
          } catch (error) {
            console.error("[v0] AI conflict analysis error:", error)
          }
        }
      }, 300) // 300ms debounce
    },
    [events, enableAI, realTimeAnalysis],
  )

  const handleAIDrop = useCallback(
    async (targetDate: Date, draggedEventIds: string[]) => {
      const draggedEvents = events.filter((e) => draggedEventIds.includes(e.id))

      if (enableAI && autoOptimize && draggedEvents.length === 1) {
        try {
          const optimization = await AIDragDropService.optimizeEventPlacement(draggedEvents[0], targetDate, events)

          if (optimization) {
            // Apply AI-optimized timing
            const optimizedEvents = events.map((event) => {
              if (event.id === draggedEvents[0].id) {
                const duration = event.endDate.getTime() - event.startDate.getTime()
                return {
                  ...event,
                  startDate: optimization.suggestedTime,
                  endDate: new Date(optimization.suggestedTime.getTime() + duration),
                }
              }
              return event
            })

            onEventsChange(optimizedEvents)

            setAISuggestions([
              {
                type: "optimization",
                message: `AI optimized timing: ${optimization.reason}`,
                confidence: 0.85,
              },
            ])

            return
          }
        } catch (error) {
          console.error("[v0] AI drop optimization error:", error)
        }
      }

      // Fallback to standard drop handling
      baseDragDrop.handleDragEnd(new MouseEvent("mouseup") as any)
      setDragFeedback(null)
    },
    [events, onEventsChange, enableAI, autoOptimize, baseDragDrop.handleDragEnd],
  )

  const clearAISuggestions = useCallback(() => {
    setAISuggestions([])
    setDragFeedback(null)
    setIsAnalyzing(false)
  }, [])

  return {
    ...baseDragDrop,
    // Override with AI-enhanced handlers
    handleDragStart: handleAIDragStart,
    handleDragMove: handleAIDragMove,
    handleDrop: handleAIDrop,
    // AI-specific state and actions
    aiSuggestions,
    isAnalyzing,
    dragFeedback,
    clearAISuggestions,
  }
}
