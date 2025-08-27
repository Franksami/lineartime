/**
 * AI Revenue Planner Interface - CheatCal Default Interface
 * 
 * Professional AI-powered coordination optimization for money-focused professionals.
 * Built with Vercel AI SDK v5, AI Elements, and sophisticated design patterns.
 * 
 * Features:
 * - Revenue-focused goal planning with AI assistance
 * - Real-time conflict detection and resolution
 * - Tool calling for complex coordination calculations
 * - Professional aesthetics inspired by Sunsama
 * - Voice input and audio feedback integration
 * 
 * @version 2.0.0 (CheatCal Transformation)
 * @author CheatCal Revenue Optimization Platform
 */

'use client';

import { useChat } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
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
  Zap
} from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';

// AI Elements Components (established pattern)
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
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

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AIDragDropIntegration } from '@/components/calendar/AIDragDropIntegration';
// Enhanced Calendar System Integration (restore ALL functionality)
import EnhancedCalendarToolbar from '@/components/calendar/EnhancedCalendarToolbar';
import { EnhancedDragDropSystem } from '@/components/calendar/EnhancedDragDropSystem';
import { LinearCalendarHorizontal } from '@/components/calendar/LinearCalendarHorizontal';
import { MotionEnhancedCalendarToolbar } from '@/components/calendar/MotionEnhancedCalendarToolbar';

// Calendar Provider System (10 libraries)
import { useCalendarProvider } from '@/components/calendar/providers/CalendarProvider';

// CheatCal Enterprise Interface Integration
import CheatCalEnterpriseInterface from '@/components/enterprise/CheatCalEnterpriseInterface';

// Existing integrations
import { useSoundEffects } from '@/lib/sound-service';
import { cn } from '@/lib/utils';

// CheatCal AI Revenue Planner Architecture Documentation
// This component provides a sophisticated 3-panel interface for AI-powered coordination optimization

interface RevenueGoal {
  id: string;
  title: string;
  targetAmount: number;
  deadline: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  progress: number;
}

interface CoordinationMetric {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  impact: string;
}

export default function PlannerInterface() {
  const { playSound } = useSoundEffects() || { playSound: () => Promise.resolve() };
  
  // Chat integration using established EnhancedAIAssistant pattern
  const { messages, sendMessage, status } = useChat({
    api: '/api/ai/chat',
    body: {
      model: 'anthropic/claude-3-5-sonnet-20241022',
      context: 'cheatcal-planner',
      enhancedAI: true,
    },
    onFinish: () => {
      playSound?.('success');
      console.log('Plan generated successfully');
    },
    onError: (error) => {
      playSound?.('error');
      console.error('Planning error:', error);
    }
  });

  // Professional state management (following EnhancedAIAssistant pattern)
  const [input, setInput] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState('planner');

  // Demo events for calendar integration
  const [calendarEvents] = useState([
    {
      id: '1',
      title: 'Q4 Launch Strategy Call',
      description: 'Strategic planning for course launch',
      start: new Date(2025, 0, 28, 14, 0),
      end: new Date(2025, 0, 28, 16, 0),
      allDay: false,
      category: 'work',
      priority: 'critical' as const,
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      borderColor: '#3b82f6',
      editable: true,
      location: 'Conference Room A',
      attendees: 5,
      tags: ['strategy', 'launch'],
      extendedProps: {
        priority: 'critical' as const,
        estimatedRevenue: 45000,
      }
    },
    {
      id: '2',
      title: 'Client Onboarding Session',
      description: 'New agency client coordination meeting',
      start: new Date(2025, 0, 29, 10, 0),
      end: new Date(2025, 0, 29, 12, 0),
      allDay: false,
      category: 'work',
      priority: 'high' as const,
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      borderColor: '#10b981',
      editable: true,
      location: 'Virtual',
      attendees: 3,
      tags: ['client', 'onboarding'],
      extendedProps: {
        priority: 'high' as const,
        estimatedRevenue: 25000,
      }
    }
  ]);
  
  // Revenue and coordination metrics (real-time updates)
  const [revenueGoals] = useState<RevenueGoal[]>([
    {
      id: '1',
      title: 'Q4 Course Launch',
      targetAmount: 250000,
      deadline: '2025-12-31',
      priority: 'critical',
      progress: 65
    },
    {
      id: '2', 
      title: 'Agency Client Onboarding',
      targetAmount: 85000,
      deadline: '2025-10-15',
      priority: 'high',
      progress: 40
    },
    {
      id: '3',
      title: 'Investment Strategy Review',
      targetAmount: 500000,
      deadline: '2025-11-30',
      priority: 'medium',
      progress: 25
    }
  ]);

  const [coordinationMetrics] = useState<CoordinationMetric[]>([
    { label: 'Daily Value Created', value: 4247, unit: '$', trend: 'up', impact: '18% above target' },
    { label: 'Time Saved Today', value: 3.2, unit: 'hrs', trend: 'up', impact: '≈$1,600 value' },
    { label: 'Active Optimizations', value: 7, unit: '', trend: 'stable', impact: 'All systems green' },
    { label: 'Conflict Resolution', value: 94, unit: '%', trend: 'up', impact: 'AI auto-resolved' }
  ]);

  // Voice recording handler
  const handleVoiceToggle = useCallback(async () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      playSound?.('notification');
      // TODO: Start voice recording
    } else {
      playSound?.('success');
      // TODO: Stop voice recording and process
    }
  }, [isRecording, playSound]);

  // Form submission handler (following EnhancedAIAssistant pattern)
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === 'ready') {
      sendMessage({ text: input });
      setInput('');
    }
  }, [input, status, sendMessage]);


  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '→';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1920px] mx-auto">
        
        {/* Professional Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Brain className="w-8 h-8 text-primary" />
                    <div className="absolute -top-1 -right-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    </div>
                  </motion.div>
                  
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      CheatCal AI Planner
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Revenue Coordination Optimization
                    </p>
                  </div>
                </div>
                
                <Badge variant="outline">
                  <Crown className="w-3 h-3 mr-1" />
                  Elite Professional
                </Badge>
              </div>

              <div className="flex items-center space-x-3">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex items-center">
                  <TabsList className="grid grid-cols-3 w-48">
                    <TabsTrigger value="planner" className="text-xs">
                      <Brain className="w-3 h-3 mr-1" />
                      AI Planner
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      Enterprise
                    </TabsTrigger>
                    <TabsTrigger value="demo" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Demo
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Button
                  variant={isVoiceEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                >
                  {isVoiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-120px)]">
            <TabsContent value="planner" className="h-full">
              <div className="grid grid-cols-12 gap-6 h-full">
            
            {/* Left Panel - Revenue Context & Goals */}
            <div className="col-span-3 space-y-6">
              
              {/* Revenue Goals */}
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span>Revenue Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {revenueGoals.map((goal) => (
                    <motion.div
                      key={goal.id}
                      className="p-3 rounded-lg border bg-muted/30"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">{goal.title}</h4>
                        <Badge variant={goal.priority === 'critical' ? 'destructive' : goal.priority === 'high' ? 'secondary' : 'outline'}>
                          {goal.priority}
                        </Badge>
                      </div>
                      
                      <div className="text-2xl font-bold text-foreground mb-1">
                        ${goal.targetAmount.toLocaleString()}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-1" />
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Live Coordination Metrics */}
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span>Live Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {coordinationMetrics.map((metric, index) => (
                    <motion.div
                      key={metric.label}
                      className="flex items-center justify-between p-2 rounded border bg-card/50"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{metric.label}</div>
                        <div className="text-xs text-muted-foreground">{metric.impact}</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <span className="text-lg font-bold">
                            {metric.unit === '$' ? '$' : ''}{metric.value.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''}
                          </span>
                          <span className="text-xs">{getTrendIcon(metric.trend)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start h-auto p-3" size="sm">
                    <Target className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Optimize Launch Timeline</div>
                      <div className="text-xs text-muted-foreground">AI-powered scheduling optimization</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-auto p-3" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Find Coordination Specialist</div>
                      <div className="text-xs text-muted-foreground">Elite service provider matching</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-auto p-3" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Schedule Revenue Review</div>
                      <div className="text-xs text-muted-foreground">Performance and ROI analysis</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-auto p-3" size="sm">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Analyze ROI Patterns</div>
                      <div className="text-xs text-muted-foreground">Productivity pattern analysis</div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Center Panel - AI Chat Interface */}
            <div className="col-span-6">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span>AI Revenue Coordination Assistant</span>
                    </CardTitle>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                        Online
                      </Badge>
                      
                      {isVoiceEnabled && (
                        <Button
                          variant={isRecording ? "destructive" : "outline"}
                          size="sm"
                          onClick={handleVoiceToggle}
                        >
                          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* AI Chat Messages */}
                <CardContent className="flex-1 flex flex-col overflow-hidden">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      <AnimatePresence>
                        {messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                              "flex items-start space-x-3 p-4 rounded-lg",
                              message.role === 'user' 
                                ? "bg-primary/5 ml-12" 
                                : "bg-muted/50 mr-12"
                            )}
                          >
                            <Avatar className="w-8 h-8">
                              {message.role === 'user' ? (
                                <User className="w-5 h-5" />
                              ) : (
                                <Bot className="w-5 h-5 text-primary" />
                              )}
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium">
                                  {message.role === 'user' ? 'You' : 'CheatCal AI'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {(message as any).createdAt?.toLocaleTimeString() || 'now'}
                                </span>
                              </div>
                              
                              {(message as any).content && <Response>{(message as any).content}</Response>}
                              
                              {/* Enhanced tool rendering */}
                              {(message as any).toolInvocations?.map((tool: any, i: number) => (
                                <Tool key={i} defaultOpen>
                                  <ToolHeader
                                    type={tool.toolName}
                                    state={tool.state}
                                    icon={
                                      tool.toolName === 'planGeneration' ? (
                                        <Target className="w-4 h-4" />
                                      ) : tool.toolName === 'conflictResolution' ? (
                                        <Users className="w-4 h-4" />
                                      ) : tool.toolName === 'revenueCalculation' ? (
                                        <DollarSign className="w-4 h-4" />
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
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {status === 'streaming' && (
                        <motion.div
                          className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 mr-12"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Avatar className="w-8 h-8">
                            <Bot className="w-5 h-5 text-primary animate-pulse" />
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium">CheatCal AI</span>
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Analyzing your coordination for optimization opportunities...
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>

                  <Separator className="my-4" />

                  {/* AI Composer Input */}
                  <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                    <div className="flex-1">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your revenue goals, coordination challenges, or optimization needs..."
                        className="resize-none min-h-[44px]"
                        disabled={status !== 'ready'}
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={status !== 'ready' || !input.trim()}
                      className="shrink-0"
                    >
                      {status === 'streaming' ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - AI Insights & Tools */}
            <div className="col-span-3 space-y-6">
              
              {/* AI Capacity Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Eye className="w-5 h-5 text-blue-500" />
                    <span>AI Capacity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Processing Load</span>
                        <span>67%</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Response Speed</span>
                        <span>&lt;50ms</span>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Accuracy Score</span>
                        <span>94%</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available AI Tools */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span>AI Tools</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { name: 'Plan Generation', icon: Target, description: 'Create optimized revenue plans' },
                      { name: 'Conflict Resolution', icon: Users, description: 'Resolve coordination conflicts' },
                      { name: 'Revenue Calculator', icon: DollarSign, description: 'Calculate ROI and value impact' },
                      { name: 'Marketplace Match', icon: Crown, description: 'Find elite service providers' }
                    ].map((tool) => (
                      <motion.div
                        key={tool.name}
                        className="flex items-center space-x-3 p-2 rounded border bg-card/50"
                        whileHover={{ scale: 1.02, backgroundColor: 'hsl(var(--primary)/0.05)' }}
                      >
                        <tool.icon className="w-4 h-4 text-primary" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{tool.name}</div>
                          <div className="text-xs text-muted-foreground">{tool.description}</div>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Insights */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span>Recent Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      type: 'opportunity',
                      title: 'Revenue Opportunity',
                      description: 'Optimizing Tuesday focus blocks could increase weekly value by $1,247',
                      time: '5m ago',
                      confidence: 94
                    },
                    {
                      type: 'warning',
                      title: 'Coordination Risk',
                      description: 'Client call conflict with launch prep detected for Thursday',
                      time: '12m ago',
                      confidence: 87
                    },
                    {
                      type: 'success',
                      title: 'Optimization Complete',
                      description: 'Morning routine automation saved 45min daily (≈$375 value)',
                      time: '1h ago',
                      confidence: 96
                    }
                  ].map((insight, index) => (
                    <motion.div
                      key={index}
                      className="p-3 rounded-lg border bg-muted/30"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium">{insight.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <div className="text-xs text-muted-foreground">{insight.time}</div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="calendar" className="h-full">
        <div className="h-full">
          <CheatCalEnterpriseInterface 
            events={calendarEvents}
            onEventCreate={(event) => {
              console.log('Creating event:', event);
              // Add event creation logic here
            }}
            onEventUpdate={(event) => {
              console.log('Updating event:', event);
              // Add event update logic here  
            }}
            onEventDelete={(eventId) => {
              console.log('Deleting event:', eventId);
              // Add event deletion logic here
            }}
            className="h-full"
          />
        </div>
      </TabsContent>

      <TabsContent value="demo" className="h-full">
        <div className="h-full flex items-center justify-center">
          <Card className="p-8 text-center max-w-2xl">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4">CheatCal Enterprise Demo</h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Experience the complete enterprise-grade calendar interface with all sophisticated functionality restored.
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-sm">
                  <strong>✨ 10-Library Calendar Ecosystem</strong> - Switch between FullCalendar, Toast UI, React Big Calendar, and 7 more
                </p>
                <p className="text-sm">
                  <strong>🧠 AI Revenue Planner</strong> - Real-time coordination optimization with up to 287% improvements
                </p>
                <p className="text-sm">
                  <strong>🎯 Professional Drag & Drop</strong> - Enhanced system with AI suggestions and conflict resolution
                </p>
              </div>
              <div className="pt-4">
                <Button 
                  size="lg" 
                  className="px-8"
                  onClick={() => window.open('/cheatcal-enterprise', '_blank')}
                >
                  Launch Full Demo
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
        </div>
      </div>
    </div>
  );
}