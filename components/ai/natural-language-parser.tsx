"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wand2, Calendar, Clock, Tag } from "lucide-react"
import { AICalendarService } from "@/lib/ai-services"
import type { CalendarEvent } from "@/components/ui/calendar"

interface NaturalLanguageParserProps {
  onEventParsed?: (event: CalendarEvent) => void
}

export function NaturalLanguageParser({ onEventParsed }: NaturalLanguageParserProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [parsedEvent, setParsedEvent] = useState<CalendarEvent | null>(null)
  const [error, setError] = useState<string | null>(null)

  const exampleInputs = [
    "Team meeting tomorrow at 2pm for 1 hour",
    "Dentist appointment next Friday at 10:30am",
    "Weekly standup every Monday at 9am",
    "Vacation from July 15 to July 22",
    "Call with client on 3/15/2025 at 3:30pm",
    "Lunch with Sarah today at noon",
    "Project deadline next Wednesday",
    "Conference call at 4pm for 30 minutes",
  ]

  const handleParse = async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setParsedEvent(null)

    try {
      const event = await AICalendarService.parseEventFromText(input.trim())

      if (event) {
        setParsedEvent(event)
        onEventParsed?.(event)
      } else {
        setError("Could not parse the event. Please try rephrasing your input.")
      }
    } catch (err) {
      console.error("[v0] Parsing error:", err)
      setError("An error occurred while parsing the event.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (example: string) => {
    setInput(example)
    setError(null)
    setParsedEvent(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleParse()
    }
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Natural Language Event Parser</h3>
        </div>
        <p className="text-sm text-gray-600">
          Describe your event in natural language and I'll parse it into a structured calendar event.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Team meeting tomorrow at 2pm for 1 hour"
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleParse} disabled={!input.trim() || isLoading}>
            {isLoading ? "Parsing..." : "Parse"}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {parsedEvent && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">Event Parsed Successfully!</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Title:</span>
                <span>{parsedEvent.title}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Date & Time:</span>
                <span>
                  {parsedEvent.startDate.toLocaleDateString()} at{" "}
                  {parsedEvent.startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {parsedEvent.endDate.getTime() !== parsedEvent.startDate.getTime() && (
                    <> - {parsedEvent.endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span className="font-medium">Category:</span>
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: parsedEvent.color + "20", color: parsedEvent.color }}
                >
                  {parsedEvent.category}
                </Badge>
              </div>

              {parsedEvent.description && (
                <div className="flex items-start gap-2">
                  <span className="font-medium">Description:</span>
                  <span>{parsedEvent.description}</span>
                </div>
              )}

              {parsedEvent.recurring && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Recurring:</span>
                  <Badge variant="outline">
                    {parsedEvent.recurring.frequency} (every {parsedEvent.recurring.interval})
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Try these examples:</h4>
        <div className="flex flex-wrap gap-2">
          {exampleInputs.map((example, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleExampleClick(example)}
              className="text-xs"
            >
              {example}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  )
}
