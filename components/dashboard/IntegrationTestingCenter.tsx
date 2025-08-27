'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Database,
  Edit,
  Eye,
  Globe,
  Key,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Server,
  Settings,
  Shield,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface CalendarProvider {
  id: string;
  name: string;
  type: 'google' | 'microsoft' | 'apple' | 'caldav';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: Date;
  endpoints: {
    auth: string;
    events: string;
    calendars: string;
  };
  credentials: {
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    username?: string;
    password?: string;
    serverUrl?: string;
  };
}

interface TestResult {
  id: string;
  providerId: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'success' | 'error' | 'pending';
  responseTime: number;
  timestamp: Date;
  request: {
    headers: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
  error?: string;
}

interface PerformanceMetric {
  timestamp: Date;
  responseTime: number;
  status: 'success' | 'error' | 'pending';
}

const IntegrationTestingCenter: React.FC = () => {
  const [providers, setProviders] = useState<CalendarProvider[]>([
    {
      id: '1',
      name: 'Google Calendar',
      type: 'google',
      status: 'connected',
      lastSync: new Date(Date.now() - 300000),
      endpoints: {
        auth: 'https://accounts.google.com/oauth2/auth',
        events: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        calendars: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      },
      credentials: {
        clientId: 'your-google-client-id',
        clientSecret: 'your-google-client-secret',
        accessToken: 'ya29.a0...',
      },
    },
    {
      id: '2',
      name: 'Microsoft Graph',
      type: 'microsoft',
      status: 'connected',
      lastSync: new Date(Date.now() - 600000),
      endpoints: {
        auth: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        events: 'https://graph.microsoft.com/v1.0/me/events',
        calendars: 'https://graph.microsoft.com/v1.0/me/calendars',
      },
      credentials: {
        clientId: 'your-microsoft-client-id',
        clientSecret: 'your-microsoft-client-secret',
        accessToken: 'eyJ0eXAi...',
      },
    },
    {
      id: '3',
      name: 'Apple CalDAV',
      type: 'apple',
      status: 'error',
      lastSync: new Date(Date.now() - 3600000),
      endpoints: {
        auth: 'https://caldav.icloud.com',
        events: 'https://caldav.icloud.com/calendar',
        calendars: 'https://caldav.icloud.com/calendar',
      },
      credentials: {
        username: 'your-apple-id',
        password: 'app-specific-password',
        serverUrl: 'https://caldav.icloud.com',
      },
    },
    {
      id: '4',
      name: 'Generic CalDAV',
      type: 'caldav',
      status: 'disconnected',
      lastSync: new Date(Date.now() - 7200000),
      endpoints: {
        auth: 'https://your-caldav-server.com',
        events: 'https://your-caldav-server.com/calendar',
        calendars: 'https://your-caldav-server.com/calendar',
      },
      credentials: {
        username: 'your-username',
        password: 'your-password',
        serverUrl: 'https://your-caldav-server.com',
      },
    },
  ]);

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<Record<string, PerformanceMetric[]>>(
    {}
  );
  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider | null>(providers[0]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [testOperation, setTestOperation] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google':
        return <Globe className="h-5 w-5 text-blue-500" />;
      case 'microsoft':
        return <Server className="h-5 w-5 text-blue-600" />;
      case 'apple':
        return <Calendar className="h-5 w-5 text-gray-600" />;
      case 'caldav':
        return <Database className="h-5 w-5 text-green-600" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <Clock className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>;
    }
  };

  const simulateApiCall = async (
    provider: CalendarProvider,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any
  ): Promise<TestResult> => {
    const startTime = Date.now();

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 500));

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Simulate different response scenarios
    const isSuccess = Math.random() > 0.2; // 80% success rate
    const status = isSuccess ? (method === 'POST' ? 201 : 200) : Math.random() > 0.5 ? 401 : 500;

    const mockResponse = {
      status,
      headers: {
        'content-type': 'application/json',
        'x-ratelimit-remaining': '999',
        'x-response-time': `${responseTime}ms`,
      },
      body: isSuccess
        ? {
            data:
              method === 'GET'
                ? [
                    { id: '1', title: 'Test Event', start: new Date().toISOString() },
                    {
                      id: '2',
                      title: 'Another Event',
                      start: new Date(Date.now() + 3600000).toISOString(),
                    },
                  ]
                : { id: 'new-event', title: 'Created Event' },
            success: true,
          }
        : {
            error: status === 401 ? 'Unauthorized' : 'Internal Server Error',
            message: status === 401 ? 'Invalid credentials' : 'Something went wrong',
          },
    };

    const result: TestResult = {
      id: Date.now().toString(),
      providerId: provider.id,
      endpoint,
      method,
      status: isSuccess ? 'success' : 'error',
      responseTime,
      timestamp: new Date(),
      request: {
        headers: {
          Authorization: provider.credentials.accessToken
            ? `Bearer ${provider.credentials.accessToken}`
            : 'Basic ...',
          'Content-Type': 'application/json',
        },
        body,
      },
      response: mockResponse,
      error: !isSuccess ? mockResponse.body.message : undefined,
    };

    return result;
  };

  const runTest = async (operation?: 'GET' | 'POST' | 'PUT' | 'DELETE') => {
    if (!selectedProvider) return;

    const method = operation || testOperation;
    const endpoint = customEndpoint || selectedProvider.endpoints.events;

    let body;
    if (method !== 'GET' && requestBody) {
      try {
        body = JSON.parse(requestBody);
      } catch (_e) {
        body = requestBody;
      }
    }

    const result = await simulateApiCall(selectedProvider, endpoint, method, body);

    setTestResults((prev) => [result, ...prev.slice(0, 49)]); // Keep last 50 results

    // Update performance metrics
    setPerformanceMetrics((prev) => ({
      ...prev,
      [selectedProvider.id]: [
        ...(prev[selectedProvider.id] || []),
        {
          timestamp: result.timestamp,
          responseTime: result.responseTime,
          status: result.status,
        },
      ].slice(-20), // Keep last 20 metrics per provider
    }));
  };

  const runHealthCheck = async () => {
    if (!selectedProvider) return;

    const operations: Array<'GET' | 'POST' | 'PUT' | 'DELETE'> = ['GET', 'POST', 'PUT', 'DELETE'];

    for (const op of operations) {
      await runTest(op);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between tests
    }
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      intervalRef.current = setInterval(() => {
        if (selectedProvider) {
          runTest('GET'); // Monitor with GET requests
        }
      }, 10000); // Every 10 seconds
    }
    setIsMonitoring(!isMonitoring);
  };

  const getAverageResponseTime = (providerId: string) => {
    const metrics = performanceMetrics[providerId] || [];
    if (metrics.length === 0) return 0;
    return Math.round(metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length);
  };

  const getSuccessRate = (providerId: string) => {
    const metrics = performanceMetrics[providerId] || [];
    if (metrics.length === 0) return 100;
    const successCount = metrics.filter((m) => m.status === 'success').length;
    return Math.round((successCount / metrics.length) * 100);
  };

  useEffect(() => {
    if (autoRefresh) {
      const refreshInterval = setInterval(() => {
        // Update last sync times
        setProviders((prev) =>
          prev.map((p) => ({
            ...p,
            lastSync: p.status === 'connected' ? new Date() : p.lastSync,
          }))
        );
      }, 30000); // Every 30 seconds

      return () => clearInterval(refreshInterval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integration Testing Center</h2>
          <p className="text-muted-foreground">
            Test and monitor calendar provider API endpoints with real-time health checks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-refresh" className="text-sm">
              Auto Refresh
            </Label>
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button
            onClick={toggleMonitoring}
            variant={isMonitoring ? 'destructive' : 'default'}
            className="flex items-center gap-2"
          >
            {isMonitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </div>

      {/* Provider Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className={`cursor-pointer transition-all hover:shadow-md bg-card/50 backdrop-blur-sm border-border/50 ${
              selectedProvider?.id === provider.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedProvider(provider)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getProviderIcon(provider.type)}
                  <span className="font-medium text-sm">{provider.name}</span>
                </div>
                {getStatusBadge(provider.status)}
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Avg Response:</span>
                  <span className="font-mono">{getAverageResponseTime(provider.id)}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Success Rate:</span>
                  <span
                    className={`font-mono ${getSuccessRate(provider.id) >= 95 ? 'text-green-600' : 'text-yellow-600'}`}
                  >
                    {getSuccessRate(provider.id)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Sync:</span>
                  <span className="font-mono">
                    {Math.round((Date.now() - provider.lastSync.getTime()) / 60000)}m ago
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProvider && (
        <Tabs defaultValue="testing" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="testing">API Testing</TabsTrigger>
            <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="logs">Request Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="testing" className="space-y-6">
            <Card className="bg-card/30 backdrop-blur-md border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    API Endpoint Testing
                  </CardTitle>
                  <Button
                    onClick={runHealthCheck}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    Run Health Check
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="operation">HTTP Method</Label>
                      <select
                        id="operation"
                        value={testOperation}
                        onChange={(e) => setTestOperation(e.target.value as any)}
                        className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                      >
                        <option value="GET">GET - Fetch Events</option>
                        <option value="POST">POST - Create Event</option>
                        <option value="PUT">PUT - Update Event</option>
                        <option value="DELETE">DELETE - Remove Event</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="endpoint">Custom Endpoint (optional)</Label>
                      <Input
                        id="endpoint"
                        value={customEndpoint}
                        onChange={(e) => setCustomEndpoint(e.target.value)}
                        placeholder={selectedProvider.endpoints.events}
                        className="mt-1"
                      />
                    </div>

                    {testOperation !== 'GET' && (
                      <div>
                        <Label htmlFor="request-body">Request Body (JSON)</Label>
                        <Textarea
                          id="request-body"
                          value={requestBody}
                          onChange={(e) => setRequestBody(e.target.value)}
                          placeholder={JSON.stringify(
                            {
                              title: 'Test Event',
                              start: new Date().toISOString(),
                              end: new Date(Date.now() + 3600000).toISOString(),
                            },
                            null,
                            2
                          )}
                          rows={6}
                          className="mt-1 font-mono text-sm"
                        />
                      </div>
                    )}

                    <Button onClick={() => runTest()} className="w-full flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Execute Test
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => runTest('GET')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Get Events
                      </Button>
                      <Button
                        onClick={() => runTest('POST')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Event
                      </Button>
                      <Button
                        onClick={() => runTest('PUT')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Update Event
                      </Button>
                      <Button
                        onClick={() => runTest('DELETE')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Event
                      </Button>
                    </div>

                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h5 className="font-medium mb-2">Provider Info</h5>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Type: {selectedProvider.type}</div>
                        <div>Status: {selectedProvider.status}</div>
                        <div>Auth Endpoint: {selectedProvider.endpoints.auth}</div>
                        <div>Events Endpoint: {selectedProvider.endpoints.events}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card className="bg-card/30 backdrop-blur-md border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Real-time Performance Monitoring
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                      {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
                    </Badge>
                    <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Response Time</p>
                          <p className="text-2xl font-bold">
                            {getAverageResponseTime(selectedProvider.id)}ms
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Success Rate</p>
                          <p className="text-2xl font-bold">
                            {getSuccessRate(selectedProvider.id)}%
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Requests</p>
                          <p className="text-2xl font-bold">
                            {performanceMetrics[selectedProvider.id]?.length || 0}
                          </p>
                        </div>
                        <Database className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Simple performance chart placeholder */}
                <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2" />
                    <p>Performance Chart</p>
                    <p className="text-sm">Response time trends over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <Card className="bg-card/30 backdrop-blur-md border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Provider Configuration
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Key className="h-4 w-4 mr-2" />
                    Test Authentication
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="provider-name">Provider Name</Label>
                      <Input
                        id="provider-name"
                        value={selectedProvider.name}
                        readOnly
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="provider-type">Provider Type</Label>
                      <Input
                        id="provider-type"
                        value={selectedProvider.type}
                        readOnly
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="auth-endpoint">Authentication Endpoint</Label>
                      <Input
                        id="auth-endpoint"
                        value={selectedProvider.endpoints.auth}
                        readOnly
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="events-endpoint">Events Endpoint</Label>
                      <Input
                        id="events-endpoint"
                        value={selectedProvider.endpoints.events}
                        readOnly
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Credentials
                    </h4>

                    {selectedProvider.credentials.clientId && (
                      <div>
                        <Label htmlFor="client-id">Client ID</Label>
                        <Input
                          id="client-id"
                          value={selectedProvider.credentials.clientId}
                          type="password"
                          readOnly
                          className="mt-1"
                        />
                      </div>
                    )}

                    {selectedProvider.credentials.accessToken && (
                      <div>
                        <Label htmlFor="access-token">Access Token</Label>
                        <Input
                          id="access-token"
                          value={selectedProvider.credentials.accessToken}
                          type="password"
                          readOnly
                          className="mt-1"
                        />
                      </div>
                    )}

                    {selectedProvider.credentials.username && (
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={selectedProvider.credentials.username}
                          readOnly
                          className="mt-1"
                        />
                      </div>
                    )}

                    {selectedProvider.credentials.serverUrl && (
                      <div>
                        <Label htmlFor="server-url">Server URL</Label>
                        <Input
                          id="server-url"
                          value={selectedProvider.credentials.serverUrl}
                          readOnly
                          className="mt-1"
                        />
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h5 className="font-medium mb-2">Connection Status</h5>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedProvider.status)}
                        <span className="text-sm text-muted-foreground">
                          Last sync: {selectedProvider.lastSync.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-card/30 backdrop-blur-md border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Request/Response Logs
                  </CardTitle>
                  <Button
                    onClick={() => setTestResults([])}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Logs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Response Time</TableHead>
                        <TableHead>Response Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testResults
                        .filter((r) => r.providerId === selectedProvider.id)
                        .map((result) => (
                          <TableRow key={result.id}>
                            <TableCell className="font-mono text-xs">
                              {result.timestamp.toLocaleTimeString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {result.method}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-xs">
                              {result.endpoint}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={result.status === 'success' ? 'default' : 'destructive'}
                                className="flex items-center gap-1"
                              >
                                {result.status === 'success' ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <AlertCircle className="h-3 w-3" />
                                )}
                                {result.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              <span
                                className={
                                  result.responseTime > 1000
                                    ? 'text-red-600'
                                    : result.responseTime > 500
                                      ? 'text-yellow-600'
                                      : 'text-green-600'
                                }
                              >
                                {result.responseTime}ms
                              </span>
                            </TableCell>
                            <TableCell className="font-mono">
                              <span
                                className={
                                  result.response.status >= 400 ? 'text-red-600' : 'text-green-600'
                                }
                              >
                                {result.response.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {testResults.filter((r) => r.providerId === selectedProvider.id).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No test results yet</p>
                    <p className="text-sm">Run some API tests to see logs here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default IntegrationTestingCenter;
