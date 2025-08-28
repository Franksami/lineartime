'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Calendar,
  Clock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Mock data for real-time analytics
const generateSyncData = () => {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    return {
      time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      fullTime: hour,
      google: Math.floor(Math.random() * 50) + 50,
      microsoft: Math.floor(Math.random() * 40) + 40,
      apple: Math.floor(Math.random() * 30) + 30,
      caldav: Math.floor(Math.random() * 20) + 10,
      total: 0,
    };
  }).map((item) => ({
    ...item,
    total: item.google + item.microsoft + item.apple + item.caldav,
  }));
};

const generatePerformanceData = () => {
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      responseTime: Math.floor(Math.random() * 200) + 100,
      successRate: Math.random() * 10 + 90,
      errorRate: Math.random() * 5,
      throughput: Math.floor(Math.random() * 1000) + 500,
    };
  });
};

const generateProviderDistribution = () => [
  { name: 'Google Calendar', value: 1247, fill: '#4285f4' },
  { name: 'Microsoft Outlook', value: 892, fill: '#00a1f1' },
  { name: 'Apple CalDAV', value: 634, fill: '#007aff' },
  { name: 'Generic CalDAV', value: 156, fill: '#6b7280' },
];

interface AnalyticsMetrics {
  totalSyncs: number;
  successRate: number;
  avgResponseTime: number;
  totalEvents: number;
  activeSessions: number;
  growthRate: number;
}

const IntegrationAnalyticsCharts: React.FC = () => {
  const [syncData, setSyncData] = useState(generateSyncData());
  const [performanceData, setPerformanceData] = useState(generatePerformanceData());
  const [providerDistribution, setProviderDistribution] = useState(generateProviderDistribution());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  const metrics = useMemo<AnalyticsMetrics>(() => {
    const totalSyncs = syncData.reduce((sum, item) => sum + item.total, 0);
    const avgResponseTime =
      performanceData.reduce((sum, item) => sum + item.responseTime, 0) / performanceData.length;
    const successRate =
      performanceData.reduce((sum, item) => sum + item.successRate, 0) / performanceData.length;
    const totalEvents = providerDistribution.reduce((sum, item) => sum + item.value, 0);

    return {
      totalSyncs,
      successRate: Math.round(successRate * 10) / 10,
      avgResponseTime: Math.round(avgResponseTime),
      totalEvents,
      activeSessions: Math.floor(Math.random() * 50) + 200,
      growthRate: Math.random() * 20 + 5,
    };
  }, [syncData, performanceData, providerDistribution]);

  // Real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncData(generateSyncData());
      setPerformanceData(generatePerformanceData());
      setProviderDistribution(generateProviderDistribution());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSyncData(generateSyncData());
    setPerformanceData(generatePerformanceData());
    setProviderDistribution(generateProviderDistribution());
    setIsRefreshing(false);
  };

  const formatTooltip = (value: any, name: string) => {
    if (name === 'responseTime') return [`${value}ms`, 'Response Time'];
    if (name === 'successRate') return [`${value.toFixed(1)}%`, 'Success Rate'];
    if (name === 'errorRate') return [`${value.toFixed(1)}%`, 'Error Rate'];
    if (name === 'throughput') return [`${value} req/min`, 'Throughput'];
    return [value, name];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm p-3 rounded-lg border border-border/50 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integration Analytics</h2>
          <p className="text-muted-foreground">Real-time performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <TabsList>
              <TabsTrigger value="24h">24H</TabsTrigger>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Total Syncs</p>
                <p className="text-lg font-semibold text-foreground">{metrics.totalSyncs}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />+{metrics.growthRate.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500 /* TODO: Use semantic token */" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Success Rate</p>
                <p className="text-lg font-semibold text-foreground">{metrics.successRate}%</p>
              </div>
              <Badge variant="secondary" className="text-xs text-green-600 /* TODO: Use semantic token */">
                Excellent
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Avg Response</p>
                <p className="text-lg font-semibold text-foreground">{metrics.avgResponseTime}ms</p>
              </div>
              <Badge variant="outline" className="text-xs">
                Fast
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500 /* TODO: Use semantic token */" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Total Events</p>
                <p className="text-lg font-semibold text-foreground">
                  {metrics.totalEvents.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-500" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Active Sessions</p>
                <p className="text-lg font-semibold text-foreground">{metrics.activeSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 /* TODO: Use semantic token */ animate-pulse" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">System Status</p>
                <p className="text-lg font-semibold text-green-600 /* TODO: Use semantic token */">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sync Activity Chart */}
        <Card className="bg-card/30 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Real-time Sync Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Synchronization events across providers</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={syncData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="google"
                  stackId="1"
                  stroke="#4285f4"
                  fill="#4285f4"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="microsoft"
                  stackId="1"
                  stroke="#00a1f1"
                  fill="#00a1f1"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="apple"
                  stackId="1"
                  stroke="#007aff"
                  fill="#007aff"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="caldav"
                  stackId="1"
                  stroke="#6b7280"
                  fill="#6b7280"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Provider Distribution */}
        <Card className="bg-card/30 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Provider Event Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Event count by calendar provider</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={providerDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {providerDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="bg-card/30 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
            <p className="text-sm text-muted-foreground">Response time and success rate trends</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip content={<CustomTooltip />} formatter={formatTooltip} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="successRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Throughput Chart */}
        <Card className="bg-card/30 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">API Throughput</CardTitle>
            <p className="text-sm text-muted-foreground">Requests per minute over time</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip content={<CustomTooltip />} formatter={formatTooltip} />
                <Bar dataKey="throughput" fill="url(#throughputGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 /* TODO: Use semantic token */ animate-pulse" />
          <span>Real-time data • Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default IntegrationAnalyticsCharts;
