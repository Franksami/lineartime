/**
 * Command Center AI Integration Showcase Page
 *
 * Revolutionary demonstration of multi-modal AI coordination capabilities.
 * Features computer vision, voice processing, and AI revenue optimization.
 *
 * @version Command Center Phase 3.0
 * @author Command Center AI Integration Team
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Bot,
  Brain,
  Calendar,
  Camera,
  CheckCircle,
  Coffee,
  Cpu,
  Crown,
  Database,
  DollarSign,
  Eye,
  Gauge,
  Headphones,
  Lightbulb,
  Lock,
  Mic,
  Monitor,
  Network,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Unlock,
  Users,
  Zap,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AICapacityRibbon } from '@/components/ai/AICapacityRibbon';
import { AIConductorInterface } from '@/components/ai/AIConductorInterface';
import { AIConflictDetector } from '@/components/ai/AIConflictDetector';
import { AIInsightPanel } from '@/components/ai/AIInsightPanel';
import { AINLPInput } from '@/components/ai/AINLPInput';
// AI Components Integration
import { CheatCalVisionConsent } from '@/components/ai/CheatCalVisionConsent';

import { EnhancedVoiceProcessor } from '@/lib/ai/EnhancedVoiceProcessor';
import { MultiModalCoordinator } from '@/lib/ai/MultiModalCoordinator';
import { CheatCalSecurityManager } from '@/lib/security/CheatCalSecurityManager';
// Command Center AI System Integration
import { CheatCalVisionEngine } from '@/lib/vision/CheatCalVisionEngine';

import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';

// ==========================================
// Types & Interfaces
// ==========================================

interface AISystemStatus {
  vision: {
    active: boolean;
    analyzing: boolean;
    permissions: boolean;
    confidence: number;
  };
  voice: {
    active: boolean;
    recording: boolean;
    providers: number;
    accuracy: number;
  };
  coordination: {
    active: boolean;
    processing: boolean;
    recommendations: number;
    efficiency: number;
  };
  security: {
    active: boolean;
    threats: number;
    compliance: number;
    encryption: boolean;
  };
}

interface DemoMetrics {
  totalValue: number;
  timeSaved: number;
  optimizations: number;
  conflicts: number;
  insights: number;
  accuracy: number;
}

// ==========================================
// Main Component
// ==========================================

export default function CheatCalAIShowcase() {
  // System State Management
  const [systemStatus, setSystemStatus] = useState<AISystemStatus>({
    vision: { active: false, analyzing: false, permissions: false, confidence: 0 },
    voice: { active: false, recording: false, providers: 3, accuracy: 95 },
    coordination: { active: false, processing: false, recommendations: 0, efficiency: 0 },
    security: { active: true, threats: 0, compliance: 98, encryption: true },
  });

  const [demoMetrics, setDemoMetrics] = useState<DemoMetrics>({
    totalValue: 2847,
    timeSaved: 4.7,
    optimizations: 12,
    conflicts: 3,
    insights: 8,
    accuracy: 94,
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [showVisionConsent, setShowVisionConsent] = useState(false);
  const [isFullDemo, setIsFullDemo] = useState(false);
  const [systemInitialized, setSystemInitialized] = useState(false);

  // AI System Instances
  const [visionEngine, setVisionEngine] = useState<CheatCalVisionEngine | null>(null);
  const [voiceProcessor, setVoiceProcessor] = useState<EnhancedVoiceProcessor | null>(null);
  const [coordinator, setCoordinator] = useState<MultiModalCoordinator | null>(null);
  const [securityManager, setSecurityManager] = useState<CheatCalSecurityManager | null>(null);

  // Demo Events Data
  const demoEvents: Event[] = [
    {
      id: '1',
      title: 'Q4 Revenue Strategy Meeting',
      startTime: new Date(2025, 0, 28, 14, 0).toISOString(),
      endTime: new Date(2025, 0, 28, 16, 0).toISOString(),
      category: 'work',
      priority: 'high',
      location: 'Conference Room A',
      attendees: ['CEO', 'CFO', 'VP Sales', 'Head of Product'],
      description: 'Strategic planning for Q4 revenue targets and coordination optimization',
    },
    {
      id: '2',
      title: 'AI Optimization Review',
      startTime: new Date(2025, 0, 29, 10, 0).toISOString(),
      endTime: new Date(2025, 0, 29, 11, 30).toISOString(),
      category: 'focus',
      priority: 'critical',
      location: 'AI Lab',
      description: 'Review multi-modal coordination system performance and ROI',
    },
  ];

  // ==========================================
  // Initialization
  // ==========================================

  const initializeAISystems = useCallback(async () => {
    try {
      console.log('🚀 Initializing Command Center AI Systems...');

      // Initialize Security Manager first
      const security = new CheatCalSecurityManager({
        encryptionLevel: 'standard',
        privacyMode: 'transparent',
        auditLogging: true,
      });
      setSecurityManager(security);

      // Initialize Multi-Modal Coordinator
      const coord = new MultiModalCoordinator({
        enableVision: false, // Will be enabled with user consent
        enableVoice: true,
        fusionSensitivity: 'balanced',
        autoOptimization: false,
      });
      setCoordinator(coord);

      // Initialize Voice Processor
      const voice = new EnhancedVoiceProcessor({
        primaryProvider: 'whisper',
        fallbackProvider: 'deepgram',
        realTimeMode: true,
      });
      setVoiceProcessor(voice);

      // Update system status
      setSystemStatus((prev) => ({
        ...prev,
        voice: { ...prev.voice, active: true },
        coordination: { ...prev.coordination, active: true },
        security: { ...prev.security, active: true },
      }));

      setSystemInitialized(true);
      console.log('✅ Command Center AI Systems initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI systems:', error);
    }
  }, []);

  useEffect(() => {
    initializeAISystems();
  }, [initializeAISystems]);

  // ==========================================
  // Event Handlers
  // ==========================================

  const handleVisionActivation = useCallback(
    async (enabled: boolean) => {
      if (!coordinator) return;

      try {
        if (enabled) {
          const vision = new CheatCalVisionEngine();
          await vision.initialize();
          setVisionEngine(vision);

          // Initialize coordinator with vision
          await coordinator.initialize();

          setSystemStatus((prev) => ({
            ...prev,
            vision: { ...prev.vision, active: true, permissions: true },
          }));
        } else {
          if (visionEngine) {
            visionEngine.destroy();
            setVisionEngine(null);
          }

          setSystemStatus((prev) => ({
            ...prev,
            vision: { ...prev.vision, active: false, permissions: false },
          }));
        }
      } catch (error) {
        console.error('Vision activation error:', error);
      }
    },
    [coordinator, visionEngine]
  );

  const handleVoiceToggle = useCallback(async () => {
    if (!voiceProcessor) return;

    try {
      if (!systemStatus.voice.recording) {
        await voiceProcessor.startRecording();
        setSystemStatus((prev) => ({
          ...prev,
          voice: { ...prev.voice, recording: true },
        }));
      } else {
        await voiceProcessor.stopRecording();
        setSystemStatus((prev) => ({
          ...prev,
          voice: { ...prev.voice, recording: false },
        }));
      }
    } catch (error) {
      console.error('Voice toggle error:', error);
    }
  }, [voiceProcessor, systemStatus.voice.recording]);

  const handleFullDemoToggle = useCallback(() => {
    setIsFullDemo(!isFullDemo);

    if (!isFullDemo) {
      // Simulate full demo metrics
      setDemoMetrics({
        totalValue: 5694,
        timeSaved: 8.3,
        optimizations: 24,
        conflicts: 7,
        insights: 15,
        accuracy: 97,
      });
    } else {
      // Reset to basic demo metrics
      setDemoMetrics({
        totalValue: 2847,
        timeSaved: 4.7,
        optimizations: 12,
        conflicts: 3,
        insights: 8,
        accuracy: 94,
      });
    }
  }, [isFullDemo]);

  // ==========================================
  // Real-time Status Updates
  // ==========================================

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate dynamic metrics
      setDemoMetrics((prev) => ({
        ...prev,
        totalValue: prev.totalValue + Math.random() * 50 - 25,
        timeSaved: Math.max(0, prev.timeSaved + Math.random() * 0.2 - 0.1),
        accuracy: Math.min(100, Math.max(85, prev.accuracy + Math.random() * 2 - 1)),
      }));

      // Update system status
      if (systemStatus.vision.active) {
        setSystemStatus((prev) => ({
          ...prev,
          vision: {
            ...prev.vision,
            confidence: Math.min(
              100,
              Math.max(70, prev.vision.confidence + Math.random() * 5 - 2.5)
            ),
            analyzing: Math.random() > 0.7,
          },
        }));
      }

      if (systemStatus.coordination.active) {
        setSystemStatus((prev) => ({
          ...prev,
          coordination: {
            ...prev.coordination,
            efficiency: Math.min(
              100,
              Math.max(60, prev.coordination.efficiency + Math.random() * 3 - 1.5)
            ),
            processing: Math.random() > 0.8,
          },
        }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [systemStatus.vision.active, systemStatus.coordination.active]);

  // ==========================================
  // Render Components
  // ==========================================

  const AISystemCard = ({
    title,
    icon: Icon,
    status,
    metrics,
    onToggle,
    onConfig,
    color = 'blue',
  }: any) => (
    <Card className="relative overflow-hidden">
      <div
        className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-${color}-600/10`}
      />
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 rounded-full`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={status.active ? 'default' : 'secondary'}
              className={
                status.active ? 'bg-green-500 /* TODO: Use semantic token */ text-white' : ''
              }
            >
              {status.active ? 'Active' : 'Inactive'}
            </Badge>
            {onToggle && <Switch checked={status.active} onCheckedChange={onToggle} />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
                {key.includes('percent') || key.includes('accuracy') || key.includes('confidence')
                  ? '%'
                  : ''}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>
        {onConfig && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={onConfig} className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Brain className="w-10 h-10 text-primary" />
                <div className="absolute -top-1 -right-1">
                  <div className="w-4 h-4 bg-green-500 /* TODO: Use semantic token */ rounded-full animate-pulse" />
                </div>
              </motion.div>

              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Command Center AI
                </h1>
                <p className="text-muted-foreground">
                  Revolutionary Multi-Modal Productivity Optimization
                </p>
              </div>

              <Badge
                variant="outline"
                className="bg-yellow-100 /* TODO: Use semantic token */ dark:bg-yellow-900 /* TODO: Use semantic token *//30 text-yellow-800 /* TODO: Use semantic token */ dark:text-yellow-200 /* TODO: Use semantic token */ border-yellow-300 /* TODO: Use semantic token */"
              >
                <Crown className="w-3 h-3 mr-1" />
                Controversial AI
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 /* TODO: Use semantic token */ rounded-full animate-pulse" />
                  <span>Live Demo</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-muted-foreground">
                  ${demoMetrics.totalValue.toLocaleString()} value today
                </span>
              </div>

              <Button
                variant={isFullDemo ? 'default' : 'outline'}
                onClick={handleFullDemoToggle}
                className="flex items-center gap-2"
              >
                {isFullDemo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isFullDemo ? 'Full Demo Active' : 'Enable Full Demo'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="vision" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Vision
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="coordination" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Coordination
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Hero Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-8 h-8 text-green-500 /* TODO: Use semantic token */" />
                  </div>
                  <div className="text-3xl font-bold text-green-500 /* TODO: Use semantic token */ mb-1">
                    ${demoMetrics.totalValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Value Created Today</div>
                  <div className="text-xs text-green-600 /* TODO: Use semantic token */ mt-1">
                    +18% vs yesterday
                  </div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {demoMetrics.timeSaved.toFixed(1)}h
                  </div>
                  <div className="text-sm text-muted-foreground">Time Saved</div>
                  <div className="text-xs text-blue-600 /* TODO: Use semantic token */ mt-1">
                    ≈ ${(demoMetrics.timeSaved * 200).toFixed(0)} value
                  </div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-8 h-8 text-purple-500 /* TODO: Use semantic token */" />
                  </div>
                  <div className="text-3xl font-bold text-purple-500 /* TODO: Use semantic token */ mb-1">
                    {demoMetrics.optimizations}
                  </div>
                  <div className="text-sm text-muted-foreground">AI Optimizations</div>
                  <div className="text-xs text-purple-600 /* TODO: Use semantic token */ mt-1">
                    Active today
                  </div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-2">
                    <Brain className="w-8 h-8 text-pink-500 /* TODO: Use semantic token */" />
                  </div>
                  <div className="text-3xl font-bold text-pink-500 /* TODO: Use semantic token */ mb-1">
                    {demoMetrics.accuracy}%
                  </div>
                  <div className="text-sm text-muted-foreground">AI Accuracy</div>
                  <div className="text-xs text-pink-600 /* TODO: Use semantic token */ mt-1">
                    Multi-modal fusion
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Systems Status Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AISystemCard
                title="Computer Vision"
                icon={Eye}
                color="blue"
                status={systemStatus.vision}
                metrics={{
                  confidence: systemStatus.vision.confidence,
                  analyzing: systemStatus.vision.analyzing ? 'Yes' : 'No',
                  permissions: systemStatus.vision.permissions ? 'Granted' : 'Pending',
                  processing: '90% Local',
                }}
                onToggle={handleVisionActivation}
                onConfig={() => setShowVisionConsent(true)}
              />

              <AISystemCard
                title="Voice Processing"
                icon={Mic}
                color="green"
                status={systemStatus.voice}
                metrics={{
                  providers: `${systemStatus.voice.providers} Active`,
                  accuracy: `${systemStatus.voice.accuracy}%`,
                  recording: systemStatus.voice.recording ? 'Live' : 'Ready',
                  latency: '<50ms',
                }}
                onToggle={handleVoiceToggle}
              />

              <AISystemCard
                title="Multi-Modal Coordination"
                icon={Zap}
                color="purple"
                status={systemStatus.coordination}
                metrics={{
                  efficiency: `${systemStatus.coordination.efficiency}%`,
                  recommendations: systemStatus.coordination.recommendations,
                  processing: systemStatus.coordination.processing ? 'Active' : 'Idle',
                  fusion: 'Vision + Voice',
                }}
              />

              <AISystemCard
                title="Security & Privacy"
                icon={Shield}
                color="red"
                status={systemStatus.security}
                metrics={{
                  compliance: `${systemStatus.security.compliance}%`,
                  threats: systemStatus.security.threats,
                  encryption: systemStatus.security.encryption ? 'AES-256' : 'None',
                  auditing: 'Complete',
                }}
              />
            </div>

            {/* Architecture Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  AI Architecture Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 /* TODO: Use semantic token */ rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  <pre>{`
CHEATCAL AI SYSTEM ARCHITECTURE - LIVE STATUS
═══════════════════════════════════════════════════════════════════

MULTI-MODAL INPUT PROCESSING:
┌─────────────────────────────────────────────────────────────────┐
│ 👁️  Computer Vision      🎤 Voice Processing   📅 Calendar Data │
│ Status: ${systemStatus.vision.active ? 'ACTIVE' : 'INACTIVE'}         Status: ${systemStatus.voice.active ? 'ACTIVE' : 'INACTIVE'}       Status: ACTIVE     │
│ Conf: ${systemStatus.vision.confidence.toFixed(0)}%              Acc: ${systemStatus.voice.accuracy}%            Events: ${demoEvents.length}      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   🧠 FUSION INTELLIGENCE                        │
│ Status: ${systemStatus.coordination.active ? 'ACTIVE' : 'INACTIVE'}     Efficiency: ${systemStatus.coordination.efficiency}%    Recommendations: ${systemStatus.coordination.recommendations}    │
│ Revenue Impact: $${demoMetrics.totalValue.toLocaleString()}    Time Saved: ${demoMetrics.timeSaved.toFixed(1)}h    Accuracy: ${demoMetrics.accuracy}%     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 🛡️  SECURITY LAYER    📊 ANALYTICS     ⚡ REAL-TIME OUTPUT    │
│ Encryption: AES-256    Insights: ${demoMetrics.insights}      Value: $${demoMetrics.totalValue}          │
│ Compliance: ${systemStatus.security.compliance}%       Conflicts: ${demoMetrics.conflicts}    Optimizations: ${demoMetrics.optimizations}   │
└─────────────────────────────────────────────────────────────────┘
`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vision Tab */}
          <TabsContent value="vision" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Computer Vision System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {systemStatus.vision.active ? (
                      <div className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <Eye className="w-12 h-12 mx-auto mb-2 text-primary" />
                          <h3 className="font-semibold mb-2">Vision System Active</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Analyzing your screen for productivity optimization opportunities
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-2xl font-bold text-primary">
                                {systemStatus.vision.confidence.toFixed(0)}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Analysis Confidence
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-500 /* TODO: Use semantic token */">
                                {systemStatus.vision.analyzing ? 'Active' : 'Idle'}
                              </div>
                              <div className="text-xs text-muted-foreground">Processing Status</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold">Recent Optimizations</h4>
                          {[
                            'Email workflow optimization detected - potential 45min savings',
                            'Meeting coordination opportunity identified - $1,200 value',
                            'Focus time protection recommended - 2hr block optimal',
                          ].map((optimization, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                            >
                              <CheckCircle className="w-4 h-4 text-green-500 /* TODO: Use semantic token */ mt-0.5" />
                              <div className="text-sm">{optimization}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-semibold mb-2">Computer Vision Inactive</h3>
                        <p className="text-muted-foreground mb-4">
                          Enable computer vision to unlock productivity monitoring
                        </p>
                        <Button onClick={() => setShowVisionConsent(true)}>
                          Enable Vision System
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vision Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: 'Screen Capture', active: systemStatus.vision.permissions },
                      { name: 'Text Recognition', active: systemStatus.vision.active },
                      { name: 'App Detection', active: systemStatus.vision.active },
                      { name: 'Workflow Analysis', active: systemStatus.vision.active },
                      { name: 'Privacy Protection', active: true },
                    ].map((capability, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{capability.name}</span>
                        <Badge variant={capability.active ? 'default' : 'secondary'}>
                          {capability.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Privacy Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Local Processing</span>
                      <Badge className="bg-green-500 /* TODO: Use semantic token */ text-white">
                        90%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Storage</span>
                      <Badge variant="outline">None</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">User Control</span>
                      <Badge className="bg-primary text-white">Complete</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Voice Tab */}
          <TabsContent value="voice" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="w-5 h-5" />
                    Voice Processing System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Multi-Provider Voice Recognition</h3>
                        <Badge className="bg-green-500 /* TODO: Use semantic token */ text-white">
                          Online
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {[
                          { name: 'Whisper v3', accuracy: 96, latency: 'Medium' },
                          { name: 'Deepgram Nova 2', accuracy: 94, latency: 'Low' },
                          { name: 'Native Web API', accuracy: 75, latency: 'Low' },
                        ].map((provider, index) => (
                          <div key={index} className="text-center p-3 bg-background rounded">
                            <div className="text-sm font-medium">{provider.name}</div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {provider.accuracy}% accurate
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {provider.latency} latency
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={handleVoiceToggle}
                        className="w-full"
                        variant={systemStatus.voice.recording ? 'destructive' : 'default'}
                      >
                        {systemStatus.voice.recording ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Start Voice Input
                          </>
                        )}
                      </Button>
                    </div>

                    <AINLPInput
                      placeholder="Try saying: 'Schedule a meeting with the team tomorrow at 2pm'"
                      enableVoiceInput={true}
                      onEventParsed={(event) => console.log('Event parsed:', event)}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Voice Commands</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      'Create event',
                      'Schedule meeting',
                      'Find free time',
                      'Optimize schedule',
                      'Analyze productivity',
                      'Revenue planning',
                    ].map((command, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                        <Mic className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{command}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Voice Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Recognition Accuracy</span>
                      <span className="text-sm font-semibold">{systemStatus.voice.accuracy}%</span>
                    </div>
                    <Progress value={systemStatus.voice.accuracy} className="h-2" />

                    <div className="flex justify-between">
                      <span className="text-sm">Response Time</span>
                      <span className="text-sm font-semibold">&lt;50ms</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Coordination Tab */}
          <TabsContent value="coordination" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Multi-Modal AI Coordination
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coordination Status */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">System Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                          <span className="text-sm">Vision Integration</span>
                          <Badge variant={systemStatus.vision.active ? 'default' : 'secondary'}>
                            {systemStatus.vision.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                          <span className="text-sm">Voice Integration</span>
                          <Badge variant={systemStatus.voice.active ? 'default' : 'secondary'}>
                            {systemStatus.voice.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                          <span className="text-sm">Calendar Integration</span>
                          <Badge className="bg-green-500 /* TODO: Use semantic token */ text-white">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Performance</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Coordination Efficiency</span>
                            <span>{systemStatus.coordination.efficiency}%</span>
                          </div>
                          <Progress value={systemStatus.coordination.efficiency} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Response Time</span>
                            <span>&lt;100ms</span>
                          </div>
                          <Progress value={92} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Success Rate</span>
                            <span>97%</span>
                          </div>
                          <Progress value={97} className="h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Live Recommendations */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Live Recommendations</h3>
                      <div className="space-y-2">
                        {[
                          {
                            type: 'Revenue',
                            text: 'Schedule client call optimization - $1,500 potential',
                          },
                          {
                            type: 'Focus',
                            text: 'Block 2-hour deep work session - 40% productivity gain',
                          },
                          {
                            type: 'Coordination',
                            text: 'Resolve meeting conflict - save 90 minutes',
                          },
                        ].map((rec, index) => (
                          <div key={index} className="p-3 bg-muted/30 rounded text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {rec.type}
                              </Badge>
                              <div className="text-xs text-muted-foreground">2min ago</div>
                            </div>
                            <div>{rec.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Components Showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Conflict Detection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AIConflictDetector
                      events={demoEvents}
                      timeRange={{
                        start: new Date(),
                        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                      }}
                      detectionSensitivity="balanced"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Capacity Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AICapacityRibbon
                      date={new Date().toISOString()}
                      events={demoEvents}
                      timeRange={{
                        start: new Date(),
                        end: new Date(Date.now() + 24 * 60 * 60 * 1000),
                      }}
                      position="overlay"
                      showDetails={true}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AIInsightPanel
                      events={demoEvents}
                      timeRange={{
                        start: new Date(),
                        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                      }}
                      variant="embedded"
                      compactMode={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Privacy & Security Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded">
                      <Lock className="w-8 h-8 mx-auto mb-2 text-green-500 /* TODO: Use semantic token */" />
                      <div className="font-semibold">AES-256</div>
                      <div className="text-xs text-muted-foreground">Encryption</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded">
                      <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <div className="font-semibold">{systemStatus.security.compliance}%</div>
                      <div className="text-xs text-muted-foreground">Compliance</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold">Privacy Settings</h4>
                    {[
                      { name: 'Screen Capture Consent', enabled: systemStatus.vision.permissions },
                      { name: 'Voice Recording Consent', enabled: true },
                      { name: 'Data Processing Consent', enabled: true },
                      { name: 'Analytics Consent', enabled: false },
                    ].map((setting, index) => (
                      <div key={index} className="flex items-center justify-between p-2">
                        <span className="text-sm">{setting.name}</span>
                        <Switch checked={setting.enabled} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    Security Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">System Security</span>
                      <Badge className="bg-green-500 /* TODO: Use semantic token */ text-white">
                        Excellent
                      </Badge>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Threat Monitoring</h4>
                    <div className="text-center py-4 text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-2" />
                      <div className="text-sm">No threats detected</div>
                      <div className="text-xs">All systems secure</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Recent Security Events</h4>
                    {[
                      'System initialized with secure defaults',
                      'User consent recorded for voice processing',
                      'Encryption key generated successfully',
                    ].map((event, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-xs p-2 bg-muted/30 rounded"
                      >
                        <CheckCircle className="w-3 h-3 text-green-500 /* TODO: Use semantic token */ mt-0.5 flex-shrink-0" />
                        <span>{event}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Data Protection Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      standard: 'GDPR',
                      compliance: 98,
                      description: 'EU General Data Protection Regulation',
                    },
                    {
                      standard: 'CCPA',
                      compliance: 96,
                      description: 'California Consumer Privacy Act',
                    },
                    {
                      standard: 'SOC 2',
                      compliance: 94,
                      description: 'Service Organization Control 2',
                    },
                  ].map((item, index) => (
                    <div key={index} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-1">{item.compliance}%</div>
                      <div className="font-semibold">{item.standard}</div>
                      <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                      <Progress value={item.compliance} className="h-1 mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Vision Consent Modal */}
      <CheatCalVisionConsent
        isOpen={showVisionConsent}
        onClose={() => setShowVisionConsent(false)}
        onPermissionsChanged={(permissions) => {
          console.log('Permissions updated:', permissions);
        }}
        onVisionToggle={handleVisionActivation}
      />
    </div>
  );
}
