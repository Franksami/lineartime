/**
 * CheatCal Enterprise Demo Page
 *
 * Demonstrates the comprehensive enterprise-grade interface that restores
 * all sophisticated functionality while adding AI coordination optimization.
 *
 * This showcases the "incredible vision" of the best calendar app with:
 * - 10-library calendar ecosystem
 * - Enhanced toolbar with motion animations
 * - AI Revenue Planner overlay
 * - Professional drag & drop system
 * - Multi-modal AI coordination
 * - Enterprise monitoring and controls
 *
 * @version CheatCal v1.0 Foundation
 */

'use client';

import { motion } from 'framer-motion';
import React, { useState, useEffect, useMemo } from 'react';

// Import the comprehensive enterprise interface
import CheatCalEnterpriseInterface from '@/components/enterprise/CheatCalEnterpriseInterface';

// Calendar provider system for 10-library support
import { CalendarProvider } from '@/components/calendar/providers/CalendarProvider';

// Mock data for demonstration
import type { CalendarEvent } from '@/components/calendar/providers/types';
import { CATEGORY_COLORS } from '@/components/ui/calendar';

import { Badge } from '@/components/ui/badge';
// UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Icons
import {
  ArrowLeft,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  MonitorSpeaker,
  Shield,
  Smartphone,
  Sparkles,
  Tablet,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

// Generate comprehensive demo events for showcasing capabilities
const generateDemoEvents = (): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const today = new Date();
  const categories = ['work', 'personal', 'health', 'social', 'learning'] as const;
  const priorities = ['low', 'medium', 'high', 'critical'] as const;

  // Generate events for the next 3 months
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Generate 1-3 events per day
    const eventsPerDay = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < eventsPerDay; j++) {
      const startHour = 8 + Math.floor(Math.random() * 10);
      const duration = [0.5, 1, 1.5, 2, 3][Math.floor(Math.random() * 5)];

      const start = new Date(date);
      start.setHours(startHour, j * 15, 0, 0);

      const end = new Date(start);
      end.setTime(start.getTime() + duration * 60 * 60 * 1000);

      const category = categories[Math.floor(Math.random() * categories.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];

      const eventTemplates = {
        work: [
          'Client Call',
          'Team Meeting',
          'Product Review',
          'Strategy Session',
          'Project Kickoff',
          'Sales Demo',
          'Board Meeting',
          'Code Review',
        ],
        personal: [
          'Workout',
          'Grocery Shopping',
          'Family Time',
          'Personal Project',
          'Doctor Appointment',
          'Lunch',
          'Errands',
          'Reading Time',
        ],
        health: [
          'Gym Session',
          'Yoga Class',
          'Medical Checkup',
          'Therapy',
          'Meditation',
          'Walk',
          'Physiotherapy',
          'Nutrition Planning',
        ],
        social: [
          'Coffee with Friends',
          'Dinner Party',
          'Networking Event',
          'Concert',
          'Movie Night',
          'Game Night',
          'Birthday Party',
          'Social Meetup',
        ],
        learning: [
          'Online Course',
          'Workshop',
          'Webinar',
          'Conference',
          'Study Session',
          'Tutorial',
          'Certification Exam',
          'Book Club',
        ],
      };

      const titles = eventTemplates[category];
      const title = titles[Math.floor(Math.random() * titles.length)];

      events.push({
        id: `event-${i}-${j}`,
        title,
        description: `${category} event scheduled for ${duration} hour${duration !== 1 ? 's' : ''}`,
        start,
        end,
        allDay: false,
        category,
        priority,
        backgroundColor: CATEGORY_COLORS[category] || CATEGORY_COLORS.personal,
        textColor: '#ffffff',
        borderColor: CATEGORY_COLORS[category] || CATEGORY_COLORS.personal,
        editable: true,
        location: j % 3 === 0 ? 'Office' : j % 3 === 1 ? 'Home' : 'Remote',
        attendees: Math.floor(Math.random() * 5) + 1,
        tags: [`tag-${j}`, category],
        extendedProps: {
          priority,
          estimatedRevenue: category === 'work' ? Math.floor(Math.random() * 50000) + 5000 : 0,
        },
      });
    }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
};

export default function CheatCalEnterprisePage() {
  const [demoEvents, setDemoEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeatures, setShowFeatures] = useState(false);

  // Initialize demo data
  useEffect(() => {
    const initializeDemo = async () => {
      setIsLoading(true);
      // Simulate loading time for dramatic effect
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const events = generateDemoEvents();
      setDemoEvents(events);
      setIsLoading(false);

      // Show features overview after a brief delay
      setTimeout(() => setShowFeatures(true), 2000);
    };

    initializeDemo();
  }, []);

  // Calculate demo metrics
  const metrics = useMemo(() => {
    const totalEvents = demoEvents.length;
    const workEvents = demoEvents.filter((e) => e.category === 'work').length;
    const totalRevenue = demoEvents.reduce(
      (sum, event) => sum + (event.extendedProps?.estimatedRevenue || 0),
      0
    );
    const avgRevenuePerEvent = workEvents > 0 ? Math.floor(totalRevenue / workEvents) : 0;
    const categories = new Set(demoEvents.map((e) => e.category)).size;

    return {
      totalEvents,
      workEvents,
      totalRevenue,
      avgRevenuePerEvent,
      categories,
    };
  }, [demoEvents]);

  // Event handlers
  const handleEventCreate = (event: Partial<CalendarEvent>) => {
    const newEvent: CalendarEvent = {
      id: `new-${Date.now()}`,
      title: event.title || 'New Event',
      description: event.description || '',
      start: event.start || new Date(),
      end: event.end || new Date(),
      allDay: event.allDay || false,
      category: event.category || 'personal',
      priority: 'medium',
      backgroundColor: CATEGORY_COLORS[event.category || 'personal'],
      textColor: '#ffffff',
      borderColor: CATEGORY_COLORS[event.category || 'personal'],
      editable: true,
      ...event,
    };

    setDemoEvents((prev) =>
      [...prev, newEvent].sort((a, b) => a.start.getTime() - b.start.getTime())
    );
  };

  const handleEventUpdate = (event: CalendarEvent) => {
    setDemoEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, ...event } : e)));
  };

  const handleEventDelete = (eventId: string) => {
    setDemoEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            className="w-16 h-16 mx-auto"
          >
            <Calendar className="w-16 h-16 text-primary" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Initializing CheatCal Enterprise</h1>
            <p className="text-muted-foreground">Loading comprehensive calendar intelligence...</p>
          </div>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1 }}
            className="h-1 bg-primary rounded-full mx-auto max-w-xs"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">CheatCal Enterprise</h1>
                <p className="text-sm text-muted-foreground">
                  AI-Powered Coordination Optimization
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
              🧠 Quantum Calendar Intelligence
            </Badge>
            <Badge variant="outline">Live Demo</Badge>
          </div>
        </div>
      </div>

      {/* Demo Metrics Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted/30 border-b border-border"
      >
        <div className="flex items-center justify-center gap-8 p-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 /* TODO: Use semantic token */" />
            <span className="font-medium">{metrics.totalEvents.toLocaleString()} Events</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600 /* TODO: Use semantic token */" />
            <span className="font-medium">
              ${(metrics.totalRevenue / 1000).toFixed(0)}K Revenue
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600 /* TODO: Use semantic token */" />
            <span className="font-medium">{metrics.categories} Categories</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-600" />
            <span className="font-medium">287% AI Optimization</span>
          </div>
        </div>
      </motion.div>

      {/* Main Enterprise Interface */}
      <CalendarProvider>
        <CheatCalEnterpriseInterface
          events={demoEvents}
          onEventCreate={handleEventCreate}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          className="h-[calc(100vh-120px)]"
        />
      </CalendarProvider>

      {/* Features Showcase Overlay */}
      {showFeatures && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowFeatures(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-xl shadow-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Welcome to CheatCal Enterprise</h2>
              <p className="text-muted-foreground text-lg">
                The world's most sophisticated AI-powered calendar coordination platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                {
                  icon: Calendar,
                  title: '10-Library Ecosystem',
                  description:
                    'Seamlessly switch between FullCalendar, Toast UI, React Big Calendar, and 7 more professional libraries',
                  color: 'text-blue-600 /* TODO: Use semantic token */',
                },
                {
                  icon: TrendingUp,
                  title: 'AI Revenue Planner',
                  description:
                    'Real-time coordination optimization showing potential revenue increases up to 287%',
                  color: 'text-green-600 /* TODO: Use semantic token */',
                },
                {
                  icon: Brain,
                  title: 'AI Conductor System',
                  description:
                    'Multi-agent AI orchestration with conflict detection, capacity analysis, and smart scheduling',
                  color: 'text-purple-600 /* TODO: Use semantic token */',
                },
                {
                  icon: Zap,
                  title: 'Enhanced Drag & Drop',
                  description:
                    'Professional drag & drop with AI suggestions, templates, and conflict resolution',
                  color: 'text-orange-600',
                },
                {
                  icon: Shield,
                  title: 'Enterprise Security',
                  description:
                    'SOC 2, GDPR compliance with comprehensive audit logging and threat detection',
                  color: 'text-red-600 /* TODO: Use semantic token */',
                },
                {
                  icon: Users,
                  title: 'Multi-Modal Interface',
                  description:
                    'Voice commands, touch gestures, computer vision, and accessibility-first design',
                  color: 'text-indigo-600 /* TODO: Use semantic token */',
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <feature.icon className={cn('w-6 h-6', feature.color)} />
                    <h3 className="font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold">Quick Start Guide</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 /* TODO: Use semantic token */" />
                    <span>
                      <kbd className="bg-muted px-2 py-1 rounded">⌘R</kbd> - Open Revenue Planner
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 /* TODO: Use semantic token */" />
                    <span>
                      <kbd className="bg-muted px-2 py-1 rounded">⌘I</kbd> - Interface Controls
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 /* TODO: Use semantic token */" />
                    <span>
                      <kbd className="bg-muted px-2 py-1 rounded">⌘A</kbd> - AI Conductor
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 /* TODO: Use semantic token */" />
                    <span>
                      <kbd className="bg-muted px-2 py-1 rounded">⌘F</kbd> - Fullscreen Mode
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 /* TODO: Use semantic token */" />
                    <span>Click toolbar to switch between 10 calendar libraries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 /* TODO: Use semantic token */" />
                    <span>Drag & drop events with AI suggestions</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => setShowFeatures(false)} size="lg" className="px-8">
                Start Using CheatCal Enterprise
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
