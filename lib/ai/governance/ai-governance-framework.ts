/**
 * AI Governance Framework for Command Center Calendar
 *
 * Comprehensive governance system ensuring responsible AI usage,
 * compliance, safety, and ethical considerations.
 *
 * Based on industry best practices and research-validated patterns.
 */

// ============================================================================
// CORE GOVERNANCE PRINCIPLES
// ============================================================================

export const AI_GOVERNANCE_PRINCIPLES = {
  transparency: {
    description: 'Users understand when and how AI is being used',
    requirements: [
      'Clear AI indicators in UI',
      'Explanation of AI decision-making',
      'Accessible AI settings and controls',
    ],
  },
  privacy: {
    description: 'User data is protected and used responsibly',
    requirements: [
      'Local-first processing when possible',
      'Explicit consent for data usage',
      'Data minimization practices',
      'Right to deletion',
    ],
  },
  fairness: {
    description: 'AI systems avoid bias and discrimination',
    requirements: [
      'Regular bias testing',
      'Diverse training data',
      'Inclusive design practices',
      'Equitable access to features',
    ],
  },
  accountability: {
    description: 'Clear responsibility and oversight for AI systems',
    requirements: [
      'Human oversight mechanisms',
      'Audit trails for AI decisions',
      'Clear escalation paths',
      'Regular governance reviews',
    ],
  },
  safety: {
    description: 'AI systems operate safely and reliably',
    requirements: [
      'Rigorous testing protocols',
      'Graceful degradation',
      'Error boundaries and fallbacks',
      'Rate limiting and abuse prevention',
    ],
  },
} as const;

// ============================================================================
// PERMISSION AND CONSENT MANAGEMENT
// ============================================================================

export interface ConsentConfiguration {
  feature: string;
  level: 'required' | 'optional' | 'implicit';
  scope: 'session' | 'persistent' | 'one-time';
  dataUsed: string[];
  purpose: string;
  retentionPeriod?: string;
}

export class ConsentManager {
  private consents: Map<string, ConsentRecord> = new Map();
  private auditLog: AuditEntry[] = [];

  async requestConsent(config: ConsentConfiguration): Promise<boolean> {
    // Check if consent already granted
    const existing = this.consents.get(config.feature);
    if (existing && !this.isExpired(existing)) {
      return existing.granted;
    }

    // For implicit consent, auto-grant with notification
    if (config.level === 'implicit') {
      this.grantConsent(config.feature, config);
      return true;
    }

    // For required/optional, show consent dialog
    const granted = await this.showConsentDialog(config);

    if (granted) {
      this.grantConsent(config.feature, config);
    } else {
      this.denyConsent(config.feature, config);
    }

    return granted;
  }

  private grantConsent(feature: string, config: ConsentConfiguration): void {
    const record: ConsentRecord = {
      feature,
      granted: true,
      timestamp: new Date(),
      scope: config.scope,
      dataUsed: config.dataUsed,
      purpose: config.purpose,
      expiresAt: this.calculateExpiry(config),
    };

    this.consents.set(feature, record);
    this.auditLog.push({
      action: 'consent_granted',
      feature,
      timestamp: new Date(),
      details: config,
    });
  }

  private denyConsent(feature: string, config: ConsentConfiguration): void {
    const record: ConsentRecord = {
      feature,
      granted: false,
      timestamp: new Date(),
      scope: config.scope,
      dataUsed: [],
      purpose: config.purpose,
    };

    this.consents.set(feature, record);
    this.auditLog.push({
      action: 'consent_denied',
      feature,
      timestamp: new Date(),
      details: config,
    });
  }

  private isExpired(record: ConsentRecord): boolean {
    if (!record.expiresAt) return false;
    return new Date() > record.expiresAt;
  }

  private calculateExpiry(config: ConsentConfiguration): Date | undefined {
    switch (config.scope) {
      case 'session':
        // Expires when session ends
        return undefined;
      case 'one-time':
        // Expires immediately after use
        return new Date(Date.now() + 1000);
      case 'persistent':
        // Default 1 year or specified retention period
        const retention = config.retentionPeriod || '1y';
        return this.parseRetentionPeriod(retention);
    }
  }

  private parseRetentionPeriod(period: string): Date {
    const now = new Date();
    const match = period.match(/(\d+)([hdmy])/);
    if (!match) return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const [, amount, unit] = match;
    const value = parseInt(amount);

    switch (unit) {
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() + value * 30 * 24 * 60 * 60 * 1000);
      case 'y':
        return new Date(now.getTime() + value * 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
  }

  private async showConsentDialog(config: ConsentConfiguration): Promise<boolean> {
    // This would show actual UI dialog in production
    // For now, simulate with console
    console.log(`
      🤖 AI Feature Consent Required
      ================================
      Feature: ${config.feature}
      Purpose: ${config.purpose}
      Data Used: ${config.dataUsed.join(', ')}
      Level: ${config.level}
      
      Do you consent to this AI feature?
    `);

    // In production, this would return user's choice
    return true; // Simulated consent
  }

  getAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  revokeConsent(feature: string): void {
    const record = this.consents.get(feature);
    if (record) {
      record.granted = false;
      this.auditLog.push({
        action: 'consent_revoked',
        feature,
        timestamp: new Date(),
      });
    }
  }

  exportConsents(): ConsentRecord[] {
    return Array.from(this.consents.values());
  }
}

// ============================================================================
// SAFETY AND RATE LIMITING
// ============================================================================

export interface SafetyConfiguration {
  maxRequestsPerMinute: number;
  maxTokensPerRequest: number;
  maxCostPerDay: number;
  blockedPatterns: RegExp[];
  allowedDomains: string[];
  sensitiveDataPatterns: RegExp[];
}

export class SafetyGuard {
  private requestCounts: Map<string, number[]> = new Map();
  private dailyCosts: Map<string, number> = new Map();
  private config: SafetyConfiguration;

  constructor(config: SafetyConfiguration) {
    this.config = config;
  }

  async checkRequest(userId: string, request: AIRequest): Promise<SafetyCheckResult> {
    const checks: SafetyCheck[] = [];

    // Rate limiting check
    const rateCheck = this.checkRateLimit(userId);
    checks.push(rateCheck);

    // Token limit check
    const tokenCheck = this.checkTokenLimit(request);
    checks.push(tokenCheck);

    // Cost limit check
    const costCheck = await this.checkCostLimit(userId, request);
    checks.push(costCheck);

    // Content safety check
    const contentCheck = this.checkContentSafety(request);
    checks.push(contentCheck);

    // Data privacy check
    const privacyCheck = this.checkDataPrivacy(request);
    checks.push(privacyCheck);

    const passed = checks.every((c) => c.passed);
    const warnings = checks.filter((c) => c.warning).map((c) => c.message);
    const errors = checks.filter((c) => !c.passed).map((c) => c.message);

    return {
      allowed: passed,
      checks,
      warnings,
      errors,
      recommendations: this.getRecommendations(checks),
    };
  }

  private checkRateLimit(userId: string): SafetyCheck {
    const now = Date.now();
    const minute = 60 * 1000;

    // Get user's recent requests
    const userRequests = this.requestCounts.get(userId) || [];
    const recentRequests = userRequests.filter((t) => now - t < minute);

    // Update request history
    recentRequests.push(now);
    this.requestCounts.set(userId, recentRequests);

    const passed = recentRequests.length <= this.config.maxRequestsPerMinute;

    return {
      type: 'rate_limit',
      passed,
      warning: recentRequests.length > this.config.maxRequestsPerMinute * 0.8,
      message: passed
        ? `Rate limit OK (${recentRequests.length}/${this.config.maxRequestsPerMinute})`
        : `Rate limit exceeded (${recentRequests.length}/${this.config.maxRequestsPerMinute})`,
    };
  }

  private checkTokenLimit(request: AIRequest): SafetyCheck {
    const estimatedTokens = this.estimateTokens(request.prompt);
    const passed = estimatedTokens <= this.config.maxTokensPerRequest;

    return {
      type: 'token_limit',
      passed,
      warning: estimatedTokens > this.config.maxTokensPerRequest * 0.8,
      message: passed
        ? `Token limit OK (${estimatedTokens}/${this.config.maxTokensPerRequest})`
        : `Token limit exceeded (${estimatedTokens}/${this.config.maxTokensPerRequest})`,
    };
  }

  private async checkCostLimit(userId: string, request: AIRequest): Promise<SafetyCheck> {
    const today = new Date().toDateString();
    const userKey = `${userId}-${today}`;

    const currentCost = this.dailyCosts.get(userKey) || 0;
    const estimatedCost = this.estimateCost(request);
    const totalCost = currentCost + estimatedCost;

    const passed = totalCost <= this.config.maxCostPerDay;

    if (passed) {
      this.dailyCosts.set(userKey, totalCost);
    }

    return {
      type: 'cost_limit',
      passed,
      warning: totalCost > this.config.maxCostPerDay * 0.8,
      message: passed
        ? `Daily cost OK ($${totalCost.toFixed(2)}/$${this.config.maxCostPerDay})`
        : `Daily cost limit exceeded ($${totalCost.toFixed(2)}/$${this.config.maxCostPerDay})`,
    };
  }

  private checkContentSafety(request: AIRequest): SafetyCheck {
    const blocked = this.config.blockedPatterns.some((pattern) => pattern.test(request.prompt));

    return {
      type: 'content_safety',
      passed: !blocked,
      warning: false,
      message: blocked ? 'Content contains blocked patterns' : 'Content safety check passed',
    };
  }

  private checkDataPrivacy(request: AIRequest): SafetyCheck {
    const hasSensitiveData = this.config.sensitiveDataPatterns.some((pattern) =>
      pattern.test(request.prompt)
    );

    if (hasSensitiveData) {
      // Check if data is being sent to allowed domains only
      const isAllowedDomain =
        request.endpoint &&
        this.config.allowedDomains.some((domain) => request.endpoint!.includes(domain));

      return {
        type: 'data_privacy',
        passed: isAllowedDomain || false,
        warning: true,
        message: isAllowedDomain
          ? 'Sensitive data detected but endpoint is allowed'
          : 'Sensitive data cannot be sent to this endpoint',
      };
    }

    return {
      type: 'data_privacy',
      passed: true,
      warning: false,
      message: 'No sensitive data detected',
    };
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private estimateCost(request: AIRequest): number {
    const tokens = this.estimateTokens(request.prompt);
    const costPer1kTokens = 0.002; // Example rate
    return (tokens / 1000) * costPer1kTokens;
  }

  private getRecommendations(checks: SafetyCheck[]): string[] {
    const recommendations: string[] = [];

    checks.forEach((check) => {
      if (check.warning) {
        switch (check.type) {
          case 'rate_limit':
            recommendations.push('Consider spacing out requests');
            break;
          case 'token_limit':
            recommendations.push('Try breaking down into smaller requests');
            break;
          case 'cost_limit':
            recommendations.push('Monitor usage to stay within budget');
            break;
        }
      }
    });

    return recommendations;
  }
}

// ============================================================================
// AUDIT AND COMPLIANCE
// ============================================================================

export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private retentionDays = 90;

  logAIOperation(operation: AIOperation): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      operation: operation.type,
      userId: operation.userId,
      model: operation.model,
      prompt: this.sanitizePrompt(operation.prompt),
      response: this.sanitizeResponse(operation.response),
      tokensUsed: operation.tokensUsed,
      cost: operation.cost,
      latency: operation.latency,
      success: operation.success,
      error: operation.error,
      metadata: operation.metadata,
    };

    this.logs.push(entry);
    this.pruneOldLogs();
  }

  private sanitizePrompt(prompt: string): string {
    // Remove sensitive data before logging
    return prompt
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
      .replace(/\b\d{16}\b/g, '[CARD]');
  }

  private sanitizeResponse(response: string): string {
    // Similar sanitization for responses
    return this.sanitizePrompt(response);
  }

  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private pruneOldLogs(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    this.logs = this.logs.filter((log) => log.timestamp > cutoffDate);
  }

  queryLogs(filters: AuditQueryFilters): AuditLogEntry[] {
    let results = [...this.logs];

    if (filters.userId) {
      results = results.filter((log) => log.userId === filters.userId);
    }

    if (filters.operation) {
      results = results.filter((log) => log.operation === filters.operation);
    }

    if (filters.startDate) {
      results = results.filter((log) => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      results = results.filter((log) => log.timestamp <= filters.endDate!);
    }

    if (filters.success !== undefined) {
      results = results.filter((log) => log.success === filters.success);
    }

    return results;
  }

  generateComplianceReport(): ComplianceReport {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentLogs = this.logs.filter((log) => log.timestamp > thirtyDaysAgo);

    return {
      period: {
        start: thirtyDaysAgo,
        end: now,
      },
      totalOperations: recentLogs.length,
      successRate: this.calculateSuccessRate(recentLogs),
      averageLatency: this.calculateAverageLatency(recentLogs),
      totalCost: this.calculateTotalCost(recentLogs),
      userCount: new Set(recentLogs.map((l) => l.userId)).size,
      operationBreakdown: this.getOperationBreakdown(recentLogs),
      errorSummary: this.getErrorSummary(recentLogs),
      complianceChecks: this.runComplianceChecks(recentLogs),
    };
  }

  private calculateSuccessRate(logs: AuditLogEntry[]): number {
    if (logs.length === 0) return 0;
    const successful = logs.filter((l) => l.success).length;
    return (successful / logs.length) * 100;
  }

  private calculateAverageLatency(logs: AuditLogEntry[]): number {
    if (logs.length === 0) return 0;
    const total = logs.reduce((sum, log) => sum + (log.latency || 0), 0);
    return total / logs.length;
  }

  private calculateTotalCost(logs: AuditLogEntry[]): number {
    return logs.reduce((sum, log) => sum + (log.cost || 0), 0);
  }

  private getOperationBreakdown(logs: AuditLogEntry[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    logs.forEach((log) => {
      breakdown[log.operation] = (breakdown[log.operation] || 0) + 1;
    });
    return breakdown;
  }

  private getErrorSummary(logs: AuditLogEntry[]): Record<string, number> {
    const errors: Record<string, number> = {};
    logs
      .filter((l) => !l.success && l.error)
      .forEach((log) => {
        const errorType = log.error?.type || 'unknown';
        errors[errorType] = (errors[errorType] || 0) + 1;
      });
    return errors;
  }

  private runComplianceChecks(logs: AuditLogEntry[]): ComplianceCheck[] {
    return [
      {
        name: 'Data Retention',
        passed: this.logs.every(
          (l) =>
            new Date().getTime() - l.timestamp.getTime() < this.retentionDays * 24 * 60 * 60 * 1000
        ),
        details: `Logs retained for ${this.retentionDays} days`,
      },
      {
        name: 'Audit Completeness',
        passed: logs.every((l) => l.id && l.timestamp && l.userId),
        details: 'All required fields present in audit logs',
      },
      {
        name: 'PII Protection',
        passed: logs.every(
          (l) =>
            !l.prompt.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) &&
            !l.prompt.match(/\b\d{3}-\d{2}-\d{4}\b/g)
        ),
        details: 'No unmasked PII in logs',
      },
    ];
  }
}

// ============================================================================
// MODEL SELECTION AND OPTIMIZATION
// ============================================================================

export interface ModelSelectionCriteria {
  taskType: 'generation' | 'analysis' | 'extraction' | 'conversation';
  complexity: 'low' | 'medium' | 'high';
  latencyRequirement: 'realtime' | 'near-realtime' | 'batch';
  accuracyRequirement: 'high' | 'medium' | 'low';
  costSensitivity: 'high' | 'medium' | 'low';
}

export class ModelSelector {
  private models: AIModel[] = [
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      capabilities: ['generation', 'analysis', 'extraction', 'conversation'],
      complexity: 'high',
      latency: 'near-realtime',
      accuracy: 'high',
      costPerToken: 0.015,
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3.5 Sonnet',
      capabilities: ['generation', 'analysis', 'extraction', 'conversation'],
      complexity: 'high',
      latency: 'near-realtime',
      accuracy: 'high',
      costPerToken: 0.003,
    },
    {
      id: 'claude-3-haiku',
      name: 'Claude 3 Haiku',
      capabilities: ['generation', 'extraction', 'conversation'],
      complexity: 'medium',
      latency: 'realtime',
      accuracy: 'medium',
      costPerToken: 0.00025,
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      capabilities: ['generation', 'analysis', 'extraction', 'conversation'],
      complexity: 'high',
      latency: 'near-realtime',
      accuracy: 'high',
      costPerToken: 0.03,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      capabilities: ['generation', 'extraction', 'conversation'],
      complexity: 'medium',
      latency: 'realtime',
      accuracy: 'medium',
      costPerToken: 0.0015,
    },
  ];

  selectModel(criteria: ModelSelectionCriteria): AIModel {
    // Filter models by capability
    let candidates = this.models.filter((m) => m.capabilities.includes(criteria.taskType));

    // Filter by complexity requirement
    candidates = candidates.filter((m) => {
      if (criteria.complexity === 'high') return m.complexity === 'high';
      if (criteria.complexity === 'medium') return ['medium', 'high'].includes(m.complexity);
      return true;
    });

    // Filter by latency requirement
    candidates = candidates.filter((m) => {
      if (criteria.latencyRequirement === 'realtime') return m.latency === 'realtime';
      if (criteria.latencyRequirement === 'near-realtime')
        return ['realtime', 'near-realtime'].includes(m.latency);
      return true;
    });

    // Filter by accuracy requirement
    candidates = candidates.filter((m) => {
      if (criteria.accuracyRequirement === 'high') return m.accuracy === 'high';
      if (criteria.accuracyRequirement === 'medium') return ['medium', 'high'].includes(m.accuracy);
      return true;
    });

    // Sort by cost if cost-sensitive
    if (criteria.costSensitivity === 'high') {
      candidates.sort((a, b) => a.costPerToken - b.costPerToken);
    } else if (criteria.costSensitivity === 'low') {
      candidates.sort((a, b) => (b.accuracy === 'high' ? -1 : 1));
    }

    // Return best match or fallback
    return candidates[0] || this.models.find((m) => m.id === 'claude-3-haiku')!;
  }

  estimateCost(model: AIModel, tokens: number): number {
    return (tokens / 1000) * model.costPerToken;
  }

  getRecommendation(useCase: string): AIModel {
    const useCaseMap: Record<string, ModelSelectionCriteria> = {
      calendar_parsing: {
        taskType: 'extraction',
        complexity: 'low',
        latencyRequirement: 'realtime',
        accuracyRequirement: 'medium',
        costSensitivity: 'high',
      },
      conflict_resolution: {
        taskType: 'analysis',
        complexity: 'high',
        latencyRequirement: 'near-realtime',
        accuracyRequirement: 'high',
        costSensitivity: 'medium',
      },
      daily_summary: {
        taskType: 'generation',
        complexity: 'medium',
        latencyRequirement: 'batch',
        accuracyRequirement: 'medium',
        costSensitivity: 'high',
      },
      conversation: {
        taskType: 'conversation',
        complexity: 'medium',
        latencyRequirement: 'realtime',
        accuracyRequirement: 'medium',
        costSensitivity: 'medium',
      },
    };

    const criteria = useCaseMap[useCase] || useCaseMap['conversation'];
    return this.selectModel(criteria);
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ConsentRecord {
  feature: string;
  granted: boolean;
  timestamp: Date;
  scope: 'session' | 'persistent' | 'one-time';
  dataUsed: string[];
  purpose: string;
  expiresAt?: Date;
}

interface AuditEntry {
  action: string;
  feature: string;
  timestamp: Date;
  details?: any;
}

interface AIRequest {
  prompt: string;
  model?: string;
  endpoint?: string;
  maxTokens?: number;
}

interface SafetyCheck {
  type: 'rate_limit' | 'token_limit' | 'cost_limit' | 'content_safety' | 'data_privacy';
  passed: boolean;
  warning: boolean;
  message: string;
}

interface SafetyCheckResult {
  allowed: boolean;
  checks: SafetyCheck[];
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

interface AIOperation {
  type: string;
  userId: string;
  model: string;
  prompt: string;
  response: string;
  tokensUsed: number;
  cost: number;
  latency: number;
  success: boolean;
  error?: { type: string; message: string };
  metadata?: Record<string, any>;
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  operation: string;
  userId: string;
  model: string;
  prompt: string;
  response: string;
  tokensUsed: number;
  cost: number;
  latency: number;
  success: boolean;
  error?: { type: string; message: string };
  metadata?: Record<string, any>;
}

interface AuditQueryFilters {
  userId?: string;
  operation?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
}

interface ComplianceReport {
  period: { start: Date; end: Date };
  totalOperations: number;
  successRate: number;
  averageLatency: number;
  totalCost: number;
  userCount: number;
  operationBreakdown: Record<string, number>;
  errorSummary: Record<string, number>;
  complianceChecks: ComplianceCheck[];
}

interface ComplianceCheck {
  name: string;
  passed: boolean;
  details: string;
}

interface AIModel {
  id: string;
  name: string;
  capabilities: ('generation' | 'analysis' | 'extraction' | 'conversation')[];
  complexity: 'low' | 'medium' | 'high';
  latency: 'realtime' | 'near-realtime' | 'batch';
  accuracy: 'low' | 'medium' | 'high';
  costPerToken: number;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ConsentManager,
  SafetyGuard,
  AuditLogger,
  ModelSelector,
  type ConsentConfiguration,
  type SafetyConfiguration,
  type ModelSelectionCriteria,
  type AIModel,
  type ComplianceReport,
};
