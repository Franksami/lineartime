/**
 * Omnibox Provider - Natural Language to Actions
 * Research validation: Rasa intent classification + Vercel AI SDK streaming
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertCircle, Check } from 'lucide-react';
import { CommandExecutor, type CommandDefinition } from '@/lib/commands/CommandRegistry';
import { useFeatureFlag, COMMAND_WORKSPACE_FLAGS } from '@/lib/features/useFeatureFlags';
import { cn } from '@/lib/utils';

/**
 * Intent classification interface (research: Rasa patterns)
 */
interface ParsedIntent {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  action?: {
    type: string;
    parameters: Record<string, any>;
  };
  suggestions?: Array<{
    title: string;
    description: string;
    action: () => void;
    confidence: number;
  }>;
}

/**
 * Omnibox state management
 */
function useOmnibox() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
  const omniboxEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.OMNIBOX_ENABLED);
  const streamingEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.OMNIBOX_STREAMING);

  const { completion, input, handleInputChange, handleSubmit, isLoading, stop } = useCompletion({
    api: '/api/omnibox',
    onFinish: async (result) => {
      try {
        const parsed: ParsedIntent = JSON.parse(result);
        setParsedIntent(parsed);

        // Auto-execute high confidence intents (research: Rasa ≥0.8 threshold)
        if (parsed.confidence >= 0.8 && parsed.action) {
          await executeIntent(parsed);
        }
      } catch (error) {
        console.error('Failed to parse omnibox result:', error);
        setParsedIntent({
          intent: 'error',
          confidence: 0,
          entities: {},
          suggestions: [
            {
              title: 'Try again',
              description: 'Could not understand the request',
              action: () => setIsExpanded(true),
              confidence: 0,
            },
          ],
        });
      }
    },
    onError: (error) => {
      console.error('Omnibox error:', error);
      setParsedIntent(null);
    },
  });

  const executeIntent = useCallback(async (intent: ParsedIntent) => {
    if (!intent.action) return;

    try {
      // Map intent actions to command registry commands
      const commandMap: Record<string, string> = {
        create_event: 'create.event',
        create_task: 'create.task',
        create_note: 'create.note',
        switch_view: 'navigate.view.week',
        toggle_ai: 'toggle.panel.ai',
        toggle_details: 'toggle.panel.details',
        resolve_conflicts: 'tool.resolve.conflicts',
        auto_schedule: 'tool.auto.schedule',
      };

      const commandId = commandMap[intent.action.type] || intent.action.parameters?.commandId;

      if (commandId) {
        const command = CommandExecutor.getCommandById(commandId);
        if (command) {
          await CommandExecutor.executeCommand(command, intent.entities);
          console.log('✅ Omnibox executed command:', commandId);
        } else {
          console.warn('Command not found:', commandId);
        }
      } else {
        console.log('Executing raw intent:', intent.action);
      }

      // Reset state after successful execution
      setParsedIntent(null);
      setIsExpanded(false);
    } catch (error) {
      console.error('Intent execution failed:', error);
    }
  }, []);

  return {
    isExpanded,
    setIsExpanded,
    parsedIntent,
    setParsedIntent,
    executeIntent,
    omniboxEnabled,
    streamingEnabled,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    completion,
  };
}

/**
 * Main Omnibox Component
 */
export function OmniboxProvider() {
  const {
    isExpanded,
    setIsExpanded,
    parsedIntent,
    executeIntent,
    omniboxEnabled,
    streamingEnabled,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    completion,
  } = useOmnibox();

  if (!omniboxEnabled) {
    return null;
  }

  return (
    <div className="relative">
      {/* Omnibox Input */}
      <div className={cn('transition-all duration-200', isExpanded ? 'w-96' : 'w-64')}>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type natural language commands..."
              className={cn(
                'font-mono text-sm pr-10',
                'focus:ring-2 focus:ring-primary',
                isLoading && 'pr-16'
              )}
              onFocus={() => setIsExpanded(true)}
              data-testid="omnibox-input"
            />

            {/* Loading indicator */}
            {isLoading && (
              <div
                className="absolute right-8 top-1/2 transform -translate-y-1/2"
                data-testid="omnibox-streaming"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}

            {/* Sparkles icon */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Sparkles
                className={cn(
                  'h-4 w-4 transition-colors',
                  isExpanded || input ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Intent Results (when expanded and has results) */}
      {isExpanded && (parsedIntent || completion) && (
        <Card className="absolute top-12 left-0 w-96 z-50 shadow-lg">
          <CardContent className="p-4">
            {/* Streaming response display */}
            {streamingEnabled && completion && !parsedIntent && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Processing...</span>
                </div>

                <div
                  className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg font-mono"
                  data-testid="omnibox-response"
                >
                  {completion}
                </div>
              </div>
            )}

            {/* Parsed intent display */}
            {parsedIntent && (
              <div className="space-y-3">
                {/* Intent confidence */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {parsedIntent.confidence >= 0.8 ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm font-medium" data-testid="omnibox-intent">
                      Intent: {parsedIntent.intent}
                    </span>
                  </div>

                  <Badge
                    variant={parsedIntent.confidence >= 0.8 ? 'default' : 'secondary'}
                    data-testid="omnibox-confidence"
                  >
                    {(parsedIntent.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>

                {/* Auto-execute notification */}
                {parsedIntent.confidence >= 0.8 && parsedIntent.action && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-green-800">
                      Auto-executing (confidence ≥80%)
                    </div>
                    <div className="text-xs text-green-600 mt-1">{parsedIntent.action.type}</div>
                  </div>
                )}

                {/* Manual confirmation required */}
                {parsedIntent.confidence < 0.8 && parsedIntent.suggestions && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Did you mean:</div>
                    {parsedIntent.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={suggestion.action}
                        data-testid="omnibox-suggestion"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{suggestion.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {suggestion.description}
                          </span>
                        </div>

                        <Badge variant="outline" className="ml-auto">
                          {(suggestion.confidence * 100).toFixed(0)}%
                        </Badge>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Entity extraction display */}
                {Object.keys(parsedIntent.entities).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                      Extracted Information:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(parsedIntent.entities).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Omnibox Performance Hook
 * Monitors NL processing performance against research targets
 */
export function useOmniboxPerformance() {
  const [processingTimes, setProcessingTimes] = useState<number[]>([]);

  const recordProcessingTime = useCallback((time: number) => {
    setProcessingTimes((prev) => {
      const newTimes = [...prev, time].slice(-10); // Keep last 10

      // Performance target: <400ms for first token (research validated)
      if (time > 400) {
        console.warn(`⚠️ Omnibox first token: ${time.toFixed(2)}ms (target: <400ms)`);
      }

      return newTimes;
    });
  }, []);

  return {
    recordProcessingTime,
    averageProcessingTime:
      processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0,
    isPerformant: processingTimes.length > 0 ? processingTimes.every((time) => time < 400) : true,
  };
}

/**
 * Example natural language patterns for development/testing
 */
export const EXAMPLE_OMNIBOX_PATTERNS = [
  'create meeting with Dan tomorrow at 3pm for 1 hour',
  'schedule focus time every morning 9-11am',
  'find conflicts in my calendar this week',
  "summarize yesterday's meetings",
  'convert this email to a task',
  'link this note to the project meeting',
  'auto-schedule my unscheduled tasks',
  'show me my capacity for next week',
];
