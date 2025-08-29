/**
 * Web Vitals Monitoring System for Command Center Calendar
 *
 * Comprehensive performance monitoring based on Core Web Vitals and INP.
 * Implements research-validated best practices from Next.js documentation.
 *
 * @see https://web.dev/vitals/
 * @see https://nextjs.org/docs/app/api-reference/functions/useReportWebVitals
 */

'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type WebVitalsMetric = {
  id: string;
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  navigationType?: string;
  attribution?: any;
};

export interface PerformanceThresholds {
  FCP: { good: number; poor: number };
  LCP: { good: number; poor: number };
  FID: { good: number; poor: number };
  CLS: { good: number; poor: number };
  INP: { good: number; poor: number };
  TTFB: { good: number; poor: number };
}

export interface PerformanceReport {
  timestamp: number;
  metrics: Map<string, WebVitalsMetric>;
  score: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  recommendations: string[];
}

// ============================================================================
// PERFORMANCE THRESHOLDS (Based on Web.dev and Google Standards)
// ============================================================================

const THRESHOLDS: PerformanceThresholds = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

// ============================================================================
// RATING CALCULATOR
// ============================================================================

function calculateRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof PerformanceThresholds];
  if (!threshold) return 'needs-improvement';

  if (value <= threshold.good) return 'good';
  if (value > threshold.poor) return 'poor';
  return 'needs-improvement';
}

function calculateOverallScore(metrics: Map<string, WebVitalsMetric>): number {
  const weights = {
    LCP: 0.25, // Largest Contentful Paint (25%)
    FID: 0.15, // First Input Delay (15%)
    CLS: 0.15, // Cumulative Layout Shift (15%)
    INP: 0.2, // Interaction to Next Paint (20%)
    FCP: 0.15, // First Contentful Paint (15%)
    TTFB: 0.1, // Time to First Byte (10%)
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([metricName, weight]) => {
    const metric = metrics.get(metricName);
    if (metric) {
      const rating = metric.rating || calculateRating(metricName, metric.value);
      const score = rating === 'good' ? 100 : rating === 'needs-improvement' ? 50 : 0;
      totalScore += score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

// ============================================================================
// WEB VITALS MONITOR COMPONENT
// ============================================================================

export function WebVitalsMonitor() {
  const [metrics, setMetrics] = useState<Map<string, WebVitalsMetric>>(new Map());
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const analyticsQueue = useRef<WebVitalsMetric[]>([]);
  const flushTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle incoming metrics
  const handleWebVitals = (metric: WebVitalsMetric) => {
    // Calculate rating
    const rating = calculateRating(metric.name, metric.value);
    const enrichedMetric = { ...metric, rating };

    // Update local state
    setMetrics((prev) => {
      const newMetrics = new Map(prev);
      newMetrics.set(metric.name, enrichedMetric);
      return newMetrics;
    });

    // Queue for analytics
    analyticsQueue.current.push(enrichedMetric);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${metric.name}: ${metric.value.toFixed(2)} (${rating})`, metric);
    }

    // Schedule flush
    if (flushTimeout.current) clearTimeout(flushTimeout.current);
    flushTimeout.current = setTimeout(flushAnalytics, 3000);
  };

  // Send metrics to analytics endpoint
  const flushAnalytics = () => {
    if (analyticsQueue.current.length === 0) return;

    const metricsToSend = [...analyticsQueue.current];
    analyticsQueue.current = [];

    // Send to analytics
    sendToAnalytics(metricsToSend);

    // Generate report
    generateReport();
  };

  // Send metrics to backend
  const sendToAnalytics = (metrics: WebVitalsMetric[]) => {
    const url = '/api/analytics/web-vitals';
    const body = JSON.stringify({
      metrics,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      // Fallback to fetch
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch((err) => {
        console.error('Failed to send Web Vitals:', err);
      });
    }
  };

  // Generate performance report
  const generateReport = () => {
    if (metrics.size === 0) return;

    const score = calculateOverallScore(metrics);
    const rating = score >= 75 ? 'good' : score >= 50 ? 'needs-improvement' : 'poor';
    const recommendations = generateRecommendations(metrics);

    const newReport: PerformanceReport = {
      timestamp: Date.now(),
      metrics,
      score,
      rating,
      recommendations,
    };

    setReport(newReport);

    // Emit custom event for other components
    window.dispatchEvent(new CustomEvent('webvitals:report', { detail: newReport }));
  };

  // Generate performance recommendations
  const generateRecommendations = (metrics: Map<string, WebVitalsMetric>): string[] => {
    const recommendations: string[] = [];

    // LCP recommendations
    const lcp = metrics.get('LCP');
    if (lcp && lcp.rating !== 'good') {
      recommendations.push(
        'Optimize Largest Contentful Paint: Consider lazy loading, image optimization, and CDN usage'
      );
    }

    // FID/INP recommendations
    const inp = metrics.get('INP');
    const fid = metrics.get('FID');
    if ((inp && inp.rating !== 'good') || (fid && fid.rating !== 'good')) {
      recommendations.push(
        'Improve interactivity: Reduce JavaScript execution time, split long tasks, use web workers'
      );
    }

    // CLS recommendations
    const cls = metrics.get('CLS');
    if (cls && cls.rating !== 'good') {
      recommendations.push(
        'Fix layout shifts: Set dimensions for images/videos, avoid dynamic content above fold'
      );
    }

    // TTFB recommendations
    const ttfb = metrics.get('TTFB');
    if (ttfb && ttfb.rating !== 'good') {
      recommendations.push('Optimize server response: Use caching, CDN, optimize database queries');
    }

    return recommendations;
  };

  // Register Web Vitals reporting
  useReportWebVitals(handleWebVitals);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flushTimeout.current) {
        clearTimeout(flushTimeout.current);
        flushAnalytics();
      }
    };
  }, []);

  // Development mode performance dashboard
  if (process.env.NODE_ENV === 'development' && report) {
    return <PerformanceDashboard report={report} />;
  }

  return null;
}

// ============================================================================
// PERFORMANCE DASHBOARD (Development Only)
// ============================================================================

function PerformanceDashboard({ report }: { report: PerformanceReport }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (isMinimized) {
    return (
      <button
        className="fixed bottom-4 right-4 z-50 bg-black text-white px-3 py-1 rounded-full text-sm font-mono"
        onClick={() => setIsMinimized(false)}
        aria-label="Show performance metrics"
      >
        Perf: {report.score}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black text-white p-4 rounded-lg max-w-sm font-mono text-xs">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Performance Monitor</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-white"
            aria-label="Toggle details"
          >
            {showDetails ? '−' : '+'}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-white"
            aria-label="Minimize"
          >
            _
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {/* Overall Score */}
        <div className="flex justify-between items-center">
          <span>Score:</span>
          <span className={`font-bold ${getScoreColor(report.score)}`}>{report.score}/100</span>
        </div>

        {/* Core Web Vitals */}
        {Array.from(report.metrics.entries()).map(([name, metric]) => (
          <div key={name} className="flex justify-between items-center">
            <span className="text-gray-400">{name}:</span>
            <span className={getRatingColor(metric.rating)}>
              {formatMetricValue(name, metric.value)}
            </span>
          </div>
        ))}

        {/* Details Section */}
        {showDetails && report.recommendations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <h4 className="text-xs font-bold mb-2">Recommendations:</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="pl-2">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatMetricValue(name: string, value: number): string {
  switch (name) {
    case 'CLS':
      return value.toFixed(3);
    case 'FCP':
    case 'LCP':
    case 'TTFB':
    case 'FID':
    case 'INP':
      return `${value.toFixed(0)}ms`;
    default:
      return value.toFixed(2);
  }
}

function getRatingColor(rating?: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return 'text-green-400';
    case 'needs-improvement':
      return 'text-yellow-400';
    case 'poor':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

// ============================================================================
// CUSTOM METRICS TRACKING
// ============================================================================

export function trackCustomMetric(name: string, value: number, unit = 'ms') {
  if (typeof window === 'undefined') return;

  // Use Performance Observer API
  if ('performance' in window && 'measure' in performance) {
    performance.measure(name, {
      start: 0,
      duration: value,
    });

    // Emit custom event
    window.dispatchEvent(
      new CustomEvent('webvitals:custom', {
        detail: {
          name,
          value,
          unit,
          timestamp: performance.now(),
        },
      })
    );
  }
}

// ============================================================================
// PERFORMANCE MARKS FOR CUSTOM TIMING
// ============================================================================

export function markStart(name: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`${name}-start`);
  }
}

export function markEnd(name: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`${name}-end`);
    try {
      performance.measure(name, `${name}-start`, `${name}-end`);
      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        trackCustomMetric(name, measure.duration);
      }
    } catch (error) {
      console.error(`Failed to measure ${name}:`, error);
    }
  }
}

// ============================================================================
// EXPORT FOR USAGE
// ============================================================================

export default WebVitalsMonitor;
