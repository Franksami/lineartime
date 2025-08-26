'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Zap,
  Calendar,
  Activity,
  Timer,
  TrendingUp
} from 'lucide-react';

interface SyncJob {
  id: string;
  providerId: string;
  providerName: string;
  operation: 'full_sync' | 'incremental_sync' | 'webhook_update' | 'token_refresh';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  priority: number;
  progress?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
  estimatedDuration?: number;
  actualDuration?: number;
}

interface QueueStats {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedToday: number;
  failedToday: number;
  averageProcessingTime: number;
  successRate: number;
}

const SyncQueueMonitor: React.FC = () => {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    totalJobs: 0,
    pendingJobs: 0,
    processingJobs: 0,
    completedToday: 247,
    failedToday: 3,
    averageProcessingTime: 2.3,
    successRate: 98.8
  });
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate mock sync jobs
  const generateMockJobs = (): SyncJob[] => {
    const providers = [
      { id: 'google-1', name: 'Google Calendar' },
      { id: 'microsoft-1', name: 'Microsoft Outlook' },
      { id: 'apple-1', name: 'Apple CalDAV' },
      { id: 'caldav-1', name: 'Generic CalDAV' }
    ];

    const operations: SyncJob['operation'][] = ['full_sync', 'incremental_sync', 'webhook_update', 'token_refresh'];
    const statuses: SyncJob['status'][] = ['pending', 'processing', 'completed', 'failed', 'retrying'];

    return Array.from({ length: 12 }, (_, i) => {
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const operation = operations[Math.floor(Math.random() * operations.length)];
      const status = i < 2 ? 'processing' : i < 5 ? 'pending' : statuses[Math.floor(Math.random() * statuses.length)];
      const createdAt = new Date(Date.now() - Math.random() * 3600000); // Within last hour
      const startedAt = status !== 'pending' ? new Date(createdAt.getTime() + Math.random() * 300000) : undefined;
      const completedAt = status === 'completed' ? new Date((startedAt || createdAt).getTime() + Math.random() * 600000) : undefined;
      
      return {
        id: `job-${i + 1}`,
        providerId: provider.id,
        providerName: provider.name,
        operation,
        status,
        priority: Math.floor(Math.random() * 10) + 1,
        progress: status === 'processing' ? Math.floor(Math.random() * 80) + 20 : undefined,
        createdAt,
        startedAt,
        completedAt,
        error: status === 'failed' ? 'Connection timeout' : undefined,
        retryCount: status === 'retrying' ? Math.floor(Math.random() * 3) : 0,
        maxRetries: 3,
        estimatedDuration: Math.random() * 300 + 60, // 1-6 minutes in seconds
        actualDuration: completedAt && startedAt ? (completedAt.getTime() - startedAt.getTime()) / 1000 : undefined
      };
    });
  };

  useEffect(() => {
    const initialJobs = generateMockJobs();
    setJobs(initialJobs);

    // Update stats based on jobs
    const pendingJobs = initialJobs.filter(j => j.status === 'pending').length;
    const processingJobs = initialJobs.filter(j => j.status === 'processing').length;
    const totalJobs = initialJobs.length;

    setStats(prev => ({
      ...prev,
      totalJobs,
      pendingJobs,
      processingJobs
    }));
  }, []);

  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setJobs(prevJobs => {
        return prevJobs.map(job => {
          if (job.status === 'processing' && job.progress !== undefined) {
            const newProgress = Math.min(job.progress + Math.random() * 10, 100);
            if (newProgress >= 100) {
              return {
                ...job,
                status: Math.random() > 0.1 ? 'completed' : 'failed',
                progress: 100,
                completedAt: new Date(),
                actualDuration: job.startedAt ? (Date.now() - job.startedAt.getTime()) / 1000 : undefined,
                error: Math.random() > 0.1 ? undefined : 'Processing error occurred'
              };
            }
            return { ...job, progress: newProgress };
          }

          if (job.status === 'pending' && Math.random() < 0.3) {
            return {
              ...job,
              status: 'processing',
              startedAt: new Date(),
              progress: Math.floor(Math.random() * 20) + 5
            };
          }

          return job;
        });
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setJobs(generateMockJobs());
    setIsRefreshing(false);
  };

  const getStatusColor = (status: SyncJob['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'retrying': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: SyncJob['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'retrying': return <RotateCcw className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getOperationIcon = (operation: SyncJob['operation']) => {
    switch (operation) {
      case 'full_sync': return <Calendar className="w-4 h-4" />;
      case 'incremental_sync': return <Activity className="w-4 h-4" />;
      case 'webhook_update': return <Zap className="w-4 h-4" />;
      case 'token_refresh': return <RefreshCw className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  const formatOperation = (operation: SyncJob['operation']) => {
    switch (operation) {
      case 'full_sync': return 'Full Sync';
      case 'incremental_sync': return 'Incremental Sync';
      case 'webhook_update': return 'Webhook Update';
      case 'token_refresh': return 'Token Refresh';
      default: return operation;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Sync Queue Monitor</h2>
          <p className="text-muted-foreground">Real-time synchronization job monitoring and management</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={isAutoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className="flex items-center gap-2"
          >
            {isAutoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAutoRefresh ? 'Pause' : 'Resume'}
          </Button>
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

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-foreground">{stats.processingJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold text-foreground">{stats.completedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-foreground">{stats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Queue */}
      <Card className="bg-card/30 backdrop-blur-md border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Active Jobs Queue
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time sync job status with exponential backoff retry logic
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {jobs
                .sort((a, b) => {
                  // Sort by status priority: processing > pending > retrying > failed > completed
                  const statusPriority = { 
                    processing: 5, 
                    pending: 4, 
                    retrying: 3, 
                    failed: 2, 
                    completed: 1 
                  };
                  return statusPriority[b.status] - statusPriority[a.status];
                })
                .map((job) => (
                <div 
                  key={job.id} 
                  className="p-4 bg-muted/50 rounded-lg border border-border/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getOperationIcon(job.operation)}
                        <span className="font-medium text-foreground">{job.providerName}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatOperation(job.operation)}
                      </Badge>
                      <Badge className={`${getStatusColor(job.status)} text-xs`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(job.status)}
                          {job.status}
                        </div>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Priority: {job.priority}</span>
                      {job.retryCount > 0 && (
                        <span>• Retry: {job.retryCount}/{job.maxRetries}</span>
                      )}
                    </div>
                  </div>

                  {job.status === 'processing' && job.progress !== undefined && (
                    <div className="mb-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(job.progress)}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  )}

                  {job.error && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <span className="font-medium">Error: </span>
                      {job.error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {job.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                    {job.startedAt && (
                      <div>
                        <p className="text-muted-foreground">Started</p>
                        <p className="font-medium">
                          {job.startedAt.toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                    {job.completedAt && (
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-medium">
                          {job.completedAt.toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {formatDuration(job.actualDuration)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Real-time Status */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-blue-600 font-medium">Queue Active</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <span className="text-muted-foreground">
            Auto-refresh: {isAutoRefresh ? 'ON' : 'OFF'}
          </span>
          <div className="w-px h-4 bg-border" />
          <span className="text-muted-foreground">
            Avg processing time: {stats.averageProcessingTime}s
          </span>
        </div>
      </div>
    </div>
  );
};

export default SyncQueueMonitor;