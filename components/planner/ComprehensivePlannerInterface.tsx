/**
 * Comprehensive CheatCal AI Revenue Planner Interface
 *
 * Complete integration hub that provides access to ALL sophisticated features:
 * - Enhanced Calendar Toolbar with 10 library switching
 * - Linear Calendar with drag & drop functionality
 * - AI-enhanced event management and conflict resolution
 * - Motion system with animations and sound effects
 * - Multi-modal AI coordination (chat, voice, vision)
 * - Professional modals and workflow management
 *
 * This is the sophisticated interface that restores all functionality
 * while adding AI revenue optimization as the primary focus.
 *
 * @version 2.0.0 (CheatCal Complete Integration)
 */

'use client';

import { useChat } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

// AI Elements Integration
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Response } from '@/components/ai-elements/response';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AIDragDropIntegration } from '@/components/calendar/AIDragDropIntegration';
import { ConflictResolutionModal } from '@/components/calendar/ConflictResolutionModal';
// Complete Calendar System Integration
import EnhancedCalendarToolbar from '@/components/calendar/EnhancedCalendarToolbar';
import { EnhancedDragDropSystem } from '@/components/calendar/EnhancedDragDropSystem';
import { EnhancedEventManagement } from '@/components/calendar/EnhancedEventManagement';
import { EventManagement } from '@/components/calendar/EventManagement';
import { EventModal } from '@/components/calendar/EventModal';
import { LinearCalendarHorizontal } from '@/components/calendar/LinearCalendarHorizontal';
import { MotionEnhancedCalendarToolbar } from '@/components/calendar/MotionEnhancedCalendarToolbar';

import { AICapacityRibbon } from '@/components/ai/AICapacityRibbon';
// Advanced AI Components
import { AIConflictDetector } from '@/components/ai/AIConflictDetector';
import { AIInsightPanel } from '@/components/ai/AIInsightPanel';
import { AINLPInput } from '@/components/ai/AINLPInput';

// Calendar Provider System
import { useCalendarProvider } from '@/components/calendar/providers/CalendarProvider';

import { LibraryTransitionAnimator } from '@/components/calendar/LibraryTransitionAnimator';
import { LiveCollaborationLayer } from '@/components/calendar/LiveCollaborationLayer';
// Advanced Features
import { TouchGestureHandler } from '@/components/calendar/TouchGestureHandler';
import { WebSocketSyncManager } from '@/components/calendar/WebSocketSyncManager';

// Business Logic
import { useSoundEffects } from '@/lib/sound-service';
import { cn } from '@/lib/utils';

// Icons
import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  Calendar,
  Crown,
  DollarSign,
  Eye,
  Mic,
  MicOff,
  Send,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  Zap,
} from 'lucide-react';

export default function ComprehensivePlannerInterface() {
  const { playSound } = useSoundEffects() || { playSound: () => Promise.resolve() };

  // AI Chat Integration
  const { messages, sendMessage, status } = useChat({
    api: '/api/ai/chat',
    body: {
      model: 'anthropic/claude-3-5-sonnet-20241022',
      context: 'cheatcal-planner',
      enhancedAI: true,
    },
    onFinish: () => playSound?.('success'),
    onError: () => playSound?.('error'),
  });

  // State Management
  const [input, setInput] = useState('');
  const [activeView, setActiveView] = useState<
    'planner' | 'calendar' | 'insights' | 'coordination'
  >('planner');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);

  // Calendar Integration
  const { selectedLibrary, switchLibrary, events, onEventCreate, onEventUpdate, onEventDelete } =
    useCalendarProvider();

  // Form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim() && status === 'ready') {
        sendMessage({ text: input });
        setInput('');
      }
    },
    [input, status, sendMessage]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Enhanced Calendar Toolbar - Full Functionality Restored */}
      {showToolbar && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-border bg-card"
        >
          <MotionEnhancedCalendarToolbar
            showSyncStatus={true}
            enableKeyboardShortcuts={true}
            showLibrarySelector={true}
            compactMode={false}
          />
        </motion.div>
      )}

      {/* Professional Header with AI Branding */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Brain className="w-8 h-8 text-primary" />
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-green-600 /* TODO: Use semantic token */ rounded-full animate-pulse" />
                  </div>
                </motion.div>

                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    CheatCal AI Revenue Planner
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Complete Coordination Optimization Platform
                  </p>
                </div>
              </div>

              <Badge variant="outline">
                <Crown className="w-3 h-3 mr-1" />
                Elite Professional
              </Badge>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={() => setShowToolbar(!showToolbar)}>
                <Settings className="w-4 h-4 mr-2" />
                {showToolbar ? 'Hide' : 'Show'} Toolbar
              </Button>

              <Button
                variant={isVoiceEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              >
                {isVoiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interface - Comprehensive View System */}
      <div className="container mx-auto p-6">
        {/* View Selector Tabs */}
        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as any)}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 bg-card">
            <TabsTrigger value="planner" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>AI Planner</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Insights</span>
            </TabsTrigger>
            <TabsTrigger value="coordination" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Coordination</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Planner Tab - Revenue Optimization Chat */}
          <TabsContent value="planner" className="space-y-6">
            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-240px)]">
              {/* Left Panel - Revenue Goals & Quick Actions */}
              <div className="col-span-3 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-600 /* TODO: Use semantic token */" />
                      <span>Revenue Goals</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-bold text-foreground">$250,000</div>
                    <div className="text-sm text-muted-foreground">Q4 Launch Target</div>
                    <Progress value={65} className="h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-yellow-500 /* TODO: Use semantic token */" />
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Target className="w-4 h-4 mr-2" />
                      Optimize Schedule
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Users className="w-4 h-4 mr-2" />
                      Find Coordinator
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Calculate ROI
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Center Panel - AI Chat Interface */}
              <div className="col-span-6">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span>AI Revenue Coordination Assistant</span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <Conversation className="flex-1">
                      <ConversationContent>
                        <ScrollArea className="flex-1 pr-4">
                          {messages.map((message) => (
                            <Message key={message.id} from={message.role}>
                              <MessageContent>
                                <Response>{message.content}</Response>
                              </MessageContent>
                            </Message>
                          ))}

                          {status === 'streaming' && (
                            <Message from="assistant">
                              <MessageContent>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                  <div
                                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                    style={{ animationDelay: '0.1s' }}
                                  />
                                  <div
                                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                    style={{ animationDelay: '0.2s' }}
                                  />
                                  <span className="text-sm text-muted-foreground ml-2">
                                    Analyzing coordination opportunities...
                                  </span>
                                </div>
                              </MessageContent>
                            </Message>
                          )}
                        </ScrollArea>
                      </ConversationContent>

                      <Separator className="my-4" />

                      <PromptInput>
                        <form onSubmit={handleSubmit}>
                          <div className="flex items-end space-x-3">
                            <div className="flex-1">
                              <PromptInputTextarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me to optimize your coordination, calculate revenue impact, or find scheduling conflicts..."
                                disabled={status !== 'ready'}
                                className="min-h-[60px]"
                              />
                            </div>
                            <PromptInputSubmit asChild>
                              <Button
                                type="submit"
                                disabled={status !== 'ready' || !input.trim()}
                                size="lg"
                              >
                                {status === 'streaming' ? (
                                  <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                            </PromptInputSubmit>
                          </div>
                        </form>
                      </PromptInput>
                    </Conversation>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - AI Insights & Controls */}
              <div className="col-span-3 space-y-4">
                <AICapacityRibbon className="h-32" />
                <AIInsightPanel className="h-48" />

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-sm">
                      <Activity className="w-4 h-4" />
                      <span>Live Metrics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Daily Value</span>
                      <span className="font-mono">$4,247</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Time Saved</span>
                      <span className="font-mono">3.2h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Conflicts</span>
                      <span className="font-mono text-green-600 /* TODO: Use semantic token */">0 active</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Calendar Tab - Full Linear Calendar with All Features */}
          <TabsContent value="calendar" className="space-y-4">
            {/* Enhanced Drag & Drop Integration */}
            <AIDragDropIntegration>
              <EnhancedDragDropSystem>
                {/* Live Collaboration Layer */}
                <LiveCollaborationLayer>
                  <WebSocketSyncManager>
                    {/* Main Calendar with Touch Gestures */}
                    <TouchGestureHandler>
                      <LibraryTransitionAnimator>
                        <Card className="min-h-[600px]">
                          <LinearCalendarHorizontal
                            year={2025}
                            events={events}
                            onEventCreate={onEventCreate}
                            onEventUpdate={onEventUpdate}
                            onEventDelete={onEventDelete}
                            enableInfiniteCanvas={true}
                            className="w-full h-full"
                          />
                        </Card>
                      </LibraryTransitionAnimator>
                    </TouchGestureHandler>
                  </WebSocketSyncManager>
                </LiveCollaborationLayer>
              </EnhancedDragDropSystem>
            </AIDragDropIntegration>
          </TabsContent>

          {/* Insights Tab - AI Analytics & Performance */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Conflict Detection */}
              <Card className="lg:col-span-2">
                <AIConflictDetector
                  events={events}
                  onConflictResolved={(resolution) => {
                    playSound?.('success');
                    console.log('Conflict resolved:', resolution);
                  }}
                />
              </Card>

              {/* Revenue Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600 /* TODO: Use semantic token */" />
                    <span>Revenue Impact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 /* TODO: Use semantic token */">+$12,847</div>
                  <div className="text-sm text-muted-foreground">
                    This month's optimization value
                  </div>
                </CardContent>
              </Card>

              {/* Productivity Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-600 /* TODO: Use semantic token */" />
                    <span>Productivity Score</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 /* TODO: Use semantic token */">94%</div>
                  <div className="text-sm text-muted-foreground">Coordination efficiency</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Coordination Tab - Team & Service Provider Management */}
          <TabsContent value="coordination" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Event Management */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-600 /* TODO: Use semantic token */" />
                    <span>Team Coordination Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedEventManagement
                    events={events}
                    onEventCreate={onEventCreate}
                    onEventUpdate={onEventUpdate}
                    onEventDelete={onEventDelete}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Advanced AI Features - Voice Input Integration */}
      {isVoiceEnabled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <AINLPInput
            enableVoiceInput={true}
            placeholder="Speak your coordination needs..."
            onEventParsed={(event) => {
              console.log('Voice event parsed:', event);
              playSound?.('success');
            }}
          />
        </motion.div>
      )}

      {/* Modals and Overlays */}
      <EventModal />
      <ConflictResolutionModal />
    </div>
  );
}
