/**
 * Security Middleware - Comprehensive security layer for the application
 * Integrates all security features: MFA, rate limiting, CSRF, session management, and security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { applySecurityHeaders } from '@/lib/security/security-headers';
import { checkRateLimit, getRateLimitHeaders, RateLimitConfigs } from '@/lib/security/rate-limiter';
import { csrfProtection, createCSRFToken } from '@/lib/security/csrf-protection';
import { SessionManager } from '@/lib/security/session-manager';

/**
 * Security middleware configuration
 */
export interface SecurityConfig {
  enableSecurityHeaders: boolean;
  enableRateLimiting: boolean;
  enableCSRFProtection: boolean;
  enableSessionManagement: boolean;
  enableMFAEnforcement: boolean;
  csrfSecret?: string;
  sessionTimeout?: number;
  idleTimeout?: number;
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableSecurityHeaders: true,
  enableRateLimiting: true,
  enableCSRFProtection: true,
  enableSessionManagement: true,
  enableMFAEnforcement: false, // Set to true after MFA is configured in Clerk
  csrfSecret: process.env.CSRF_SECRET || 'your-csrf-secret-key',
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  idleTimeout: 15 * 60 * 1000, // 15 minutes
};

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/calendar',
  '/settings',
  '/api/protected',
];

/**
 * API routes with different rate limit configurations
 */
const RATE_LIMIT_RULES = {
  '/api/auth': RateLimitConfigs.auth,
  '/api/calendar/sync': RateLimitConfigs.write,
  '/api/calendar': RateLimitConfigs.api,
  '/api/settings': RateLimitConfigs.write,
  '/api': RateLimitConfigs.api,
};

/**
 * Routes that require MFA
 */
const MFA_REQUIRED_ROUTES = [
  '/settings/security',
  '/api/settings/security',
  '/api/calendar/providers',
];

/**
 * Session manager instance
 */
const sessionManager = new SessionManager({
  sessionTimeout: DEFAULT_SECURITY_CONFIG.sessionTimeout!,
  idleTimeout: DEFAULT_SECURITY_CONFIG.idleTimeout!,
  maxSessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  enableFingerprinting: true,
  enableActivityTracking: true,
  cookieName: 'lt-session',
  requireMFA: false,
  maxConcurrentSessions: 5,
  rotateOnActivity: true,
});

/**
 * Check if route is protected
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if route requires MFA
 */
function requiresMFA(pathname: string): boolean {
  return MFA_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Get rate limit config for path
 */
function getRateLimitConfig(pathname: string) {
  for (const [path, config] of Object.entries(RATE_LIMIT_RULES)) {
    if (pathname.startsWith(path)) {
      return config;
    }
  }
  return RateLimitConfigs.api;
}

/**
 * Main security middleware
 */
export async function securityMiddleware(
  request: NextRequest,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next();

  try {
    // 1. Apply security headers
    if (config.enableSecurityHeaders) {
      response = applySecurityHeaders(response);
    }

    // 2. Check rate limiting
    if (config.enableRateLimiting && pathname.startsWith('/api')) {
      const rateLimitConfig = getRateLimitConfig(pathname);
      const rateLimitResult = checkRateLimit(request, rateLimitConfig);
      
      // Add rate limit headers
      const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      // Return 429 if rate limit exceeded
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { 
            error: 'Too many requests', 
            retryAfter: rateLimitResult.retryAfter 
          },
          { 
            status: 429,
            headers: response.headers,
          }
        );
      }
    }

    // 3. Check authentication for protected routes
    if (isProtectedRoute(pathname)) {
      const { userId } = await auth();
      
      if (!userId) {
        // Redirect to sign-in page
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signInUrl);
      }

      // 4. Session management
      if (config.enableSessionManagement) {
        let session = sessionManager.getSession(request);
        
        if (!session) {
          // Create new session
          session = sessionManager.createSession(userId, request, response);
        } else {
          // Update session activity
          sessionManager.updateSessionActivity(request);
        }
      }

      // 5. MFA enforcement
      if (config.enableMFAEnforcement && requiresMFA(pathname)) {
        const session = sessionManager.getSession(request);
        
        if (!session?.mfaVerified) {
          // Check if user has MFA enabled in Clerk
          // This would require checking Clerk's user metadata
          
          return NextResponse.json(
            { error: 'MFA verification required' },
            { status: 403, headers: response.headers }
          );
        }
      }
    }

    // 6. CSRF protection for state-changing operations
    if (config.enableCSRFProtection && pathname.startsWith('/api')) {
      const method = request.method;
      const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
      
      if (stateChangingMethods.includes(method)) {
        const csrfResult = await csrfProtection(request, {
          secret: config.csrfSecret!,
          excludePaths: ['/api/webhooks', '/api/auth'],
        });
        
        if (!csrfResult.valid) {
          // Generate new CSRF token for response
          const newToken = createCSRFToken(response, {
            secret: config.csrfSecret!,
          });
          
          response.headers.set('x-csrf-token', newToken);
          
          return NextResponse.json(
            { error: csrfResult.error || 'CSRF validation failed' },
            { status: 403, headers: response.headers }
          );
        }
      }
    }

    // 7. Add security context headers
    response.headers.set('x-request-id', crypto.randomUUID());
    response.headers.set('x-content-type-options', 'nosniff');
    response.headers.set('x-frame-options', 'DENY');
    response.headers.set('x-xss-protection', '1; mode=block');

    return response;
  } catch (error) {
    console.error('Security middleware error:', error);
    
    // Return a generic error response
    return NextResponse.json(
      { error: 'Internal security error' },
      { status: 500 }
    );
  }
}

/**
 * Export session manager for use in API routes
 */
export { sessionManager };

/**
 * Helper function to check if user has MFA enabled
 */
export async function checkUserMFA(userId: string): Promise<boolean> {
  // This would integrate with Clerk's API to check MFA status
  // For now, return false as placeholder
  return false;
}

/**
 * Helper function to verify MFA token
 */
export async function verifyMFAToken(
  userId: string,
  token: string
): Promise<boolean> {
  // This would integrate with Clerk's MFA verification
  // For now, return false as placeholder
  return false;
}

/**
 * Security audit log
 */
export interface SecurityAuditLog {
  timestamp: number;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  reason?: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  request: NextRequest,
  event: Partial<SecurityAuditLog>
): Promise<void> {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  const log: SecurityAuditLog = {
    timestamp: Date.now(),
    ipAddress,
    userAgent,
    action: 'unknown',
    resource: request.nextUrl.pathname,
    result: 'success',
    ...event,
  };
  
  // In production, send to logging service
  console.log('[SECURITY AUDIT]', log);
  
  // Could also store in database or send to SIEM
}