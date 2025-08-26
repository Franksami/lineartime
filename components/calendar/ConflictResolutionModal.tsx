'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, Clock, MapPin, Users, FileText, RefreshCw, GitBranch } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { notify } from '@/components/ui/notify';
import { useAutoAnimate, useAutoAnimateModal } from '@/hooks/useAutoAnimate';

interface ConflictEvent {
  id?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    status?: string;
  }>;
  updated: string;
  source: string;
}

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictId: Id<"syncConflicts"> | null;
  localEvent: ConflictEvent | null;
  remoteEvent: ConflictEvent | null;
  baseEvent?: ConflictEvent | null;
  providerId: Id<"calendarProviders"> | null;
  onResolved?: () => void;
}

type ResolutionStrategy = 'local' | 'remote' | 'merge' | 'both';

export function ConflictResolutionModal({
  isOpen,
  onClose,
  conflictId,
  localEvent,
  remoteEvent,
  baseEvent,
  providerId,
  onResolved,
}: ConflictResolutionModalProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<ResolutionStrategy>('merge');
  const [mergedEvent, setMergedEvent] = useState<ConflictEvent | null>(null);
  const resolveConflict = useMutation(api.calendar.events.resolveSyncConflict);
  
  // AutoAnimate refs for smooth transitions
  const [modalContentRef] = useAutoAnimateModal();
  const [radioGroupRef] = useAutoAnimate({ duration: 200 });

  if (!localEvent || !remoteEvent || !conflictId || !providerId) {
    return null;
  }

  const handleResolve = async () => {
    try {
      let resolution: any;
      
      switch (selectedStrategy) {
        case 'local':
          resolution = {
            strategy: 'keep_local' as const,
            mergedData: localEvent,
          };
          break;
        case 'remote':
          resolution = {
            strategy: 'keep_remote' as const,
            mergedData: remoteEvent,
          };
          break;
        case 'merge':
          // Auto-merge: Take newer modifications for each field
          const merged = mergeEvents(localEvent, remoteEvent, baseEvent);
          resolution = {
            strategy: 'merge' as const,
            mergedData: merged,
          };
          setMergedEvent(merged);
          break;
        case 'both':
          resolution = {
            strategy: 'keep_both' as const,
          };
          break;
      }

      await resolveConflict({
        conflictId,
        resolution,
      });

      notify.success('Conflict resolved successfully');
      onResolved?.();
      onClose();
    } catch (error) {
      console.error('Error resolving conflict:', error);
      notify.error('Failed to resolve conflict');
    }
  };

  const formatDate = (dateStr: string, allDay: boolean) => {
    const date = parseISO(dateStr);
    return allDay 
      ? format(date, 'MMM d, yyyy')
      : format(date, 'MMM d, yyyy h:mm a');
  };

  const EventCard = ({ event, source }: { event: ConflictEvent; source: string }) => (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{event.title}</CardTitle>
          <Badge variant={source === 'Local' ? 'default' : 'secondary'}>
            {source}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Last updated: {format(parseISO(event.updated), 'MMM d, h:mm a')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span>{formatDate(event.startDate, event.allDay)} - {formatDate(event.endDate, event.allDay)}</span>
        </div>
        
        {event.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>{event.location}</span>
          </div>
        )}
        
        {event.description && (
          <div className="flex items-start gap-2">
            <FileText className="h-3 w-3 text-muted-foreground mt-0.5" />
            <span className="line-clamp-2">{event.description}</span>
          </div>
        )}
        
        {event.attendees && event.attendees.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>{event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Sync Conflict Detected
          </DialogTitle>
          <DialogDescription>
            This event has been modified in multiple places. Choose how to resolve the conflict.
          </DialogDescription>
        </DialogHeader>

        <div ref={modalContentRef} className="grid gap-4">
          {/* Show conflicting versions */}
          <div className="grid md:grid-cols-2 gap-4">
            <EventCard event={localEvent} source="Local" />
            <EventCard event={remoteEvent} source="Remote" />
          </div>

          {/* Resolution strategies */}
          <div className="space-y-4">
            <Label>Resolution Strategy</Label>
            <RadioGroup value={selectedStrategy} onValueChange={(value) => setSelectedStrategy(value as ResolutionStrategy)}>
              <div ref={radioGroupRef} className="space-y-3">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="local" id="local" />
                  <div className="grid gap-0.5">
                    <Label htmlFor="local" className="font-normal cursor-pointer">
                      Keep Local Version
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Use your local changes and discard remote updates
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="remote" id="remote" />
                  <div className="grid gap-0.5">
                    <Label htmlFor="remote" className="font-normal cursor-pointer">
                      Keep Remote Version
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Use remote changes and discard your local updates
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="merge" id="merge" />
                  <div className="grid gap-0.5">
                    <Label htmlFor="merge" className="font-normal cursor-pointer">
                      <span className="flex items-center gap-1">
                        Merge Changes <RefreshCw className="h-3 w-3" />
                      </span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically merge both versions, keeping the most recent changes for each field
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="both" id="both" />
                  <div className="grid gap-0.5">
                    <Label htmlFor="both" className="font-normal cursor-pointer">
                      <span className="flex items-center gap-1">
                        Keep Both <GitBranch className="h-3 w-3" />
                      </span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Create duplicate events to preserve both versions
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Show merged result preview */}
          {selectedStrategy === 'merge' && mergedEvent && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Merged Result Preview
              </h4>
              <div className="text-sm space-y-1">
                <p><strong>Title:</strong> {mergedEvent.title}</p>
                <p><strong>Time:</strong> {formatDate(mergedEvent.startDate, mergedEvent.allDay)} - {formatDate(mergedEvent.endDate, mergedEvent.allDay)}</p>
                {mergedEvent.location && <p><strong>Location:</strong> {mergedEvent.location}</p>}
                {mergedEvent.description && <p><strong>Description:</strong> {mergedEvent.description}</p>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleResolve}>
            Resolve Conflict
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to merge events based on most recent changes
function mergeEvents(
  local: ConflictEvent,
  remote: ConflictEvent,
  base?: ConflictEvent | null
): ConflictEvent {
  const merged: ConflictEvent = { ...local };

  // If we have a base version, we can do a proper three-way merge
  if (base) {
    // Compare each field and take the one that changed
    if (local.title !== base.title && remote.title === base.title) {
      merged.title = local.title;
    } else if (remote.title !== base.title && local.title === base.title) {
      merged.title = remote.title;
    } else if (local.title !== base.title && remote.title !== base.title) {
      // Both changed - use the more recently updated one
      merged.title = parseISO(local.updated) > parseISO(remote.updated) ? local.title : remote.title;
    }

    // Apply same logic to other fields
    if (local.description !== base.description && remote.description === base.description) {
      merged.description = local.description;
    } else if (remote.description !== base.description && local.description === base.description) {
      merged.description = remote.description;
    } else if (local.description !== base.description && remote.description !== base.description) {
      merged.description = parseISO(local.updated) > parseISO(remote.updated) ? local.description : remote.description;
    }

    // For dates, location, etc., apply the same pattern
    // ...
  } else {
    // Without a base, just use the more recently updated version for conflicts
    if (parseISO(remote.updated) > parseISO(local.updated)) {
      return remote;
    }
  }

  // Merge attendees (union of both lists)
  if (local.attendees || remote.attendees) {
    const attendeeMap = new Map<string, any>();
    [...(local.attendees || []), ...(remote.attendees || [])].forEach(attendee => {
      attendeeMap.set(attendee.email, attendee);
    });
    merged.attendees = Array.from(attendeeMap.values());
  }

  merged.updated = new Date().toISOString();
  merged.source = 'merged';

  return merged;
}