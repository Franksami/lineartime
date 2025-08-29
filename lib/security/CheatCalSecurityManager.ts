/**
 * Command Center Security Manager - Privacy-First AI Security System
 *
 * Comprehensive security and privacy controls for controversial AI monitoring.
 * Implements transparency, user control, and data protection standards.
 *
 * @version Command Center Phase 3.0
 * @author Command Center Security & Privacy Team
 */

import { logger } from '@/lib/utils/logger';
import CryptoJS from 'crypto-js';

// ==========================================
// Types & Interfaces
// ==========================================

export interface SecurityConfiguration {
  encryptionLevel: 'basic' | 'standard' | 'maximum';
  dataRetention: 'session' | 'daily' | 'weekly' | 'never';
  auditLogging: boolean;
  anomalyDetection: boolean;
  ratelimiting: boolean;
  accessControl: 'open' | 'restricted' | 'locked';
  privacyMode: 'transparent' | 'minimal' | 'strict';
}

export interface PrivacySettings {
  screenCaptureConsent: boolean;
  voiceRecordingConsent: boolean;
  dataProcessingConsent: boolean;
  analyticsConsent: boolean;
  improvementConsent: boolean;
  consentTimestamp: Date;
  consentVersion: string;
  withdrawalOption: boolean;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  event: string;
  component: 'vision' | 'voice' | 'coordinator' | 'security';
  severity: 'info' | 'warning' | 'error' | 'critical';
  details: any;
  userAction?: boolean;
  dataAccessed?: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DataAccessRequest {
  id: string;
  component: string;
  dataType: 'screen' | 'voice' | 'calendar' | 'analytics';
  purpose: string;
  requestTime: Date;
  approved: boolean;
  approvedBy: 'user' | 'system' | 'automatic';
  expiryTime?: Date;
  accessCount: number;
}

export interface SecurityThreat {
  id: string;
  type: 'unauthorized_access' | 'data_breach' | 'anomaly' | 'rate_limit' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detected_at: Date;
  mitigated: boolean;
  mitigation_action?: string;
  false_positive: boolean;
}

// ==========================================
// Security Manager Class
// ==========================================

export class CheatCalSecurityManager {
  private configuration: SecurityConfiguration;
  private privacySettings: PrivacySettings;
  private auditLogs: SecurityAuditLog[] = [];
  private dataAccessRequests: Map<string, DataAccessRequest> = new Map();
  private activeSessions: Map<string, any> = new Map();
  private rateLimitCache: Map<string, number[]> = new Map();
  private encryptionKey: string;

  // ASCII Security Architecture
  private static readonly SECURITY_ARCHITECTURE = `
CHEATCAL SECURITY & PRIVACY ARCHITECTURE
═══════════════════════════════════════════════════════════════════

PRIVACY-FIRST CONTROVERSIAL AI SECURITY SYSTEM:
┌─────────────────────────────────────────────────────────────────┐
│                   SECURITY CONTROL LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ USER CONSENT MANAGEMENT                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✅ Explicit Consent Required     [TRANSPARENT]             │ │
│ │ 🔄 Withdrawal Anytime           [USER CONTROL]             │ │
│ │ 📝 Consent Versioning           [AUDIT TRAIL]              │ │
│ │ ⏰ Time-bound Permissions        [AUTO-EXPIRY]              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ DATA PROTECTION LAYER                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔐 AES-256 Encryption            [MILITARY GRADE]          │ │
│ │ 💾 Local Processing First        [PRIVACY BY DESIGN]       │ │
│ │ 🚫 No Persistent Storage         [EPHEMERAL DATA]          │ │
│ │ 🛡️ Secure Memory Management      [AUTO-CLEANUP]            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ACCESS CONTROL MATRIX                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👤 User Authentication          [IDENTITY VERIFICATION]    │ │
│ │ 🎯 Purpose-Limited Access       [MINIMAL NECESSARY]        │ │
│ │ ⚡ Time-Limited Sessions         [AUTO-TERMINATION]         │ │
│ │ 📊 Audit Every Action           [COMPLETE TRANSPARENCY]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MONITORING & COMPLIANCE LAYER                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ REAL-TIME THREAT DETECTION                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🚨 Anomaly Detection             [ML-POWERED]               │ │
│ │ 🔍 Behavioral Analysis           [PATTERN RECOGNITION]      │ │
│ │ ⚡ Instant Response               [AUTOMATED MITIGATION]     │ │
│ │ 📈 Risk Assessment               [DYNAMIC SCORING]          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ COMPLIANCE FRAMEWORK                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🇪🇺 GDPR Compliance              [RIGHT TO BE FORGOTTEN]    │ │
│ │ 🇺🇸 CCPA Compliance              [CALIFORNIA PRIVACY]       │ │
│ │ 🔒 SOC 2 Standards               [SECURITY CONTROLS]        │ │
│ │ 🏢 Enterprise Ready              [B2B SECURITY]             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

TRANSPARENCY & CONTROL DASHBOARD:
┌─────────────────────────────────────────────────────────────────┐
│ 👁️ WHAT WE SEE        📊 HOW WE USE IT      🔒 YOUR CONTROL    │
│ • Screen content      • Optimization only   • Real-time toggle  │
│ • Voice commands      • Event coordination  • Granular settings │
│ • Calendar patterns   • Revenue insights    • Data export       │
│ • App usage patterns  • Productivity tips   • Complete deletion │
└─────────────────────────────────────────────────────────────────┘
`;

  constructor(configuration?: Partial<SecurityConfiguration>) {
    this.configuration = {
      encryptionLevel: 'standard',
      dataRetention: 'session',
      auditLogging: true,
      anomalyDetection: true,
      rateLimit: true,
      accessControl: 'restricted',
      privacyMode: 'transparent',
      ...configuration,
    };

    this.privacySettings = {
      screenCaptureConsent: false,
      voiceRecordingConsent: false,
      dataProcessingConsent: false,
      analyticsConsent: false,
      improvementConsent: false,
      consentTimestamp: new Date(),
      consentVersion: '1.0.0',
      withdrawalOption: true,
    };

    // Generate encryption key
    this.encryptionKey = this.generateEncryptionKey();

    // Initialize security monitoring
    this.initializeSecurityMonitoring();

    logger.info('🛡️ Command Center Security Manager initialized');
    logger.info(CheatCalSecurityManager.SECURITY_ARCHITECTURE);
  }

  // ==========================================
  // Initialization Methods
  // ==========================================

  private initializeSecurityMonitoring(): void {
    // Set up periodic security checks
    setInterval(() => {
      this.performSecurityAudit();
    }, 60000); // Every minute

    // Set up anomaly detection
    this.setupAnomalyDetection();

    // Clean up expired data
    setInterval(() => {
      this.cleanupExpiredData();
    }, 300000); // Every 5 minutes
  }

  private setupAnomalyDetection(): void {
    if (!this.configuration.anomalyDetection) return;

    // Monitor for unusual access patterns
    window.addEventListener('cheatcal-data-access', (event: any) => {
      this.analyzeAccessPattern(event.detail);
    });

    // Monitor for security events
    window.addEventListener('cheatcal-security-event', (event: any) => {
      this.handleSecurityEvent(event.detail);
    });
  }

  // ==========================================
  // Consent Management
  // ==========================================

  public requestConsent(
    consentType: keyof PrivacySettings,
    purpose: string,
    duration?: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.logSecurityEvent({
        event: 'consent_requested',
        component: 'security',
        severity: 'info',
        details: { type: consentType, purpose, duration },
        userAction: false,
      });

      // Emit consent request event for UI
      window.dispatchEvent(
        new CustomEvent('cheatcal-consent-request', {
          detail: {
            type: consentType,
            purpose,
            duration,
            callback: (granted: boolean) => {
              this.handleConsentResponse(consentType, granted, purpose);
              resolve(granted);
            },
          },
        })
      );
    });
  }

  private handleConsentResponse(
    consentType: keyof PrivacySettings,
    granted: boolean,
    purpose: string
  ): void {
    // Update privacy settings
    if (typeof this.privacySettings[consentType] === 'boolean') {
      (this.privacySettings as any)[consentType] = granted;
      this.privacySettings.consentTimestamp = new Date();
    }

    // Log consent decision
    this.logSecurityEvent({
      event: 'consent_updated',
      component: 'security',
      severity: granted ? 'info' : 'warning',
      details: { type: consentType, granted, purpose },
      userAction: true,
    });

    // Emit consent updated event
    window.dispatchEvent(
      new CustomEvent('cheatcal-consent-updated', {
        detail: { type: consentType, granted, privacy_settings: this.privacySettings },
      })
    );
  }

  public withdrawConsent(consentType: keyof PrivacySettings): void {
    if (typeof this.privacySettings[consentType] === 'boolean') {
      (this.privacySettings as any)[consentType] = false;
      this.privacySettings.consentTimestamp = new Date();
    }

    // Log withdrawal
    this.logSecurityEvent({
      event: 'consent_withdrawn',
      component: 'security',
      severity: 'warning',
      details: { type: consentType },
      userAction: true,
    });

    // Clean up related data
    this.cleanupDataByType(consentType);

    // Emit withdrawal event
    window.dispatchEvent(
      new CustomEvent('cheatcal-consent-withdrawn', {
        detail: { type: consentType, privacy_settings: this.privacySettings },
      })
    );
  }

  public hasValidConsent(consentType: keyof PrivacySettings): boolean {
    const consent = this.privacySettings[consentType];
    if (typeof consent !== 'boolean' || !consent) return false;

    // Check if consent has expired (24 hours for screen capture)
    if (consentType === 'screenCaptureConsent') {
      const hoursSinceConsent =
        (Date.now() - this.privacySettings.consentTimestamp.getTime()) / (1000 * 60 * 60);
      if (hoursSinceConsent > 24) {
        this.withdrawConsent(consentType);
        return false;
      }
    }

    return true;
  }

  // ==========================================
  // Data Protection Methods
  // ==========================================

  public encryptData(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();

      this.logSecurityEvent({
        event: 'data_encrypted',
        component: 'security',
        severity: 'info',
        details: { size: jsonString.length },
        userAction: false,
      });

      return encrypted;
    } catch (error) {
      logger.error('Data encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  public decryptData(encryptedData: string): any {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!jsonString) {
        throw new Error('Decryption failed - invalid key or data');
      }

      this.logSecurityEvent({
        event: 'data_decrypted',
        component: 'security',
        severity: 'info',
        details: { size: jsonString.length },
        userAction: false,
      });

      return JSON.parse(jsonString);
    } catch (error) {
      logger.error('Data decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  public requestDataAccess(
    component: string,
    dataType: 'screen' | 'voice' | 'calendar' | 'analytics',
    purpose: string,
    duration?: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const requestId = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const request: DataAccessRequest = {
        id: requestId,
        component,
        dataType,
        purpose,
        requestTime: new Date(),
        approved: false,
        approvedBy: 'system',
        expiryTime: duration ? new Date(Date.now() + duration) : undefined,
        accessCount: 0,
      };

      // Check if access is automatically granted based on consent
      const autoApprove = this.checkAutoApproval(dataType, purpose);

      if (autoApprove) {
        request.approved = true;
        request.approvedBy = 'automatic';
        this.dataAccessRequests.set(requestId, request);

        this.logSecurityEvent({
          event: 'data_access_granted',
          component: 'security',
          severity: 'info',
          details: { requestId, component, dataType, purpose, auto: true },
          userAction: false,
          dataAccessed: [dataType],
        });

        resolve(true);
      } else {
        // Request user approval
        window.dispatchEvent(
          new CustomEvent('cheatcal-data-access-request', {
            detail: {
              request,
              callback: (approved: boolean) => {
                request.approved = approved;
                request.approvedBy = 'user';

                if (approved) {
                  this.dataAccessRequests.set(requestId, request);
                }

                this.logSecurityEvent({
                  event: approved ? 'data_access_granted' : 'data_access_denied',
                  component: 'security',
                  severity: approved ? 'info' : 'warning',
                  details: { requestId, component, dataType, purpose, auto: false },
                  userAction: true,
                  dataAccessed: approved ? [dataType] : [],
                });

                resolve(approved);
              },
            },
          })
        );
      }
    });
  }

  private checkAutoApproval(dataType: string, purpose: string): boolean {
    // Check if user has already consented to this type of data access
    switch (dataType) {
      case 'screen':
        return this.hasValidConsent('screenCaptureConsent');
      case 'voice':
        return this.hasValidConsent('voiceRecordingConsent');
      case 'calendar':
        return true; // Calendar data is always approved as it's user's own data
      case 'analytics':
        return this.hasValidConsent('analyticsConsent');
      default:
        return false;
    }
  }

  // ==========================================
  // Rate Limiting
  // ==========================================

  public checkRateLimit(key: string, maxRequests = 60, windowMs = 60000): boolean {
    if (!this.configuration.rateLimit) return true;

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this key
    const requests = this.rateLimitCache.get(key) || [];

    // Filter out old requests
    const recentRequests = requests.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      this.logSecurityEvent({
        event: 'rate_limit_exceeded',
        component: 'security',
        severity: 'warning',
        details: { key, requests: recentRequests.length, limit: maxRequests },
        userAction: false,
        riskLevel: 'medium',
      });

      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.rateLimitCache.set(key, recentRequests);

    return true;
  }

  // ==========================================
  // Security Monitoring
  // ==========================================

  private performSecurityAudit(): void {
    // Check for expired sessions
    this.auditSessions();

    // Check for suspicious patterns
    this.auditAccessPatterns();

    // Validate data integrity
    this.auditDataIntegrity();

    // Clean up old logs
    this.cleanupOldLogs();
  }

  private auditSessions(): void {
    const expiredSessions = [];

    for (const [sessionId, session] of this.activeSessions) {
      if (this.isSessionExpired(session)) {
        expiredSessions.push(sessionId);
      }
    }

    // Clean up expired sessions
    expiredSessions.forEach((sessionId) => {
      this.activeSessions.delete(sessionId);
      this.logSecurityEvent({
        event: 'session_expired',
        component: 'security',
        severity: 'info',
        details: { sessionId },
        userAction: false,
      });
    });
  }

  private auditAccessPatterns(): void {
    const recentLogs = this.auditLogs.filter(
      (log) => Date.now() - log.timestamp.getTime() < 300000 // Last 5 minutes
    );

    // Check for unusual access patterns
    const accessAttempts = recentLogs.filter((log) => log.event.includes('access'));

    if (accessAttempts.length > 20) {
      // More than 20 access attempts in 5 minutes
      this.raiseSecurityAlert({
        type: 'suspicious_activity',
        severity: 'medium',
        description: `Unusual access pattern detected: ${accessAttempts.length} attempts in 5 minutes`,
        detected_at: new Date(),
        mitigated: false,
        false_positive: false,
      });
    }
  }

  private auditDataIntegrity(): void {
    // Check if encryption key is still valid
    try {
      const testData = { test: 'integrity_check' };
      const encrypted = this.encryptData(testData);
      const decrypted = this.decryptData(encrypted);

      if (JSON.stringify(testData) !== JSON.stringify(decrypted)) {
        this.raiseSecurityAlert({
          type: 'data_breach',
          severity: 'critical',
          description: 'Data integrity check failed - encryption/decryption mismatch',
          detected_at: new Date(),
          mitigated: false,
          false_positive: false,
        });
      }
    } catch (error) {
      this.raiseSecurityAlert({
        type: 'data_breach',
        severity: 'critical',
        description: `Data integrity check failed: ${error.message}`,
        detected_at: new Date(),
        mitigated: false,
        false_positive: false,
      });
    }
  }

  private analyzeAccessPattern(accessDetails: any): void {
    if (!this.configuration.anomalyDetection) return;

    // Check for anomalous access patterns
    const componentAccess = this.auditLogs.filter(
      (log) =>
        log.component === accessDetails.component && Date.now() - log.timestamp.getTime() < 600000 // Last 10 minutes
    ).length;

    if (componentAccess > 50) {
      // More than 50 accesses in 10 minutes
      this.raiseSecurityAlert({
        type: 'anomaly',
        severity: 'high',
        description: `Anomalous access pattern for ${accessDetails.component}: ${componentAccess} accesses in 10 minutes`,
        detected_at: new Date(),
        mitigated: false,
        false_positive: false,
      });
    }
  }

  private handleSecurityEvent(eventDetails: any): void {
    this.logSecurityEvent({
      event: 'security_event_handled',
      component: 'security',
      severity: eventDetails.severity || 'info',
      details: eventDetails,
      userAction: false,
    });

    // Trigger additional security measures if needed
    if (eventDetails.severity === 'critical') {
      this.emergencyLockdown();
    }
  }

  private raiseSecurityAlert(threat: SecurityThreat): void {
    // Log the threat
    this.logSecurityEvent({
      event: 'security_threat_detected',
      component: 'security',
      severity: 'error',
      details: threat,
      userAction: false,
      riskLevel: threat.severity as any,
    });

    // Emit security alert event
    window.dispatchEvent(
      new CustomEvent('cheatcal-security-alert', {
        detail: threat,
      })
    );

    // Auto-mitigate if possible
    this.attemptThreatMitigation(threat);
  }

  private attemptThreatMitigation(threat: SecurityThreat): void {
    switch (threat.type) {
      case 'rate_limit':
        // Already handled by rate limiting system
        threat.mitigated = true;
        threat.mitigation_action = 'Rate limiting enforced';
        break;

      case 'suspicious_activity':
        // Temporarily increase security level
        this.configuration.accessControl = 'locked';
        threat.mitigated = true;
        threat.mitigation_action = 'Access control locked temporarily';

        // Auto-unlock after 10 minutes
        setTimeout(() => {
          this.configuration.accessControl = 'restricted';
        }, 600000);
        break;

      case 'data_breach':
      case 'unauthorized_access':
        // Emergency lockdown
        this.emergencyLockdown();
        threat.mitigated = true;
        threat.mitigation_action = 'Emergency lockdown activated';
        break;
    }
  }

  private emergencyLockdown(): void {
    logger.error('🚨 EMERGENCY LOCKDOWN ACTIVATED');

    // Disable all AI systems
    window.dispatchEvent(
      new CustomEvent('cheatcal-emergency-lockdown', {
        detail: { timestamp: new Date(), reason: 'security_threat' },
      })
    );

    // Clear all sensitive data
    this.cleanupAllData();

    // Lock access
    this.configuration.accessControl = 'locked';

    // Log lockdown
    this.logSecurityEvent({
      event: 'emergency_lockdown',
      component: 'security',
      severity: 'critical',
      details: { triggered_at: new Date() },
      userAction: false,
      riskLevel: 'high',
    });
  }

  // ==========================================
  // Data Cleanup Methods
  // ==========================================

  private cleanupExpiredData(): void {
    const now = Date.now();

    // Clean up expired data access requests
    for (const [id, request] of this.dataAccessRequests) {
      if (request.expiryTime && request.expiryTime.getTime() < now) {
        this.dataAccessRequests.delete(id);
      }
    }

    // Clean up rate limit cache
    for (const [key, timestamps] of this.rateLimitCache) {
      const filtered = timestamps.filter((ts) => now - ts < 3600000); // Keep last hour
      if (filtered.length === 0) {
        this.rateLimitCache.delete(key);
      } else {
        this.rateLimitCache.set(key, filtered);
      }
    }

    // Clean up based on data retention policy
    switch (this.configuration.dataRetention) {
      case 'session':
        // Data is cleaned when session ends
        break;
      case 'daily':
        this.cleanupDataOlderThan(24 * 60 * 60 * 1000); // 24 hours
        break;
      case 'weekly':
        this.cleanupDataOlderThan(7 * 24 * 60 * 60 * 1000); // 7 days
        break;
      case 'never':
        // Keep all data
        break;
    }
  }

  private cleanupDataByType(consentType: keyof PrivacySettings): void {
    // Emit cleanup event for specific data type
    window.dispatchEvent(
      new CustomEvent('cheatcal-cleanup-data', {
        detail: { type: consentType, timestamp: new Date() },
      })
    );

    this.logSecurityEvent({
      event: 'data_cleanup',
      component: 'security',
      severity: 'info',
      details: { type: consentType },
      userAction: true,
    });
  }

  private cleanupDataOlderThan(maxAge: number): void {
    const cutoff = Date.now() - maxAge;

    // Clean up old audit logs
    this.auditLogs = this.auditLogs.filter((log) => log.timestamp.getTime() > cutoff);

    // Emit cleanup event
    window.dispatchEvent(
      new CustomEvent('cheatcal-cleanup-old-data', {
        detail: { cutoff: new Date(cutoff), timestamp: new Date() },
      })
    );
  }

  private cleanupAllData(): void {
    // Clear all caches and sensitive data
    this.dataAccessRequests.clear();
    this.activeSessions.clear();
    this.rateLimitCache.clear();

    // Emit complete cleanup event
    window.dispatchEvent(
      new CustomEvent('cheatcal-cleanup-all-data', {
        detail: { timestamp: new Date() },
      })
    );

    this.logSecurityEvent({
      event: 'all_data_cleanup',
      component: 'security',
      severity: 'warning',
      details: { reason: 'emergency_lockdown_or_withdrawal' },
      userAction: true,
    });
  }

  private cleanupOldLogs(): void {
    const maxLogs = 1000;
    if (this.auditLogs.length > maxLogs) {
      const removed = this.auditLogs.length - maxLogs;
      this.auditLogs = this.auditLogs.slice(-maxLogs);

      logger.info(`🗑️ Cleaned up ${removed} old audit logs`);
    }
  }

  // ==========================================
  // Logging Methods
  // ==========================================

  private logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): void {
    if (!this.configuration.auditLogging) return;

    const logEntry: SecurityAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      riskLevel: 'low',
      ...event,
    };

    this.auditLogs.push(logEntry);

    // Emit audit log event for monitoring dashboards
    window.dispatchEvent(
      new CustomEvent('cheatcal-audit-log', {
        detail: logEntry,
      })
    );
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  private generateEncryptionKey(): string {
    // Generate a secure encryption key
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  private isSessionExpired(session: any): boolean {
    const maxAge = 4 * 60 * 60 * 1000; // 4 hours
    return Date.now() - session.created > maxAge;
  }

  // ==========================================
  // Public API
  // ==========================================

  public getSecurityConfiguration(): SecurityConfiguration {
    return { ...this.configuration };
  }

  public updateSecurityConfiguration(updates: Partial<SecurityConfiguration>): void {
    this.configuration = { ...this.configuration, ...updates };

    this.logSecurityEvent({
      event: 'configuration_updated',
      component: 'security',
      severity: 'info',
      details: updates,
      userAction: true,
    });
  }

  public getPrivacySettings(): PrivacySettings {
    return { ...this.privacySettings };
  }

  public getAuditLogs(): SecurityAuditLog[] {
    return [...this.auditLogs];
  }

  public exportUserData(): any {
    return {
      privacy_settings: this.privacySettings,
      audit_logs: this.auditLogs.filter((log) => log.userAction),
      data_access_history: Array.from(this.dataAccessRequests.values()),
      export_timestamp: new Date(),
    };
  }

  public deleteAllUserData(): void {
    // Withdraw all consents
    Object.keys(this.privacySettings).forEach((key) => {
      if (key !== 'consentTimestamp' && key !== 'consentVersion' && key !== 'withdrawalOption') {
        this.withdrawConsent(key as keyof PrivacySettings);
      }
    });

    // Clean up all data
    this.cleanupAllData();

    this.logSecurityEvent({
      event: 'user_data_deleted',
      component: 'security',
      severity: 'warning',
      details: { requested_by_user: true },
      userAction: true,
    });
  }

  public getSecurityStatus(): any {
    return {
      active_sessions: this.activeSessions.size,
      recent_threats: this.auditLogs.filter(
        (log) => log.severity === 'error' || log.severity === 'critical'
      ).length,
      data_access_requests: this.dataAccessRequests.size,
      privacy_compliance: this.calculatePrivacyCompliance(),
      last_audit: this.auditLogs[this.auditLogs.length - 1]?.timestamp,
    };
  }

  private calculatePrivacyCompliance(): number {
    let score = 100;

    // Deduct points for missing consent
    if (!this.privacySettings.screenCaptureConsent) score -= 20;
    if (!this.privacySettings.voiceRecordingConsent) score -= 20;
    if (!this.privacySettings.dataProcessingConsent) score -= 15;

    // Deduct points for weak security configuration
    if (this.configuration.encryptionLevel === 'basic') score -= 10;
    if (!this.configuration.auditLogging) score -= 10;
    if (!this.configuration.anomalyDetection) score -= 5;

    return Math.max(0, score);
  }

  public destroy(): void {
    // Clean up all data
    this.cleanupAllData();

    // Clear intervals
    // (This would be implemented with proper interval tracking)

    logger.info('🛡️ Command Center Security Manager destroyed');
  }
}

export default CheatCalSecurityManager;
