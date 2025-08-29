/**
 * API Rate Limiting Middleware for Command Center Calendar
 *
 * Comprehensive rate limiting solution with multiple strategies,
 * in-memory storage, and optional database persistence.
 *
 * @see https://owasp.org/www-community/controls/Rate_Limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface RateLimitConfig {
  strategy: 'fixed-window' | 'sliding-window' | 'token-bucket' | 'leaky-bucket';
  limit: number;
  window: number; // in milliseconds
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  customKeyGenerator?: (req: NextRequest) => string;
  onLimitReached?: (req: NextRequest, identifier: string) => void;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
  tokens?: number;
  lastRefill?: number;
}

interface TokenBucketEntry extends RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

// ============================================================================
// RATE LIMIT STORE
// ============================================================================

class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, value: RateLimitEntry): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Global store instance
const globalStore = new RateLimitStore();

// ============================================================================
// RATE LIMITING STRATEGIES
// ============================================================================

/**
 * Fixed Window Rate Limiting
 * Resets count at fixed intervals
 */
function fixedWindowStrategy(
  identifier: string,
  config: RateLimitConfig,
  store: RateLimitStore
): RateLimitResult {
  const now = Date.now();
  const windowStart = Math.floor(now / config.window) * config.window;
  const windowEnd = windowStart + config.window;

  const key = `${config.keyPrefix}:${identifier}`;
  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: windowEnd,
    };
  }

  entry.count++;
  store.set(key, entry);

  const success = entry.count <= config.limit;
  const remaining = Math.max(0, config.limit - entry.count);

  return {
    success,
    limit: config.limit,
    remaining,
    reset: entry.resetAt,
    retryAfter: success ? undefined : Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Sliding Window Rate Limiting
 * More accurate than fixed window, prevents burst at window boundaries
 */
function slidingWindowStrategy(
  identifier: string,
  config: RateLimitConfig,
  store: RateLimitStore
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.window;

  const key = `${config.keyPrefix}:${identifier}:sliding`;
  const timestamps = `${key}:timestamps`;

  // Get existing timestamps
  let timestampEntry = (store.get(timestamps) as any) || { timestamps: [] };

  // Remove expired timestamps
  timestampEntry.timestamps = timestampEntry.timestamps.filter((ts: number) => ts > windowStart);

  // Add current timestamp
  timestampEntry.timestamps.push(now);

  // Update store
  store.set(timestamps, {
    ...timestampEntry,
    count: timestampEntry.timestamps.length,
    resetAt: now + config.window,
  });

  const count = timestampEntry.timestamps.length;
  const success = count <= config.limit;
  const remaining = Math.max(0, config.limit - count);

  // Calculate when the oldest request will expire
  const oldestTimestamp = timestampEntry.timestamps[0] || now;
  const reset = oldestTimestamp + config.window;

  return {
    success,
    limit: config.limit,
    remaining,
    reset,
    retryAfter: success ? undefined : Math.ceil((reset - now) / 1000),
  };
}

/**
 * Token Bucket Rate Limiting
 * Allows burst traffic while maintaining average rate
 */
function tokenBucketStrategy(
  identifier: string,
  config: RateLimitConfig,
  store: RateLimitStore
): RateLimitResult {
  const now = Date.now();
  const refillRate = config.limit / config.window; // tokens per millisecond
  const key = `${config.keyPrefix}:${identifier}:bucket`;

  let entry = store.get(key) as TokenBucketEntry;

  if (!entry) {
    entry = {
      count: 0,
      tokens: config.limit,
      lastRefill: now,
      resetAt: now + config.window,
    };
  } else {
    // Calculate tokens to add based on time passed
    const timePassed = now - entry.lastRefill;
    const tokensToAdd = timePassed * refillRate;
    entry.tokens = Math.min(config.limit, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
  }

  // Try to consume a token
  const success = entry.tokens >= 1;
  if (success) {
    entry.tokens -= 1;
    entry.count++;
  }

  store.set(key, entry);

  // Calculate when a token will be available
  const timeToNextToken = success ? 0 : 1 / refillRate;
  const reset = now + timeToNextToken;

  return {
    success,
    limit: config.limit,
    remaining: Math.floor(entry.tokens),
    reset,
    retryAfter: success ? undefined : Math.ceil(timeToNextToken / 1000),
  };
}

/**
 * Leaky Bucket Rate Limiting
 * Smooths out bursts, processes requests at constant rate
 */
function leakyBucketStrategy(
  identifier: string,
  config: RateLimitConfig,
  store: RateLimitStore
): RateLimitResult {
  const now = Date.now();
  const leakRate = config.window / config.limit; // milliseconds per request
  const key = `${config.keyPrefix}:${identifier}:leaky`;

  let entry = store.get(key) as any;

  if (!entry) {
    entry = {
      count: 0,
      queue: [],
      lastLeak: now,
      resetAt: now + config.window,
    };
  } else {
    // Calculate how many requests have leaked
    const timePassed = now - entry.lastLeak;
    const requestsLeaked = Math.floor(timePassed / leakRate);

    // Remove leaked requests from queue
    entry.queue = entry.queue.slice(requestsLeaked);
    entry.lastLeak = now - (timePassed % leakRate);
  }

  // Try to add request to queue
  const success = entry.queue.length < config.limit;
  if (success) {
    entry.queue.push(now);
    entry.count++;
  }

  store.set(key, entry);

  // Calculate when next spot will be available
  const timeToNextLeak = success ? 0 : leakRate - (now - entry.lastLeak);
  const reset = now + timeToNextLeak;

  return {
    success,
    limit: config.limit,
    remaining: Math.max(0, config.limit - entry.queue.length),
    reset,
    retryAfter: success ? undefined : Math.ceil(timeToNextLeak / 1000),
  };
}

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyPrefix: '@lineartime/ratelimit',
      ...config,
    };
    this.store = globalStore;
  }

  /**
   * Check if request is allowed
   */
  async limit(identifier: string): Promise<RateLimitResult> {
    let result: RateLimitResult;

    switch (this.config.strategy) {
      case 'sliding-window':
        result = slidingWindowStrategy(identifier, this.config, this.store);
        break;
      case 'token-bucket':
        result = tokenBucketStrategy(identifier, this.config, this.store);
        break;
      case 'leaky-bucket':
        result = leakyBucketStrategy(identifier, this.config, this.store);
        break;
      case 'fixed-window':
      default:
        result = fixedWindowStrategy(identifier, this.config, this.store);
        break;
    }

    // Call hook if limit reached
    if (!result.success && this.config.onLimitReached) {
      this.config.onLimitReached({} as NextRequest, identifier);
    }

    return result;
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    const key = `${this.config.keyPrefix}:${identifier}`;
    this.store.delete(key);
    this.store.delete(`${key}:sliding`);
    this.store.delete(`${key}:bucket`);
    this.store.delete(`${key}:leaky`);
    this.store.delete(`${key}:timestamps`);
  }
}

// ============================================================================
// MIDDLEWARE HELPERS
// ============================================================================

/**
 * Get client identifier from request
 */
export function getClientIdentifier(req: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || real || '127.0.0.1';

  // Include authenticated user if available
  const userId = req.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }

  // Include API key if available
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    return `api:${apiKey}`;
  }

  return `ip:${ip}`;
}

/**
 * Apply rate limit headers to response
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());

  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }

  return response;
}

// ============================================================================
// PRE-CONFIGURED RATE LIMITERS
// ============================================================================

// API Rate Limiter - General API endpoints
export const apiRateLimiter = new RateLimiter({
  strategy: 'sliding-window',
  limit: 100,
  window: 60000, // 100 requests per minute
  keyPrefix: 'api',
});

// Auth Rate Limiter - Login/signup endpoints
export const authRateLimiter = new RateLimiter({
  strategy: 'fixed-window',
  limit: 5,
  window: 300000, // 5 attempts per 5 minutes
  keyPrefix: 'auth',
  onLimitReached: (_req, identifier) => {
    console.warn(`Auth rate limit reached for ${identifier}`);
  },
});

// Upload Rate Limiter - File upload endpoints
export const uploadRateLimiter = new RateLimiter({
  strategy: 'token-bucket',
  limit: 10,
  window: 3600000, // 10 uploads per hour with burst capability
  keyPrefix: 'upload',
});

// Webhook Rate Limiter - Webhook endpoints
export const webhookRateLimiter = new RateLimiter({
  strategy: 'leaky-bucket',
  limit: 1000,
  window: 60000, // 1000 requests per minute, smoothed
  keyPrefix: 'webhook',
});

// ============================================================================
// NEXT.JS MIDDLEWARE
// ============================================================================

/**
 * Rate limiting middleware for Next.js
 */
export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | undefined> {
  const pathname = request.nextUrl.pathname;

  // Select appropriate rate limiter based on endpoint
  let limiter: RateLimiter;
  if (pathname.startsWith('/api/auth/')) {
    limiter = authRateLimiter;
  } else if (pathname.startsWith('/api/upload/')) {
    limiter = uploadRateLimiter;
  } else if (pathname.startsWith('/api/webhooks/')) {
    limiter = webhookRateLimiter;
  } else if (pathname.startsWith('/api/')) {
    limiter = apiRateLimiter;
  } else {
    // No rate limiting for non-API routes
    return undefined;
  }

  // Get client identifier
  const identifier = getClientIdentifier(request);

  // Check rate limit
  const result = await limiter.limit(identifier);

  if (!result.success) {
    // Create rate limit error response
    const response = NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter,
      },
      { status: 429 }
    );

    // Apply rate limit headers
    return applyRateLimitHeaders(response, result);
  }

  // Continue to next middleware
  return undefined;
}

// ============================================================================
// RATE LIMIT REPORT
// ============================================================================

/**
 * Generate rate limit status report
 * ASCII visualization of current rate limits
 */
export function generateRateLimitReport(): string {
  const now = Date.now();
  const endpoints = [
    { name: 'API', limiter: apiRateLimiter, path: '/api/*' },
    { name: 'Auth', limiter: authRateLimiter, path: '/api/auth/*' },
    { name: 'Upload', limiter: uploadRateLimiter, path: '/api/upload/*' },
    { name: 'Webhook', limiter: webhookRateLimiter, path: '/api/webhooks/*' },
  ];

  let report = `
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RATE LIMIT STATUS REPORT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Generated: ${new Date(now).toISOString()}                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ENDPOINT      │  STRATEGY        │  LIMIT     │  WINDOW    │  PATH          │
├─────────────────────────────────────────────────────────────────────────────┤
`;

  for (const endpoint of endpoints) {
    const config = (endpoint.limiter as any).config;
    const windowSeconds = config.window / 1000;
    const windowDisplay = windowSeconds >= 60 ? `${windowSeconds / 60}min` : `${windowSeconds}s`;

    report += `│  ${endpoint.name.padEnd(13)} │  ${config.strategy.padEnd(15)} │  ${config.limit.toString().padEnd(9)} │  ${windowDisplay.padEnd(9)} │  ${endpoint.path.padEnd(13)} │\n`;
  }

  report += `├─────────────────────────────────────────────────────────────────────────────┤\n`;
  report += `│  RATE LIMITING STRATEGIES:                                                   │\n`;
  report += `│  • Fixed Window: Simple, resets at intervals                                 │\n`;
  report += `│  • Sliding Window: Accurate, prevents boundary bursts                        │\n`;
  report += `│  • Token Bucket: Allows bursts, maintains average                            │\n`;
  report += `│  • Leaky Bucket: Smooths traffic, constant processing rate                   │\n`;
  report += `└─────────────────────────────────────────────────────────────────────────────┘`;

  return report;
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  RateLimiter,
  apiRateLimiter,
  authRateLimiter,
  uploadRateLimiter,
  webhookRateLimiter,
  rateLimitMiddleware,
  getClientIdentifier,
  applyRateLimitHeaders,
  generateRateLimitReport,
};
