/**
 * CheatCal Vision Consent Component
 *
 * Privacy-first computer vision consent UI with transparent controls.
 * Revolutionary screen analysis with user consent and control.
 *
 * @version CheatCal Phase 3.0
 * @author CheatCal AI Enhancement System
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { CheatCalVisionEngine } from '@/lib/vision/CheatCalVisionEngine';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Eye,
  EyeOff,
  Info,
  Lock,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Shield,
  Sparkles,
  Unlock,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';

// ==========================================
// Types & Interfaces
// ==========================================

interface VisionPermissions {
  screenCapture: boolean;
  textAnalysis: boolean;
  applicationDetection: boolean;
  productivityAnalysis: boolean;
  dataCollection: boolean;
}

interface VisionStatus {
  isActive: boolean;
  isAnalyzing: boolean;
  permissionsGranted: boolean;
  lastAnalysis?: Date;
  analysisCount: number;
  privacyLevel: 'strict' | 'balanced' | 'permissive';
}

interface CheatCalVisionConsentProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionsChanged?: (permissions: VisionPermissions) => void;
  onVisionToggle?: (enabled: boolean) => void;
  className?: string;
}

// ==========================================
// ASCII Vision Architecture
// ==========================================

const VISION_ARCHITECTURE = `
CHEATCAL COMPUTER VISION CONSENT ARCHITECTURE
═══════════════════════════════════════════════════════════════════

CONTROVERSIAL SCREEN ANALYSIS WITH USER CONTROL:
┌─────────────────────────────────────────────────────────────────┐
│                   PRIVACY-FIRST VISION SYSTEM                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ USER CONSENT LAYER                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📷 Screen Capture Permission    [USER CONTROLS]            │ │
│ │ 📝 Text Analysis Permission     [ON/OFF TOGGLE]            │ │
│ │ 🎯 App Detection Permission     [GRANULAR CONTROL]         │ │
│ │ 📊 Productivity Analysis        [USER CHOOSES]             │ │
│ │ 💾 Data Collection Permission   [TRANSPARENT]              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│                              ▼                                 │
│ PROCESSING LAYER                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔒 90% On-Device Processing    [PRIVACY FIRST]             │ │
│ │ 🧠 OpenCV Analysis Engine      [LOCAL PROCESSING]          │ │
│ │ 📱 Real-time Optimization     [NO CLOUD REQUIRED]          │ │
│ │ 🛡️ Zero Persistent Storage     [TEMPORARY ONLY]            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│                              ▼                                 │
│ OUTPUT LAYER                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💡 Optimization Suggestions    [USER BENEFITS]             │ │
│ │ ⚡ Productivity Insights       [ACTIONABLE ADVICE]         │ │
│ │ 🎯 Coordination Opportunities  [REVENUE OPTIMIZATION]      │ │
│ │ 📈 Performance Metrics         [TRANSPARENT RESULTS]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

PRIVACY GUARANTEES:
┌─────────────────────────────────────────────────────────────────┐
│ 🔒 No Screenshots Stored     │ ⚡ Instant Analysis Only        │
│ 🛡️ Local Processing Only     │ 📊 Aggregated Metrics Only    │
│ 🚫 No Personal Data Sent     │ 🎯 Productivity Focus Only    │
│ 👤 User Control Always       │ 🔐 Transparent Operation       │
└─────────────────────────────────────────────────────────────────┘
`;

// ==========================================
// Main Component
// ==========================================

export function CheatCalVisionConsent({
  isOpen,
  onClose,
  onPermissionsChanged,
  onVisionToggle,
  className,
}: CheatCalVisionConsentProps) {
  // State Management
  const [currentStep, setCurrentStep] = useState<'intro' | 'permissions' | 'preview' | 'complete'>(
    'intro'
  );
  const [permissions, setPermissions] = useState<VisionPermissions>({
    screenCapture: false,
    textAnalysis: false,
    applicationDetection: false,
    productivityAnalysis: false,
    dataCollection: false,
  });

  const [visionStatus, setVisionStatus] = useState<VisionStatus>({
    isActive: false,
    isAnalyzing: false,
    permissionsGranted: false,
    analysisCount: 0,
    privacyLevel: 'balanced',
  });

  const [visionEngine, setVisionEngine] = useState<CheatCalVisionEngine | null>(null);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [consentProgress, setConsentProgress] = useState(0);

  // Initialize Vision Engine
  const initializeVisionEngine = useCallback(async () => {
    if (!visionEngine) {
      const engine = new CheatCalVisionEngine();
      setVisionEngine(engine);
    }
  }, [visionEngine]);

  // Handle Permission Changes
  const handlePermissionChange = useCallback(
    (permission: keyof VisionPermissions, enabled: boolean) => {
      const newPermissions = { ...permissions, [permission]: enabled };
      setPermissions(newPermissions);

      // Update progress based on permissions granted
      const grantedCount = Object.values(newPermissions).filter(Boolean).length;
      setConsentProgress((grantedCount / 5) * 100);

      onPermissionsChanged?.(newPermissions);
    },
    [permissions, onPermissionsChanged]
  );

  // Handle Vision System Toggle
  const handleVisionToggle = useCallback(
    async (enabled: boolean) => {
      try {
        if (enabled && visionEngine) {
          await visionEngine.initialize();
          setVisionStatus((prev) => ({
            ...prev,
            isActive: true,
            permissionsGranted: true,
          }));
        } else if (visionEngine) {
          visionEngine.destroy();
          setVisionStatus((prev) => ({
            ...prev,
            isActive: false,
            permissionsGranted: false,
          }));
        }

        onVisionToggle?.(enabled);
      } catch (error) {
        console.error('Vision system toggle error:', error);
        // Show user-friendly error
        setVisionStatus((prev) => ({
          ...prev,
          isActive: false,
          permissionsGranted: false,
        }));
      }
    },
    [visionEngine, onVisionToggle]
  );

  // Handle Step Navigation
  const handleNextStep = useCallback(() => {
    switch (currentStep) {
      case 'intro':
        setCurrentStep('permissions');
        break;
      case 'permissions':
        setCurrentStep('preview');
        initializeVisionEngine();
        break;
      case 'preview':
        setCurrentStep('complete');
        break;
      case 'complete':
        onClose();
        break;
    }
  }, [currentStep, initializeVisionEngine, onClose]);

  const handlePreviousStep = useCallback(() => {
    switch (currentStep) {
      case 'permissions':
        setCurrentStep('intro');
        break;
      case 'preview':
        setCurrentStep('permissions');
        break;
      case 'complete':
        setCurrentStep('preview');
        break;
    }
  }, [currentStep]);

  // Check if user can proceed
  const canProceed = () => {
    switch (currentStep) {
      case 'intro':
        return true;
      case 'permissions':
        return permissions.screenCapture; // Minimum requirement
      case 'preview':
        return visionStatus.permissionsGranted;
      case 'complete':
        return true;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={cn(
            'bg-background border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto',
            className
          )}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-full">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">CheatCal Computer Vision</h2>
                  <p className="text-muted-foreground">
                    Revolutionary productivity monitoring with your consent
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-yellow-100 /* TODO: Use semantic token */ text-yellow-800 /* TODO: Use semantic token */ border-yellow-300 /* TODO: Use semantic token */"
                >
                  Controversial AI
                </Badge>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Setup Progress</span>
                <span className="text-sm text-muted-foreground">
                  Step {['intro', 'permissions', 'preview', 'complete'].indexOf(currentStep) + 1} of
                  4
                </span>
              </div>
              <Progress
                value={
                  (['intro', 'permissions', 'preview', 'complete'].indexOf(currentStep) + 1) * 25
                }
                className="h-2"
              />
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {currentStep === 'intro' && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <Eye className="w-12 h-12 text-white" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        The AI That Watches Everything You Do
                      </h3>
                      <p className="text-muted-foreground max-w-2xl mx-auto">
                        CheatCal's computer vision system analyzes your screen in real-time to
                        optimize productivity and find coordination opportunities. This is
                        controversial but powerful technology.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 text-center">
                      <Monitor className="w-8 h-8 mx-auto mb-3 text-primary" />
                      <h4 className="font-semibold mb-2">Screen Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        Real-time screen capture and analysis to understand your workflow patterns
                      </p>
                    </Card>

                    <Card className="p-4 text-center">
                      <Brain className="w-8 h-8 mx-auto mb-3 text-purple-500 /* TODO: Use semantic token */" />
                      <h4 className="font-semibold mb-2">AI Optimization</h4>
                      <p className="text-sm text-muted-foreground">
                        Intelligent suggestions for productivity improvements and time optimization
                      </p>
                    </Card>

                    <Card className="p-4 text-center">
                      <Shield className="w-8 h-8 mx-auto mb-3 text-green-500 /* TODO: Use semantic token */" />
                      <h4 className="font-semibold mb-2">Privacy First</h4>
                      <p className="text-sm text-muted-foreground">
                        90% on-device processing with no persistent storage of your screen content
                      </p>
                    </Card>
                  </div>

                  <div className="bg-yellow-50 /* TODO: Use semantic token */ dark:bg-yellow-900 /* TODO: Use semantic token *//20 border border-yellow-200 /* TODO: Use semantic token */ dark:border-yellow-800 /* TODO: Use semantic token */ rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 /* TODO: Use semantic token */ dark:text-yellow-400 /* TODO: Use semantic token */ flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-800 /* TODO: Use semantic token */ dark:text-yellow-200 /* TODO: Use semantic token */ mb-1">
                          Controversial Technology Notice
                        </h4>
                        <p className="text-yellow-700 /* TODO: Use semantic token */ dark:text-yellow-300 /* TODO: Use semantic token */ text-sm">
                          This system monitors your screen activity to provide productivity
                          insights. While controversial, it's designed with privacy-first principles
                          and transparent user control.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={() => setShowArchitecture(!showArchitecture)}
                      variant="outline"
                      size="sm"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      {showArchitecture ? 'Hide' : 'Show'} System Architecture
                    </Button>
                  </div>

                  <AnimatePresence>
                    {showArchitecture && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-black text-green-400 /* TODO: Use semantic token */ rounded-lg p-4 font-mono text-xs overflow-x-auto"
                      >
                        <pre>{VISION_ARCHITECTURE}</pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {currentStep === 'permissions' && (
                <motion.div
                  key="permissions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Permission Controls</h3>
                    <p className="text-muted-foreground">
                      Choose exactly what CheatCal can monitor. You have complete control.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        key: 'screenCapture' as keyof VisionPermissions,
                        icon: <Monitor className="w-5 h-5" />,
                        title: 'Screen Capture Access',
                        description: 'Allow CheatCal to capture your screen for analysis',
                        required: true,
                        privacy: 'Processed locally, not stored permanently',
                      },
                      {
                        key: 'textAnalysis' as keyof VisionPermissions,
                        icon: <Brain className="w-5 h-5" />,
                        title: 'Text Content Analysis',
                        description: 'Analyze visible text to understand workflow context',
                        required: false,
                        privacy: 'OCR processed on-device only',
                      },
                      {
                        key: 'applicationDetection' as keyof VisionPermissions,
                        icon: <Activity className="w-5 h-5" />,
                        title: 'Application Detection',
                        description: "Identify which applications you're using for context",
                        required: false,
                        privacy: 'App names only, no sensitive data',
                      },
                      {
                        key: 'productivityAnalysis' as keyof VisionPermissions,
                        icon: <Zap className="w-5 h-5" />,
                        title: 'Productivity Analysis',
                        description: 'Generate optimization suggestions based on patterns',
                        required: false,
                        privacy: 'Aggregated patterns only, no personal details',
                      },
                      {
                        key: 'dataCollection' as keyof VisionPermissions,
                        icon: <Shield className="w-5 h-5" />,
                        title: 'Anonymous Analytics',
                        description: 'Collect anonymous usage data to improve the system',
                        required: false,
                        privacy: 'Completely anonymous, no personal identification',
                      },
                    ].map((permission) => (
                      <Card key={permission.key} className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              'p-2 rounded-full flex-shrink-0',
                              permissions[permission.key]
                                ? 'bg-green-100 /* TODO: Use semantic token */ text-green-600 /* TODO: Use semantic token */ dark:bg-green-900 /* TODO: Use semantic token *//30 dark:text-green-400 /* TODO: Use semantic token */'
                                : 'bg-muted text-gray-600 /* TODO: Use semantic token */ dark:bg-gray-900 /* TODO: Use semantic token *//30 dark:text-gray-400 /* TODO: Use semantic token */'
                            )}
                          >
                            {permission.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{permission.title}</h4>
                              {permission.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground mb-2">
                              {permission.description}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                              <Lock className="w-3 h-3" />
                              <span>{permission.privacy}</span>
                            </div>
                          </div>

                          <Switch
                            checked={permissions[permission.key]}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(permission.key, checked)
                            }
                          />
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      Permissions Granted: {Object.values(permissions).filter(Boolean).length} of 5
                    </div>
                    <Progress value={consentProgress} className="max-w-xs mx-auto" />
                  </div>
                </motion.div>
              )}

              {currentStep === 'preview' && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">System Preview</h3>
                    <p className="text-muted-foreground">
                      Ready to activate CheatCal's computer vision system
                    </p>
                  </div>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Vision System Status</h4>
                      <Badge
                        variant={visionStatus.isActive ? 'default' : 'secondary'}
                        className="flex items-center gap-1"
                      >
                        {visionStatus.isActive ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {visionStatus.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {visionStatus.analysisCount}
                        </div>
                        <div className="text-sm text-muted-foreground">Analyses Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500 /* TODO: Use semantic token */">90%</div>
                        <div className="text-sm text-muted-foreground">On-Device Processing</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <Button
                        onClick={() => handleVisionToggle(!visionStatus.isActive)}
                        variant={visionStatus.isActive ? 'destructive' : 'default'}
                        className="flex items-center gap-2"
                      >
                        {visionStatus.isActive ? (
                          <>
                            <Pause className="w-4 h-4" />
                            Deactivate Vision
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Activate Vision
                          </>
                        )}
                      </Button>

                      <Button variant="outline" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Advanced Settings
                      </Button>
                    </div>
                  </Card>

                  <div className="bg-blue-50 /* TODO: Use semantic token */ dark:bg-blue-900 /* TODO: Use semantic token *//20 border border-blue-200 /* TODO: Use semantic token */ dark:border-blue-800 /* TODO: Use semantic token */ rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 /* TODO: Use semantic token */ dark:text-blue-400 /* TODO: Use semantic token */ flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800 /* TODO: Use semantic token */ dark:text-blue-200 /* TODO: Use semantic token */ mb-1">
                          Ready for Productivity Cheating
                        </h4>
                        <p className="text-blue-700 /* TODO: Use semantic token */ dark:text-blue-300 /* TODO: Use semantic token */ text-sm">
                          Your CheatCal computer vision system is configured and ready to help you
                          optimize productivity through controversial but powerful screen analysis.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 text-center"
                >
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold mb-2">CheatCal Vision Activated!</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Your controversial but powerful productivity monitoring system is now active
                      and ready to help you cheat at productivity.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                    <div className="text-center">
                      <Eye className="w-8 h-8 mx-auto mb-2 text-purple-500 /* TODO: Use semantic token */" />
                      <div className="text-sm font-medium">Always Watching</div>
                    </div>
                    <div className="text-center">
                      <Brain className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <div className="text-sm font-medium">AI Optimizing</div>
                    </div>
                    <div className="text-center">
                      <Shield className="w-8 h-8 mx-auto mb-2 text-green-500 /* TODO: Use semantic token */" />
                      <div className="text-sm font-medium">Privacy First</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 /* TODO: Use semantic token */ dark:border-purple-800 /* TODO: Use semantic token */ rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 /* TODO: Use semantic token */ dark:text-purple-200 /* TODO: Use semantic token */ mb-2">
                      🎯 What Happens Next?
                    </h4>
                    <ul className="text-sm text-purple-700 /* TODO: Use semantic token */ dark:text-purple-300 /* TODO: Use semantic token */ space-y-1 text-left max-w-md mx-auto">
                      <li>• Real-time screen analysis begins immediately</li>
                      <li>• AI-powered productivity suggestions appear automatically</li>
                      <li>• Coordination opportunities detected and highlighted</li>
                      <li>• Revenue optimization recommendations delivered</li>
                      <li>• Full transparency and control maintained</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 'intro'}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Back
              </Button>

              <div className="text-sm text-muted-foreground">
                {canProceed() ? 'Ready to continue' : 'Complete requirements to proceed'}
              </div>

              <Button
                onClick={handleNextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                {currentStep === 'complete' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Start Cheating
                  </>
                ) : (
                  <>
                    Continue
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CheatCalVisionConsent;
