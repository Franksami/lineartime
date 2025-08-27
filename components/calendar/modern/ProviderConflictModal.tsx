'use client';

/**
 * ProviderConflictModal - Multi-Provider Conflict Resolution UI
 *
 * Handles conflicts between calendar providers with intelligent resolution options,
 * visual diff comparison, and automated merge suggestions.
 *
 * Phase 5.0 Integration: AI-powered conflict detection and resolution
 */

import { cn } from '@/lib/utils';
import { differenceInMinutes, format, isSameDay } from 'date-fns';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  Info,
  MapPin,
  Merge,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
// UI Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

// Types
import type { Event } from '@/types/calendar';

interface ConflictEvent extends Event {
  providerId: string;
  providerName: string;
  lastModified?: Date;
  confidence?: number;
  isCanonical?: boolean;
}

interface ConflictResolution {
  type: 'keep_all' | 'merge' | 'keep_primary' | 'keep_secondary' | 'delete_duplicate' | 'manual';
  primaryEvent?: ConflictEvent;
  secondaryEvent?: ConflictEvent;
  mergedEvent?: Partial<Event>;
  notes?: string;
  applyToAll?: boolean;
}

interface ConflictGroup {
  id: string;
  type: 'duplicate' | 'overlap' | 'inconsistent_data' | 'provider_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  events: ConflictEvent[];
  suggestedResolution?: ConflictResolution;
  userResolution?: ConflictResolution;
  description: string;
  impact: string[];
}

interface ProviderConflictModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: Event[];
  onResolve: (resolutions: ConflictResolution[]) => void;
  onCancel?: () => void;
  providers?: Array<{
    id: string;
    name: string;
    priority: number;
  }>;
  enableAIAssist?: boolean;
  showAdvancedOptions?: boolean;
}

const PROVIDER_COLORS = {
  google: '#4285f4',
  microsoft: '#0078d4',
  apple: '#007aff',
  caldav: '#6b7280',
};

const PROVIDER_NAMES = {
  google: 'Google Calendar',
  microsoft: 'Microsoft Graph',
  apple: 'Apple CalDAV',
  caldav: 'Generic CalDAV',
};

export function ProviderConflictModal({
  open,
  onOpenChange,
  conflicts,
  onResolve,
  onCancel,
  providers = [],
  enableAIAssist = true,
  showAdvancedOptions = false,
}: ProviderConflictModalProps) {
  // System Integration
  const _tokens = useDesignTokens();
  const enhancedTheme = useEnhancedTheme();
  const tokenBridge = useMemo(() => new TokenBridge(enhancedTheme.theme), [enhancedTheme.theme]);

  const { getAccessibleLabel, announceToScreenReader } = useAccessibilityAAA();
  const { playSuccess, playError, playNotification } = useSoundEffects();
  const i18n = useI18n();

  // Component State
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map());
  const [showAIAssist, _setShowAIAssist] = useState(enableAIAssist);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [_expandedDetails, _setExpandedDetails] = useState<Set<string>>(new Set());
  const [previewMerge, setPreviewMerge] = useState<string | null>(null);

  // Process conflicts into organized groups
  const conflictGroups = useMemo(() => {
    const groups: ConflictGroup[] = [];

    // Group conflicts by similarity
    const processed = new Set<string>();

    conflicts.forEach((conflict, _index) => {
      if (processed.has(conflict.id)) return;

      const similarEvents = conflicts.filter(
        (other) =>
          other.id !== conflict.id &&
          !processed.has(other.id) &&
          // Same title and overlapping time
          ((other.title === conflict.title &&
            Math.abs(differenceInMinutes(new Date(other.startDate), new Date(conflict.startDate))) <
              60) ||
            // Same time, similar title
            (isSameDay(new Date(other.startDate), new Date(conflict.startDate)) &&
              other.title.toLowerCase().includes(conflict.title.toLowerCase().substr(0, 10))))
      );

      // Determine conflict type and severity
      let conflictType: ConflictGroup['type'] = 'duplicate';
      let severity: ConflictGroup['severity'] = 'medium';
      let description = '';
      let impact: string[] = [];

      if (similarEvents.length > 0) {
        const allEvents = [conflict, ...similarEvents] as ConflictEvent[];

        // Add provider information
        allEvents.forEach((event) => {
          const providerId = (event as any).providerId || 'unknown';
          (event as ConflictEvent).providerId = providerId;
          (event as ConflictEvent).providerName =
            PROVIDER_NAMES[providerId as keyof typeof PROVIDER_NAMES] || 'Unknown Provider';
        });

        // Analyze conflict characteristics
        const uniqueTitles = new Set(allEvents.map((e) => e.title));
        const uniqueTimes = new Set(allEvents.map((e) => e.startDate.toISOString()));
        const uniqueProviders = new Set(allEvents.map((e) => (e as ConflictEvent).providerId));

        if (uniqueTitles.size === 1 && uniqueTimes.size === 1) {
          conflictType = 'duplicate';
          severity = 'high';
          description = `Exact duplicate events across ${uniqueProviders.size} providers`;
          impact = ['Data redundancy', 'Sync overhead', 'User confusion'];
        } else if (uniqueTimes.size === 1 && uniqueTitles.size > 1) {
          conflictType = 'inconsistent_data';
          severity = 'critical';
          description = 'Same time slot with different titles across providers';
          impact = ['Data inconsistency', 'Scheduling conflicts', 'Trust issues'];
        } else if (
          Math.abs(
            differenceInMinutes(new Date(allEvents[0].startDate), new Date(allEvents[1].startDate))
          ) < 30
        ) {
          conflictType = 'overlap';
          severity = 'medium';
          description = 'Overlapping events from different providers';
          impact = ['Scheduling conflicts', 'Double booking risk'];
        } else {
          conflictType = 'provider_mismatch';
          severity = 'low';
          description = 'Similar events with timing variations';
          impact = ['Minor sync discrepancies'];
        }

        // Generate AI suggestion if enabled
        let suggestedResolution: ConflictResolution | undefined;
        if (enableAIAssist) {
          suggestedResolution = generateAIResolution(allEvents, conflictType);
        }

        const group: ConflictGroup = {
          id: `conflict-${groups.length}`,
          type: conflictType,
          severity,
          events: allEvents,
          suggestedResolution,
          description,
          impact,
        };

        groups.push(group);

        // Mark events as processed
        allEvents.forEach((event) => processed.add(event.id));
      }
    });

    return groups.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [conflicts, enableAIAssist]);

  // Generate AI-powered resolution suggestion
  const generateAIResolution = (
    events: ConflictEvent[],
    conflictType: ConflictGroup['type']
  ): ConflictResolution => {
    const primaryEvent = events.reduce((prev, current) => {
      // Prefer events from higher-priority providers
      const prevPriority = providers.find((p) => p.id === prev.providerId)?.priority || 0;
      const currentPriority = providers.find((p) => p.id === current.providerId)?.priority || 0;

      if (currentPriority > prevPriority) return current;
      if (currentPriority < prevPriority) return prev;

      // If same priority, prefer more recent
      const prevTime = prev.lastModified || new Date(prev.startDate);
      const currentTime = current.lastModified || new Date(current.startDate);

      return currentTime > prevTime ? current : prev;
    });

    switch (conflictType) {
      case 'duplicate':
        return {
          type: 'keep_primary',
          primaryEvent,
          notes:
            'AI suggests keeping the event from the highest-priority provider and removing duplicates.',
        };

      case 'inconsistent_data': {
        // Create merged event with best data from each
        const mergedEvent: Partial<Event> = {
          id: primaryEvent.id,
          title: events.find((e) => e.title.length > 0)?.title || primaryEvent.title,
          startDate: primaryEvent.startDate,
          endDate: primaryEvent.endDate,
          description:
            events.find((e) => e.description && e.description.length > 0)?.description ||
            primaryEvent.description,
          location:
            events.find((e) => e.location && e.location.length > 0)?.location ||
            primaryEvent.location,
          category: primaryEvent.category,
        };

        return {
          type: 'merge',
          primaryEvent,
          mergedEvent,
          notes: 'AI suggests merging the best data from each event version.',
        };
      }

      case 'overlap':
        return {
          type: 'keep_all',
          notes:
            'AI suggests keeping all events as they appear to be legitimately separate despite overlap.',
        };

      case 'provider_mismatch':
        return {
          type: 'keep_primary',
          primaryEvent,
          notes: 'AI suggests keeping the version from the most reliable provider.',
        };

      default:
        return {
          type: 'manual',
          notes: 'AI suggests manual review due to complexity.',
        };
    }
  };

  // Handle resolution selection
  const handleResolutionChange = (groupId: string, resolution: ConflictResolution) => {
    setResolutions((prev) => new Map(prev.set(groupId, resolution)));
    playNotification();
  };

  // Preview merged event
  const handlePreviewMerge = (groupId: string) => {
    setPreviewMerge(groupId === previewMerge ? null : groupId);
    playNotification();
  };

  // Apply all resolutions
  const handleApplyResolutions = () => {
    const resolvedConflicts = Array.from(resolutions.values());

    if (resolvedConflicts.length === 0) {
      announceToScreenReader('No resolutions selected');
      playError();
      return;
    }

    onResolve(resolvedConflicts);
    playSuccess();

    announceToScreenReader(`Applied ${resolvedConflicts.length} conflict resolutions`);
  };

  // Auto-apply AI suggestions
  const handleAutoApplyAI = async () => {
    setIsAnalyzing(true);

    // Simulate AI analysis time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const aiResolutions = new Map<string, ConflictResolution>();
    conflictGroups.forEach((group) => {
      if (group.suggestedResolution) {
        aiResolutions.set(group.id, group.suggestedResolution);
      }
    });

    setResolutions(aiResolutions);
    setIsAnalyzing(false);
    playSuccess();

    announceToScreenReader(`AI applied ${aiResolutions.size} suggested resolutions`);
  };

  const currentGroup = conflictGroups[currentGroupIndex];
  const currentResolution = currentGroup ? resolutions.get(currentGroup.id) : undefined;

  if (!open || conflictGroups.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden"
        style={{
          backgroundColor: tokenBridge.getColorValue('modal.background'),
          borderColor: tokenBridge.getColorValue('modal.border'),
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle
              className="w-5 h-5"
              style={{ color: tokenBridge.getColorValue('status.warning.foreground') }}
            />
            {i18n.t('Providers.conflictResolution')}
            <Badge variant="secondary">
              {conflictGroups.length} {conflictGroups.length === 1 ? 'conflict' : 'conflicts'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[60vh]">
          {/* Conflict list sidebar */}
          <div
            className="w-80 border-r flex flex-col"
            style={{ borderColor: tokenBridge.getColorValue('modal.border') }}
          >
            <div
              className="p-3 border-b"
              style={{ borderColor: tokenBridge.getColorValue('modal.border') }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Conflicts Found</h3>

                {enableAIAssist && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoApplyAI}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isAnalyzing ? 'Analyzing...' : 'AI Assist'}
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {conflictGroups.map((group, index) => {
                  const isActive = index === currentGroupIndex;
                  const hasResolution = resolutions.has(group.id);
                  const severityColors = {
                    critical: tokenBridge.getColorValue('severity.critical'),
                    high: tokenBridge.getColorValue('severity.high'),
                    medium: tokenBridge.getColorValue('severity.medium'),
                    low: tokenBridge.getColorValue('severity.low'),
                  };

                  return (
                    <div
                      key={group.id}
                      className={cn(
                        'p-3 rounded border cursor-pointer transition-all',
                        isActive && 'ring-2'
                      )}
                      style={{
                        backgroundColor: isActive
                          ? tokenBridge.getColorValue('conflict.active.background')
                          : tokenBridge.getColorValue('conflict.item.background'),
                        borderColor: severityColors[group.severity],
                        ringColor: isActive
                          ? tokenBridge.getColorValue('conflict.active.ring')
                          : undefined,
                      }}
                      onClick={() => setCurrentGroupIndex(index)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Conflict ${index + 1}: ${group.description}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setCurrentGroupIndex(index);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant="outline"
                          className="capitalize"
                          style={{
                            borderColor: severityColors[group.severity],
                            color: severityColors[group.severity],
                          }}
                        >
                          {group.severity}
                        </Badge>

                        {hasResolution && (
                          <CheckCircle2
                            className="w-4 h-4"
                            style={{
                              color: tokenBridge.getColorValue('status.success.foreground'),
                            }}
                          />
                        )}
                      </div>

                      <div className="text-sm font-medium mb-1">{group.description}</div>
                      <div className="text-xs opacity-75">
                        {group.events.length} events affected
                      </div>

                      {/* Provider indicators */}
                      <div className="flex gap-1 mt-2">
                        {Array.from(new Set(group.events.map((e) => e.providerId))).map(
                          (providerId) => (
                            <div
                              key={providerId}
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  PROVIDER_COLORS[providerId as keyof typeof PROVIDER_COLORS],
                              }}
                              title={PROVIDER_NAMES[providerId as keyof typeof PROVIDER_NAMES]}
                            />
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main conflict details */}
          <div className="flex-1 flex flex-col">
            {currentGroup && (
              <>
                {/* Conflict header */}
                <div
                  className="p-4 border-b"
                  style={{ borderColor: tokenBridge.getColorValue('modal.border') }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {currentGroup.type.replace('_', ' ')}
                      </Badge>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: tokenBridge.getColorValue(
                            `severity.${currentGroup.severity}`
                          ),
                          color: tokenBridge.getColorValue(`severity.${currentGroup.severity}`),
                        }}
                      >
                        {currentGroup.severity} severity
                      </Badge>
                    </div>

                    <div className="text-sm opacity-75">
                      {currentGroupIndex + 1} of {conflictGroups.length}
                    </div>
                  </div>

                  <p className="text-sm">{currentGroup.description}</p>

                  {/* Impact indicators */}
                  {currentGroup.impact.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium mb-1">Impact:</div>
                      <div className="flex flex-wrap gap-1">
                        {currentGroup.impact.map((impact) => (
                          <Badge key={impact} variant="secondary" className="text-xs">
                            {impact}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Event comparison */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Conflicting events */}
                    <div>
                      <h4 className="font-medium mb-3">Conflicting Events</h4>
                      <div className="grid gap-3">
                        {currentGroup.events.map((event, _index) => (
                          <div
                            key={event.id}
                            className="border rounded-lg p-3"
                            style={{
                              backgroundColor: tokenBridge.getColorValue(
                                'event.comparison.background'
                              ),
                              borderColor:
                                PROVIDER_COLORS[event.providerId as keyof typeof PROVIDER_COLORS],
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      PROVIDER_COLORS[
                                        event.providerId as keyof typeof PROVIDER_COLORS
                                      ],
                                  }}
                                />
                                <span className="text-sm font-medium">{event.providerName}</span>
                                {event.isCanonical && (
                                  <Badge variant="default" className="text-xs">
                                    Primary
                                  </Badge>
                                )}
                              </div>

                              {event.lastModified && (
                                <span className="text-xs opacity-60">
                                  Modified {format(event.lastModified, 'MMM d, HH:mm')}
                                </span>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div>
                                <div className="text-sm font-medium">{event.title}</div>
                                {event.description && (
                                  <div className="text-xs opacity-75 mt-1">{event.description}</div>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-xs opacity-75">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(event.startDate, 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(event.startDate, 'HH:mm')} -{' '}
                                  {format(event.endDate, 'HH:mm')}
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resolution options */}
                    <div>
                      <h4 className="font-medium mb-3">Resolution Options</h4>

                      {/* AI suggestion */}
                      {currentGroup.suggestedResolution && showAIAssist && (
                        <div
                          className="border rounded-lg p-3 mb-3"
                          style={{
                            backgroundColor: tokenBridge.getColorValue('ai.suggestion.background'),
                            borderColor: tokenBridge.getColorValue('ai.suggestion.border'),
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Suggestion</span>
                          </div>
                          <p className="text-sm opacity-75 mb-3">
                            {currentGroup.suggestedResolution.notes}
                          </p>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleResolutionChange(
                                currentGroup.id,
                                currentGroup.suggestedResolution!
                              )
                            }
                          >
                            Apply AI Suggestion
                          </Button>
                        </div>
                      )}

                      {/* Manual resolution options */}
                      <RadioGroup
                        value={currentResolution?.type || ''}
                        onValueChange={(value) => {
                          const resolution: ConflictResolution = { type: value as any };

                          if (value === 'keep_primary' && currentGroup.events.length > 0) {
                            resolution.primaryEvent = currentGroup.events[0];
                          } else if (value === 'merge' && currentGroup.events.length >= 2) {
                            resolution.primaryEvent = currentGroup.events[0];
                            resolution.secondaryEvent = currentGroup.events[1];
                          }

                          handleResolutionChange(currentGroup.id, resolution);
                        }}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="keep_all" id="keep_all" />
                          <Label htmlFor="keep_all" className="flex items-center gap-2">
                            <Copy className="w-4 h-4" />
                            Keep all events as separate
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="keep_primary" id="keep_primary" />
                          <Label htmlFor="keep_primary" className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Keep primary event only
                          </Label>
                        </div>

                        {currentGroup.type === 'inconsistent_data' && (
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="merge" id="merge" />
                            <Label htmlFor="merge" className="flex items-center gap-2">
                              <Merge className="w-4 h-4" />
                              Merge event data
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreviewMerge(currentGroup.id)}
                                className="ml-2"
                              >
                                Preview
                              </Button>
                            </Label>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="delete_duplicate" id="delete_duplicate" />
                          <Label htmlFor="delete_duplicate" className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Delete duplicate events
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="manual" id="manual" />
                          <Label htmlFor="manual" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Manual review required
                          </Label>
                        </div>
                      </RadioGroup>

                      {/* Resolution notes */}
                      {currentResolution && (
                        <div className="mt-3">
                          <Label htmlFor="resolution-notes" className="text-sm">
                            Resolution Notes (Optional)
                          </Label>
                          <Textarea
                            id="resolution-notes"
                            placeholder="Add notes about this resolution..."
                            value={currentResolution.notes || ''}
                            onChange={(e) => {
                              const updatedResolution = {
                                ...currentResolution,
                                notes: e.target.value,
                              };
                              handleResolutionChange(currentGroup.id, updatedResolution);
                            }}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>

                    {/* Merge preview */}
                    {previewMerge === currentGroup.id && currentResolution?.type === 'merge' && (
                      <div
                        className="border rounded-lg p-3"
                        style={{
                          backgroundColor: tokenBridge.getColorValue('preview.background'),
                          borderColor: tokenBridge.getColorValue('preview.border'),
                        }}
                      >
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Merge Preview
                        </h4>

                        {/* Show what the merged event would look like */}
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium">Title:</span>
                            <div className="text-sm">{currentGroup.events[0].title}</div>
                          </div>

                          <div>
                            <span className="text-xs font-medium">Time:</span>
                            <div className="text-sm">
                              {format(currentGroup.events[0].startDate, 'MMM d, yyyy HH:mm')} -
                              {format(currentGroup.events[0].endDate, 'HH:mm')}
                            </div>
                          </div>

                          {currentGroup.events.some((e) => e.description) && (
                            <div>
                              <span className="text-xs font-medium">Description:</span>
                              <div className="text-sm">
                                {
                                  currentGroup.events.find(
                                    (e) => e.description && e.description.length > 0
                                  )?.description
                                }
                              </div>
                            </div>
                          )}

                          {currentGroup.events.some((e) => e.location) && (
                            <div>
                              <span className="text-xs font-medium">Location:</span>
                              <div className="text-sm">
                                {
                                  currentGroup.events.find(
                                    (e) => e.location && e.location.length > 0
                                  )?.location
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-75">
              {resolutions.size} of {conflictGroups.length} conflicts resolved
            </span>

            {showAdvancedOptions && (
              <Button variant="ghost" size="sm">
                Advanced Options
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onCancel?.();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={handleApplyResolutions}
              disabled={resolutions.size === 0}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Resolutions ({resolutions.size})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProviderConflictModal;
