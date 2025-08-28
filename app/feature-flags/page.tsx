/**
 * Feature Flags Page - Phase 5.0 Week 7-8
 *
 * Main page for accessing feature flag and deployment infrastructure:
 * - Feature Flag Dashboard
 * - Production Monitor
 * - Deployment Management
 * - System Health Overview
 */

'use client';

import { FeatureFlagDashboard } from '@/components/deployment/FeatureFlagDashboard';
import { ProductionMonitor } from '@/components/monitoring/ProductionMonitor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeploymentManager } from '@/lib/deployment/DeploymentManager';
import { GradualRolloutEngine } from '@/lib/deployment/GradualRolloutEngine';
import {
  type ComponentFlags,
  FeatureFlagManager,
  defaultFeatureFlagConfig,
} from '@/lib/featureFlags/FeatureFlagManager';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Flag,
  Info,
  Rocket,
  Settings,
  Shield,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SystemStatus {
  featureFlags: {
    status: 'healthy' | 'degraded' | 'critical';
    totalFlags: number;
    activeFlags: number;
    errorRate: number;
  };
  deployments: {
    status: 'healthy' | 'degraded' | 'critical';
    activeDeployments: number;
    successRate: number;
    lastDeployment?: Date;
  };
  monitoring: {
    status: 'healthy' | 'degraded' | 'critical';
    alertsActive: number;
    systemHealth: 'healthy' | 'degraded' | 'critical';
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FeatureFlagsPage() {
  const [featureFlagManager, setFeatureFlagManager] = useState<FeatureFlagManager>();
  const [rolloutEngine, setRolloutEngine] = useState<GradualRolloutEngine>();
  const [deploymentManager, setDeploymentManager] = useState<DeploymentManager>();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    featureFlags: {
      status: 'healthy',
      totalFlags: 11,
      activeFlags: 6,
      errorRate: 0.003,
    },
    deployments: {
      status: 'healthy',
      activeDeployments: 0,
      successRate: 0.98,
    },
    monitoring: {
      status: 'healthy',
      alertsActive: 0,
      systemHealth: 'healthy',
    },
  });

  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    initializeSystem();
  }, []);

  const initializeSystem = async () => {
    try {
      // Initialize feature flag manager
      const flagManager = new FeatureFlagManager(defaultFeatureFlagConfig);
      await flagManager.initialize();
      setFeatureFlagManager(flagManager);

      // Initialize rollout engine
      const rollout = new GradualRolloutEngine(flagManager);
      setRolloutEngine(rollout);

      // Initialize deployment manager
      const deployment = new DeploymentManager(flagManager, rollout);
      setDeploymentManager(deployment);

      setInitialized(true);

      // Update system status
      updateSystemStatus();
    } catch (err) {
      console.error('Failed to initialize feature flag system:', err);
      setError(err instanceof Error ? err.message : 'Unknown initialization error');
    }
  };

  const updateSystemStatus = () => {
    // In a real implementation, these would be actual system metrics
    setSystemStatus({
      featureFlags: {
        status: 'healthy',
        totalFlags: 11,
        activeFlags: Math.floor(Math.random() * 8) + 3, // 3-10 active
        errorRate: Math.random() * 0.01, // 0-1% error rate
      },
      deployments: {
        status: 'healthy',
        activeDeployments: Math.floor(Math.random() * 3), // 0-2 active
        successRate: 0.95 + Math.random() * 0.05, // 95-100%
        lastDeployment: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
      },
      monitoring: {
        status: 'healthy',
        alertsActive: Math.floor(Math.random() * 3), // 0-2 alerts
        systemHealth: 'healthy',
      },
    });
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleFeatureToggle = async (featureKey: keyof ComponentFlags, enabled: boolean) => {
    try {
      if (featureFlagManager) {
        if (enabled) {
          // Feature is being enabled - this would typically start the rollout process
          console.log(`Enabling feature: ${featureKey}`);
        } else {
          // Feature is being disabled
          await featureFlagManager.emergencyDisableFeature(featureKey, 'Disabled via dashboard');
        }

        // Update system status
        updateSystemStatus();
      }
    } catch (err) {
      console.error(`Failed to toggle feature ${featureKey}:`, err);
      setError(
        `Failed to toggle ${featureKey}: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const handleRolloutStart = async (featureKey: keyof ComponentFlags) => {
    try {
      if (rolloutEngine && featureFlagManager) {
        console.log(`Starting rollout for feature: ${featureKey}`);

        // This would start an actual gradual rollout
        // For demo, we'll just log the action

        updateSystemStatus();
      }
    } catch (err) {
      console.error(`Failed to start rollout for ${featureKey}:`, err);
      setError(`Failed to start rollout: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleEmergencyStop = async (featureKey: keyof ComponentFlags, reason: string) => {
    try {
      if (featureFlagManager) {
        await featureFlagManager.emergencyDisableFeature(featureKey, reason);
        updateSystemStatus();
      }
    } catch (err) {
      console.error(`Emergency stop failed for ${featureKey}:`, err);
      setError(`Emergency stop failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500 /* TODO: Use semantic token */';
      case 'degraded':
        return 'text-yellow-500 /* TODO: Use semantic token */';
      case 'critical':
        return 'text-red-500 /* TODO: Use semantic token */';
      default:
        return 'text-gray-500 /* TODO: Use semantic token */';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatPercentage = (num: number) => `${(num * 100).toFixed(1)}%`;

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderSystemOverview = () => (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Feature Flags Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Feature Flags</CardTitle>
          <div
            className={`flex items-center gap-1 ${getStatusColor(systemStatus.featureFlags.status)}`}
          >
            {getStatusIcon(systemStatus.featureFlags.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {systemStatus.featureFlags.activeFlags}/{systemStatus.featureFlags.totalFlags}
          </div>
          <p className="text-xs text-muted-foreground">
            Active flags • {formatPercentage(systemStatus.featureFlags.errorRate)} error rate
          </p>
        </CardContent>
      </Card>

      {/* Deployments Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deployments</CardTitle>
          <div
            className={`flex items-center gap-1 ${getStatusColor(systemStatus.deployments.status)}`}
          >
            {getStatusIcon(systemStatus.deployments.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemStatus.deployments.activeDeployments}</div>
          <p className="text-xs text-muted-foreground">
            Active • {formatPercentage(systemStatus.deployments.successRate)} success rate
          </p>
        </CardContent>
      </Card>

      {/* Monitoring Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monitoring</CardTitle>
          <div
            className={`flex items-center gap-1 ${getStatusColor(systemStatus.monitoring.status)}`}
          >
            {getStatusIcon(systemStatus.monitoring.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemStatus.monitoring.alertsActive}</div>
          <p className="text-xs text-muted-foreground">
            Active alerts • System {systemStatus.monitoring.systemHealth}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderLoadingState = () => (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <h2 className="text-xl font-semibold">Initializing Feature Flag System</h2>
          <p className="text-muted-foreground">
            Setting up feature flag management, rollout engine, and monitoring...
          </p>
        </div>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>System Initialization Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setError(null);
                initializeSystem();
              }}
            >
              Retry Initialization
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (!initialized && !error) {
    return renderLoadingState();
  }

  if (error) {
    return renderErrorState();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="h-8 w-8" />
            Feature Flags & Deployment
          </h1>
          <p className="text-muted-foreground mt-1">
            Phase 5.0 feature flag management and deployment infrastructure
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Phase 5.0 Live
          </Badge>
          <Button variant="outline" size="sm" onClick={updateSystemStatus}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      {renderSystemOverview()}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="deployments" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Deployments
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Feature Flag Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <FeatureFlagDashboard
            featureFlagManager={featureFlagManager}
            rolloutEngine={rolloutEngine}
            onFeatureToggle={handleFeatureToggle}
            onRolloutStart={handleRolloutStart}
            onEmergencyStop={handleEmergencyStop}
          />
        </TabsContent>

        {/* Production Monitoring */}
        <TabsContent value="monitoring" className="space-y-6">
          <ProductionMonitor
            featureFlagManager={featureFlagManager}
            rolloutEngine={rolloutEngine}
            deploymentManager={deploymentManager}
          />
        </TabsContent>

        {/* Deployment Management */}
        <TabsContent value="deployments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Deployment Management
              </CardTitle>
              <CardDescription>
                Blue-green deployments, canary releases, and rollback controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Deployment Status */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Blue Environment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Status</div>
                          <div className="font-medium">Active (100% traffic)</div>
                        </div>
                        <Badge variant="default">Production</Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Version: 5.0.0 • Deployed 2 hours ago
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Green Environment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Status</div>
                          <div className="font-medium">Idle (0% traffic)</div>
                        </div>
                        <Badge variant="secondary">Standby</Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Version: 4.9.8 • Last deployed 1 week ago
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Deployment Actions */}
                <div className="flex gap-2">
                  <Button disabled>
                    <Rocket className="h-4 w-4 mr-2" />
                    Start Deployment
                  </Button>
                  <Button variant="outline" disabled>
                    <Shield className="h-4 w-4 mr-2" />
                    Health Check
                  </Button>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No Active Deployments</AlertTitle>
                  <AlertDescription>
                    All systems are running stable versions. Deployment manager is ready for new
                    releases.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Feature flag and deployment system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Feature Flag Settings</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Flags Configured:</span>
                      <span className="font-mono">{systemStatus.featureFlags.totalFlags}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Default Rollout Strategy:</span>
                      <span className="font-mono">Conservative</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance Monitoring:</span>
                      <span className="font-mono">Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Emergency Rollback:</span>
                      <span className="font-mono">Enabled</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Deployment Settings</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Deployment Strategy:</span>
                      <span className="font-mono">Blue-Green</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Health Check Interval:</span>
                      <span className="font-mono">30s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rollback Threshold:</span>
                      <span className="font-mono">5% error rate</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Canary Traffic:</span>
                      <span className="font-mono">5% → 25% → 50% → 100%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Monitoring Settings</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Performance Tracking:</span>
                      <span className="font-mono">Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alert Thresholds:</span>
                      <span className="font-mono">Error Rate {'>'} 1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Correlation Analysis:</span>
                      <span className="font-mono">Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Real-time Updates:</span>
                      <span className="font-mono">30s interval</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
