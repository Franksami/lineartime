/**
 * CSRF Protection - Double Submit Cookie pattern implementation
 * Protects against Cross-Site Request Forgery attacks
 */

import crypto from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

export interface CSRFConfig {
  /**
   * Secret key for token generation
   */
  secret: string;

  /**
   * Token lifetime in milliseconds
   */
  tokenLifetime?: number;

  /**
   * Cookie name for CSRF token
   */
  cookieName?: string;

  /**
   * Header name for CSRF token
   */
  headerName?: string;

  /**
   * Form field name for CSRF token
   */
  fieldName?: string;

  /**
   * Methods to protect
   */
  protectedMethods?: string[];

  /**
   * Paths to exclude from protection
   */
  excludePaths?: string[];

  /**
   * Enable SameSite cookie attribute
   */
  sameSite?: 'strict' | 'lax' | 'none';

  /**
   * Enable double submit cookie pattern
   */
  doubleSubmit?: boolean;
}

/**
 * Default CSRF configuration
 */
const DEFAULT_CONFIG: Partial<CSRFConfig> = {
  tokenLifetime: 3600000, // 1 hour
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  fieldName: '_csrf',
  protectedMethods: ['POST', 'PUT', 'DELETE', 'PATCH'],
  excludePaths: ['/api/webhooks'], // Webhook endpoints typically need to be excluded
  sameSite: 'strict',
  doubleSubmit: true,
};

/**
 * Token store for server-side validation
 * In production, use Redis or database
 */
class CSRFTokenStore {
  private tokens: Map<string, { token: string; expires: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired tokens every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  /**
   * Store a token
   */
  store(sessionId: string, token: string, lifetime: number): void {
    this.tokens.set(sessionId, {
      token,
      expires: Date.now() + lifetime,
    });
  }

  /**
   * Validate a token
   */
  validate(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);

    if (!stored) {
      return false;
    }

    if (stored.expires < Date.now()) {
      this.tokens.delete(sessionId);
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(stored.token), Buffer.from(token));
  }

  /**
   * Revoke a token
   */
  revoke(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  /**
   * Clean up expired tokens
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (data.expires < now) {
        this.tokens.delete(sessionId);
      }
    }
  }

  /**
   * Destroy the store
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.tokens.clear();
  }
}

// Global token store
const tokenStore = new CSRFTokenStore();

/**
 * Generate CSRF token
 */
export function generateCSRFToken(secret: string, sessionId?: string): string {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const data = `${timestamp}:${nonce}:${sessionId || ''}`;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const signature = hmac.digest('hex');

  return Buffer.from(`${data}:${signature}`).toString('base64');
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, secret: string, maxAge?: number): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length < 4) {
      return false;
    }

    const [timestamp, nonce, sessionId, signature] = parts;

    // Check token age if maxAge is specified
    if (maxAge) {
      const tokenAge = Date.now() - Number.parseInt(timestamp, 10);
      if (tokenAge > maxAge) {
        return false;
      }
    }

    // Verify signature
    const data = `${timestamp}:${nonce}:${sessionId}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    const expectedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

/**
 * Extract CSRF token from request
 */
export function extractCSRFToken(req: NextRequest, config: CSRFConfig): string | null {
  const { headerName, cookieName, fieldName } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Check header
  if (headerName) {
    const headerToken = req.headers.get(headerName);
    if (headerToken) {
      return headerToken;
    }
  }

  // Check cookie
  if (cookieName) {
    const cookieToken = req.cookies.get(cookieName)?.value;
    if (cookieToken) {
      return cookieToken;
    }
  }

  // Check body (for form submissions)
  // Note: This requires parsing the body which should be done carefully
  // to avoid consuming the stream multiple times

  return null;
}

/**
 * Check if path should be protected
 */
export function shouldProtectPath(path: string, excludePaths: string[] = []): boolean {
  for (const excludePath of excludePaths) {
    if (excludePath.endsWith('*')) {
      const prefix = excludePath.slice(0, -1);
      if (path.startsWith(prefix)) {
        return false;
      }
    } else if (path === excludePath) {
      return false;
    }
  }

  return true;
}

/**
 * CSRF protection middleware
 */
export async function csrfProtection(
  req: NextRequest,
  config: CSRFConfig
): Promise<{ valid: boolean; token?: string; error?: string }> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const { secret, protectedMethods, excludePaths, tokenLifetime, doubleSubmit } = fullConfig;

  const method = req.method;
  const path = new URL(req.url).pathname;

  // Check if method should be protected
  if (!protectedMethods?.includes(method)) {
    return { valid: true };
  }

  // Check if path should be excluded
  if (!shouldProtectPath(path, excludePaths)) {
    return { valid: true };
  }

  // Extract token from request
  const token = extractCSRFToken(req, fullConfig);

  if (!token) {
    return {
      valid: false,
      error: 'CSRF token not found',
    };
  }

  // Verify token
  const isValid = verifyCSRFToken(token, secret, tokenLifetime);

  if (!isValid) {
    return {
      valid: false,
      error: 'Invalid CSRF token',
    };
  }

  // Additional validation for double submit cookie pattern
  if (doubleSubmit) {
    const cookieToken = req.cookies.get(fullConfig.cookieName!)?.value;
    const headerToken = req.headers.get(fullConfig.headerName!);

    if (!cookieToken || !headerToken) {
      return {
        valid: false,
        error: 'Missing CSRF token in cookie or header',
      };
    }

    if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
      return {
        valid: false,
        error: 'CSRF token mismatch',
      };
    }
  }

  return { valid: true, token };
}

/**
 * Create CSRF token and set cookie
 */
export function createCSRFToken(
  response: NextResponse,
  config: CSRFConfig,
  sessionId?: string
): string {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const { secret, cookieName, sameSite, tokenLifetime } = fullConfig;

  const token = generateCSRFToken(secret, sessionId);

  // Store token server-side if session ID is provided
  if (sessionId) {
    tokenStore.store(sessionId, token, tokenLifetime!);
  }

  // Set cookie
  response.cookies.set({
    name: cookieName!,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: sameSite as any,
    path: '/',
    maxAge: tokenLifetime! / 1000, // Convert to seconds
  });

  return token;
}

/**
 * React hook helper for CSRF token
 */
export function getCSRFTokenForClient(config: CSRFConfig): {
  token: string;
  headerName: string;
  fieldName: string;
} {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const token = generateCSRFToken(config.secret);

  return {
    token,
    headerName: fullConfig.headerName!,
    fieldName: fullConfig.fieldName!,
  };
}

/**
 * Validate CSRF token from form data
 */
export async function validateFormCSRF(formData: FormData, config: CSRFConfig): Promise<boolean> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const token = formData.get(fullConfig.fieldName!) as string;

  if (!token) {
    return false;
  }

  return verifyCSRFToken(token, config.secret, fullConfig.tokenLifetime);
}

/**
 * CSRF token rotation
 */
export class CSRFTokenRotation {
  private currentToken: string;
  private previousToken: string | null = null;
  private rotationInterval: NodeJS.Timeout | null = null;

  constructor(
    private config: CSRFConfig,
    private rotationPeriod = 3600000 // 1 hour
  ) {
    this.currentToken = generateCSRFToken(config.secret);
    this.startRotation();
  }

  /**
   * Start automatic token rotation
   */
  private startRotation(): void {
    this.rotationInterval = setInterval(() => {
      this.rotate();
    }, this.rotationPeriod);
  }

  /**
   * Rotate tokens
   */
  rotate(): void {
    this.previousToken = this.currentToken;
    this.currentToken = generateCSRFToken(this.config.secret);
  }

  /**
   * Validate token (accepts current or previous)
   */
  validate(token: string): boolean {
    const currentValid = crypto.timingSafeEqual(Buffer.from(this.currentToken), Buffer.from(token));

    if (currentValid) {
      return true;
    }

    if (this.previousToken) {
      return crypto.timingSafeEqual(Buffer.from(this.previousToken), Buffer.from(token));
    }

    return false;
  }

  /**
   * Get current token
   */
  getToken(): string {
    return this.currentToken;
  }

  /**
   * Destroy rotation
   */
  destroy(): void {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }
}
