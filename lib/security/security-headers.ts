/**
 * Security Headers Configuration
 * Implements comprehensive security headers for the application
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  crossOriginEmbedderPolicy?: string;
  crossOriginOpenerPolicy?: string;
  crossOriginResourcePolicy?: string;
}

/**
 * Default Content Security Policy directives
 */
const DEFAULT_CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'", // Required for development
    'https://clerk.com',
    'https://*.clerk.accounts.dev',
    'https://challenges.cloudflare.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled components
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://img.clerk.com',
    'https://images.clerk.dev',
    'https://www.gravatar.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://clerk.com',
    'https://*.clerk.accounts.dev',
    'https://api.clerk.dev',
    'wss://*.clerk.accounts.dev',
    process.env.NEXT_PUBLIC_CONVEX_URL || '',
  ].filter(Boolean),
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'child-src': ["'self'"],
  'frame-src': [
    "'self'",
    'https://clerk.com',
    'https://*.clerk.accounts.dev',
  ],
  'worker-src': ["'self'", 'blob:'],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'manifest-src': ["'self'"],
  'upgrade-insecure-requests': [],
};

/**
 * Build Content Security Policy string
 */
function buildCSP(directives: Record<string, string[]> = DEFAULT_CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Get default security headers
 */
export function getDefaultSecurityHeaders(): SecurityHeadersConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    contentSecurityPolicy: buildCSP(
      isDevelopment
        ? {
            ...DEFAULT_CSP_DIRECTIVES,
            'script-src': [...DEFAULT_CSP_DIRECTIVES['script-src'], "'unsafe-eval'"],
          }
        : DEFAULT_CSP_DIRECTIVES
    ),
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', '),
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
  };
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = getDefaultSecurityHeaders()
): NextResponse {
  // Content Security Policy
  if (config.contentSecurityPolicy) {
    response.headers.set('Content-Security-Policy', config.contentSecurityPolicy);
  }

  // Strict Transport Security (HSTS)
  if (config.strictTransportSecurity) {
    response.headers.set('Strict-Transport-Security', config.strictTransportSecurity);
  }

  // X-Frame-Options
  if (config.xFrameOptions) {
    response.headers.set('X-Frame-Options', config.xFrameOptions);
  }

  // X-Content-Type-Options
  if (config.xContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', config.xContentTypeOptions);
  }

  // Referrer Policy
  if (config.referrerPolicy) {
    response.headers.set('Referrer-Policy', config.referrerPolicy);
  }

  // Permissions Policy
  if (config.permissionsPolicy) {
    response.headers.set('Permissions-Policy', config.permissionsPolicy);
  }

  // Cross-Origin Embedder Policy
  if (config.crossOriginEmbedderPolicy) {
    response.headers.set('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy);
  }

  // Cross-Origin Opener Policy
  if (config.crossOriginOpenerPolicy) {
    response.headers.set('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy);
  }

  // Cross-Origin Resource Policy
  if (config.crossOriginResourcePolicy) {
    response.headers.set('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy);
  }

  return response;
}

/**
 * Security headers middleware for Next.js
 */
export function securityHeadersMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

/**
 * Validate CSP for known issues
 */
export function validateCSP(csp: string): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check for unsafe-inline in production
  if (process.env.NODE_ENV === 'production') {
    if (csp.includes("'unsafe-inline'")) {
      warnings.push("CSP contains 'unsafe-inline' which is not recommended for production");
    }
    if (csp.includes("'unsafe-eval'")) {
      warnings.push("CSP contains 'unsafe-eval' which is not recommended for production");
    }
  }
  
  // Check for wildcards
  if (csp.includes('*') && !csp.includes('*.')) {
    warnings.push('CSP contains wildcard (*) which may be too permissive');
  }
  
  // Check for missing directives
  const requiredDirectives = ['default-src', 'script-src', 'style-src'];
  for (const directive of requiredDirectives) {
    if (!csp.includes(directive)) {
      warnings.push(`CSP missing recommended directive: ${directive}`);
    }
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Generate nonce for inline scripts
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Add nonce to CSP for inline scripts
 */
export function addNonceToCSP(csp: string, nonce: string): string {
  const scriptSrcRegex = /script-src([^;]*)/;
  const match = csp.match(scriptSrcRegex);
  
  if (match) {
    const updatedScriptSrc = `script-src${match[1]} 'nonce-${nonce}'`;
    return csp.replace(scriptSrcRegex, updatedScriptSrc);
  }
  
  return `${csp}; script-src 'nonce-${nonce}'`;
}