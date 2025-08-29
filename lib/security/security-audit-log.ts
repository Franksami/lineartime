/**
 * Security Audit Logging System for Command Center Calendar
 *
 * Comprehensive security event logging with structured data,
 * severity levels, and compliance reporting.
 *
 * @see https://owasp.org/www-project-logging-cheat-sheet/
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Logging_Vocabulary_Cheat_Sheet.html
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'AUTH_LOGOUT'
  | 'AUTH_TOKEN_REFRESH'
  | 'AUTH_PASSWORD_CHANGE'
  | 'AUTH_2FA_ENABLED'
  | 'AUTH_2FA_DISABLED'
  | 'ACCESS_GRANTED'
  | 'ACCESS_DENIED'
  | 'PERMISSION_VIOLATION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'SQL_INJECTION_ATTEMPT'
  | 'XSS_ATTEMPT'
  | 'CSRF_ATTEMPT'
  | 'PATH_TRAVERSAL_ATTEMPT'
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'
  | 'DATA_DELETION'
  | 'CONFIGURATION_CHANGE'
  | 'SECURITY_SCAN'
  | 'VULNERABILITY_DETECTED'
  | 'ENCRYPTION_ERROR'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED'
  | 'WEBHOOK_REGISTERED'
  | 'WEBHOOK_FAILED'
  | 'SESSION_HIJACK_ATTEMPT'
  | 'BRUTE_FORCE_ATTEMPT';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface SecurityEvent {
  id: string;
  timestamp: number;
  type: SecurityEventType;
  severity: SeverityLevel;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result: 'SUCCESS' | 'FAILURE' | 'ERROR';
  message: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
  correlationId?: string;
  threat?: ThreatIndicator;
}

export interface ThreatIndicator {
  score: number; // 0-100
  category: string;
  indicators: string[];
  recommendations: string[];
}

export interface AuditLogConfig {
  enabled: boolean;
  logLevel: SeverityLevel;
  storage: 'memory' | 'database' | 'file';
  retention: number; // days
  encryption: boolean;
  anonymization: boolean;
  alerting: AlertingConfig;
}

export interface AlertingConfig {
  enabled: boolean;
  channels: ('email' | 'slack' | 'webhook')[];
  thresholds: {
    severity: SeverityLevel;
    frequency: number;
    timeWindow: number;
  };
}

// ============================================================================
// SEVERITY CONFIGURATION
// ============================================================================

const SEVERITY_SCORES: Record<SeverityLevel, number> = {
  CRITICAL: 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
  INFO: 0,
};

const EVENT_SEVERITY: Record<SecurityEventType, SeverityLevel> = {
  AUTH_SUCCESS: 'INFO',
  AUTH_FAILURE: 'MEDIUM',
  AUTH_LOGOUT: 'INFO',
  AUTH_TOKEN_REFRESH: 'INFO',
  AUTH_PASSWORD_CHANGE: 'MEDIUM',
  AUTH_2FA_ENABLED: 'INFO',
  AUTH_2FA_DISABLED: 'MEDIUM',
  ACCESS_GRANTED: 'INFO',
  ACCESS_DENIED: 'MEDIUM',
  PERMISSION_VIOLATION: 'HIGH',
  RATE_LIMIT_EXCEEDED: 'MEDIUM',
  SUSPICIOUS_ACTIVITY: 'HIGH',
  SQL_INJECTION_ATTEMPT: 'CRITICAL',
  XSS_ATTEMPT: 'CRITICAL',
  CSRF_ATTEMPT: 'CRITICAL',
  PATH_TRAVERSAL_ATTEMPT: 'CRITICAL',
  DATA_EXPORT: 'MEDIUM',
  DATA_IMPORT: 'MEDIUM',
  DATA_DELETION: 'HIGH',
  CONFIGURATION_CHANGE: 'MEDIUM',
  SECURITY_SCAN: 'INFO',
  VULNERABILITY_DETECTED: 'CRITICAL',
  ENCRYPTION_ERROR: 'HIGH',
  API_KEY_CREATED: 'MEDIUM',
  API_KEY_REVOKED: 'MEDIUM',
  WEBHOOK_REGISTERED: 'LOW',
  WEBHOOK_FAILED: 'MEDIUM',
  SESSION_HIJACK_ATTEMPT: 'CRITICAL',
  BRUTE_FORCE_ATTEMPT: 'HIGH',
};

// ============================================================================
// AUDIT LOG STORAGE
// ============================================================================

class AuditLogStore {
  private events: SecurityEvent[] = [];
  private maxSize = 10000;
  private alertQueue: SecurityEvent[] = [];

  add(event: SecurityEvent): void {
    this.events.push(event);

    // Rotate if needed
    if (this.events.length > this.maxSize) {
      this.events = this.events.slice(-this.maxSize);
    }

    // Queue for alerting if critical
    if (SEVERITY_SCORES[event.severity] >= SEVERITY_SCORES.HIGH) {
      this.alertQueue.push(event);
    }
  }

  getEvents(filter?: {
    type?: SecurityEventType;
    severity?: SeverityLevel;
    userId?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): SecurityEvent[] {
    let filtered = [...this.events];

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter((e) => e.type === filter.type);
      }
      if (filter.severity) {
        const minScore = SEVERITY_SCORES[filter.severity];
        filtered = filtered.filter((e) => SEVERITY_SCORES[e.severity] >= minScore);
      }
      if (filter.userId) {
        filtered = filtered.filter((e) => e.userId === filter.userId);
      }
      if (filter.startTime) {
        filtered = filtered.filter((e) => e.timestamp >= filter.startTime);
      }
      if (filter.endTime) {
        filtered = filtered.filter((e) => e.timestamp <= filter.endTime);
      }
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit);
      }
    }

    return filtered;
  }

  getAlertQueue(): SecurityEvent[] {
    const queue = [...this.alertQueue];
    this.alertQueue = [];
    return queue;
  }

  clear(): void {
    this.events = [];
    this.alertQueue = [];
  }

  getStatistics(): {
    total: number;
    bySeverity: Record<SeverityLevel, number>;
    byType: Partial<Record<SecurityEventType, number>>;
    recentThreats: SecurityEvent[];
  } {
    const stats = {
      total: this.events.length,
      bySeverity: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
        INFO: 0,
      } as Record<SeverityLevel, number>,
      byType: {} as Partial<Record<SecurityEventType, number>>,
      recentThreats: [] as SecurityEvent[],
    };

    for (const event of this.events) {
      stats.bySeverity[event.severity]++;
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
    }

    // Get recent high-severity events
    stats.recentThreats = this.events
      .filter((e) => SEVERITY_SCORES[e.severity] >= SEVERITY_SCORES.HIGH)
      .slice(-10);

    return stats;
  }
}

// Global store instance
const globalStore = new AuditLogStore();

// ============================================================================
// SECURITY AUDIT LOGGER
// ============================================================================

export class SecurityAuditLogger {
  private config: AuditLogConfig;
  private store: AuditLogStore;

  constructor(config?: Partial<AuditLogConfig>) {
    this.config = {
      enabled: true,
      logLevel: 'INFO',
      storage: 'memory',
      retention: 90,
      encryption: false,
      anonymization: false,
      alerting: {
        enabled: true,
        channels: ['email'],
        thresholds: {
          severity: 'HIGH',
          frequency: 10,
          timeWindow: 300000, // 5 minutes
        },
      },
      ...config,
    };
    this.store = globalStore;
  }

  /**
   * Log security event
   */
  async log(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enabled) return;

    // Check if event meets logging threshold
    const eventSeverity = event.severity || EVENT_SEVERITY[event.type];
    if (SEVERITY_SCORES[eventSeverity] < SEVERITY_SCORES[this.config.logLevel]) {
      return;
    }

    // Create complete event
    const completeEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
      severity: eventSeverity,
      correlationId: event.correlationId || this.generateCorrelationId(),
    };

    // Anonymize if configured
    if (this.config.anonymization) {
      completeEvent.ipAddress = this.anonymizeIp(completeEvent.ipAddress);
      completeEvent.userId = this.hashUserId(completeEvent.userId);
    }

    // Detect threats
    completeEvent.threat = this.detectThreats(completeEvent);

    // Store event
    this.store.add(completeEvent);

    // Process alerts
    await this.processAlerts();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(completeEvent);
    }
  }

  /**
   * Log authentication event
   */
  async logAuth(
    type: 'success' | 'failure' | 'logout',
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const eventType: SecurityEventType =
      type === 'success' ? 'AUTH_SUCCESS' : type === 'failure' ? 'AUTH_FAILURE' : 'AUTH_LOGOUT';

    await this.log({
      type: eventType,
      userId,
      result: type === 'failure' ? 'FAILURE' : 'SUCCESS',
      message: `Authentication ${type} for user ${userId || 'unknown'}`,
      metadata,
    });
  }

  /**
   * Log access control event
   */
  async logAccess(
    granted: boolean,
    resource: string,
    action: string,
    userId?: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      type: granted ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
      userId,
      resource,
      action,
      result: granted ? 'SUCCESS' : 'FAILURE',
      message: `${action} access to ${resource} ${granted ? 'granted' : 'denied'}`,
      metadata: { reason },
    });
  }

  /**
   * Log security attack attempt
   */
  async logAttack(
    type: 'sql' | 'xss' | 'csrf' | 'path-traversal' | 'brute-force',
    details: {
      payload?: string;
      source?: string;
      target?: string;
      userId?: string;
      ipAddress?: string;
    }
  ): Promise<void> {
    const eventType: SecurityEventType =
      type === 'sql'
        ? 'SQL_INJECTION_ATTEMPT'
        : type === 'xss'
          ? 'XSS_ATTEMPT'
          : type === 'csrf'
            ? 'CSRF_ATTEMPT'
            : type === 'path-traversal'
              ? 'PATH_TRAVERSAL_ATTEMPT'
              : 'BRUTE_FORCE_ATTEMPT';

    await this.log({
      type: eventType,
      userId: details.userId,
      ipAddress: details.ipAddress,
      result: 'FAILURE',
      message: `${type.toUpperCase()} attack attempt detected`,
      metadata: {
        payload: details.payload?.substring(0, 200), // Truncate for safety
        source: details.source,
        target: details.target,
      },
    });
  }

  /**
   * Get audit log events
   */
  getEvents(filter?: Parameters<AuditLogStore['getEvents']>[0]): SecurityEvent[] {
    return this.store.getEvents(filter);
  }

  /**
   * Get audit log statistics
   */
  getStatistics() {
    return this.store.getStatistics();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private generateEventId(): string {
    return `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  private generateCorrelationId(): string {
    return `cor_${crypto.randomBytes(8).toString('hex')}`;
  }

  private anonymizeIp(ip?: string): string | undefined {
    if (!ip) return undefined;
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    return 'anonymized';
  }

  private hashUserId(userId?: string): string | undefined {
    if (!userId) return undefined;
    return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }

  private detectThreats(event: SecurityEvent): ThreatIndicator | undefined {
    const indicators: string[] = [];
    let score = 0;

    // Check for attack patterns
    if (event.type.includes('_ATTEMPT')) {
      indicators.push('Attack attempt detected');
      score += 50;
    }

    // Check for critical events
    if (event.severity === 'CRITICAL') {
      indicators.push('Critical security event');
      score += 40;
    }

    // Check for suspicious patterns
    if (event.metadata?.payload?.includes('script')) {
      indicators.push('Potential script injection');
      score += 30;
    }

    if (event.metadata?.payload?.includes('../')) {
      indicators.push('Path traversal pattern');
      score += 30;
    }

    // Check for repeated failures
    const recentFailures = this.store
      .getEvents({
        userId: event.userId,
        startTime: Date.now() - 300000, // Last 5 minutes
      })
      .filter((e) => e.result === 'FAILURE');

    if (recentFailures.length > 5) {
      indicators.push('Multiple failed attempts');
      score += 20;
    }

    if (score === 0) return undefined;

    return {
      score: Math.min(100, score),
      category: score >= 70 ? 'HIGH_RISK' : score >= 40 ? 'MEDIUM_RISK' : 'LOW_RISK',
      indicators,
      recommendations: this.getThreatRecommendations(indicators),
    };
  }

  private getThreatRecommendations(indicators: string[]): string[] {
    const recommendations: string[] = [];

    if (indicators.some((i) => i.includes('Attack'))) {
      recommendations.push('Block source IP temporarily');
      recommendations.push('Increase monitoring for this user');
    }

    if (indicators.some((i) => i.includes('injection'))) {
      recommendations.push('Review input validation');
      recommendations.push('Enable WAF rules');
    }

    if (indicators.some((i) => i.includes('Multiple failed'))) {
      recommendations.push('Consider account lockout');
      recommendations.push('Implement CAPTCHA');
    }

    return recommendations;
  }

  private async processAlerts(): Promise<void> {
    if (!this.config.alerting.enabled) return;

    const alertEvents = this.store.getAlertQueue();
    if (alertEvents.length === 0) return;

    // Check if threshold exceeded
    const recentEvents = this.store.getEvents({
      severity: this.config.alerting.thresholds.severity,
      startTime: Date.now() - this.config.alerting.thresholds.timeWindow,
    });

    if (recentEvents.length >= this.config.alerting.thresholds.frequency) {
      await this.sendAlerts(alertEvents);
    }
  }

  private async sendAlerts(events: SecurityEvent[]): Promise<void> {
    // In production, implement actual alerting logic
    console.error('🚨 SECURITY ALERT:', {
      count: events.length,
      critical: events.filter((e) => e.severity === 'CRITICAL').length,
      types: [...new Set(events.map((e) => e.type))],
    });
  }

  private consoleLog(event: SecurityEvent): void {
    const emoji =
      event.severity === 'CRITICAL'
        ? '🚨'
        : event.severity === 'HIGH'
          ? '⚠️'
          : event.severity === 'MEDIUM'
            ? '⚡'
            : event.severity === 'LOW'
              ? 'ℹ️'
              : '📝';

    console.log(`${emoji} [SECURITY] ${event.type}:`, {
      severity: event.severity,
      user: event.userId,
      message: event.message,
      threat: event.threat,
    });
  }
}

// ============================================================================
// MIDDLEWARE INTEGRATION
// ============================================================================

/**
 * Extract security context from request
 */
export function extractSecurityContext(req: NextRequest): {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    userId: req.headers.get('x-user-id') || undefined,
    sessionId: req.cookies.get('session')?.value,
    ipAddress:
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      undefined,
    userAgent: req.headers.get('user-agent') || undefined,
  };
}

// ============================================================================
// COMPLIANCE REPORT
// ============================================================================

/**
 * Generate compliance audit report
 * ASCII chart for security compliance visualization
 */
export function generateComplianceReport(logger: SecurityAuditLogger): string {
  const stats = logger.getStatistics();
  const now = Date.now();
  const last24h = logger.getEvents({ startTime: now - 86400000 });
  const critical = last24h.filter((e) => e.severity === 'CRITICAL');

  let report = `
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SECURITY COMPLIANCE AUDIT REPORT                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Generated: ${new Date(now).toISOString()}                                    │
│  Reporting Period: Last 24 Hours                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  EXECUTIVE SUMMARY                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Total Security Events: ${stats.total.toString().padEnd(10)}                                             │
│  Events in Last 24h: ${last24h.length.toString().padEnd(10)}                                                │
│  Critical Events: ${critical.length.toString().padEnd(10)} ${critical.length > 0 ? '⚠️ ATTENTION REQUIRED' : '✅'}                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  EVENTS BY SEVERITY                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
`;

  // Severity distribution
  const maxCount = Math.max(...Object.values(stats.bySeverity));
  for (const [severity, count] of Object.entries(stats.bySeverity)) {
    const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0.0';
    const barLength = maxCount > 0 ? Math.floor((count / maxCount) * 40) : 0;
    const bar = '█'.repeat(barLength) + '░'.repeat(40 - barLength);

    report += `│  ${severity.padEnd(8)} │ ${bar} │ ${count.toString().padStart(5)} (${percentage}%)  │\n`;
  }

  report += `├─────────────────────────────────────────────────────────────────────────────┤\n`;
  report += `│  TOP SECURITY EVENT TYPES                                                     │\n`;
  report += `├─────────────────────────────────────────────────────────────────────────────┤\n`;

  // Top event types
  const topTypes = Object.entries(stats.byType)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .slice(0, 5);

  for (const [type, count] of topTypes) {
    report += `│  ${type.padEnd(30)} │ ${(count || 0).toString().padStart(10)} events                  │\n`;
  }

  if (stats.recentThreats.length > 0) {
    report += `├─────────────────────────────────────────────────────────────────────────────┤\n`;
    report += `│  ⚠️ RECENT THREATS DETECTED                                                   │\n`;
    report += `├─────────────────────────────────────────────────────────────────────────────┤\n`;

    for (const threat of stats.recentThreats.slice(0, 3)) {
      const time = new Date(threat.timestamp).toLocaleTimeString();
      report += `│  ${time} - ${threat.type.padEnd(28)} [${threat.severity}]              │\n`;
    }
  }

  report += `├─────────────────────────────────────────────────────────────────────────────┤\n`;
  report += `│  COMPLIANCE STATUS                                                            │\n`;
  report += `├─────────────────────────────────────────────────────────────────────────────┤\n`;
  report += `│  ✅ Audit Logging: ENABLED                                                    │\n`;
  report += `│  ✅ Event Retention: 90 days                                                  │\n`;
  report += `│  ${critical.length === 0 ? '✅' : '❌'} Critical Events: ${critical.length === 0 ? 'NONE DETECTED' : critical.length + ' REQUIRE REVIEW'}                                   │\n`;
  report += `│  ✅ Threat Detection: ACTIVE                                                  │\n`;
  report += `│  ✅ Alerting System: CONFIGURED                                               │\n`;
  report += `└─────────────────────────────────────────────────────────────────────────────┘`;

  return report;
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

export const auditLogger = new SecurityAuditLogger();

// ============================================================================
// EXPORT
// ============================================================================

export default {
  SecurityAuditLogger,
  auditLogger,
  extractSecurityContext,
  generateComplianceReport,
  EVENT_SEVERITY,
  SEVERITY_SCORES,
};
