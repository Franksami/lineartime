'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type ConflictResolution,
  type EventConflict,
  type SyncableEvent,
  offlineSyncManager,
} from '@/lib/offline-sync/OfflineSyncManager';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Merge,
  Palette,
  Smartphone,
  Tag,
  User,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: EventConflict[];
  onResolved: (resolutions: ConflictResolution[]) => void;
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflicts,
  onResolved,
}: ConflictResolutionDialogProps) {
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map());
  const [selectedStrategy, setSelectedStrategy] = useState<'local' | 'remote' | 'merge'>('merge');

  useEffect(() => {
    if (conflicts.length > 0 && !resolutions.has(conflicts[0].eventId)) {
      // Initialize with suggested resolutions
      const initialResolutions = new Map<string, ConflictResolution>();
      conflicts.forEach((conflict) => {
        initialResolutions.set(conflict.eventId, conflict.suggested);
      });
      setResolutions(initialResolutions);
    }
  }, [conflicts]);

  if (conflicts.length === 0) return null;

  const currentConflict = conflicts[currentConflictIndex];
  const currentResolution = resolutions.get(currentConflict.eventId);

  const handleStrategyChange = (strategy: 'local' | 'remote' | 'merge') => {
    setSelectedStrategy(strategy);

    let resolvedEvent: SyncableEvent;
    let resolutionDetails: string;

    switch (strategy) {
      case 'local':
        resolvedEvent = {
          ...currentConflict.localEvent,
          version:
            Math.max(currentConflict.localEvent.version, currentConflict.remoteEvent.version) + 1,
          lastModified: Date.now(),
        };
        resolutionDetails = 'Keep local changes, discard remote changes';
        break;

      case 'remote':
        resolvedEvent = {
          ...currentConflict.remoteEvent,
          version: currentConflict.remoteEvent.version + 1,
          lastModified: Date.now(),
        };
        resolutionDetails = 'Keep remote changes, discard local changes';
        break;
      default:
        resolvedEvent = currentConflict.suggested.resolvedEvent;
        resolutionDetails = 'Merge both versions intelligently';
        break;
    }

    const newResolution: ConflictResolution = {
      strategy,
      resolvedEvent,
      conflictReason: currentConflict.suggested.conflictReason,
      resolutionDetails,
    };

    setResolutions((prev) => new Map(prev).set(currentConflict.eventId, newResolution));
  };

  const handleNext = () => {
    if (currentConflictIndex < conflicts.length - 1) {
      setCurrentConflictIndex((prev) => prev + 1);
      const nextConflict = conflicts[currentConflictIndex + 1];
      const nextResolution = resolutions.get(nextConflict.eventId);
      if (nextResolution) {
        setSelectedStrategy(nextResolution.strategy as any);
      }
    }
  };

  const handlePrevious = () => {
    if (currentConflictIndex > 0) {
      setCurrentConflictIndex((prev) => prev - 1);
      const prevConflict = conflicts[currentConflictIndex - 1];
      const prevResolution = resolutions.get(prevConflict.eventId);
      if (prevResolution) {
        setSelectedStrategy(prevResolution.strategy as any);
      }
    }
  };

  const handleResolveAll = async () => {
    const resolutionArray = Array.from(resolutions.values());

    try {
      // Apply all resolutions
      for (const resolution of resolutionArray) {
        const eventId = conflicts.find(
          (c) => c.suggested === resolution || resolutions.get(c.eventId) === resolution
        )?.eventId;

        if (eventId) {
          await offlineSyncManager.resolveConflictManually(eventId, resolution);
        }
      }

      onResolved(resolutionArray);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to resolve conflicts:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getConflictTypeDescription = (type: EventConflict['conflictType']) => {
    switch (type) {
      case 'timestamp':
        return 'Both versions were modified at nearly the same time';
      case 'content':
        return 'The event content differs between versions';
      case 'deletion':
        return 'One version was deleted while the other was modified';
      case 'creation':
        return 'The event was created on multiple devices';
      default:
        return 'Unknown conflict type';
    }
  };

  const renderEventCard = (
    event: SyncableEvent,
    title: string,
    variant: 'local' | 'remote' | 'merged'
  ) => {
    const iconColor = {
      local: 'text-primary',
      remote: 'text-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */',
      merged: 'text-purple-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */',
    }[variant];

    const Icon = {
      local: User,
      remote: Smartphone,
      merged: Merge,
    }[variant];

    return (
      <Card className={selectedStrategy === variant ? 'ring-2 ring-primary' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-base flex items-center gap-2 ${iconColor}`}>
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
          <CardDescription>
            Modified: {formatTime(new Date(event.lastModified).toISOString())}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{event.title}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">
                {formatTime(event.startDate)} - {formatTime(event.endDate)}
              </span>
            </div>

            {event.description && (
              <div className="flex items-start gap-2">
                <FileText className="h-3 w-3 text-muted-foreground mt-0.5" />
                <span className="text-sm text-muted-foreground line-clamp-2">
                  {event.description}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Palette className="h-3 w-3 text-muted-foreground" />
              <div className="w-4 h-4 rounded border" style={{ backgroundColor: event.color }} />
              <span className="text-sm">{event.category || 'No category'}</span>
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {event.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />
            Resolve Sync Conflicts ({currentConflictIndex + 1} of {conflicts.length})
          </DialogTitle>
          <DialogDescription>
            {getConflictTypeDescription(currentConflict.conflictType)} - Choose how to resolve this
            conflict.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conflict Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Event: {currentConflict.localEvent.title}</Badge>
              <Badge
                variant={currentConflict.conflictType === 'content' ? 'destructive' : 'secondary'}
              >
                {currentConflict.conflictType} conflict
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentConflictIndex === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentConflictIndex + 1} / {conflicts.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentConflictIndex === conflicts.length - 1}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Resolution Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resolution Strategy</CardTitle>
              <CardDescription>Choose how you want to resolve this conflict</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedStrategy} onValueChange={handleStrategyChange}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="local" id="local" />
                    <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4 text-primary" />
                      Keep Local Version
                      <span className="text-sm text-muted-foreground">(Your changes)</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="remote" id="remote" />
                    <Label htmlFor="remote" className="flex items-center gap-2 cursor-pointer">
                      <Smartphone className="h-4 w-4 text-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />
                      Keep Remote Version
                      <span className="text-sm text-muted-foreground">
                        (Server/other device changes)
                      </span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="merge" id="merge" />
                    <Label htmlFor="merge" className="flex items-center gap-2 cursor-pointer">
                      <Merge className="h-4 w-4 text-purple-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />
                      Smart Merge
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Event Comparison */}
          <Tabs value={selectedStrategy} onValueChange={handleStrategyChange}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="local" className="flex items-center gap-2">
                <User className="h-3 w-3" />
                Local
              </TabsTrigger>
              <TabsTrigger value="remote" className="flex items-center gap-2">
                <Smartphone className="h-3 w-3" />
                Remote
              </TabsTrigger>
              <TabsTrigger value="merge" className="flex items-center gap-2">
                <Merge className="h-3 w-3" />
                Merged
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <TabsContent value="local" className="mt-0 col-span-full md:col-span-1">
                {renderEventCard(currentConflict.localEvent, 'Local Version', 'local')}
              </TabsContent>

              <TabsContent value="remote" className="mt-0 col-span-full md:col-span-1">
                {renderEventCard(currentConflict.remoteEvent, 'Remote Version', 'remote')}
              </TabsContent>

              <TabsContent value="merge" className="mt-0 col-span-full md:col-span-1">
                {currentResolution &&
                  renderEventCard(currentResolution.resolvedEvent, 'Merged Version', 'merged')}
              </TabsContent>
            </div>
          </Tabs>

          {/* Resolution Details */}
          {currentResolution && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resolution Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{currentResolution.resolutionDetails}</span>
                  </div>

                  {selectedStrategy === 'merge' && (
                    <div className="text-sm text-muted-foreground mt-2">
                      <strong>Merge logic:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        <li>Title: Most recent modification</li>
                        <li>Time: Latest time values</li>
                        <li>Description: Longest description</li>
                        <li>Tags: Combined from both versions</li>
                        <li>Category: Most recent modification</li>
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} to resolve
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveAll}>Resolve All Conflicts</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConflictResolutionDialog;
