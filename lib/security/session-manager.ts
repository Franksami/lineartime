/**
 * Session Manager - Secure session management with timeout and activity tracking
 * Implements session security best practices
 */

import crypto from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

export interface SessionData {
  id: string;
  userId: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  ipAddress: string;
  userAgent: string;
  data: Record<string, any>;
  isActive: boolean;
  refreshToken?: string;
  mfaVerified?: boolean;
}

export interface SessionConfig {
  /**
   * Session timeout in milliseconds
   */
  sessionTimeout: number;

  /**
   * Idle timeout in milliseconds
   */
  idleTimeout: number;

  /**
   * Maximum session duration in milliseconds
   */
  maxSessionDuration: number;

  /**
   * Enable session fingerprinting
   */
  enableFingerprinting: boolean;

  /**
   * Enable activity tracking
   */
  enableActivityTracking: boolean;

  /**
   * Session cookie name
   */
  cookieName: string;

  /**
   * Require MFA for sensitive operations
   */
  requireMFA: boolean;

  /**
   * Maximum concurrent sessions per user
   */
  maxConcurrentSessions: number;

  /**
   * Enable session rotation on activity
   */
  rotateOnActivity: boolean;
}

/**
 * Default session configuration
 */
const DEFAULT_CONFIG: SessionConfig = {
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  idleTimeout: 15 * 60 * 1000, // 15 minutes
  maxSessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  enableFingerprinting: true,
  enableActivityTracking: true,
  cookieName: 'session-id',
  requireMFA: false,
  maxConcurrentSessions: 5,
  rotateOnActivity: true,
};

/**
 * Session store - In production, use Redis or database
 */
class SessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired sessions every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Create a new session
   */
  create(userId: string, ipAddress: string, userAgent: string, config: SessionConfig): SessionData {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const session: SessionData = {
      id: sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + config.sessionTimeout,
      ipAddress,
      userAgent,
      data: {},
      isActive: true,
      mfaVerified: false,
    };

    // Store session
    this.sessions.set(sessionId, session);

    // Track user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)?.add(sessionId);

    // Enforce maximum concurrent sessions
    this.enforceMaxSessions(userId, config.maxConcurrentSessions);

    return session;
  }

  /**
   * Get session by ID
   */
  get(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expiresAt < Date.now()) {
      this.destroy(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session activity
   */
  updateActivity(sessionId: string, config: SessionConfig): boolean {
    const session = this.get(sessionId);

    if (!session) {
      return false;
    }

    const now = Date.now();

    // Check idle timeout
    if (now - session.lastActivity > config.idleTimeout) {
      this.destroy(sessionId);
      return false;
    }

    // Check maximum session duration
    if (now - session.createdAt > config.maxSessionDuration) {
      this.destroy(sessionId);
      return false;
    }

    // Update activity
    session.lastActivity = now;
    session.expiresAt = now + config.sessionTimeout;

    // Rotate session ID if configured
    if (config.rotateOnActivity) {
      const newSessionId = this.generateSessionId();
      this.sessions.delete(sessionId);
      session.id = newSessionId;
      this.sessions.set(newSessionId, session);

      // Update user sessions tracking
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        userSessions.add(newSessionId);
      }
    }

    return true;
  }

  /**
   * Update session data
   */
  updateData(sessionId: string, data: Record<string, any>): boolean {
    const session = this.get(sessionId);

    if (!session) {
      return false;
    }

    session.data = { ...session.data, ...data };
    return true;
  }

  /**
   * Verify MFA for session
   */
  verifyMFA(sessionId: string): boolean {
    const session = this.get(sessionId);

    if (!session) {
      return false;
    }

    session.mfaVerified = true;
    return true;
  }

  /**
   * Destroy a session
   */
  destroy(sessionId: string): void {
    const session = this.sessions.get(sessionId);

    if (session) {
      // Remove from user sessions
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
    }

    this.sessions.delete(sessionId);
  }

  /**
   * Destroy all sessions for a user
   */
  destroyUserSessions(userId: string): void {
    const userSessions = this.userSessions.get(userId);

    if (userSessions) {
      userSessions.forEach((sessionId) => {
        this.sessions.delete(sessionId);
      });
      this.userSessions.delete(userId);
    }
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): SessionData[] {
    const userSessionIds = this.userSessions.get(userId);

    if (!userSessionIds) {
      return [];
    }

    const sessions: SessionData[] = [];
    userSessionIds.forEach((sessionId) => {
      const session = this.get(sessionId);
      if (session) {
        sessions.push(session);
      }
    });

    return sessions;
  }

  /**
   * Enforce maximum concurrent sessions
   */
  private enforceMaxSessions(userId: string, maxSessions: number): void {
    const userSessions = this.getUserSessions(userId);

    if (userSessions.length > maxSessions) {
      // Sort by last activity and remove oldest
      userSessions.sort((a, b) => a.lastActivity - b.lastActivity);
      const toRemove = userSessions.slice(0, userSessions.length - maxSessions);

      toRemove.forEach((session) => {
        this.destroy(session.id);
      });
    }
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Clean up expired sessions
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.destroy(sessionId);
      }
    }
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      totalUsers: this.userSessions.size,
      activeSessions: Array.from(this.sessions.values()).filter((s) => s.isActive).length,
      mfaVerifiedSessions: Array.from(this.sessions.values()).filter((s) => s.mfaVerified).length,
    };
  }

  /**
   * Destroy the store
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
    this.userSessions.clear();
  }
}

// Global session store
const sessionStore = new SessionStore();

/**
 * Session manager class
 */
export class SessionManager {
  constructor(private config: SessionConfig = DEFAULT_CONFIG) {}

  /**
   * Create a new session
   */
  createSession(userId: string, req: NextRequest, res: NextResponse): SessionData {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const session = sessionStore.create(userId, ipAddress, userAgent, this.config);

    // Set session cookie
    this.setSessionCookie(res, session.id);

    return session;
  }

  /**
   * Get session from request
   */
  getSession(req: NextRequest): SessionData | null {
    const sessionId = this.getSessionId(req);

    if (!sessionId) {
      return null;
    }

    const session = sessionStore.get(sessionId);

    if (!session) {
      return null;
    }

    // Verify session fingerprint if enabled
    if (this.config.enableFingerprinting && !this.verifyFingerprint(session, req)) {
      sessionStore.destroy(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session activity
   */
  updateSessionActivity(req: NextRequest): boolean {
    const sessionId = this.getSessionId(req);

    if (!sessionId) {
      return false;
    }

    return sessionStore.updateActivity(sessionId, this.config);
  }

  /**
   * Destroy session
   */
  destroySession(req: NextRequest, res: NextResponse): void {
    const sessionId = this.getSessionId(req);

    if (sessionId) {
      sessionStore.destroy(sessionId);
    }

    // Clear session cookie
    this.clearSessionCookie(res);
  }

  /**
   * Require MFA for session
   */
  requireMFA(req: NextRequest): boolean {
    if (!this.config.requireMFA) {
      return true;
    }

    const session = this.getSession(req);

    if (!session) {
      return false;
    }

    return session.mfaVerified === true;
  }

  /**
   * Verify MFA for session
   */
  verifyMFA(req: NextRequest): boolean {
    const sessionId = this.getSessionId(req);

    if (!sessionId) {
      return false;
    }

    return sessionStore.verifyMFA(sessionId);
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): SessionData[] {
    return sessionStore.getUserSessions(userId);
  }

  /**
   * Destroy all sessions for a user
   */
  destroyUserSessions(userId: string): void {
    sessionStore.destroyUserSessions(userId);
  }

  /**
   * Get session ID from request
   */
  private getSessionId(req: NextRequest): string | null {
    return req.cookies.get(this.config.cookieName)?.value || null;
  }

  /**
   * Set session cookie
   */
  private setSessionCookie(res: NextResponse, sessionId: string): void {
    res.cookies.set({
      name: this.config.cookieName,
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: this.config.sessionTimeout / 1000, // Convert to seconds
    });
  }

  /**
   * Clear session cookie
   */
  private clearSessionCookie(res: NextResponse): void {
    res.cookies.delete(this.config.cookieName);
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const real = req.headers.get('x-real-ip');
    const cloudflare = req.headers.get('cf-connecting-ip');

    return cloudflare || real || forwarded?.split(',')[0] || 'unknown';
  }

  /**
   * Verify session fingerprint
   */
  private verifyFingerprint(session: SessionData, req: NextRequest): boolean {
    const currentIP = this.getClientIP(req);
    const currentUserAgent = req.headers.get('user-agent') || 'unknown';

    // Check IP address (can be relaxed for mobile users)
    if (session.ipAddress !== currentIP) {
      console.warn(`Session IP mismatch: ${session.ipAddress} !== ${currentIP}`);
      // Could implement IP range checking for mobile networks
      return false;
    }

    // Check user agent
    if (session.userAgent !== currentUserAgent) {
      console.warn('Session user agent mismatch');
      return false;
    }

    return true;
  }

  /**
   * Get session statistics
   */
  getStats() {
    return sessionStore.getStats();
  }
}

/**
 * Session middleware
 */
export function sessionMiddleware(
  config: SessionConfig = DEFAULT_CONFIG
): (req: NextRequest) => SessionData | null {
  const manager = new SessionManager(config);

  return (req: NextRequest) => {
    const session = manager.getSession(req);

    if (session && config.enableActivityTracking) {
      manager.updateSessionActivity(req);
    }

    return session;
  };
}

/**
 * React hook helper for session management
 */
export interface SessionHookResult {
  session: SessionData | null;
  isAuthenticated: boolean;
  isMFAVerified: boolean;
  destroySession: () => Promise<void>;
  verifyMFA: () => Promise<boolean>;
}

/**
 * Session activity monitor
 */
export class SessionActivityMonitor {
  private lastActivity: number = Date.now();
  private warningCallback?: () => void;
  private timeoutCallback?: () => void;
  private warningTimer?: NodeJS.Timeout;
  private timeoutTimer?: NodeJS.Timeout;

  constructor(
    private idleTimeout: number,
    private warningTime = 60000 // 1 minute warning
  ) {
    this.startMonitoring();
  }

  /**
   * Start monitoring user activity
   */
  private startMonitoring(): void {
    // Monitor user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, this.handleActivity, true);
    });

    this.resetTimers();
  }

  /**
   * Handle user activity
   */
  private handleActivity = (): void => {
    this.lastActivity = Date.now();
    this.resetTimers();
  };

  /**
   * Reset warning and timeout timers
   */
  private resetTimers(): void {
    // Clear existing timers
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }

    // Set warning timer
    this.warningTimer = setTimeout(() => {
      this.warningCallback?.();
    }, this.idleTimeout - this.warningTime);

    // Set timeout timer
    this.timeoutTimer = setTimeout(() => {
      this.timeoutCallback?.();
    }, this.idleTimeout);
  }

  /**
   * Set warning callback
   */
  onWarning(callback: () => void): void {
    this.warningCallback = callback;
  }

  /**
   * Set timeout callback
   */
  onTimeout(callback: () => void): void {
    this.timeoutCallback = callback;
  }

  /**
   * Get time until timeout
   */
  getTimeUntilTimeout(): number {
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, this.idleTimeout - elapsed);
  }

  /**
   * Destroy the monitor
   */
  destroy(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.removeEventListener(event, this.handleActivity, true);
    });

    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
  }
}
