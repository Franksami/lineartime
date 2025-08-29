/**
 * Command Center Enterprise Interface - Working Version
 *
 * Professional calendar interface inspired by Sunsama and Notion Calendar
 * that focuses on working functionality first, then adds sophisticated features.
 *
 * DESIGN PROCESS:
 * 1. Layout - Professional 3-panel layout with sidebar
 * 2. Theming - Pure semantic tokens (bg-background, bg-card, text-foreground)
 * 3. Animation - Micro animations for professional feel
 * 4. Code - Clean implementation with proper documentation
 *
 * @version 2.0.0 (Command Center Working Enterprise)
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React, { useState, useCallback } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Command Workspace View Integration
import { WeekView } from '@/views/week/WeekView';
import { ViewScaffold } from '@/components/_deprecated/ViewScaffold';

// Preserve backend calendar integration
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';

// Icons
import {
  Activity,
  Brain,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  DollarSign,
  Eye,
  Filter,
  Layers,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import { useSettingsContext } from '@/contexts/SettingsContext';
// Business logic & Performance
import { useSoundEffects } from '@/lib/sound-service';
import { cn } from '@/lib/utils';

// Security & Validation
import DOMPurify from 'isomorphic-dompurify';

interface CheatCalEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  type: 'revenue' | 'coordination' | 'focus' | 'client' | 'optimization';
  attendees?: string[];
  location?: string;
  revenueImpact?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  aiSuggestions?: string[];
}

// Motion System Utilities (graceful degradation)
const useMotion = () => ({ ref: null });
const useButtonAnimation = (config?: any) => ({
  ref: null,
  handlePress: async () => {},
  handleHover: (hover: boolean) => {},
});
const useAudioVisualSync = (settings?: any) => ({
  syncWithPreset: async (preset: string, duration: number, category: string) => {},
});
const useMotionTokens = () => ({
  durations: { fast: 150, interface: 300 },
  easings: { spring: 'easeOut' },
});

// Security validation utilities
const sanitizeUserInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

const validateEventData = (event: Partial<CalendarEvent>): boolean => {
  if (!event.title || event.title.trim().length === 0) return false;
  if (!event.start || !event.end) return false;
  if (event.start >= event.end) return false;
  return true;
};

export default function SimpleCheatCalInterface() {
  const { playSound } = useSoundEffects() || { playSound: () => Promise.resolve() };
  const { settings } = useSettingsContext();
  const { events, createEvent, updateEvent, deleteEvent, loading } = useCalendarEvents();

  // Motion System Integration
  const motionTokens = useMotionTokens();
  const { syncWithPreset } = useAudioVisualSync(settings?.notifications);
  const headerMotion = useMotion();
  const sidebarMotion = useMotion();
  const mainContentMotion = useMotion();
  const {
    ref: actionButtonRef,
    handlePress: handleActionPress,
    handleHover,
  } = useButtonAnimation({
    category: 'feedback',
    audio: { sound: 'success', syncTiming: true, volume: 0.2 },
  });

  // State Management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [activePanel, setActivePanel] = useState<
    'calendar' | 'ai-planner' | 'insights' | 'coordination'
  >('calendar');
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showLibraryTransitioner, setShowLibraryTransitioner] = useState(false);

  // Convert real events to professional display format
  const processedEvents: CheatCalEvent[] = events.slice(0, 3).map((event) => ({
    id: event.id,
    title: sanitizeUserInput(event.title),
    time: new Date(event.start).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    duration: `${Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60))}m`,
    type: (event.category as any) || 'coordination',
    attendees: event.attendees || [],
    location: event.location || 'TBD',
    revenueImpact: Math.floor(Math.random() * 100000) + 50000, // Mock revenue impact
    priority: (event.priority as any) || 'medium',
    aiSuggestions: ['AI optimization active', 'Coordination tracking enabled'],
  }));

  // Fallback professional mock data for demo
  const fallbackEvents: CheatCalEvent[] = [
    {
      id: '1',
      title: 'Q4 Launch Strategy Session',
      time: '09:00',
      duration: '2h',
      type: 'revenue',
      attendees: ['CEO', 'CMO', 'Head of Product'],
      location: 'Conference Room A',
      revenueImpact: 250000,
      priority: 'critical',
      aiSuggestions: ['Optimize for decision-making efficiency', 'Prepare revenue projections'],
    },
    {
      id: '2',
      title: 'Client Coordination Optimization',
      time: '11:30',
      duration: '1h 30m',
      type: 'coordination',
      attendees: ['Account Manager', 'Client Team'],
      location: 'Virtual Meeting',
      revenueImpact: 85000,
      priority: 'high',
      aiSuggestions: ['Focus on coordination bottlenecks', 'Track decision velocity'],
    },
    {
      id: '3',
      title: 'Deep Work: Revenue Analysis',
      time: '14:00',
      duration: '3h',
      type: 'focus',
      revenueImpact: 150000,
      priority: 'high',
      aiSuggestions: ['Eliminate interruptions', 'Use focus mode tracking'],
    },
    {
      id: '2',
      title: 'Client Coordination Optimization',
      time: '11:30',
      duration: '1h 30m',
      type: 'coordination',
      attendees: ['Account Manager', 'Client Team'],
      location: 'Virtual Meeting',
      revenueImpact: 85000,
      priority: 'high',
      aiSuggestions: ['Focus on coordination bottlenecks', 'Track decision velocity'],
    },
    {
      id: '3',
      title: 'Deep Work: Revenue Analysis',
      time: '14:00',
      duration: '3h',
      type: 'focus',
      revenueImpact: 150000,
      priority: 'high',
      aiSuggestions: ['Eliminate interruptions', 'Use focus mode tracking'],
    },
  ];

  const displayEvents = processedEvents.length > 0 ? processedEvents : fallbackEvents;

  // Professional styling functions
  const getEventTypeColor = (type: CheatCalEvent['type']) => {
    const colors = {
      revenue: 'bg-green-600 /* TODO: Use semantic token */',
      coordination: 'bg-blue-600 /* TODO: Use semantic token */',
      focus: 'bg-purple-600 /* TODO: Use semantic token */',
      client: 'bg-orange-600',
      optimization: 'bg-yellow-600 /* TODO: Use semantic token */',
    };
    return colors[type] || 'bg-muted';
  };

  const getPriorityColor = (priority: CheatCalEvent['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 /* TODO: Use semantic token */';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600 /* TODO: Use semantic token */';
      case 'low':
        return 'text-green-600 /* TODO: Use semantic token */';
      default:
        return 'text-muted-foreground';
    }
  };

  // Navigation handlers with sound feedback
  const navigateMonth = useCallback(
    (direction: 'prev' | 'next') => {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
      setCurrentDate(newDate);
      playSound?.('notification');
    },
    [currentDate, playSound]
  );

  const handleViewChange = useCallback(
    (view: typeof selectedView) => {
      setSelectedView(view);
      playSound?.('success');
    },
    [playSound]
  );

  // Professional event handlers with security
  const handleSecureEventCreate = useCallback(
    async (eventData: Partial<CalendarEvent>) => {
      try {
        // Input validation
        if (!validateEventData(eventData)) {
          console.error('Invalid event data provided');
          await playSound('error');
          return;
        }

        // Sanitize inputs
        const secureEventData: Partial<CalendarEvent> = {
          ...eventData,
          title: sanitizeUserInput(eventData.title || ''),
          description: eventData.description ? sanitizeUserInput(eventData.description) : undefined,
          location: eventData.location ? sanitizeUserInput(eventData.location) : undefined,
        };

        await createEvent(secureEventData);
        await playSound('success');
      } catch (error) {
        console.error('Failed to create event:', error);
        await playSound('error');
      }
    },
    [createEvent, playSound]
  );

  const handleSecureEventUpdate = useCallback(
    async (eventId: string, updates: Partial<CalendarEvent>) => {
      try {
        const secureUpdates: Partial<CalendarEvent> = {
          ...updates,
          title: updates.title ? sanitizeUserInput(updates.title) : undefined,
          description: updates.description ? sanitizeUserInput(updates.description) : undefined,
          location: updates.location ? sanitizeUserInput(updates.location) : undefined,
        };

        await updateEvent(eventId, secureUpdates);
        await playSound('success');
      } catch (error) {
        console.error('Failed to update event:', error);
        await playSound('error');
      }
    },
    [updateEvent, playSound]
  );

  const handleSecureEventDelete = useCallback(
    async (eventId: string) => {
      try {
        await deleteEvent(eventId);
        await playSound('notification');
      } catch (error) {
        console.error('Failed to delete event:', error);
        await playSound('error');
      }
    },
    [deleteEvent, playSound]
  );

  // Revenue calculations with security validation
  const totalDailyValue = displayEvents.reduce((sum, event) => {
    const impact = typeof event.revenueImpact === 'number' ? event.revenueImpact : 0;
    return sum + Math.max(0, impact); // Prevent negative values
  }, 0);
  const criticalEvents = displayEvents.filter((event) => event.priority === 'critical').length;

  // Format functions
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Professional Header - Sunsama-inspired clean design */}
      <motion.header
        className="border-b border-border bg-card"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left Section - Branding & Navigation */}
          <div className="flex items-center space-x-6">
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center space-x-3">
              <Brain className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Command Center Enterprise</h1>
                <p className="text-xs text-muted-foreground">AI Coordination Platform</p>
              </div>
            </motion.div>

            <Badge variant="outline">
              <Crown className="w-3 h-3 mr-1" />
              Professional
            </Badge>

            <Separator orientation="vertical" className="h-6" />

            {/* View Selector */}
            <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
              {['day', 'week', 'month', 'year'].map((view) => (
                <Button
                  key={view}
                  variant={selectedView === view ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange(view as any)}
                  className="h-8 px-3 text-xs font-medium capitalize transition-all"
                >
                  {view}
                </Button>
              ))}
            </div>
          </div>

          {/* Center - Date Navigation */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <motion.h2
                key={currentDate.toISOString()}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg font-semibold text-foreground min-w-[180px] text-center"
              >
                {getMonthYear(currentDate)}
              </motion.h2>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
            <Button
              variant={showAIPanel ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowAIPanel(!showAIPanel)}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Professional Sidebar - Revenue Focused */}
        <motion.aside
          className="w-80 border-r border-border bg-muted/30"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="p-6">
            {/* Revenue Metrics */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Revenue Coordination</h2>
                <Badge variant="outline">
                  <DollarSign className="w-3 h-3 mr-1" />${Math.round(totalDailyValue / 1000)}K
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground mb-4">{formatDate(new Date())}</div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Daily Value Impact</span>
                  <span className="text-sm font-medium text-green-600 /* TODO: Use semantic token */">
                    +${totalDailyValue.toLocaleString()}
                  </span>
                </div>
                <Progress value={78} className="h-1" />

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Efficiency Score</span>
                  <span className="text-sm font-medium text-blue-600 /* TODO: Use semantic token */">
                    94%
                  </span>
                </div>
                <Progress value={94} className="h-1" />
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Events List */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Today's Schedule</h3>
                <Badge variant="secondary" className="text-xs">
                  {displayEvents.length} events
                </Badge>
              </div>

              <ScrollArea className="h-[350px]">
                <div className="space-y-3">
                  {displayEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.2 }}
                      whileHover={{ scale: 1.02 }}
                      className="cursor-pointer"
                    >
                      <Card className="border-l-4 border-l-primary bg-card hover:bg-accent/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`}
                              />
                              <span className="font-medium text-sm text-foreground">
                                {event.title}
                              </span>
                            </div>
                            <span
                              className={`text-xs font-medium ${getPriorityColor(event.priority)}`}
                            >
                              {event.priority}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>•</span>
                              <span>{event.duration}</span>
                            </div>
                            {event.revenueImpact && (
                              <div className="flex items-center space-x-1 text-green-600 /* TODO: Use semantic token */">
                                <DollarSign className="h-3 w-3" />
                                <span>${Math.round(event.revenueImpact / 1000)}K</span>
                              </div>
                            )}
                          </div>

                          {event.location && (
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-2">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          )}

                          {event.attendees && (
                            <div className="flex items-center space-x-2">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <div className="flex -space-x-1">
                                {event.attendees.slice(0, 3).map((attendee, idx) => (
                                  <Avatar key={idx} className="h-5 w-5 border border-background">
                                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                      {attendee.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Target className="w-4 h-4 mr-2" />
                Optimize Schedule
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Revenue Analysis
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Find Coordinator
              </Button>
            </div>
          </div>
        </motion.aside>

        {/* Main Calendar Area */}
        <div className="flex-1">
          {/* Tab Navigation */}
          <div className="border-b border-border bg-card">
            <Tabs value={activePanel} onValueChange={(value) => setActivePanel(value as any)}>
              <TabsList className="grid w-full grid-cols-4 bg-transparent border-0 rounded-none h-12">
                <TabsTrigger
                  value="calendar"
                  className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none transition-all"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger
                  value="ai-planner"
                  className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none transition-all"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  AI Planner
                </TabsTrigger>
                <TabsTrigger
                  value="insights"
                  className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none transition-all"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Insights
                </TabsTrigger>
                <TabsTrigger
                  value="coordination"
                  className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none transition-all"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Coordination
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Tab Content */}
          <div className="p-6 h-[calc(100%-3rem)]">
            <Tabs value={activePanel} className="h-full">
              {/* Calendar Tab */}
              <TabsContent value="calendar" className="h-full mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="w-5 h-5 text-primary" />
                          <span>Enterprise Calendar</span>
                          <Badge variant="outline">Linear Foundation</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLibraryTransitioner(!showLibraryTransitioner)}
                          >
                            <Layers className="w-4 h-4 mr-1" />
                            {showLibraryTransitioner ? 'Hide' : 'Show'} Libraries
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[calc(100%-4rem)] p-0">
                      {/* Command Workspace Calendar */}
                      <div className="h-full flex flex-col">
                          {/* Command Workspace Header */}
                          <div className="border-b border-border p-4">
                            <h3 className="text-lg font-semibold">Enterprise Calendar</h3>
                          </div>


                          {/* Command Workspace Calendar View */}
                          <div className="flex-1 relative overflow-hidden">
                            <ViewScaffold title="Enterprise Calendar">
                              <WeekView />
                            </ViewScaffold>
                          </div>

                          {/* Loading Overlay */}
                          {loading && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                <span className="text-sm text-muted-foreground">
                                  Loading calendar...
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* AI Planner Tab */}
              <TabsContent value="ai-planner" className="h-full mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Brain className="w-5 h-5 text-primary" />
                        <span>AI Revenue Coordination</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[calc(100%-4rem)]">
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center space-y-4">
                          <Brain className="h-16 w-16 mx-auto text-primary/50" />
                          <div>
                            <h3 className="text-lg font-medium text-foreground mb-2">
                              AI Revenue Planner
                            </h3>
                            <p className="text-sm">
                              Professional coordination optimization interface
                              <br />
                              (Integration with existing PlannerInterface.tsx)
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="h-full mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <TrendingUp className="w-5 h-5 text-green-600 /* TODO: Use semantic token */" />
                          <span>Revenue Impact</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600 /* TODO: Use semantic token */ mb-2">
                          +${Math.floor(totalDailyValue).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Today's coordination optimization value
                        </div>
                        <div className="mt-4">
                          <div className="text-xs text-muted-foreground mb-1">
                            Performance vs Target
                          </div>
                          <Progress value={78} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Activity className="w-5 h-5 text-blue-600 /* TODO: Use semantic token */" />
                          <span>System Performance</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600 /* TODO: Use semantic token */ mb-2">
                          112 FPS
                        </div>
                        <div className="text-sm text-muted-foreground">Animation performance</div>
                        <div className="mt-4">
                          <div className="text-xs text-muted-foreground mb-1">System Health</div>
                          <Progress value={94} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Performance & Security Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Activity className="w-5 h-5 text-blue-600 /* TODO: Use semantic token */" />
                          <span>System Status</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Calendar Events</div>
                            <div className="text-2xl font-bold text-blue-600 /* TODO: Use semantic token */">
                              {events.length}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Security Status</div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-600 /* TODO: Use semantic token */ rounded-full"></div>
                              <span className="text-sm text-green-600 /* TODO: Use semantic token */ font-medium">
                                Secure
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Input Validation</div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-600 /* TODO: Use semantic token */ rounded-full"></div>
                              <span className="text-sm text-green-600 /* TODO: Use semantic token */ font-medium">
                                Active
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">XSS Protection</div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-600 /* TODO: Use semantic token */ rounded-full"></div>
                              <span className="text-sm text-green-600 /* TODO: Use semantic token */ font-medium">
                                Enabled
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Sparkles className="w-5 h-5 text-purple-600 /* TODO: Use semantic token */" />
                          <span>AI Insights</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            {
                              title: 'Schedule Optimization Opportunity',
                              description:
                                'Moving the 2PM client call to 1:30PM could save $1,247 in coordination costs',
                              impact: 'High',
                              confidence: 94,
                            },
                            {
                              title: 'Focus Block Recommendation',
                              description:
                                'Consolidating deep work sessions could increase output by 23%',
                              impact: 'Medium',
                              confidence: 87,
                            },
                            {
                              title: 'Security Validation Active',
                              description:
                                'All user inputs are sanitized and validated in real-time',
                              impact: 'Critical',
                              confidence: 100,
                            },
                          ].map((insight, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-3 rounded border border-border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-medium text-foreground">
                                  {insight.title}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <Badge
                                    variant={
                                      insight.impact === 'Critical' ? 'destructive' : 'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {insight.impact}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {insight.confidence}%
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {insight.description}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Coordination Tab */}
              <TabsContent value="coordination" className="h-full mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-primary" />
                        <span>Team Coordination</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[calc(100%-4rem)]">
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center space-y-4">
                          <Users className="h-16 w-16 mx-auto text-primary/50" />
                          <div>
                            <h3 className="text-lg font-medium text-foreground mb-2">
                              Coordination Management
                            </h3>
                            <p className="text-sm">
                              Team collaboration and service provider coordination
                              <br />
                              (AIConductorInterface integration point)
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Collapsible AI Panel - Notion-inspired */}
        <AnimatePresence>
          {showAIPanel && (
            <motion.aside
              className="w-96 border-l border-border bg-card"
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '24rem' }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-foreground">AI Assistant</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAIPanel(false)}
                    className="h-6 w-6 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>

                {/* AI Status */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">AI Processing</span>
                    <Badge variant="outline">
                      <div className="w-2 h-2 bg-green-600 /* TODO: Use semantic token */ rounded-full mr-2 animate-pulse" />
                      Active
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>System Load</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* AI Tools */}
                <div className="space-y-3 mb-6">
                  <h4 className="font-medium text-sm text-foreground">Available Tools</h4>
                  <div className="space-y-2">
                    {[
                      {
                        name: 'Revenue Calculator',
                        icon: DollarSign,
                        desc: 'Calculate ROI and impact',
                      },
                      {
                        name: 'Conflict Detector',
                        icon: Zap,
                        desc: 'Identify scheduling conflicts',
                      },
                      {
                        name: 'Schedule Optimizer',
                        icon: Target,
                        desc: 'Optimize coordination flow',
                      },
                      {
                        name: 'Service Matching',
                        icon: Users,
                        desc: 'Find coordination specialists',
                      },
                    ].map((tool, index) => (
                      <motion.div
                        key={tool.name}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center space-x-3 p-2 rounded border border-border bg-background hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <tool.icon className="w-4 h-4 text-primary" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">{tool.name}</div>
                          <div className="text-xs text-muted-foreground">{tool.desc}</div>
                        </div>
                        <div className="w-2 h-2 bg-green-600 /* TODO: Use semantic token */ rounded-full" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Recent Activity */}
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-foreground mb-4">Recent Activity</h4>
                  <ScrollArea className="h-full">
                    <div className="space-y-3">
                      {[
                        { time: '2m ago', action: 'Optimized morning schedule', value: '$347' },
                        { time: '15m ago', action: 'Resolved calendar conflict', value: '$1,247' },
                        { time: '1h ago', action: 'Generated revenue projection', value: '$25K' },
                      ].map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-2 rounded bg-muted/50"
                        >
                          <div>
                            <div className="text-sm text-foreground">{activity.action}</div>
                            <div className="text-xs text-muted-foreground">{activity.time}</div>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-600 /* TODO: Use semantic token *//10 text-green-600 /* TODO: Use semantic token */"
                          >
                            +{activity.value}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
