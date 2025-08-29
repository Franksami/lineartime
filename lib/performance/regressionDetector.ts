/**
 * Performance Regression Detection Engine
 *
 * Automated system for detecting performance regressions based on:
 * - Statistical analysis of performance trends
 * - SLO threshold monitoring
 * - Machine learning-based anomaly detection
 */

export interface PerformanceDataPoint {
  timestamp: Date;
  loadTime: number;
  lcp: number;
  fid: number;
  cls: number;
  bundleSize: number;
  memoryUsage: number;
  fps: number;
  tokenResolution: number;
  componentRender: number;
}

export interface RegressionAlert {
  id: string;
  metric: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  threshold: number;
  currentValue: number;
  trend: 'increasing' | 'decreasing' | 'volatile';
  confidence: number;
}

export interface SLOThresholds {
  maxLoadTime: number;
  maxLCP: number;
  maxFID: number;
  maxCLS: number;
  maxBundleSize: number;
  maxMemoryUsage: number;
  minFPS: number;
  maxTokenResolution: number;
  maxComponentRender: number;
}

export const DEFAULT_SLO_THRESHOLDS: SLOThresholds = {
  maxLoadTime: 500,
  maxLCP: 2500,
  maxFID: 100,
  maxCLS: 0.1,
  maxBundleSize: 500,
  maxMemoryUsage: 100,
  minFPS: 112,
  maxTokenResolution: 10,
  maxComponentRender: 1,
};

export class PerformanceRegressionDetector {
  private dataHistory: PerformanceDataPoint[] = [];
  private sloThresholds: SLOThresholds;
  private alertHistory: RegressionAlert[] = [];

  constructor(sloThresholds: SLOThresholds = DEFAULT_SLO_THRESHOLDS) {
    this.sloThresholds = sloThresholds;
  }

  /**
   * Add a new performance data point and check for regressions
   */
  addDataPoint(dataPoint: PerformanceDataPoint): RegressionAlert[] {
    this.dataHistory.push(dataPoint);

    // Keep only last 100 data points for analysis
    if (this.dataHistory.length > 100) {
      this.dataHistory = this.dataHistory.slice(-100);
    }

    const newAlerts = this.analyzeForRegressions(dataPoint);
    this.alertHistory.push(...newAlerts);

    // Keep only last 50 alerts
    if (this.alertHistory.length > 50) {
      this.alertHistory = this.alertHistory.slice(-50);
    }

    return newAlerts;
  }

  /**
   * Comprehensive regression analysis
   */
  private analyzeForRegressions(current: PerformanceDataPoint): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];

    // SLO Threshold Analysis
    alerts.push(...this.checkSLOThresholds(current));

    // Trend Analysis (requires at least 10 data points)
    if (this.dataHistory.length >= 10) {
      alerts.push(...this.checkTrends(current));
    }

    // Anomaly Detection (requires at least 20 data points)
    if (this.dataHistory.length >= 20) {
      alerts.push(...this.detectAnomalies(current));
    }

    return alerts;
  }

  /**
   * Check if current metrics violate SLO thresholds
   */
  private checkSLOThresholds(current: PerformanceDataPoint): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];

    const checks = [
      {
        metric: 'Load Time',
        current: current.loadTime,
        threshold: this.sloThresholds.maxLoadTime,
        isMinimum: false,
      },
      {
        metric: 'LCP',
        current: current.lcp,
        threshold: this.sloThresholds.maxLCP,
        isMinimum: false,
      },
      {
        metric: 'FID',
        current: current.fid,
        threshold: this.sloThresholds.maxFID,
        isMinimum: false,
      },
      {
        metric: 'CLS',
        current: current.cls,
        threshold: this.sloThresholds.maxCLS,
        isMinimum: false,
      },
      {
        metric: 'Bundle Size',
        current: current.bundleSize,
        threshold: this.sloThresholds.maxBundleSize,
        isMinimum: false,
      },
      {
        metric: 'Memory Usage',
        current: current.memoryUsage,
        threshold: this.sloThresholds.maxMemoryUsage,
        isMinimum: false,
      },
      {
        metric: 'FPS',
        current: current.fps,
        threshold: this.sloThresholds.minFPS,
        isMinimum: true,
      },
      {
        metric: 'Token Resolution',
        current: current.tokenResolution,
        threshold: this.sloThresholds.maxTokenResolution,
        isMinimum: false,
      },
      {
        metric: 'Component Render',
        current: current.componentRender,
        threshold: this.sloThresholds.maxComponentRender,
        isMinimum: false,
      },
    ];

    checks.forEach((check) => {
      const violationSeverity = this.calculateSLOViolationSeverity(
        check.current,
        check.threshold,
        check.isMinimum
      );

      if (violationSeverity !== null) {
        alerts.push({
          id: `slo-${check.metric.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          metric: check.metric,
          severity: violationSeverity,
          message: this.generateSLOMessage(
            check.metric,
            check.current,
            check.threshold,
            check.isMinimum
          ),
          timestamp: current.timestamp,
          resolved: false,
          threshold: check.threshold,
          currentValue: check.current,
          trend: 'increasing',
          confidence: 0.95,
        });
      }
    });

    return alerts;
  }

  /**
   * Check for concerning trends over time
   */
  private checkTrends(current: PerformanceDataPoint): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];
    const recentData = this.dataHistory.slice(-10); // Last 10 data points

    const trendChecks = [
      {
        metric: 'Load Time',
        values: recentData.map((d) => d.loadTime),
        threshold: this.sloThresholds.maxLoadTime,
      },
      { metric: 'LCP', values: recentData.map((d) => d.lcp), threshold: this.sloThresholds.maxLCP },
      {
        metric: 'Memory Usage',
        values: recentData.map((d) => d.memoryUsage),
        threshold: this.sloThresholds.maxMemoryUsage,
      },
      {
        metric: 'Bundle Size',
        values: recentData.map((d) => d.bundleSize),
        threshold: this.sloThresholds.maxBundleSize,
      },
    ];

    trendChecks.forEach((check) => {
      const trend = this.calculateTrend(check.values);

      // Alert if trend is consistently increasing and approaching threshold
      if (trend.slope > 0 && trend.confidence > 0.7) {
        const projectedValue = check.values[check.values.length - 1] + trend.slope * 5; // 5 data points ahead

        if (projectedValue > check.threshold * 0.8) {
          // 80% of threshold
          alerts.push({
            id: `trend-${check.metric.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            metric: check.metric,
            severity: projectedValue > check.threshold ? 'high' : 'medium',
            message: `${check.metric} trending upward. Projected to exceed threshold in ~5 measurements.`,
            timestamp: current.timestamp,
            resolved: false,
            threshold: check.threshold,
            currentValue: check.values[check.values.length - 1],
            trend: 'increasing',
            confidence: trend.confidence,
          });
        }
      }
    });

    return alerts;
  }

  /**
   * Detect statistical anomalies
   */
  private detectAnomalies(current: PerformanceDataPoint): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];
    const recentData = this.dataHistory.slice(-20); // Last 20 data points

    const anomalyChecks = [
      { metric: 'Load Time', values: recentData.map((d) => d.loadTime), current: current.loadTime },
      { metric: 'LCP', values: recentData.map((d) => d.lcp), current: current.lcp },
      { metric: 'FID', values: recentData.map((d) => d.fid), current: current.fid },
      {
        metric: 'Memory Usage',
        values: recentData.map((d) => d.memoryUsage),
        current: current.memoryUsage,
      },
      {
        metric: 'FPS',
        values: recentData.map((d) => d.fps),
        current: current.fps,
        isMinimum: true,
      },
    ];

    anomalyChecks.forEach((check) => {
      const anomalyScore = this.calculateAnomalyScore(check.values, check.current);

      // Alert if anomaly score is high (> 2 standard deviations)
      if (anomalyScore > 2) {
        const severity = anomalyScore > 3 ? 'high' : 'medium';

        alerts.push({
          id: `anomaly-${check.metric.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          metric: check.metric,
          severity,
          message: `${check.metric} showing anomalous behavior (${anomalyScore.toFixed(1)}σ from normal).`,
          timestamp: current.timestamp,
          resolved: false,
          threshold: this.calculateThresholdForMetric(check.metric),
          currentValue: check.current,
          trend: 'volatile',
          confidence: Math.min(0.95, anomalyScore / 3),
        });
      }
    });

    return alerts;
  }

  /**
   * Calculate SLO violation severity
   */
  private calculateSLOViolationSeverity(
    current: number,
    threshold: number,
    isMinimum = false
  ): 'low' | 'medium' | 'high' | 'critical' | null {
    let violationRatio: number;

    if (isMinimum) {
      if (current >= threshold) return null; // No violation
      violationRatio = (threshold - current) / threshold;
    } else {
      if (current <= threshold) return null; // No violation
      violationRatio = (current - threshold) / threshold;
    }

    if (violationRatio > 0.5) return 'critical';
    if (violationRatio > 0.3) return 'high';
    if (violationRatio > 0.1) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable SLO violation message
   */
  private generateSLOMessage(
    metric: string,
    current: number,
    threshold: number,
    isMinimum: boolean
  ): string {
    const unit = this.getMetricUnit(metric);
    const violation = Math.abs(current - threshold);
    const percentage = ((violation / threshold) * 100).toFixed(1);

    if (isMinimum) {
      return `${metric} dropped to ${current.toFixed(1)}${unit}, ${percentage}% below target of ${threshold}${unit}`;
    }
    return `${metric} reached ${current.toFixed(1)}${unit}, ${percentage}% above target of ${threshold}${unit}`;
  }

  /**
   * Calculate trend using linear regression
   */
  private calculateTrend(values: number[]): { slope: number; confidence: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Calculate R² as confidence metric
    const yMean = sumY / n;
    const ssTotal = values.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
    const ssRes = values.reduce((sum, yi, i) => sum + (yi - slope * x[i]) ** 2, 0);
    const confidence = 1 - ssRes / ssTotal;

    return { slope, confidence: Math.max(0, confidence) };
  }

  /**
   * Calculate anomaly score using z-score
   */
  private calculateAnomalyScore(historicalValues: number[], currentValue: number): number {
    const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
    const variance =
      historicalValues.reduce((sum, val) => sum + (val - mean) ** 2, 0) / historicalValues.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0; // No variation, no anomaly

    return Math.abs(currentValue - mean) / stdDev;
  }

  /**
   * Get appropriate unit for metric
   */
  private getMetricUnit(metric: string): string {
    switch (metric) {
      case 'Load Time':
      case 'LCP':
      case 'FID':
      case 'Token Resolution':
      case 'Component Render':
        return 'ms';
      case 'CLS':
        return '';
      case 'Bundle Size':
        return 'KB';
      case 'Memory Usage':
        return 'MB';
      case 'FPS':
        return ' fps';
      default:
        return '';
    }
  }

  /**
   * Get threshold for specific metric
   */
  private calculateThresholdForMetric(metric: string): number {
    switch (metric) {
      case 'Load Time':
        return this.sloThresholds.maxLoadTime;
      case 'LCP':
        return this.sloThresholds.maxLCP;
      case 'FID':
        return this.sloThresholds.maxFID;
      case 'CLS':
        return this.sloThresholds.maxCLS;
      case 'Bundle Size':
        return this.sloThresholds.maxBundleSize;
      case 'Memory Usage':
        return this.sloThresholds.maxMemoryUsage;
      case 'FPS':
        return this.sloThresholds.minFPS;
      case 'Token Resolution':
        return this.sloThresholds.maxTokenResolution;
      case 'Component Render':
        return this.sloThresholds.maxComponentRender;
      default:
        return 0;
    }
  }

  /**
   * Get active alerts (unresolved)
   */
  getActiveAlerts(): RegressionAlert[] {
    return this.alertHistory.filter((alert) => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alertHistory.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Get performance summary statistics
   */
  getPerformanceSummary(): any {
    if (this.dataHistory.length === 0) return null;

    const recent = this.dataHistory.slice(-10);
    const latest = this.dataHistory[this.dataHistory.length - 1];

    return {
      dataPoints: this.dataHistory.length,
      activeAlerts: this.getActiveAlerts().length,
      latestMetrics: latest,
      averages: {
        loadTime: recent.reduce((sum, d) => sum + d.loadTime, 0) / recent.length,
        lcp: recent.reduce((sum, d) => sum + d.lcp, 0) / recent.length,
        fid: recent.reduce((sum, d) => sum + d.fid, 0) / recent.length,
        memoryUsage: recent.reduce((sum, d) => sum + d.memoryUsage, 0) / recent.length,
        fps: recent.reduce((sum, d) => sum + d.fps, 0) / recent.length,
      },
    };
  }

  /**
   * Export performance data for analysis
   */
  exportData(): {
    dataHistory: PerformanceDataPoint[];
    alertHistory: RegressionAlert[];
    sloThresholds: SLOThresholds;
  } {
    return {
      dataHistory: [...this.dataHistory],
      alertHistory: [...this.alertHistory],
      sloThresholds: { ...this.sloThresholds },
    };
  }
}
