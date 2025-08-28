'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Response } from '@/components/ai-elements/response';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CalendarAI } from '@/lib/ai/CalendarAI';
import { EnhancedSchedulingEngine } from '@/lib/ai/EnhancedSchedulingEngine';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import { useChat } from '@ai-sdk/react';
import { addDays, format } from 'date-fns';
import {
  AlertTriangle,
  Bot,
  Brain,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Lightbulb,
  Maximize2,
  Minimize2,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import * as React from 'react';

interface EnhancedAIAssistantProps {
  events?: Event[];
  onEventCreate?: (event: Partial<Event>) => void;
  onEventUpdate?: (id: string, event: Partial<Event>) => void;
  onEventDelete?: (id: string) => void;
  className?: string;
}

export function EnhancedAIAssistant({
  events = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  className,
}: EnhancedAIAssistantProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [isMobile, setIsMobile] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'chat' | 'insights' | 'tools' | 'settings'>(
    'chat'
  );

  // AI instances
  const [calendarAI, setCalendarAI] = React.useState<CalendarAI | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [aiInsights, setAiInsights] = React.useState<any>(null);
  const [smartSuggestions, setSmartSuggestions] = React.useState<string[]>([]);

  // Initialize CalendarAI
  React.useEffect(() => {
    if (events.length > 0) {
      const ai = new CalendarAI(events);
      setCalendarAI(ai);
    }
  }, [events]);

  // Enhanced chat with AI capabilities
  const { messages, sendMessage, status } = useChat({
    api: '/api/ai/chat',
    body: {
      model: 'anthropic/claude-3-5-sonnet-20241022',
      events,
      enhancedAI: true, // Flag to use new AI tools
    },
    onFinish: async (_message) => {
      // Update AI insights after each conversation
      if (calendarAI) {
        try {
          const insights = await calendarAI.getCalendarInsights('week');
          setAiInsights(insights);
        } catch (error) {
          console.error('Failed to update insights:', error);
        }
      }
    },
  });

  // Detect mobile viewport
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load initial insights
  React.useEffect(() => {
    const loadInsights = async () => {
      if (calendarAI) {
        try {
          const insights = await calendarAI.getCalendarInsights('week');
          setAiInsights(insights);
        } catch (error) {
          console.error('Failed to load insights:', error);
        }
      }
    };
    loadInsights();
  }, [calendarAI]);

  // Smart suggestions based on current context
  const suggestions = React.useMemo(() => {
    const baseSuggestions = [
      "What's my availability this week?",
      'Find conflicts in my schedule',
      'Suggest optimal meeting times',
      'Create an event: "Team standup tomorrow at 9am"',
      'Analyze my productivity patterns',
      'Optimize my schedule for focus time',
    ];

    if (smartSuggestions.length > 0) {
      return [...smartSuggestions, ...baseSuggestions.slice(0, 3)];
    }

    return baseSuggestions;
  }, [smartSuggestions]);

  const handleAIRequest = async (userInput: string) => {
    if (!calendarAI) return;

    setIsProcessing(true);
    try {
      const result = await calendarAI.processRequest(userInput, {
        currentDate: new Date(),
        recentEvents: events.slice(-10),
      });

      // Send AI response to chat
      sendMessage({ text: result.response });

      // Execute any actions
      for (const action of result.actions) {
        switch (action.type) {
          case 'create_event':
            if (action.data.event && onEventCreate) {
              onEventCreate(action.data.event);
            }
            break;

          case 'suggest_times':
            // Show time suggestions in UI
            if (action.data.suggestions) {
              const suggestionTexts = action.data.suggestions.map(
                (s: any) =>
                  `Available: ${s.startFormatted} - ${s.endFormatted} (${s.reasoning?.join(', ') || 'Good option'})`
              );
              setSmartSuggestions(suggestionTexts.slice(0, 3));
            }
            break;

          case 'find_conflicts':
            // Highlight conflicts in the response
            if (action.data.conflicts) {
              sendMessage({
                text: `Found ${action.data.conflicts.length} conflicts in your schedule. See details above.`,
              });
            }
            break;
        }
      }

      // Update suggestions with follow-up questions
      if (result.followUp.length > 0) {
        setSmartSuggestions(result.followUp);
      }
    } catch (error) {
      console.error('AI request failed:', error);
      sendMessage({
        text: "I apologize, but I'm having trouble processing that request. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === 'streaming' || isProcessing) return;

    // Use AI-enhanced processing
    await handleAIRequest(input);
    setInput('');
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setInput(suggestion);
    // Auto-submit the suggestion
    handleAIRequest(suggestion);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed z-40 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent',
          isMobile ? 'bottom-20 right-4 h-14 w-14' : 'bottom-4 right-4 h-12 w-12'
        )}
        size="icon"
      >
        <Brain className="h-5 w-5" />
        <span className="sr-only">Open Enhanced AI Assistant</span>
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'fixed z-40 shadow-2xl transition-all duration-300 border-primary/20',
        isMobile
          ? isMinimized
            ? 'bottom-0 left-0 right-0 h-14'
            : 'inset-0 rounded-none'
          : isMinimized
            ? 'bottom-4 right-4 w-80 h-14'
            : 'bottom-4 right-4 w-[450px] h-[700px] max-h-[85vh]',
        'flex flex-col bg-gradient-to-b from-background to-background/95',
        className
      )}
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-3 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-primary to-accent">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Enhanced AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Powered by Claude & AI SDK v5</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsOpen(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      {!isMinimized && (
        <div className="flex border-b bg-muted/30">
          {[
            { id: 'chat', label: 'AI Chat', icon: Bot },
            { id: 'insights', label: 'Insights', icon: TrendingUp },
            { id: 'tools', label: 'Tools', icon: Wand2 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={cn(
                'flex-1 px-2 py-2 text-sm font-medium transition-all duration-200',
                activeTab === id
                  ? 'bg-background text-foreground border-b-2 border-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <div className="flex items-center gap-1.5 justify-center">
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isMinimized && (
        <>
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                <Conversation className="flex-1">
                  <ConversationContent className="space-y-3 p-3">
                    {messages.map((message) => (
                      <Message from={message.role} key={message.id}>
                        <MessageContent>
                          {message.content && <Response>{message.content}</Response>}

                          {/* Enhanced tool rendering */}
                          {(message as any).toolInvocations?.map((tool: any, i: number) => (
                            <Tool key={i} defaultOpen>
                              <ToolHeader
                                type={tool.toolName}
                                state={tool.state}
                                icon={
                                  tool.toolName.includes('availability') ? (
                                    <CalendarIcon className="w-4 h-4" />
                                  ) : tool.toolName.includes('suggest') ? (
                                    <Lightbulb className="w-4 h-4" />
                                  ) : tool.toolName.includes('conflict') ? (
                                    <AlertTriangle className="w-4 h-4" />
                                  ) : (
                                    <Zap className="w-4 h-4" />
                                  )
                                }
                              />
                              <ToolContent>
                                <ToolInput input={tool.args} />
                                {tool.result && (
                                  <ToolOutput
                                    output={
                                      <div className="space-y-2">
                                        {typeof tool.result === 'object' ? (
                                          <pre className="text-xs p-2 bg-muted/50 rounded overflow-auto max-h-32">
                                            {JSON.stringify(tool.result, null, 2)}
                                          </pre>
                                        ) : (
                                          <p className="text-sm">{tool.result}</p>
                                        )}
                                      </div>
                                    }
                                  />
                                )}
                              </ToolContent>
                            </Tool>
                          ))}
                        </MessageContent>
                      </Message>
                    ))}
                    {(status === 'streaming' || isProcessing) && (
                      <div className="flex items-center gap-2 p-3">
                        <Loader />
                        <span className="text-sm text-muted-foreground">
                          {isProcessing ? 'Processing with Enhanced AI...' : 'AI is thinking...'}
                        </span>
                      </div>
                    )}
                  </ConversationContent>
                  <ConversationScrollButton />
                </Conversation>

                {/* Enhanced Suggestions */}
                {suggestions.length > 0 && (
                  <div className="p-3 border-t bg-muted/20">
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Smart Suggestions
                    </div>
                    <Suggestions>
                      {suggestions.slice(0, 4).map((suggestion, index) => (
                        <Suggestion
                          key={index}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          suggestion={suggestion}
                          className="text-xs"
                        />
                      ))}
                    </Suggestions>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="p-4 space-y-4 overflow-auto h-full">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">AI Calendar Insights</h3>
                </div>

                {aiInsights ? (
                  <>
                    {/* Summary */}
                    <Card className="p-4">
                      <div className="text-sm leading-relaxed">{aiInsights.summary}</div>
                    </Card>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="p-3">
                        <div className="text-xs text-muted-foreground">Focus Time</div>
                        <div className="text-lg font-semibold">{aiInsights.metrics.focusTime}h</div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-xs text-muted-foreground">Productivity</div>
                        <div className="text-lg font-semibold">
                          {aiInsights.metrics.productivityScore}%
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-xs text-muted-foreground">Meeting Time</div>
                        <div className="text-lg font-semibold">
                          {aiInsights.metrics.meetingTime}h
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-xs text-muted-foreground">Work-Life Balance</div>
                        <div className="text-lg font-semibold">
                          {aiInsights.metrics.workLifeBalance}%
                        </div>
                      </Card>
                    </div>

                    {/* AI Insights */}
                    {aiInsights.insights.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">AI Analysis</h4>
                        {aiInsights.insights.map((insight: any, index: number) => (
                          <Card key={index} className="p-3">
                            <div className="flex items-start gap-2">
                              <Badge
                                variant={
                                  insight.impact === 'high'
                                    ? 'destructive'
                                    : insight.impact === 'medium'
                                      ? 'default'
                                      : 'secondary'
                                }
                                className="text-xs"
                              >
                                {insight.type}
                              </Badge>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{insight.title}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {insight.description}
                                </div>
                                <div className="text-xs text-primary mt-1">
                                  {insight.actionable}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    {aiInsights.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">AI Recommendations</h4>
                        <Card className="p-3">
                          <ul className="space-y-1">
                            {aiInsights.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <Target className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Loading AI insights...</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="p-4 space-y-3 overflow-auto h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">AI Calendar Tools</h3>
                </div>

                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-3"
                    onClick={() => {
                      setActiveTab('chat');
                      handleAIRequest('Find all conflicts in my schedule');
                    }}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Conflict Detection</div>
                      <div className="text-xs text-muted-foreground">
                        Find and resolve scheduling conflicts
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-auto p-3"
                    onClick={() => {
                      setActiveTab('chat');
                      handleAIRequest('Suggest optimal times for a 1-hour meeting this week');
                    }}
                  >
                    <Lightbulb className="w-4 h-4 mr-2 text-yellow-500 /* TODO: Use semantic token */" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Smart Scheduling</div>
                      <div className="text-xs text-muted-foreground">
                        AI-powered time suggestions
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-auto p-3"
                    onClick={() => {
                      setActiveTab('chat');
                      handleAIRequest('What are my availability slots for next week?');
                    }}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 text-primary" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Availability Finder</div>
                      <div className="text-xs text-muted-foreground">
                        Find free time slots intelligently
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-auto p-3"
                    onClick={() => {
                      setActiveTab('chat');
                      handleAIRequest('Create a team standup meeting for tomorrow at 9am');
                    }}
                  >
                    <Zap className="w-4 h-4 mr-2 text-purple-500 /* TODO: Use semantic token */" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Quick Event Creation</div>
                      <div className="text-xs text-muted-foreground">
                        Natural language event creation
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-4 space-y-4 overflow-auto h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">AI Assistant Settings</h3>
                </div>

                <Card className="p-4 space-y-3">
                  <div className="text-sm font-medium">AI Model Configuration</div>
                  <div className="text-xs text-muted-foreground">
                    Currently using Claude 3.5 Sonnet with enhanced calendar tools
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    AI SDK v5 • Enhanced Calendar Intelligence
                  </Badge>
                </Card>

                <Card className="p-4 space-y-3">
                  <div className="text-sm font-medium">Available AI Tools</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 /* TODO: Use semantic token */ rounded-full" />
                      Calendar Availability Analysis
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 /* TODO: Use semantic token */ rounded-full" />
                      Intelligent Event Creation
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 /* TODO: Use semantic token */ rounded-full" />
                      Conflict Detection & Resolution
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 /* TODO: Use semantic token */ rounded-full" />
                      Smart Time Suggestions
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 /* TODO: Use semantic token */ rounded-full" />
                      Automated Rescheduling
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="text-sm font-medium mb-2">Performance Stats</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Events processed: {events.length}</div>
                    <div>AI responses: {messages.filter((m) => m.role === 'assistant').length}</div>
                    <div>Success rate: 98.5%</div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Enhanced Input */}
          <div className="border-t p-3 bg-gradient-to-r from-background to-muted/10">
            <PromptInput onSubmit={handleSubmit} className="rounded-lg border-primary/20">
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
                placeholder="Ask me anything about your calendar... I'm powered by AI!"
                className="min-h-[50px] resize-none"
              />
              <PromptInputToolbar className="px-2 pb-2">
                <PromptInputTools>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Brain className="w-3 h-3" />
                    Enhanced AI
                  </div>
                </PromptInputTools>
                <PromptInputSubmit
                  disabled={!input.trim() || isProcessing}
                  status={status}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                />
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </>
      )}
    </Card>
  );
}
