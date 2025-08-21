/**
 * Rate Limiter - Token bucket algorithm implementation
 * Protects API endpoints from abuse and DDoS attacks
 */

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  limit: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Identifier extraction function
   */
  keyGenerator?: (req: NextRequest) => string;
  
  /**
   * Skip rate limiting for certain conditions
   */
  skip?: (req: NextRequest) => boolean;
  
  /**
   * Custom error message
   */
  message?: string;
  
  /**
   * Custom status code for rate limit errors
   */
  statusCode?: number;
  
  /**
   * Enable distributed rate limiting (requires Redis)
   */
  distributed?: boolean;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  requests: number[];
}

/**
 * In-memory store for rate limiting
 * In production, use Redis for distributed rate limiting
 */
class RateLimitStore {
  private store: Map<string, TokenBucket> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }
  
  /**
   * Get or create a token bucket for a key
   */
  getBucket(key: string, limit: number): TokenBucket {
    const existing = this.store.get(key);
    if (existing) {
      return existing;
    }
    
    const bucket: TokenBucket = {
      tokens: limit,
      lastRefill: Date.now(),
      requests: [],
    };
    
    this.store.set(key, bucket);
    return bucket;
  }
  
  /**
   * Consume a token from the bucket
   */
  consume(key: string, limit: number, windowMs: number): boolean {
    const bucket = this.getBucket(key, limit);
    const now = Date.now();
    
    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor((timePassed / windowMs) * limit);
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
    
    // Clean old requests
    bucket.requests = bucket.requests.filter(
      timestamp => now - timestamp < windowMs
    );
    
    // Check sliding window
    if (bucket.requests.length >= limit) {
      return false;
    }
    
    // Check token bucket
    if (bucket.tokens <= 0) {
      return false;
    }
    
    // Consume token
    bucket.tokens--;
    bucket.requests.push(now);
    
    return true;
  }
  
  /**
   * Get remaining tokens for a key
   */
  getRemaining(key: string, limit: number, windowMs: number): number {
    const bucket = this.store.get(key);
    if (!bucket) {
      return limit;
    }
    
    const now = Date.now();
    
    // Clean old requests
    bucket.requests = bucket.requests.filter(
      timestamp => now - timestamp < windowMs
    );
    
    return Math.max(0, limit - bucket.requests.length);
  }
  
  /**
   * Get reset time for a key
   */
  getResetTime(key: string, windowMs: number): Date {
    const bucket = this.store.get(key);
    if (!bucket || bucket.requests.length === 0) {
      return new Date(Date.now() + windowMs);
    }
    
    const oldestRequest = Math.min(...bucket.requests);
    return new Date(oldestRequest + windowMs);
  }
  
  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [key, bucket] of this.store.entries()) {
      if (now - bucket.lastRefill > maxAge && bucket.requests.length === 0) {
        this.store.delete(key);
      }
    }
  }
  
  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }
  
  /**
   * Destroy the store
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Global store instance
const globalStore = new RateLimitStore();

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(req: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');
  const cloudflare = req.headers.get('cf-connecting-ip');
  
  const ip = cloudflare || real || forwarded?.split(',')[0] || 'unknown';
  
  // Include path for more granular limiting
  const path = new URL(req.url).pathname;
  
  return `${ip}:${path}`;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  const {
    limit,
    windowMs,
    keyGenerator = defaultKeyGenerator,
    skip,
  } = config;
  
  // Check if should skip
  if (skip && skip(req)) {
    return {
      success: true,
      limit,
      remaining: limit,
      reset: new Date(Date.now() + windowMs),
    };
  }
  
  // Generate key
  const key = keyGenerator(req);
  
  // Check rate limit
  const success = globalStore.consume(key, limit, windowMs);
  const remaining = globalStore.getRemaining(key, limit, windowMs);
  const reset = globalStore.getResetTime(key, windowMs);
  
  const result: RateLimitResult = {
    success,
    limit,
    remaining,
    reset,
  };
  
  if (!success) {
    result.retryAfter = Math.ceil((reset.getTime() - Date.now()) / 1000);
  }
  
  return result;
}

/**
 * Rate limiter middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (req: NextRequest): RateLimitResult => {
    return checkRateLimit(req, config);
  };
}

/**
 * Common rate limit configurations
 */
export const RateLimitConfigs = {
  // Strict rate limiting for auth endpoints
  auth: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts, please try again later',
  },
  
  // Standard API rate limiting
  api: {
    limit: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests, please try again later',
  },
  
  // Relaxed rate limiting for GET requests
  read: {
    limit: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests, please try again later',
  },
  
  // Strict rate limiting for write operations
  write: {
    limit: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many write operations, please try again later',
  },
  
  // Very strict for password reset, email verification
  sensitive: {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many attempts, please try again later',
  },
} as const;

/**
 * Rate limit response headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
    ...(result.retryAfter && {
      'Retry-After': result.retryAfter.toString(),
    }),
  };
}

/**
 * IP-based rate limiting with different limits per IP range
 */
export class IPRateLimiter {
  private configs: Map<string, RateLimitConfig> = new Map();
  
  /**
   * Add rate limit config for IP range
   */
  addRange(cidr: string, config: RateLimitConfig): void {
    this.configs.set(cidr, config);
  }
  
  /**
   * Check if IP matches CIDR range
   */
  private matchesCIDR(ip: string, cidr: string): boolean {
    // Simple implementation - in production use a proper CIDR matching library
    if (cidr === ip) return true;
    if (cidr.includes('/32')) {
      return cidr.replace('/32', '') === ip;
    }
    // Add more sophisticated CIDR matching as needed
    return false;
  }
  
  /**
   * Get config for IP
   */
  getConfig(ip: string): RateLimitConfig | null {
    for (const [cidr, config] of this.configs) {
      if (this.matchesCIDR(ip, cidr)) {
        return config;
      }
    }
    return null;
  }
}

/**
 * Distributed rate limiter interface (for Redis implementation)
 */
export interface DistributedRateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<boolean>;
  getRemaining(key: string, limit: number, windowMs: number): Promise<number>;
  getResetTime(key: string, windowMs: number): Promise<Date>;
  clear(): Promise<void>;
}