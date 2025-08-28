'use client';

import {
  type PerformanceAlert,
  type PerformanceMetrics,
  performanceMonitor,
} from '@/lib/performance/PerformanceMonitor';
import { cn } from '@/lib/utils';
import type React from 'react';
import { useEffect, useState } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'good' | 'warning' | 'error';
  trend?: 'up' | 'down' | 'stable';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, status = 'good', trend }) => {
  const statusColors = {
    good: 'text-green-600 /* TODO: Use semantic token */ dark:text-green-400 /* TODO: Use semantic token */',
    warning: 'text-yellow-600 /* TODO: Use semantic token */ dark:text-yellow-400 /* TODO: Use semantic token */',
    error: 'text-red-600 /* TODO: Use semantic token */ dark:text-red-400 /* TODO: Use semantic token */',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  return (
    <div className="bg-white dark:bg-gray-800 /* TODO: Use semantic token */ rounded-lg p-4 shadow-sm border border-border dark:border-gray-700 /* TODO: Use semantic token */">
      <div className="text-sm text-gray-500 /* TODO: Use semantic token */ dark:text-gray-400 /* TODO: Use semantic token */ mb-1">{label}</div>
      <div className="flex items-baseline space-x-2">
        <span className={cn('text-2xl font-semibold', statusColors[status])}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        {unit && <span className="text-sm text-gray-500 /* TODO: Use semantic token */ dark:text-gray-400 /* TODO: Use semantic token */">{unit}</span>}
        {trend && <span className="text-sm">{trendIcons[trend]}</span>}
      </div>
    </div>
  );
};

interface HealthIndicatorProps {
  health: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  score: number;
}

const HealthIndicator: React.FC<HealthIndicatorProps> = ({ health, score }) => {
  const healthColors = {
    excellent: 'bg-green-500 /* TODO: Use semantic token */',
    good: 'bg-primary',
    fair: 'bg-yellow-500 /* TODO: Use semantic token */',
    poor: 'bg-orange-500',
    critical: 'bg-red-500 /* TODO: Use semantic token */',
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Overall Health</span>
          <span className="text-sm text-gray-500 /* TODO: Use semantic token */">{score.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 /* TODO: Use semantic token */ dark:bg-gray-700 /* TODO: Use semantic token */ rounded-full h-2">
          <div
            className={cn('h-2 rounded-full transition-all duration-300', healthColors[health])}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      <div
        className={cn(
          'px-3 py-1 rounded-full text-white text-sm font-medium',
          healthColors[health]
        )}
      >
        {health.toUpperCase()}
      </div>
    </div>
  );
};

interface AlertItemProps {
  alert: PerformanceAlert;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert }) => {
  const severityColors = {
    info: 'border-blue-200 /* TODO: Use semantic token */ bg-blue-50 /* TODO: Use semantic token */ dark:border-blue-800 /* TODO: Use semantic token */ dark:bg-blue-900 /* TODO: Use semantic token *//20',
    warning: 'border-yellow-200 /* TODO: Use semantic token */ bg-yellow-50 /* TODO: Use semantic token */ dark:border-yellow-800 /* TODO: Use semantic token */ dark:bg-yellow-900 /* TODO: Use semantic token *//20',
    error: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20',
    critical: 'border-red-200 /* TODO: Use semantic token */ bg-red-50 /* TODO: Use semantic token */ dark:border-red-800 /* TODO: Use semantic token */ dark:bg-red-900 /* TODO: Use semantic token *//20',
  };

  const severityIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  };

  return (
    <div className={cn('border rounded-lg p-3 mb-2', severityColors[alert.severity])}>
      <div className="flex items-start space-x-2">
        <span className="text-lg">{severityIcons[alert.severity]}</span>
        <div className="flex-1">
          <div className="font-medium text-sm">{alert.message}</div>
          {alert.recommendation && (
            <div className="text-xs text-gray-600 /* TODO: Use semantic token */ dark:text-gray-400 /* TODO: Use semantic token */ mt-1">
              {alert.recommendation}
            </div>
          )}
          <div className="text-xs text-gray-500 /* TODO: Use semantic token */ dark:text-gray-500 /* TODO: Use semantic token */ mt-1">
            Value: {alert.value.toFixed(2)} | Threshold: {alert.threshold.toFixed(2)}
          </div>
        </div>
        <div className="text-xs text-gray-500 /* TODO: Use semantic token */">
          {new Date(alert.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Subscribe to metrics updates
    const unsubscribeMetrics = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    // Subscribe to alerts
    const unsubscribeAlerts = performanceMonitor.subscribeToAlerts((alert) => {
      setAlerts((prev) => [...prev.slice(-9), alert]); // Keep last 10 alerts
    });

    // Get initial data
    setMetrics(performanceMonitor.getMetrics());
    setAlerts(performanceMonitor.getAlerts());

    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
    };
  }, []);

  if (!metrics) {
    return null;
  }

  const getMetricStatus = (
    value: number,
    thresholds: { good: number; warning: number; bad: number }
  ): 'good' | 'warning' | 'error' => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'error';
  };

  const overallScore = (metrics.performanceScore + metrics.qualityScore) / 2;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            'flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg transition-colors',
            metrics.overallHealth === 'excellent' && 'bg-green-500 /* TODO: Use semantic token */ hover:bg-green-600 /* TODO: Use semantic token */ text-white',
            metrics.overallHealth === 'good' && 'bg-primary hover:bg-blue-600 /* TODO: Use semantic token */ text-white',
            metrics.overallHealth === 'fair' && 'bg-yellow-500 /* TODO: Use semantic token */ hover:bg-yellow-600 /* TODO: Use semantic token */ text-white',
            metrics.overallHealth === 'poor' && 'bg-orange-500 hover:bg-orange-600 text-white',
            metrics.overallHealth === 'critical' && 'bg-red-500 /* TODO: Use semantic token */ hover:bg-red-600 /* TODO: Use semantic token */ text-white'
          )}
        >
          <span className="text-sm font-medium">Performance</span>
          <span className="text-xs">{metrics.fps.toFixed(0)} FPS</span>
          {alerts.length > 0 && (
            <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
              {alerts.length} alerts
            </span>
          )}
        </button>
      )}

      {/* Expanded Dashboard */}
      {isExpanded && (
        <div className="bg-white dark:bg-gray-900 /* TODO: Use semantic token */ rounded-lg shadow-2xl border border-border dark:border-gray-700 /* TODO: Use semantic token */ w-96 max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border dark:border-gray-700 /* TODO: Use semantic token */">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Performance Monitor</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 /* TODO: Use semantic token */ hover:text-muted-foreground dark:text-gray-400 /* TODO: Use semantic token */ dark:hover:text-gray-200 /* TODO: Use semantic token */"
              >
                ✕
              </button>
            </div>
            <HealthIndicator health={metrics.overallHealth} score={overallScore} />
          </div>

          {/* Metrics Grid */}
          <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto flex-1">
            <MetricCard
              label="FPS"
              value={metrics.fps}
              status={getMetricStatus(60 - metrics.fps, { good: 10, warning: 20, bad: 30 })}
            />
            <MetricCard
              label="Frame Time"
              value={metrics.frameTimeAvg}
              unit="ms"
              status={getMetricStatus(metrics.frameTimeAvg, { good: 16.67, warning: 33, bad: 50 })}
            />
            <MetricCard
              label="Memory"
              value={metrics.heapUsed}
              unit="MB"
              status={getMetricStatus(metrics.heapUsed, { good: 200, warning: 400, bad: 600 })}
            />
            <MetricCard
              label="DOM Nodes"
              value={metrics.domNodes}
              status={getMetricStatus(metrics.domNodes, { good: 3000, warning: 6000, bad: 10000 })}
            />
            <MetricCard
              label="Render Queue"
              value={metrics.renderQueueSize}
              status={getMetricStatus(metrics.renderQueueSize, { good: 20, warning: 50, bad: 100 })}
            />
            <MetricCard
              label="Dropped Frames"
              value={metrics.droppedFrames}
              status={getMetricStatus(metrics.droppedFrames, { good: 0, warning: 10, bad: 50 })}
            />
            <MetricCard
              label="Leak Risk"
              value={metrics.leakRisk * 100}
              unit="%"
              status={getMetricStatus(metrics.leakRisk, { good: 0.3, warning: 0.6, bad: 0.8 })}
            />
            <MetricCard
              label="CPU Usage"
              value={metrics.cpuUsage}
              unit="%"
              status={getMetricStatus(metrics.cpuUsage, { good: 30, warning: 60, bad: 80 })}
            />
          </div>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="p-4 border-t border-border dark:border-gray-700 /* TODO: Use semantic token */ max-h-48 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Recent Alerts</h4>
                <button
                  onClick={() => {
                    performanceMonitor.clearAlerts();
                    setAlerts([]);
                  }}
                  className="text-xs text-gray-500 /* TODO: Use semantic token */ hover:text-muted-foreground dark:text-gray-400 /* TODO: Use semantic token */ dark:hover:text-gray-200 /* TODO: Use semantic token */"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {alerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-3 border-t border-border dark:border-gray-700 /* TODO: Use semantic token */ flex justify-between">
            <button
              onClick={() => {
                const report = performanceMonitor.generateReport();
                console.log(report);
                alert('Performance report logged to console');
              }}
              className="text-sm text-blue-600 /* TODO: Use semantic token */ hover:text-blue-700 /* TODO: Use semantic token */ dark:text-blue-400 /* TODO: Use semantic token */ dark:hover:text-blue-300 /* TODO: Use semantic token */"
            >
              Generate Report
            </button>
            <div className="flex space-x-2">
              <span className="text-xs text-gray-500 /* TODO: Use semantic token */">
                Perf: {metrics.performanceScore.toFixed(0)}
              </span>
              <span className="text-xs text-gray-500 /* TODO: Use semantic token */">
                Quality: {metrics.qualityScore.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
