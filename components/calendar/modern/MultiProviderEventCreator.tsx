'use client';

/**
 * MultiProviderEventCreator - Cross-Provider Event Creation
 *
 * Allows users to create events that sync across multiple calendar providers
 * with intelligent provider selection, conflict detection, and scheduling optimization.
 *
 * Phase 5.0 Integration: AI-powered multi-provider event creation with smart defaults
 */

import { cn } from '@/lib/utils';
import { addHours, addMinutes, format, startOfHour } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Cloud,
  FileText,
  Globe,
  Info,
  MapPin,
  Monitor,
  Plus,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { useEnhancedTheme } from '@/lib/design-system/enhanced-theme';
// Design System Integration
import { TokenBridge, useDesignTokens } from '@/lib/design-system/utils/token-bridge';

// Accessibility Integration
import { useAccessibilityAAA } from '@/lib/accessibility';

// Sound Effects Integration
import { useSoundEffects } from '@/hooks/use-sound-effects';

// I18n Integration
import { useI18n } from '@/hooks/useI18n';

// Analytics Integration
import { useAnalytics } from '@/hooks/use-analytics';

// Types
import type { Event } from '@/types/calendar';

interface Provider {
  id: string;
  name: string;
  displayName: string;
  icon: React.ReactNode;
  isConnected: boolean;
  isHealthy: boolean;
  capabilities: {
    createEvents: boolean;
    updateEvents: boolean;
    deleteEvents: boolean;
    attachments: boolean;
    reminders: boolean;
    recurrence: boolean;
    guests: boolean;
    privacy: boolean;
  };
  limits: {
    maxTitle: number;
    maxDescription: number;
    maxGuests: number;
    maxAttachments: number;
  };
  syncLatency: number;
  successRate: number;
}

interface EventTemplate {
  title: string;
  description?: string;
  duration: number; // minutes
  location?: string;
  category: string;
  privacy: 'public' | 'private';
  reminders: number[]; // minutes before event
}

interface MultiProviderEventCreatorProps {
  date: Date;
  providers: string[];
  onEventCreate: (event: Partial<Event>, selectedProviders: string[]) => void;
  onCancel?: () => void;
  defaultTemplate?: EventTemplate;
  enableAIAssist?: boolean;
  enableBulkCreation?: boolean;
  showAdvancedOptions?: boolean;
  className?: string;
}

const PROVIDER_CONFIGS: Record<string, Provider> = {
  google: {
    id: 'google',
    name: 'Google Calendar',
    displayName: 'Google',
    icon: <Globe className="w-4 h-4" />,
    isConnected: true,
    isHealthy: true,
    capabilities: {
      createEvents: true,
      updateEvents: true,
      deleteEvents: true,
      attachments: true,
      reminders: true,
      recurrence: true,
      guests: true,
      privacy: true,
    },
    limits: {
      maxTitle: 1000,
      maxDescription: 8192,
      maxGuests: 100,
      maxAttachments: 25,
    },
    syncLatency: 30,
    successRate: 0.99,
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft Graph',
    displayName: 'Microsoft',
    icon: <Monitor className="w-4 h-4" />,
    isConnected: true,
    isHealthy: true,
    capabilities: {
      createEvents: true,
      updateEvents: true,
      deleteEvents: true,
      attachments: true,
      reminders: true,
      recurrence: true,
      guests: true,
      privacy: true,
    },
    limits: {
      maxTitle: 255,
      maxDescription: 2048,
      maxGuests: 500,
      maxAttachments: 150,
    },
    syncLatency: 45,
    successRate: 0.97,
  },
  apple: {
    id: 'apple',
    name: 'Apple CalDAV',
    displayName: 'Apple',
    icon: <Smartphone className="w-4 h-4" />,
    isConnected: true,
    isHealthy: true,
    capabilities: {
      createEvents: true,
      updateEvents: true,
      deleteEvents: true,
      attachments: false,
      reminders: true,
      recurrence: true,
      guests: true,
      privacy: false,
    },
    limits: {
      maxTitle: 500,
      maxDescription: 1024,
      maxGuests: 50,
      maxAttachments: 0,
    },
    syncLatency: 60,
    successRate: 0.95,
  },
  caldav: {
    id: 'caldav',
    name: 'Generic CalDAV',
    displayName: 'CalDAV',
    icon: <Cloud className="w-4 h-4" />,
    isConnected: false,
    isHealthy: true,
    capabilities: {
      createEvents: true,
      updateEvents: true,
      deleteEvents: true,
      attachments: false,
      reminders: true,
      recurrence: true,
      guests: false,
      privacy: false,
    },
    limits: {
      maxTitle: 200,
      maxDescription: 512,
      maxGuests: 0,
      maxAttachments: 0,
    },
    syncLatency: 120,
    successRate: 0.92,
  },
};

const EVENT_CATEGORIES = [
  { id: 'personal', name: 'Personal', color: '#6366f1' },
  { id: 'work', name: 'Work', color: '#059669' },
  { id: 'meeting', name: 'Meeting', color: '#dc2626' },
  { id: 'appointment', name: 'Appointment', color: '#7c3aed' },
  { id: 'travel', name: 'Travel', color: '#ea580c' },
  { id: 'other', name: 'Other', color: '#6b7280' },
];

const QUICK_DURATIONS = [
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 90, label: '1.5 hours' },
  { minutes: 120, label: '2 hours' },
  { minutes: 480, label: 'All day' },
];

const REMINDER_PRESETS = [
  { minutes: 0, label: 'At time of event' },
  { minutes: 5, label: '5 minutes before' },
  { minutes: 15, label: '15 minutes before' },
  { minutes: 30, label: '30 minutes before' },
  { minutes: 60, label: '1 hour before' },
  { minutes: 1440, label: '1 day before' },
];

export function MultiProviderEventCreator({
  date,
  providers = [],
  onEventCreate,
  onCancel,
  defaultTemplate,
  enableAIAssist = true,
  enableBulkCreation = false,
  showAdvancedOptions = false,
  className,
}: MultiProviderEventCreatorProps) {
  // System Integration
  const _tokens = useDesignTokens();
  const enhancedTheme = useEnhancedTheme();
  const tokenBridge = useMemo(() => new TokenBridge(enhancedTheme.theme), [enhancedTheme.theme]);

  const { getAccessibleLabel, announceToScreenReader } = useAccessibilityAAA();
  const { playSuccess, playError, playNotification } = useSoundEffects();
  const _i18n = useI18n();
  const analytics = useAnalytics();

  // Component State
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState<'providers' | 'event' | 'review' | 'creating'>('providers');
  const [selectedProviders, setSelectedProviders] = useState<string[]>(
    providers.filter((p) => PROVIDER_CONFIGS[p]?.isConnected)
  );
  const [eventData, setEventData] = useState<Partial<Event>>({
    title: defaultTemplate?.title || '',
    description: defaultTemplate?.description || '',
    startDate: defaultTemplate ? date : startOfHour(addHours(date, 1)),
    endDate: defaultTemplate
      ? addMinutes(date, defaultTemplate.duration)
      : startOfHour(addHours(date, 2)),
    location: defaultTemplate?.location || '',
    category: defaultTemplate?.category || 'personal',
  });

  // Advanced options state
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedOptions);
  const [customReminders, setCustomReminders] = useState<number[]>(
    defaultTemplate?.reminders || [15]
  );
  const [privacy, setPrivacy] = useState<'public' | 'private'>(
    defaultTemplate?.privacy || 'private'
  );
  const [_recurrence, _setRecurrence] = useState<string | null>(null);
  const [guests, _setGuests] = useState<string[]>([]);
  const [syncSettings, _setSyncSettings] = useState({
    waitForSync: true,
    rollbackOnFailure: true,
    retryFailures: true,
    consolidateConflicts: true,
  });

  // AI and validation state
  const [aiSuggestions, setAISuggestions] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState<
    Record<string, 'pending' | 'creating' | 'success' | 'error'>
  >({});

  // Available providers based on provided list
  const availableProviders = useMemo(() => {
    return providers.map((id) => PROVIDER_CONFIGS[id]).filter(Boolean);
  }, [providers]);

  // Calculate capabilities intersection
  const sharedCapabilities = useMemo(() => {
    if (selectedProviders.length === 0) return null;

    const selectedConfigs = selectedProviders.map((id) => PROVIDER_CONFIGS[id]).filter(Boolean);

    const capabilities = {
      attachments: selectedConfigs.every((p) => p.capabilities.attachments),
      reminders: selectedConfigs.every((p) => p.capabilities.reminders),
      recurrence: selectedConfigs.every((p) => p.capabilities.recurrence),
      guests: selectedConfigs.every((p) => p.capabilities.guests),
      privacy: selectedConfigs.every((p) => p.capabilities.privacy),
    };

    const limits = {
      maxTitle: Math.min(...selectedConfigs.map((p) => p.limits.maxTitle)),
      maxDescription: Math.min(...selectedConfigs.map((p) => p.limits.maxDescription)),
      maxGuests: Math.min(...selectedConfigs.map((p) => p.limits.maxGuests)),
      maxAttachments: Math.min(...selectedConfigs.map((p) => p.limits.maxAttachments)),
    };

    return { capabilities, limits };
  }, [selectedProviders]);

  // Validate event data
  const validateEvent = useMemo(() => {
    const errors: string[] = [];

    if (!eventData.title?.trim()) {
      errors.push('Event title is required');
    } else if (sharedCapabilities && eventData.title.length > sharedCapabilities.limits.maxTitle) {
      errors.push(
        `Title exceeds maximum length (${sharedCapabilities.limits.maxTitle} characters)`
      );
    }

    if (
      eventData.description &&
      sharedCapabilities &&
      eventData.description.length > sharedCapabilities.limits.maxDescription
    ) {
      errors.push(
        `Description exceeds maximum length (${sharedCapabilities.limits.maxDescription} characters)`
      );
    }

    if (eventData.startDate && eventData.endDate && eventData.startDate >= eventData.endDate) {
      errors.push('End time must be after start time');
    }

    if (
      guests.length > 0 &&
      sharedCapabilities &&
      guests.length > sharedCapabilities.limits.maxGuests
    ) {
      errors.push(`Too many guests (maximum ${sharedCapabilities.limits.maxGuests})`);
    }

    if (selectedProviders.length === 0) {
      errors.push('At least one provider must be selected');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [eventData, guests, selectedProviders, sharedCapabilities]);

  // AI suggestions for event optimization
  const generateAISuggestions = async () => {
    if (!enableAIAssist || !eventData.title) return;

    setIsAnalyzing(true);

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const suggestions = [];

    // Time optimization
    if (
      eventData.startDate &&
      eventData.startDate.getMinutes() !== 0 &&
      eventData.startDate.getMinutes() !== 30
    ) {
      suggestions.push({
        type: 'time_optimization',
        title: 'Round to nearest 30 minutes',
        description: 'Most calendar applications work better with 30-minute intervals',
        action: () => {
          const rounded = new Date(eventData.startDate!);
          rounded.setMinutes(rounded.getMinutes() < 30 ? 0 : 30, 0, 0);
          const duration = eventData.endDate
            ? eventData.endDate.getTime() - eventData.startDate?.getTime()
            : 3600000;
          setEventData((prev) => ({
            ...prev,
            startDate: rounded,
            endDate: new Date(rounded.getTime() + duration),
          }));
        },
      });
    }

    // Provider optimization
    if (selectedProviders.length > 2) {
      const fastestProviders = selectedProviders
        .map((id) => ({ id, latency: PROVIDER_CONFIGS[id].syncLatency }))
        .sort((a, b) => a.latency - b.latency)
        .slice(0, 2);

      suggestions.push({
        type: 'provider_optimization',
        title: 'Optimize provider selection',
        description: `Use only the fastest providers (${fastestProviders.map((p) => PROVIDER_CONFIGS[p.id].displayName).join(', ')}) for better sync performance`,
        action: () => {
          setSelectedProviders(fastestProviders.map((p) => p.id));
        },
      });
    }

    // Content enhancement
    if (eventData.title && eventData.title.length < 10) {
      suggestions.push({
        type: 'content_enhancement',
        title: 'Enhance event title',
        description:
          'Consider adding more descriptive information to help with searching and context',
        action: null,
      });
    }

    setAISuggestions(suggestions);
    setIsAnalyzing(false);

    if (suggestions.length > 0) {
      playNotification();
      announceToScreenReader(`AI found ${suggestions.length} suggestions to improve your event`);
    }
  };

  // Handle provider selection
  const handleProviderToggle = (providerId: string) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId]
    );

    playNotification();
  };

  // Handle event creation
  const handleCreateEvent = async () => {
    if (!validateEvent) return;

    setIsCreating(true);
    setStep('creating');

    // Initialize progress tracking
    const initialProgress: Record<string, 'pending' | 'creating' | 'success' | 'error'> = {};
    selectedProviders.forEach((id) => {
      initialProgress[id] = 'pending';
    });
    setCreationProgress(initialProgress);

    try {
      // Create event across selected providers
      for (const providerId of selectedProviders) {
        setCreationProgress((prev) => ({ ...prev, [providerId]: 'creating' }));

        // Simulate provider-specific event creation with realistic delays
        const provider = PROVIDER_CONFIGS[providerId];
        await new Promise((resolve) => setTimeout(resolve, provider.syncLatency * 10));

        // Simulate success/failure based on provider success rate
        const success = Math.random() < provider.successRate;

        setCreationProgress((prev) => ({
          ...prev,
          [providerId]: success ? 'success' : 'error',
        }));

        if (!success && syncSettings.rollbackOnFailure) {
          // In real implementation, would rollback previous successful creations
          console.log(`Rolling back due to failure in ${providerId}`);
        }
      }

      // Check if all providers succeeded
      const allSuccessful = selectedProviders.every((id) => creationProgress[id] === 'success');

      if (allSuccessful) {
        playSuccess();
        announceToScreenReader('Event created successfully across all providers');

        analytics.track('multi_provider_event_created', {
          providers: selectedProviders,
          duration:
            eventData.endDate && eventData.startDate
              ? (eventData.endDate.getTime() - eventData.startDate.getTime()) / 60000
              : 60,
          category: eventData.category,
          hasGuests: guests.length > 0,
          hasReminders: customReminders.length > 0,
        });

        onEventCreate(eventData, selectedProviders);
        setIsOpen(false);
      } else {
        playError();
        announceToScreenReader('Some providers failed to create the event');
      }
    } catch (error) {
      console.error('Event creation failed:', error);
      playError();
      announceToScreenReader('Event creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  // Auto-generate AI suggestions when event data changes
  useEffect(() => {
    if (enableAIAssist && eventData.title && step === 'event') {
      const debounceTimeout = setTimeout(generateAISuggestions, 500);
      return () => clearTimeout(debounceTimeout);
    }
  }, [eventData.title, eventData.startDate, selectedProviders, enableAIAssist, step]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className={cn('max-w-3xl max-h-[90vh] overflow-hidden', className)}
        style={{
          backgroundColor: tokenBridge.getColorValue('modal.background'),
          borderColor: tokenBridge.getColorValue('modal.border'),
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Multi-Provider Event
            <Badge variant="secondary">{format(date, 'MMM d, yyyy')}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-4 p-4 border-b">
            {(['providers', 'event', 'review'] as const).map((stepName, index) => (
              <div key={stepName} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    step === stepName ? 'ring-2' : '',
                    ['providers', 'event', 'review'].indexOf(step) > index
                      ? 'bg-green-500 text-white'
                      : step === stepName
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200'
                  )}
                  style={{
                    backgroundColor:
                      step === stepName
                        ? tokenBridge.getColorValue('step.active.background')
                        : ['providers', 'event', 'review'].indexOf(step) > index
                          ? tokenBridge.getColorValue('step.completed.background')
                          : tokenBridge.getColorValue('step.inactive.background'),
                    ringColor:
                      step === stepName ? tokenBridge.getColorValue('step.active.ring') : undefined,
                  }}
                >
                  {index + 1}
                </div>
                <span className="text-sm capitalize">{stepName}</span>
                {index < 2 && <div className="w-8 h-px bg-gray-300" />}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-6">
            {/* Step 1: Provider Selection */}
            {step === 'providers' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Select Calendar Providers</h3>
                  <p className="text-sm opacity-75">
                    Choose which calendars should contain this event
                  </p>
                </div>

                <div className="grid gap-3">
                  {availableProviders.map((provider) => {
                    const isSelected = selectedProviders.includes(provider.id);
                    const canSelect = provider.isConnected && provider.isHealthy;

                    return (
                      <Card
                        key={provider.id}
                        className={cn(
                          'cursor-pointer transition-all border-2',
                          isSelected && 'ring-2',
                          !canSelect && 'opacity-50 cursor-not-allowed'
                        )}
                        style={{
                          borderColor: isSelected
                            ? tokenBridge.getColorValue('provider.selected.border')
                            : tokenBridge.getColorValue('provider.card.border'),
                          ringColor: isSelected
                            ? tokenBridge.getColorValue('provider.selected.ring')
                            : undefined,
                        }}
                        onClick={() => canSelect && handleProviderToggle(provider.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {provider.icon}
                                <span className="font-medium">{provider.displayName}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {provider.isConnected ? (
                                  <Badge variant="default" className="text-xs">
                                    Connected
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Disconnected
                                  </Badge>
                                )}

                                {provider.isHealthy ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs opacity-75">
                              <span>{Math.round(provider.successRate * 100)}% reliability</span>
                              <span>{provider.syncLatency}ms sync</span>
                              <Checkbox checked={isSelected} disabled={!canSelect} readOnly />
                            </div>
                          </div>

                          {/* Provider capabilities */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {Object.entries(provider.capabilities).map(
                              ([capability, supported]) =>
                                supported && (
                                  <Badge key={capability} variant="outline" className="text-xs">
                                    {capability}
                                  </Badge>
                                )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {selectedProviders.length > 0 && sharedCapabilities && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Shared Capabilities</CardTitle>
                      <CardDescription className="text-xs">
                        Features available across all selected providers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Limits:</span>
                          <ul className="text-xs opacity-75 mt-1">
                            <li>Title: {sharedCapabilities.limits.maxTitle} chars</li>
                            <li>Description: {sharedCapabilities.limits.maxDescription} chars</li>
                            <li>Guests: {sharedCapabilities.limits.maxGuests}</li>
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium">Features:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(sharedCapabilities.capabilities).map(
                              ([capability, supported]) => (
                                <Badge
                                  key={capability}
                                  variant={supported ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {capability}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 2: Event Details */}
            {step === 'event' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Event Details</h3>
                    <p className="text-sm opacity-75">Configure your event information</p>
                  </div>

                  {enableAIAssist && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateAISuggestions}
                      disabled={isAnalyzing}
                      className="flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {isAnalyzing ? 'Analyzing...' : 'AI Assist'}
                    </Button>
                  )}
                </div>

                {/* AI Suggestions */}
                {aiSuggestions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {aiSuggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 rounded border">
                          <Info className="w-4 h-4 mt-0.5 text-blue-500" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{suggestion.title}</div>
                            <div className="text-xs opacity-75">{suggestion.description}</div>
                          </div>
                          {suggestion.action && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                suggestion.action();
                                playSuccess();
                              }}
                            >
                              Apply
                            </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Event form */}
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="event-title">Title *</Label>
                    <Input
                      id="event-title"
                      value={eventData.title || ''}
                      onChange={(e) => setEventData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter event title..."
                      maxLength={sharedCapabilities?.limits.maxTitle}
                    />
                    {sharedCapabilities && (
                      <div className="text-xs opacity-60 mt-1">
                        {(eventData.title || '').length} / {sharedCapabilities.limits.maxTitle}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time">Start Time</Label>
                      <Input
                        id="start-time"
                        type="datetime-local"
                        value={
                          eventData.startDate
                            ? format(eventData.startDate, "yyyy-MM-dd'T'HH:mm")
                            : ''
                        }
                        onChange={(e) =>
                          setEventData((prev) => ({
                            ...prev,
                            startDate: new Date(e.target.value),
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="end-time">End Time</Label>
                      <Input
                        id="end-time"
                        type="datetime-local"
                        value={
                          eventData.endDate ? format(eventData.endDate, "yyyy-MM-dd'T'HH:mm") : ''
                        }
                        onChange={(e) =>
                          setEventData((prev) => ({
                            ...prev,
                            endDate: new Date(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Quick duration buttons */}
                  <div>
                    <Label>Quick Duration</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {QUICK_DURATIONS.map((duration) => (
                        <Button
                          key={duration.minutes}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (eventData.startDate) {
                              setEventData((prev) => ({
                                ...prev,
                                endDate: addMinutes(eventData.startDate!, duration.minutes),
                              }));
                            }
                          }}
                        >
                          {duration.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="event-description">Description</Label>
                    <Textarea
                      id="event-description"
                      value={eventData.description || ''}
                      onChange={(e) =>
                        setEventData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Add event description..."
                      rows={3}
                      maxLength={sharedCapabilities?.limits.maxDescription}
                    />
                    {sharedCapabilities && (
                      <div className="text-xs opacity-60 mt-1">
                        {(eventData.description || '').length} /{' '}
                        {sharedCapabilities.limits.maxDescription}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="event-location">Location</Label>
                    <Input
                      id="event-location"
                      value={eventData.location || ''}
                      onChange={(e) =>
                        setEventData((prev) => ({ ...prev, location: e.target.value }))
                      }
                      placeholder="Add location..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="event-category">Category</Label>
                    <Select
                      value={eventData.category || 'personal'}
                      onValueChange={(value) =>
                        setEventData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_CATEGORIES.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Advanced options toggle */}
                  <div className="flex items-center gap-2">
                    <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                    <Label>Advanced Options</Label>
                  </div>

                  {/* Advanced options */}
                  {showAdvanced && (
                    <Card>
                      <CardContent className="pt-4 space-y-4">
                        {sharedCapabilities?.capabilities.privacy && (
                          <div>
                            <Label>Privacy</Label>
                            <Select
                              value={privacy}
                              onValueChange={(value: any) => setPrivacy(value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="private">Private</SelectItem>
                                <SelectItem value="public">Public</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {sharedCapabilities?.capabilities.reminders && (
                          <div>
                            <Label>Reminders</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {REMINDER_PRESETS.map((reminder) => (
                                <Button
                                  key={reminder.minutes}
                                  variant={
                                    customReminders.includes(reminder.minutes)
                                      ? 'default'
                                      : 'outline'
                                  }
                                  size="sm"
                                  onClick={() => {
                                    setCustomReminders((prev) =>
                                      prev.includes(reminder.minutes)
                                        ? prev.filter((m) => m !== reminder.minutes)
                                        : [...prev, reminder.minutes]
                                    );
                                  }}
                                >
                                  {reminder.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review & Create */}
            {step === 'review' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Review & Create</h3>
                  <p className="text-sm opacity-75">Confirm your event details before creation</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{eventData.title}</CardTitle>
                    {eventData.description && (
                      <CardDescription>{eventData.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {eventData.startDate && format(eventData.startDate, 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {eventData.startDate &&
                          eventData.endDate &&
                          `${format(eventData.startDate, 'HH:mm')} - ${format(eventData.endDate, 'HH:mm')}`}
                      </div>
                      {eventData.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {eventData.location}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: EVENT_CATEGORIES.find(
                              (c) => c.id === eventData.category
                            )?.color,
                          }}
                        />
                        {EVENT_CATEGORIES.find((c) => c.id === eventData.category)?.name}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Selected Providers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {selectedProviders.map((providerId) => {
                        const provider = PROVIDER_CONFIGS[providerId];
                        return (
                          <div
                            key={providerId}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div className="flex items-center gap-2">
                              {provider.icon}
                              <span className="text-sm">{provider.displayName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs opacity-75">
                              <span>{Math.round(provider.successRate * 100)}%</span>
                              <span>{provider.syncLatency}ms</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Validation errors */}
                {validationErrors.length > 0 && (
                  <Card className="border-red-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-red-700">
                            Please fix the following issues:
                          </div>
                          <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
                            {validationErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 4: Creating */}
            {step === 'creating' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Creating Event</h3>
                  <p className="text-sm opacity-75">Syncing across selected providers...</p>
                </div>

                <div className="space-y-3">
                  {selectedProviders.map((providerId) => {
                    const provider = PROVIDER_CONFIGS[providerId];
                    const status = creationProgress[providerId] || 'pending';

                    return (
                      <div
                        key={providerId}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div className="flex items-center gap-3">
                          {provider.icon}
                          <span className="text-sm font-medium">{provider.displayName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {status === 'pending' && <Badge variant="secondary">Waiting</Badge>}
                          {status === 'creating' && (
                            <Badge variant="outline" className="animate-pulse">
                              Creating...
                            </Badge>
                          )}
                          {status === 'success' && <Badge variant="default">Success</Badge>}
                          {status === 'error' && <Badge variant="destructive">Failed</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer with navigation */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="flex gap-2">
              {step !== 'providers' && step !== 'creating' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const steps = ['providers', 'event', 'review'] as const;
                    const currentIndex = steps.indexOf(step);
                    if (currentIndex > 0) {
                      setStep(steps[currentIndex - 1]);
                    }
                  }}
                >
                  Back
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  onCancel?.();
                  setIsOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>

            <div className="flex gap-2">
              {step === 'providers' && (
                <Button onClick={() => setStep('event')} disabled={selectedProviders.length === 0}>
                  Next: Event Details
                </Button>
              )}

              {step === 'event' && (
                <Button onClick={() => setStep('review')} disabled={!eventData.title?.trim()}>
                  Next: Review
                </Button>
              )}

              {step === 'review' && (
                <Button
                  onClick={handleCreateEvent}
                  disabled={!validateEvent || isCreating}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MultiProviderEventCreator;
