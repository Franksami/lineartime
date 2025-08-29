/**
 * AI Natural Language Processing Input Component
 *
 * Enhanced input field for natural language event creation.
 * Integrates with design tokens, motion system, and accessibility standards.
 * Provides real-time parsing and intelligent event suggestions.
 *
 * @version Phase 5.0
 * @author Command Center Calendar AI Enhancement System
 */

'use client';

import { useAIContext, useNaturalLanguageProcessing } from '@/contexts/AIContext';
import { useAccessibilityAAA } from '@/hooks/useAccessibilityAAA';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useMotionSystem } from '@/hooks/useMotionSystem';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Brain,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Lightbulb,
  Loader2,
  MapPin,
  Mic,
  Send,
  Sparkles,
  Tag,
  Users,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ==========================================
// Types & Interfaces
// ==========================================

export interface NLPParsedEvent {
  id: string;
  title: string;
  startDate?: Date;
  endDate?: Date;
  duration?: number; // minutes
  location?: string;
  attendees?: string[];
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    until?: Date;
  };
  reminders?: Array<{
    type: 'email' | 'popup' | 'sms';
    minutes_before: number;
  }>;
  confidence: number; // 0-1
  parsed_elements: {
    time_detected: boolean;
    location_detected: boolean;
    attendees_detected: boolean;
    recurring_detected: boolean;
  };
}

export interface NLPSuggestion {
  id: string;
  type: 'completion' | 'correction' | 'enhancement' | 'template';
  text: string;
  replacement: string;
  confidence: number;
  explanation: string;
}

interface AINLPInputProps {
  // Input Configuration
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;

  // AI Processing
  enableRealTimeParsing?: boolean;
  enableSuggestions?: boolean;
  enableVoiceInput?: boolean;
  parseDelay?: number; // milliseconds

  // Event Creation
  onEventParsed?: (event: NLPParsedEvent) => void;
  onEventCreate?: (event: Partial<Event>) => void;
  defaultCategory?: string;
  defaultDuration?: number; // minutes

  // Templates & History
  enableTemplates?: boolean;
  recentQueries?: string[];
  popularTemplates?: string[];

  // Styling
  className?: string;
  variant?: 'minimal' | 'enhanced' | 'full';
  size?: 'sm' | 'md' | 'lg';

  // Accessibility
  ariaLabel?: string;
  reducedMotion?: boolean;

  // Advanced Features
  contextAware?: boolean; // Use existing calendar data for context
  crossProviderSupport?: boolean;
  enableSmartScheduling?: boolean;
}

// ==========================================
// NLP Processing Engine
// ==========================================

class NLPProcessor {
  private static readonly TIME_PATTERNS = [
    /\b(?:at|@)\s*(\d{1,2}):?(\d{0,2})?\s*(am|pm)?\b/gi,
    /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/gi,
    /\b(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/gi,
    /\b(next|this)\s+(week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
  ];

  private static readonly LOCATION_PATTERNS = [
    /\b(?:at|in|@)\s+([A-Za-z0-9\s]+(?:room|office|building|hall|center|conference))\b/gi,
    /\b(?:location|venue|place):\s*([^\n,]+)/gi,
    /\b(room\s+\w+|\w+\s+room)\b/gi,
  ];

  private static readonly ATTENDEE_PATTERNS = [
    /\b(?:with|invite|including)\s+([^,\n]+(?:,\s*[^,\n]+)*)/gi,
    /\b(?:attendees?|participants?):\s*([^\n]+)/gi,
    /\b(@\w+(?:\.\w+)*(?:,\s*@\w+(?:\.\w+)*)*)/gi,
  ];

  private static readonly DURATION_PATTERNS = [
    /\b(\d+)\s*(?:hours?|hrs?|h)\b/gi,
    /\b(\d+)\s*(?:minutes?|mins?|m)\b/gi,
    /\b(?:for|duration)\s+(\d+)\s*(?:hours?|minutes?|hrs?|mins?|h|m)\b/gi,
  ];

  static async parseNaturalLanguage(
    query: string,
    context?: {
      existingEvents?: Event[];
      userPreferences?: any;
    }
  ): Promise<NLPParsedEvent> {
    const parsed: NLPParsedEvent = {
      id: `nlp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: '',
      confidence: 0,
      parsed_elements: {
        time_detected: false,
        location_detected: false,
        attendees_detected: false,
        recurring_detected: false,
      },
    };

    // Extract title (everything that's not a specific pattern)
    let title = query.trim();

    // Parse time information
    const timeInfo = NLPProcessor.extractTimeInfo(query);
    if (timeInfo.startDate) {
      parsed.startDate = timeInfo.startDate;
      parsed.endDate = timeInfo.endDate;
      parsed.parsed_elements.time_detected = true;
      parsed.confidence += 0.3;

      // Remove time patterns from title
      title = title.replace(/\b(?:at|@)\s*\d{1,2}:?\d{0,2}?\s*(?:am|pm)?\b/gi, '');
      title = title.replace(
        /\b(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
        ''
      );
    }

    // Parse location
    const location = NLPProcessor.extractLocation(query);
    if (location) {
      parsed.location = location;
      parsed.parsed_elements.location_detected = true;
      parsed.confidence += 0.2;

      // Remove location patterns from title
      title = title.replace(
        /\b(?:at|in|@)\s+[A-Za-z0-9\s]+(?:room|office|building|hall|center|conference)\b/gi,
        ''
      );
      title = title.replace(/\b(?:location|venue|place):\s*[^\n,]+/gi, '');
    }

    // Parse attendees
    const attendees = NLPProcessor.extractAttendees(query);
    if (attendees.length > 0) {
      parsed.attendees = attendees;
      parsed.parsed_elements.attendees_detected = true;
      parsed.confidence += 0.15;

      // Remove attendee patterns from title
      title = title.replace(/\b(?:with|invite|including)\s+[^,\n]+(?:,\s*[^,\n]+)*/gi, '');
      title = title.replace(/\b(?:attendees?|participants?):\s*[^\n]+/gi, '');
    }

    // Parse duration
    const duration = NLPProcessor.extractDuration(query);
    if (duration > 0) {
      parsed.duration = duration;
      parsed.confidence += 0.1;

      if (parsed.startDate && !parsed.endDate) {
        parsed.endDate = new Date(parsed.startDate.getTime() + duration * 60 * 1000);
      }
    }

    // Parse priority indicators
    const priority = NLPProcessor.extractPriority(query);
    if (priority) {
      parsed.priority = priority;
      parsed.confidence += 0.05;
    }

    // Parse category/tags
    const category = NLPProcessor.extractCategory(query);
    if (category) {
      parsed.category = category;
      parsed.confidence += 0.05;
    }

    // Parse recurring patterns
    const recurring = NLPProcessor.extractRecurring(query);
    if (recurring) {
      parsed.recurring = recurring;
      parsed.parsed_elements.recurring_detected = true;
      parsed.confidence += 0.1;
    }

    // Clean up and set title
    parsed.title = title.replace(/\s+/g, ' ').trim() || 'New Event';

    // Apply smart defaults
    if (!parsed.startDate) {
      // Default to next hour
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      parsed.startDate = nextHour;
    }

    if (!parsed.endDate && parsed.startDate) {
      // Default duration based on context
      const defaultDuration = duration || 60; // 1 hour default
      parsed.endDate = new Date(parsed.startDate.getTime() + defaultDuration * 60 * 1000);
    }

    // Context-aware enhancements
    if (context?.existingEvents) {
      parsed.confidence = NLPProcessor.enhanceWithContext(parsed, context.existingEvents);
    }

    return parsed;
  }

  private static extractTimeInfo(query: string): { startDate?: Date; endDate?: Date } {
    const result: { startDate?: Date; endDate?: Date } = {};

    // Look for explicit times
    const timeMatch = query.match(/\b(\d{1,2}):?(\d{0,2})?\s*(am|pm)?\b/i);
    if (timeMatch) {
      const hour = Number.parseInt(timeMatch[1]);
      const minute = Number.parseInt(timeMatch[2] || '0');
      const isPM = timeMatch[3]?.toLowerCase() === 'pm';

      const date = new Date();
      date.setHours(isPM && hour !== 12 ? hour + 12 : hour, minute, 0, 0);

      // If time is in the past, assume tomorrow
      if (date.getTime() < Date.now()) {
        date.setDate(date.getDate() + 1);
      }

      result.startDate = date;
    }

    // Look for relative dates
    if (query.match(/\btomorrow\b/i)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (!result.startDate) {
        tomorrow.setHours(9, 0, 0, 0); // Default 9 AM
        result.startDate = tomorrow;
      } else {
        result.startDate.setFullYear(tomorrow.getFullYear());
        result.startDate.setMonth(tomorrow.getMonth());
        result.startDate.setDate(tomorrow.getDate());
      }
    }

    // Look for day names
    const dayMatch = query.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    if (dayMatch) {
      const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const targetDay = dayNames.indexOf(dayMatch[1].toLowerCase());
      const today = new Date();
      const currentDay = today.getDay();

      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence of this day

      const targetDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      if (!result.startDate) {
        targetDate.setHours(9, 0, 0, 0);
        result.startDate = targetDate;
      } else {
        result.startDate.setFullYear(targetDate.getFullYear());
        result.startDate.setMonth(targetDate.getMonth());
        result.startDate.setDate(targetDate.getDate());
      }
    }

    return result;
  }

  private static extractLocation(query: string): string | undefined {
    for (const pattern of NLPProcessor.LOCATION_PATTERNS) {
      const match = pattern.exec(query);
      if (match) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  private static extractAttendees(query: string): string[] {
    const attendees: string[] = [];

    for (const pattern of NLPProcessor.ATTENDEE_PATTERNS) {
      const match = pattern.exec(query);
      if (match) {
        const attendeeList = match[1]
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
        attendees.push(...attendeeList);
      }
    }

    return [...new Set(attendees)]; // Remove duplicates
  }

  private static extractDuration(query: string): number {
    for (const pattern of NLPProcessor.DURATION_PATTERNS) {
      const match = pattern.exec(query);
      if (match) {
        const value = Number.parseInt(match[1]);
        const unit = match[0].toLowerCase();

        if (unit.includes('hour') || unit.includes('hr') || unit.includes('h')) {
          return value * 60; // Convert to minutes
        }
        return value; // Already in minutes
      }
    }

    return 0;
  }

  private static extractPriority(query: string): 'low' | 'medium' | 'high' | undefined {
    if (query.match(/\b(urgent|important|high|critical|asap)\b/i)) {
      return 'high';
    }
    if (query.match(/\b(low|minor|optional)\b/i)) {
      return 'low';
    }
    if (query.match(/\b(medium|normal|regular)\b/i)) {
      return 'medium';
    }
    return undefined;
  }

  private static extractCategory(query: string): string | undefined {
    const categoryKeywords = {
      meeting: ['meeting', 'call', 'discussion', 'standup', 'review'],
      work: ['work', 'task', 'project', 'deadline'],
      personal: ['personal', 'appointment', 'doctor', 'dentist'],
      focus: ['focus', 'deep work', 'coding', 'writing'],
      break: ['break', 'lunch', 'coffee', 'rest'],
      travel: ['travel', 'flight', 'trip', 'vacation'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (query.toLowerCase().includes(keyword)) {
          return category;
        }
      }
    }

    return undefined;
  }

  private static extractRecurring(query: string): NLPParsedEvent['recurring'] | undefined {
    if (query.match(/\b(daily|every day)\b/i)) {
      return { type: 'daily', interval: 1 };
    }
    if (query.match(/\b(weekly|every week)\b/i)) {
      return { type: 'weekly', interval: 1 };
    }
    if (query.match(/\b(monthly|every month)\b/i)) {
      return { type: 'monthly', interval: 1 };
    }
    if (query.match(/\b(yearly|annually|every year)\b/i)) {
      return { type: 'yearly', interval: 1 };
    }

    return undefined;
  }

  private static enhanceWithContext(parsed: NLPParsedEvent, existingEvents: Event[]): number {
    let contextConfidence = parsed.confidence;

    // Check for similar events in the past
    const similarEvents = existingEvents.filter(
      (event) =>
        event.title.toLowerCase().includes(parsed.title.toLowerCase()) ||
        parsed.title.toLowerCase().includes(event.title.toLowerCase())
    );

    if (similarEvents.length > 0) {
      contextConfidence += 0.1;

      // Apply patterns from similar events
      const mostRecent = similarEvents.sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )[0];

      if (!parsed.location && mostRecent.location) {
        parsed.location = mostRecent.location;
        contextConfidence += 0.05;
      }

      if (!parsed.category && mostRecent.category) {
        parsed.category = mostRecent.category;
        contextConfidence += 0.05;
      }
    }

    return Math.min(contextConfidence, 0.95); // Cap at 95%
  }

  static generateSuggestions(query: string, parsedEvent: NLPParsedEvent): NLPSuggestion[] {
    const suggestions: NLPSuggestion[] = [];

    // Time completion suggestions
    if (!parsedEvent.parsed_elements.time_detected) {
      suggestions.push({
        id: 'time_completion',
        type: 'completion',
        text: query,
        replacement: `${query} at 2:00 PM`,
        confidence: 0.8,
        explanation: 'Add a specific time to your event',
      });
    }

    // Location suggestions
    if (!parsedEvent.parsed_elements.location_detected) {
      suggestions.push({
        id: 'location_completion',
        type: 'completion',
        text: query,
        replacement: `${query} in Conference Room A`,
        confidence: 0.7,
        explanation: 'Specify a location for your meeting',
      });
    }

    // Duration suggestions
    if (!parsedEvent.duration) {
      suggestions.push({
        id: 'duration_completion',
        type: 'completion',
        text: query,
        replacement: `${query} for 1 hour`,
        confidence: 0.75,
        explanation: 'Set a duration for your event',
      });
    }

    return suggestions;
  }
}

// ==========================================
// Main Component
// ==========================================

export function AINLPInput({
  placeholder = "Try: 'Team meeting tomorrow at 2pm in conference room A'",
  multiline = false,
  maxLength = 500,
  enableRealTimeParsing = true,
  enableSuggestions = true,
  enableVoiceInput = false,
  parseDelay = 500,
  onEventParsed,
  onEventCreate,
  defaultCategory,
  defaultDuration = 60,
  enableTemplates = true,
  recentQueries = [],
  popularTemplates = [
    'Team standup tomorrow at 9am',
    'Project review next Friday at 2pm for 1 hour',
    'One-on-one with manager Thursday at 3pm',
    'Client call Monday at 10am for 30 minutes',
  ],
  className,
  variant = 'enhanced',
  size = 'md',
  ariaLabel,
  reducedMotion = false,
  contextAware = true,
  crossProviderSupport = false,
  enableSmartScheduling = true,
  ...props
}: AINLPInputProps) {
  // Hooks
  const { tokens, resolveToken } = useDesignTokens();
  const { animate, choreography } = useMotionSystem();
  const { announceChange, createAriaLabel } = useAccessibilityAAA();
  const { playSound } = useSoundEffects();
  const { state: aiState, isFeatureEnabled } = useAIContext();
  const {
    parseNaturalLanguage,
    processing: isProcessing,
    nlpResults,
  } = useNaturalLanguageProcessing();

  // Local State
  const [query, setQuery] = useState('');
  const [parsedEvent, setParsedEvent] = useState<NLPParsedEvent | null>(null);
  const [suggestions, setSuggestions] = useState<NLPSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState(0);

  // Refs
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const parseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if NLP feature is enabled
  const isEnabled = isFeatureEnabled('nlpParsing') && aiState.enabled;

  // Parse query in real-time
  const parseQuery = useCallback(
    async (queryText: string) => {
      if (!queryText.trim() || !isEnabled) {
        setParsedEvent(null);
        setSuggestions([]);
        setConfidence(0);
        return;
      }

      try {
        const parsed = await NLPProcessor.parseNaturalLanguage(queryText, {
          // Add context if available
          existingEvents: contextAware ? [] : undefined, // Would be actual events from context
        });

        setParsedEvent(parsed);
        setConfidence(parsed.confidence);

        if (enableSuggestions) {
          const generatedSuggestions = NLPProcessor.generateSuggestions(queryText, parsed);
          setSuggestions(generatedSuggestions);
        }

        onEventParsed?.(parsed);

        // Announce parsing results for accessibility
        if (parsed.confidence > 0.6) {
          announceChange(
            `Event parsed: ${parsed.title}${parsed.startDate ? ` on ${parsed.startDate.toLocaleDateString()}` : ''}`
          );
        }
      } catch (error) {
        console.error('NLP parsing error:', error);
        setParsedEvent(null);
        setSuggestions([]);
      }
    },
    [isEnabled, contextAware, enableSuggestions, onEventParsed, announceChange]
  );

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (!enableRealTimeParsing) return;

      // Clear previous timeout
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }

      // Debounce parsing
      parseTimeoutRef.current = setTimeout(() => {
        parseQuery(value);
      }, parseDelay);
    },
    [enableRealTimeParsing, parseQuery, parseDelay]
  );

  // Handle event creation
  const handleCreateEvent = useCallback(async () => {
    if (!parsedEvent || !onEventCreate) return;

    try {
      const eventData: Partial<Event> = {
        id: parsedEvent.id,
        title: parsedEvent.title,
        startTime: parsedEvent.startDate?.toISOString() || new Date().toISOString(),
        endTime:
          parsedEvent.endDate?.toISOString() ||
          new Date(Date.now() + defaultDuration * 60 * 1000).toISOString(),
        location: parsedEvent.location,
        description: parsedEvent.description,
        attendees: parsedEvent.attendees,
        category: parsedEvent.category || defaultCategory,
        priority: parsedEvent.priority || 'medium',
        // Add recurring info if needed
      };

      onEventCreate(eventData);

      // Clear input after successful creation
      setQuery('');
      setParsedEvent(null);
      setSuggestions([]);
      setConfidence(0);

      announceChange(`Event created: ${parsedEvent.title}`);
      playSound('success');
    } catch (error) {
      console.error('Event creation error:', error);
      playSound('error');
    }
  }, [parsedEvent, onEventCreate, defaultDuration, defaultCategory, announceChange, playSound]);

  // Handle voice input
  const handleVoiceInput = useCallback(() => {
    if (!enableVoiceInput || !('webkitSpeechRecognition' in window)) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      announceChange('Voice input started');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      parseQuery(transcript);
      announceChange(`Voice input: ${transcript}`);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      playSound('error');
    };

    recognition.onend = () => {
      setIsListening(false);
      announceChange('Voice input ended');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [enableVoiceInput, isListening, parseQuery, announceChange, playSound]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: NLPSuggestion) => {
      setQuery(suggestion.replacement);
      parseQuery(suggestion.replacement);
      setShowSuggestions(false);

      announceChange(`Applied suggestion: ${suggestion.explanation}`);
      playSound('success');

      // Focus back to input
      inputRef.current?.focus();
    },
    [parseQuery, announceChange, playSound]
  );

  // Handle template selection
  const handleTemplateSelect = useCallback(
    (template: string) => {
      setQuery(template);
      parseQuery(template);
      setShowTemplates(false);

      announceChange(`Applied template: ${template}`);

      // Focus back to input
      inputRef.current?.focus();
    },
    [parseQuery, announceChange]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Don't render if not enabled
  if (!isEnabled) return null;

  const inputClasses = cn(
    'flex-1 bg-transparent border-none outline-none resize-none',
    'placeholder:text-muted-foreground',
    {
      'text-sm py-2 px-3': size === 'sm',
      'text-base py-3 px-4': size === 'md',
      'text-lg py-4 px-5': size === 'lg',
    }
  );

  const containerClasses = cn(
    'ai-nlp-input relative',
    'bg-background border border-border rounded-lg',
    'focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent',
    'transition-all duration-200',
    {
      'shadow-sm': variant !== 'minimal',
      'shadow-md': variant === 'full',
    },
    className
  );

  return (
    <div className="space-y-3">
      {/* Main Input Container */}
      <div className={containerClasses}>
        <div className="flex items-start gap-2">
          {/* AI Indicator */}
          <div
            className={cn(
              'flex-shrink-0 p-2 rounded-md',
              'bg-gradient-to-br from-purple-500 to-blue-600 text-white',
              'flex items-center justify-center'
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
          </div>

          {/* Input Field */}
          <div className="flex-1 min-w-0">
            {multiline ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={query}
                onChange={handleInputChange}
                placeholder={placeholder}
                maxLength={maxLength}
                rows={3}
                className={inputClasses}
                aria-label={ariaLabel || 'Natural language event input'}
                {...props}
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder={placeholder}
                maxLength={maxLength}
                className={inputClasses}
                aria-label={ariaLabel || 'Natural language event input'}
                {...props}
              />
            )}

            {/* Parsing Confidence Indicator */}
            {query && confidence > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence * 100}%` }}
                    transition={choreography.transitions.smooth}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Voice Input */}
            {enableVoiceInput && 'webkitSpeechRecognition' in window && (
              <button
                onClick={handleVoiceInput}
                className={cn('p-2 rounded-md transition-colors', 'hover:bg-muted', {
                  'bg-red-500 /* TODO: Use semantic token */ text-white': isListening,
                  'text-muted-foreground': !isListening,
                })}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            {/* Templates */}
            {enableTemplates && popularTemplates.length > 0 && (
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Show templates"
              >
                <Lightbulb className="w-4 h-4" />
              </button>
            )}

            {/* Create Event */}
            {parsedEvent && parsedEvent.confidence > 0.6 && onEventCreate && (
              <motion.button
                onClick={handleCreateEvent}
                className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                aria-label="Create event"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={choreography.transitions.bounce}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Parsed Event Preview */}
      <AnimatePresence>
        {parsedEvent && parsedEvent.confidence > 0.4 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={choreography.transitions.smooth}
            className="bg-muted/50 border border-border rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-green-100 /* TODO: Use semantic token */ text-green-600 /* TODO: Use semantic token */ dark:bg-green-900 /* TODO: Use semantic token *//30 dark:text-green-400 /* TODO: Use semantic token */ rounded-full">
                <CheckCircle className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  {parsedEvent.title}
                  <span className="px-2 py-1 text-xs bg-blue-100 /* TODO: Use semantic token */ text-blue-800 /* TODO: Use semantic token */ dark:bg-blue-900 /* TODO: Use semantic token *//30 dark:text-blue-400 /* TODO: Use semantic token */ rounded-full">
                    {Math.round(parsedEvent.confidence * 100)}% match
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {parsedEvent.startDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{parsedEvent.startDate.toLocaleDateString()}</span>
                    </div>
                  )}

                  {parsedEvent.startDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>
                        {parsedEvent.startDate.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {parsedEvent.endDate &&
                          ` - ${parsedEvent.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>
                  )}

                  {parsedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      <span>{parsedEvent.location}</span>
                    </div>
                  )}

                  {parsedEvent.attendees && parsedEvent.attendees.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      <span>{parsedEvent.attendees.length} attendees</span>
                    </div>
                  )}

                  {parsedEvent.category && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-3 h-3" />
                      <span className="capitalize">{parsedEvent.category}</span>
                    </div>
                  )}

                  {parsedEvent.recurring && (
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-3 h-3" />
                      <span className="capitalize">{parsedEvent.recurring.type}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      <AnimatePresence>
        {enableSuggestions && suggestions.length > 0 && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-purple-500 /* TODO: Use semantic token */" />
              <span className="font-medium">AI Suggestions</span>
              <button
                onClick={() => setShowSuggestions(false)}
                className="ml-auto p-1 hover:bg-muted rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left p-2 text-sm bg-background border border-border rounded hover:bg-muted transition-colors"
                >
                  <div className="font-medium">{suggestion.replacement}</div>
                  <div className="text-xs text-muted-foreground">{suggestion.explanation}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates */}
      <AnimatePresence>
        {enableTemplates && showTemplates && popularTemplates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-sm">
              <Lightbulb className="w-4 h-4 text-yellow-500 /* TODO: Use semantic token */" />
              <span className="font-medium">Quick Templates</span>
              <button
                onClick={() => setShowTemplates(false)}
                className="ml-auto p-1 hover:bg-muted rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {popularTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleTemplateSelect(template)}
                  className="text-left p-2 text-sm bg-background border border-border rounded hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span>{template}</span>
                  </div>
                </button>
              ))}
            </div>

            {recentQueries.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-sm pt-2 border-t">
                  <History className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Recent</span>
                </div>

                <div className="space-y-1">
                  {recentQueries.slice(0, 3).map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleTemplateSelect(query)}
                      className="w-full text-left p-2 text-sm bg-background border border-border rounded hover:bg-muted transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-show suggestions */}
      {enableSuggestions && suggestions.length > 0 && !showSuggestions && (
        <button
          onClick={() => setShowSuggestions(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>{suggestions.length} AI suggestions available</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default AINLPInput;
