'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';

// Icons for the integration dashboard
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Database,
  Eye,
  EyeOff,
  Globe,
  Lock,
  RefreshCw,
  Server,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Wifi,
  XCircle,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Enhanced Dashboard Components
import IntegrationAnalyticsCharts from '@/components/dashboard/IntegrationAnalyticsCharts';
import IntegrationTestingCenter from '@/components/dashboard/IntegrationTestingCenter';
import PerformanceMonitoringDashboard from '@/components/dashboard/PerformanceMonitoringDashboard';
import { PerformanceSLOProvider } from '@/components/dashboard/PerformanceSLOProvider';
import SecurityMonitoringDashboard from '@/components/dashboard/SecurityMonitoringDashboard';
import SyncQueueMonitor from '@/components/dashboard/SyncQueueMonitor';

// Command Workspace Views for modern dashboard
const WeekView = dynamic(
  () => import('@/views/week/WeekView').then((mod) => ({ default: mod.WeekView })),
  { loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-md" /> }
);

const CommandCenterCalendarPro = dynamic(
  () =>
    import('@/components/calendar/LinearCalendarPro').then((mod) => ({
      default: mod.CommandCenterCalendarPro,
    })),
  { loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-md" /> }
);

const ToastUICalendarView = dynamic(
  () =>
    import('@/components/calendar/ToastUICalendarView').then((mod) => ({
      default: mod.ToastUICalendarView,
    })),
  { loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-md" /> }
);

const ProgressCalendarView = dynamic(
  () =>
    import('@/components/calendar/ProgressCalendarView').then((mod) => ({
      default: mod.ProgressCalendarView,
    })),
  { loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-md" /> }
);

// Calendar Provider Types
interface CalendarProvider {
  id: string;
  name: string;
  type: 'oauth2' | 'caldav';
  status: 'connected' | 'error' | 'syncing' | 'disconnected';
  lastSync?: Date;
  tokenExpiry?: Date;
  webhookStatus?: 'active' | 'expired' | 'error';
  eventsCount: number;
  syncProgress?: number;
}

// Sync Queue Job
interface SyncJob {
  id: string;
  provider: string;
  operation: 'full_sync' | 'incremental_sync' | 'webhook_update';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

// Mock data for demonstration (in real app, this would come from Convex)
const mockProviders: CalendarProvider[] = [
  {
    id: 'google-1',
    name: 'Google Calendar',
    type: 'oauth2',
    status: 'connected',
    lastSync: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    tokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    webhookStatus: 'active',
    eventsCount: 342,
    syncProgress: 100,
  },
  {
    id: 'microsoft-1',
    name: 'Microsoft Outlook',
    type: 'oauth2',
    status: 'syncing',
    lastSync: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    tokenExpiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    webhookStatus: 'active',
    eventsCount: 128,
    syncProgress: 75,
  },
  {
    id: 'apple-1',
    name: 'Apple iCloud',
    type: 'caldav',
    status: 'connected',
    lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    eventsCount: 89,
    syncProgress: 100,
  },
  {
    id: 'caldav-1',
    name: 'CalDAV Server',
    type: 'caldav',
    status: 'error',
    lastSync: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    eventsCount: 23,
    syncProgress: 0,
  },
];

const _mockSyncQueue: SyncJob[] = [
  {
    id: 'sync-1',
    provider: 'Google Calendar',
    operation: 'incremental_sync',
    status: 'processing',
    priority: 5,
    createdAt: new Date(Date.now() - 30 * 1000),
  },
  {
    id: 'sync-2',
    provider: 'Microsoft Outlook',
    operation: 'webhook_update',
    status: 'pending',
    priority: 8,
    createdAt: new Date(Date.now() - 60 * 1000),
  },
  {
    id: 'sync-3',
    provider: 'Apple iCloud',
    operation: 'full_sync',
    status: 'completed',
    priority: 3,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 60 * 1000),
  },
];

const calendarLibraries = [
  { id: 'week', name: 'Command Workspace Week View', component: 'WeekView' },
  { id: 'fullcalendar', name: 'FullCalendar Pro', component: 'CommandCenterCalendarPro' },
  { id: 'toast-ui', name: 'Toast UI Calendar', component: 'ToastUICalendarView' },
  { id: 'progress', name: 'Progress Calendar', component: 'ProgressCalendarView' },
  { id: 'react-big', name: 'React Big Calendar', component: 'ReactBigCalendarView' },
  { id: 'react-infinite', name: 'React Infinite Calendar', component: 'ReactInfiniteCalendarView' },
  { id: 'primereact', name: 'PrimeReact Calendar', component: 'PrimeReactCalendarView' },
  { id: 'mui-x', name: 'MUI X Calendar', component: 'MUIXCalendarView' },
  { id: 'react-calendar', name: 'React Calendar', component: 'ReactCalendarView' },
  { id: 'react-datepicker', name: 'React DatePicker', component: 'ReactDatePickerView' },
];

export default function IntegrationDashboardPage() {
  const [selectedLibrary, setSelectedLibrary] = useState('week');
  const [_showSecurityDetails, _setShowSecurityDetails] = useState(false);
  const currentYear = new Date().getFullYear();

  // Mock events for calendar demo
  const mockEvents = useMemo(
    () => [
      {
        id: '1',
        title: 'Team Meeting',
        startDate: new Date(2025, 0, 15, 10, 0),
        endDate: new Date(2025, 0, 15, 11, 0),
        category: 'work' as const,
        description: 'Weekly team sync',
      },
      {
        id: '2',
        title: 'Project Deadline',
        startDate: new Date(2025, 0, 20, 17, 0),
        endDate: new Date(2025, 0, 20, 18, 0),
        category: 'work' as const,
        description: 'Q1 deliverables due',
      },
      {
        id: '3',
        title: 'Doctor Appointment',
        startDate: new Date(2025, 0, 25, 14, 30),
        endDate: new Date(2025, 0, 25, 15, 30),
        category: 'personal' as const,
        description: 'Annual checkup',
      },
    ],
    []
  );

  // Calculate system health metrics
  const systemHealth = useMemo(() => {
    const connectedProviders = mockProviders.filter((p) => p.status === 'connected').length;
    const totalProviders = mockProviders.length;
    const healthPercentage = Math.round((connectedProviders / totalProviders) * 100);

    const totalEvents = mockProviders.reduce((sum, p) => sum + p.eventsCount, 0);
    const activeWebhooks = mockProviders.filter((p) => p.webhookStatus === 'active').length;

    return {
      providerHealth: healthPercentage,
      connectedProviders,
      totalProviders,
      totalEvents,
      activeWebhooks,
      encryptionStatus: 'AES-256-GCM Active',
      lastSecurityScan: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-gray-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token *//10 text-green-700 /* TODO: Use semantic token */ /* TODO: Use semantic token */ border-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token *//20';
      case 'syncing':
        return 'bg-primary/10 text-blue-700 /* TODO: Use semantic token */ /* TODO: Use semantic token */ border-blue-500 /* TODO: Use semantic token */ /* TODO: Use semantic token *//20';
      case 'error':
        return 'bg-red-500 /* TODO: Use semantic token */ /* TODO: Use semantic token *//10 text-red-700 /* TODO: Use semantic token */ /* TODO: Use semantic token */ border-red-500 /* TODO: Use semantic token */ /* TODO: Use semantic token *//20';
      case 'disconnected':
        return 'bg-gray-500 /* TODO: Use semantic token */ /* TODO: Use semantic token *//10 text-muted-foreground border-gray-500 /* TODO: Use semantic token */ /* TODO: Use semantic token *//20';
      default:
        return 'bg-gray-500 /* TODO: Use semantic token */ /* TODO: Use semantic token *//10 text-muted-foreground border-gray-500 /* TODO: Use semantic token */ /* TODO: Use semantic token *//20';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const renderCalendarComponent = () => {
    switch (selectedLibrary) {
      case 'week':
        return (
          <div className="h-full w-full">
            <WeekView />
          </div>
        );
      case 'fullcalendar':
        return (
          <CommandCenterCalendarPro
            year={currentYear}
            events={mockEvents}
            className="h-full w-full"
            onEventCreate={() => {}}
            onEventUpdate={() => {}}
            onEventDelete={() => {}}
            enableInfiniteCanvas={true}
          />
        );
      case 'toast-ui':
        return (
          <ToastUICalendarView
            year={currentYear}
            events={mockEvents}
            className="h-full w-full"
            onEventCreate={() => {}}
            onEventUpdate={() => {}}
            onEventDelete={() => {}}
          />
        );
      case 'progress':
        return (
          <ProgressCalendarView
            year={currentYear}
            events={mockEvents}
            className="h-full w-full"
            onDateSelect={() => {}}
            onEventClick={() => {}}
          />
        );
      default:
        return (
          <div className="h-full w-full bg-muted rounded-md flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Calendar library not yet implemented in demo</p>
              <p className="text-sm text-muted-foreground mt-1">
                {calendarLibraries.find((lib) => lib.id === selectedLibrary)?.name}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Integration Platform Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Command Center Calendar Phase 2.6 Foundation - Enterprise Calendar Integration
                Platform
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="gap-2">
                <Zap className="h-3 w-3" />
                Live Demo
              </Badge>
              <Badge variant="outline" className="gap-2">
                v2.6.0
              </Badge>
            </div>
          </div>

          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Provider Health</p>
                    <p className="text-2xl font-bold">{systemHealth.providerHealth}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />
                </div>
                <Progress value={systemHealth.providerHealth} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Connected Providers</p>
                    <p className="text-2xl font-bold">
                      {systemHealth.connectedProviders}/{systemHealth.totalProviders}
                    </p>
                  </div>
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Google, Microsoft, Apple, CalDAV
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                    <p className="text-2xl font-bold">
                      {systemHealth.totalEvents.toLocaleString()}
                    </p>
                  </div>
                  <Database className="h-8 w-8 text-purple-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Across all providers</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Security Status</p>
                    <p className="text-lg font-bold text-green-600 /* TODO: Use semantic token */ /* TODO: Use semantic token */">
                      Secure
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-green-500 /* TODO: Use semantic token */ /* TODO: Use semantic token */" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">AES-256-GCM Active</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="libraries">Libraries</TabsTrigger>
            <TabsTrigger value="sync">Sync Monitor</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance SLO</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>

          {/* Provider Management Tab */}
          <TabsContent value="providers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockProviders.map((provider) => (
                <Card key={provider.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {provider.name}
                        {getStatusIcon(provider.status)}
                      </CardTitle>
                      <Badge className={getStatusColor(provider.status)}>{provider.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium">{provider.type.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Events</p>
                        <p className="font-medium">{provider.eventsCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Sync</p>
                        <p className="font-medium">
                          {provider.lastSync ? formatTimeAgo(provider.lastSync) : 'Never'}
                        </p>
                      </div>
                      {provider.webhookStatus && (
                        <div>
                          <p className="text-muted-foreground">Webhook</p>
                          <p className="font-medium capitalize">{provider.webhookStatus}</p>
                        </div>
                      )}
                    </div>

                    {provider.status === 'syncing' && provider.syncProgress !== undefined && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Sync Progress</span>
                          <span className="text-sm font-medium">{provider.syncProgress}%</span>
                        </div>
                        <Progress value={provider.syncProgress} />
                      </div>
                    )}

                    {provider.tokenExpiry && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Token Expires</span>
                        <span className="font-medium">{formatTimeAgo(provider.tokenExpiry)}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Configure
                      </Button>
                      <Button size="sm" variant="outline" disabled={provider.status === 'syncing'}>
                        Sync Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Calendar Libraries Tab */}
          <TabsContent value="libraries" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Calendar Libraries</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Switch between 10 integrated calendar libraries
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {calendarLibraries.map((library) => (
                      <Button
                        key={library.id}
                        variant={selectedLibrary === library.id ? 'default' : 'ghost'}
                        className="w-full justify-start text-left"
                        onClick={() => setSelectedLibrary(library.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{library.name}</div>
                            <div className="text-xs text-muted-foreground">{library.component}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Live Preview
                    <Badge variant="secondary">
                      {calendarLibraries.find((lib) => lib.id === selectedLibrary)?.name}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Interactive calendar with unified event data from all providers
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-96 border border-border rounded-md overflow-hidden">
                    <Suspense
                      fallback={
                        <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center">
                          <div className="text-center">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">Loading calendar...</p>
                          </div>
                        </div>
                      }
                    >
                      {renderCalendarComponent()}
                    </Suspense>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sync Monitor Tab */}
          <TabsContent value="sync" className="space-y-6">
            <SyncQueueMonitor />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <SecurityMonitoringDashboard />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <IntegrationAnalyticsCharts />
          </TabsContent>

          {/* Performance SLO Tab */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceSLOProvider autoStart={true}>
              <PerformanceMonitoringDashboard />
            </PerformanceSLOProvider>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <IntegrationTestingCenter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
