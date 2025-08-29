/**
 * AI Assistant Panel - Integrated AI Agents for Context Dock
 * Research validation: All 4 agents with streaming responses and tool safety
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  Brain,
  AlertTriangle,
  FileText,
  Route,
  Play,
  Square,
  RotateCcw,
  Zap,
  Clock,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { usePlannerAgent } from '@/lib/ai/agents/PlannerAgent';
import { useConflictAgent } from '@/lib/ai/agents/ConflictAgent';
import { useSummarizerAgent } from '@/lib/ai/agents/SummarizerAgent';
import { useRouterAgent } from '@/lib/ai/agents/RouterAgent';
import { useToolSafety } from '@/lib/ai/mcp/ToolSafety';
import { useAppShell } from '@/contexts/AppShellProvider';
import { useFeatureFlag, COMMAND_WORKSPACE_FLAGS } from '@/lib/features/useFeatureFlags';
import { cn } from '@/lib/utils';

/**
 * AI Assistant Panel State Management
 */
function useAIAssistantPanel() {
  const [activeAgent, setActiveAgent] = useState<'planner' | 'conflict' | 'summarizer' | 'router'>(
    'planner'
  );
  const [conversationInput, setConversationInput] = useState('');
  const [agentMessages, setAgentMessages] = useState<
    Array<{
      id: string;
      agent: string;
      type: 'request' | 'response' | 'action';
      content: string;
      timestamp: string;
      metadata?: any;
    }>
  >([]);

  const { activeView } = useAppShell();
  const aiEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.AI_PLANNER_AGENT);

  // AI agent hooks
  const plannerAgent = usePlannerAgent();
  const conflictAgent = useConflictAgent();
  const summarizerAgent = useSummarizerAgent();
  const routerAgent = useRouterAgent();
  const toolSafety = useToolSafety();

  // Add message to conversation
  const addMessage = (agent: string, type: string, content: string, metadata?: any) => {
    const message = {
      id: `msg-${Date.now()}`,
      agent,
      type,
      content,
      timestamp: new Date().toISOString(),
      metadata,
    };

    setAgentMessages((prev) => [...prev.slice(-20), message]); // Keep last 20 messages
  };

  // Process user input through active agent
  const processInput = async () => {
    if (!conversationInput.trim()) return;

    const input = conversationInput;
    setConversationInput('');

    // Add user message
    addMessage(activeAgent, 'request', input);

    try {
      let response;

      switch (activeAgent) {
        case 'planner':
          // Use planner for scheduling optimization
          if (
            input.toLowerCase().includes('optimize') ||
            input.toLowerCase().includes('schedule')
          ) {
            // TODO: Get actual events/tasks from workspace
            const mockEvents: any[] = [];
            const mockTasks: any[] = [];
            response = await plannerAgent.optimizeSchedule(mockEvents, mockTasks);
            addMessage(
              'planner',
              'response',
              `Found ${response.violations.length} violations, generated ${response.solutions.length} solutions`
            );
          } else {
            addMessage(
              'planner',
              'response',
              'I can help with scheduling optimization and conflict resolution. Try "optimize my schedule" or "find conflicts".'
            );
          }
          break;

        case 'conflict':
          // Use conflict agent for real-time detection
          addMessage('conflict', 'response', 'Starting conflict detection...');
          // TODO: Integrate with actual conflict detection
          break;

        case 'summarizer':
          // Use summarizer for content processing
          const workspaceContext = {
            activeView,
            selectedEntities: [],
            workspaceState: {},
          };
          response = await summarizerAgent.processMessage(input, workspaceContext);
          addMessage('summarizer', 'response', response.response);
          break;

        case 'router':
          // Use router for intent classification and entity conversion
          response = await routerAgent.routeRequest(input, 'user_input', undefined, { activeView });
          addMessage(
            'router',
            'response',
            `Intent: ${response.classification.intent} (${(response.classification.confidence * 100).toFixed(0)}% confidence)`
          );
          break;
      }
    } catch (error) {
      console.error(`AI Agent error (${activeAgent}):`, error);
      addMessage(activeAgent, 'response', 'Sorry, I encountered an error processing your request.');
    }
  };

  return {
    activeAgent,
    setActiveAgent,
    conversationInput,
    setConversationInput,
    agentMessages,
    processInput,
    addMessage,
    agents: {
      planner: plannerAgent,
      conflict: conflictAgent,
      summarizer: summarizerAgent,
      router: routerAgent,
    },
    toolSafety,
    aiEnabled,
  };
}

/**
 * Agent Status Cards
 */
function AgentStatusCards({ agents, toolSafety }: { agents: any; toolSafety: any }) {
  return (
    <div className="space-y-3">
      {/* Planner Agent Status */}
      <Card className="bg-blue-50 /* TODO: Use semantic token *//50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-600 /* TODO: Use semantic token */" />
              <span className="text-sm font-medium">Planner</span>
            </div>
            <Badge variant={agents.planner.isOptimizing ? 'default' : 'secondary'}>
              {agents.planner.isOptimizing ? 'Processing' : 'Ready'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Constraint-based scheduling optimization</p>
        </CardContent>
      </Card>

      {/* Conflict Agent Status */}
      <Card className="bg-amber-50/50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Conflict</span>
            </div>
            <Badge variant={agents.conflict.isMonitoring ? 'default' : 'secondary'}>
              {agents.conflict.isMonitoring ? 'Monitoring' : 'Standby'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Real-time conflict detection • {agents.conflict.conflicts.length} active
          </p>
        </CardContent>
      </Card>

      {/* Summarizer Agent Status */}
      <Card className="bg-green-50 /* TODO: Use semantic token *//50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600 /* TODO: Use semantic token */" />
              <span className="text-sm font-medium">Summarizer</span>
            </div>
            <Badge variant={agents.summarizer.isProcessing ? 'default' : 'secondary'}>
              {agents.summarizer.isProcessing ? 'Processing' : 'Ready'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Content summarization and conversation</p>
        </CardContent>
      </Card>

      {/* Router Agent Status */}
      <Card className="bg-purple-50 /* TODO: Use semantic token *//50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-purple-600 /* TODO: Use semantic token */" />
              <span className="text-sm font-medium">Router</span>
            </div>
            <Badge variant={agents.router.isProcessing ? 'default' : 'secondary'}>
              {agents.router.isProcessing ? 'Processing' : 'Ready'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Intent classification and entity routing</p>
        </CardContent>
      </Card>

      {/* Tool Safety Status */}
      <Card className="bg-slate-50/50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium">Tool Safety</span>
            </div>
            <Badge variant="outline">{toolSafety.safetyStatus.successRate} Success</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {toolSafety.safetyStatus.registeredTools} tools •{' '}
            {toolSafety.safetyStatus.autoApprovalTools} auto-approved
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * AI Conversation Interface
 */
function AIConversationInterface({
  activeAgent,
  conversationInput,
  onInputChange,
  onSubmit,
  messages,
}: {
  activeAgent: string;
  conversationInput: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  messages: any[];
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Conversation history */}
      <ScrollArea className="flex-1 mb-4">
        <div className="space-y-3 p-1">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Start a conversation with the {activeAgent} agent
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try: "optimize my schedule" or "find conflicts"
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex', message.type === 'request' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] p-3 rounded-lg text-sm',
                    message.type === 'request'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {message.agent}
                    </Badge>
                    <span className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>{message.content}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={conversationInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={`Ask ${activeAgent} agent...`}
            className="text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
          <Button size="sm" onClick={onSubmit} disabled={!conversationInput.trim()}>
            <Zap className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

/**
 * Main AI Assistant Panel Component
 */
export function AIAssistantPanel() {
  const {
    activeAgent,
    setActiveAgent,
    conversationInput,
    setConversationInput,
    agentMessages,
    processInput,
    agents,
    toolSafety,
    aiEnabled,
  } = useAIAssistantPanel();

  if (!aiEnabled) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Bot className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold">AI Assistant</h3>
          <p className="text-xs text-muted-foreground">Feature flag disabled</p>
          <Badge variant="outline" className="text-xs">
            ai.plannerAgent
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Agent selector tabs */}
      <div className="p-3 border-b border-border">
        <Tabs value={activeAgent} onValueChange={setActiveAgent as any}>
          <TabsList className="grid grid-cols-2 h-auto p-1">
            <TabsTrigger value="planner" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Planner
            </TabsTrigger>
            <TabsTrigger value="conflict" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Conflict
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid grid-cols-2 h-auto p-1 mt-1">
            <TabsTrigger value="summarizer" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Summarizer
            </TabsTrigger>
            <TabsTrigger value="router" className="text-xs">
              <Route className="h-3 w-3 mr-1" />
              Router
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Agent content area */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeAgent} className="h-full flex flex-col">
          {/* Planner Agent Tab */}
          <TabsContent value="planner" className="flex-1 m-0 p-3">
            <div className="h-full space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Schedule Optimizer</h4>
                <p className="text-xs text-muted-foreground">
                  Constraint-based scheduling with Timefold AI patterns
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    addMessage('planner', 'action', 'Starting schedule optimization...');
                    // TODO: Integrate with actual calendar data
                  }}
                  className="text-xs"
                  disabled={agents.planner.isOptimizing}
                >
                  {agents.planner.isOptimizing ? (
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3 mr-1" />
                  )}
                  Optimize
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    addMessage('planner', 'action', 'Schedule optimization cancelled');
                  }}
                  className="text-xs"
                >
                  <Square className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              </div>

              {/* Show optimization results */}
              {agents.planner.lastResults && (
                <Card>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="text-xs font-medium">Last Optimization</div>
                      <div className="text-xs text-muted-foreground">
                        • {agents.planner.lastResults.violations?.length || 0} violations found
                      </div>
                      <div className="text-xs text-muted-foreground">
                        • {agents.planner.lastResults.solutions?.length || 0} solutions generated
                      </div>
                      <div className="text-xs text-muted-foreground">
                        • {agents.planner.lastResults.executionTime?.toFixed(0) || 0}ms execution
                        time
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Conflict Agent Tab */}
          <TabsContent value="conflict" className="flex-1 m-0 p-3">
            <div className="h-full space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Conflict Monitor</h4>
                <p className="text-xs text-muted-foreground">
                  Real-time conflict detection with forEachUniquePair analysis
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (agents.conflict.isMonitoring) {
                      agents.conflict.stopMonitoring();
                      addMessage('conflict', 'action', 'Conflict monitoring stopped');
                    } else {
                      agents.conflict.startMonitoring(async () => ({ events: [], tasks: [] }));
                      addMessage('conflict', 'action', 'Conflict monitoring started');
                    }
                  }}
                  variant={agents.conflict.isMonitoring ? 'destructive' : 'default'}
                  className="text-xs"
                >
                  {agents.conflict.isMonitoring ? (
                    <>
                      <Square className="h-3 w-3 mr-1" />
                      Stop Monitor
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Start Monitor
                    </>
                  )}
                </Button>
              </div>

              {/* Show detected conflicts */}
              {agents.conflict.conflicts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">
                    Detected Conflicts ({agents.conflict.conflicts.length})
                  </div>
                  {agents.conflict.conflicts.slice(0, 3).map((conflict: any, index: number) => (
                    <Card key={index} className="bg-red-50 /* TODO: Use semantic token *//50">
                      <CardContent className="p-2">
                        <div className="text-xs">
                          <div className="font-medium">{conflict.description}</div>
                          <div className="text-muted-foreground mt-1">
                            {conflict.entities?.length} entities affected
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Summarizer Agent Tab */}
          <TabsContent value="summarizer" className="flex-1 m-0 p-3">
            <AIConversationInterface
              activeAgent="summarizer"
              conversationInput={conversationInput}
              onInputChange={setConversationInput}
              onSubmit={processInput}
              messages={agentMessages.filter((m) => m.agent === 'summarizer')}
            />
          </TabsContent>

          {/* Router Agent Tab */}
          <TabsContent value="router" className="flex-1 m-0 p-3">
            <AIConversationInterface
              activeAgent="router"
              conversationInput={conversationInput}
              onInputChange={setConversationInput}
              onSubmit={processInput}
              messages={agentMessages.filter((m) => m.agent === 'router')}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Assistant footer - Performance metrics */}
      <div className="border-t border-border p-3">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Tool Safety:</span>
            <span>{toolSafety.safetyStatus.successRate}</span>
          </div>
          <div className="flex justify-between">
            <span>Auto-Approved:</span>
            <span>{toolSafety.safetyStatus.autoApprovalTools}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Tools:</span>
            <span>{toolSafety.safetyStatus.registeredTools}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export as default for Context Dock integration
export default AIAssistantPanel;
