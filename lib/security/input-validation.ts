/**
 * Input Validation and Sanitization for Command Center Calendar
 *
 * Comprehensive input validation based on OWASP best practices.
 * Prevents XSS, SQL injection, and other injection attacks.
 *
 * @see https://owasp.org/www-project-top-ten/
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  errors?: ValidationError[];
  sanitized?: T;
}

export interface ValidationError {
  field: string;
  message: string;
  rule: string;
  value?: any;
}

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  stripTags?: boolean;
  escapeHtml?: boolean;
  maxLength?: number;
  trim?: boolean;
}

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

/**
 * Email validation schema
 * RFC 5322 compliant email validation
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .toLowerCase()
  .trim();

/**
 * Password validation schema
 * OWASP compliant password requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  );

/**
 * Username validation schema
 * Alphanumeric with limited special characters
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username too long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

/**
 * URL validation schema
 * Safe URL validation to prevent open redirects
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      // Only allow HTTP(S) protocols
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'Only HTTP(S) URLs are allowed');

/**
 * Phone number validation schema
 * International phone number format
 */
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

/**
 * Date validation schema
 * ISO 8601 date format
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date');

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * JSON validation schema
 */
export const jsonSchema = z.string().refine((str) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}, 'Invalid JSON format');

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize HTML input
 * Removes dangerous HTML and JavaScript
 */
export function sanitizeHtml(input: string, options: SanitizationOptions = {}): string {
  const {
    allowedTags,
    allowedAttributes,
    stripTags = false,
    escapeHtml = false,
    maxLength,
    trim = true,
  } = options;

  let sanitized = input;

  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Apply max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Strip all HTML tags
  if (stripTags) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  // Escape HTML
  else if (escapeHtml) {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  // Use DOMPurify for safe HTML
  else {
    const config: any = {};

    if (allowedTags) {
      config.ALLOWED_TAGS = allowedTags;
    }

    if (allowedAttributes) {
      config.ALLOWED_ATTR = Object.keys(allowedAttributes);
      config.ALLOWED_ATTR_CONFIG = allowedAttributes;
    }

    sanitized = DOMPurify.sanitize(sanitized, config);
  }

  return sanitized;
}

/**
 * Sanitize SQL input
 * Prevents SQL injection attacks
 */
export function sanitizeSql(input: string): string {
  // Basic SQL injection prevention
  // In production, use parameterized queries instead
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comments
    .replace(/\*\//g, '') // Remove multi-line comments
    .replace(/xp_/gi, '') // Remove extended stored procedures
    .replace(/sp_/gi, ''); // Remove stored procedures
}

/**
 * Sanitize file path
 * Prevents path traversal attacks
 */
export function sanitizePath(input: string): string {
  // Remove path traversal attempts
  return input
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/^\/+/, '') // Remove leading slashes
    .replace(/\/+/g, '/') // Normalize multiple slashes
    .replace(/[^a-zA-Z0-9._\/-]/g, ''); // Allow only safe characters
}

/**
 * Sanitize filename
 * Prevents file upload attacks
 */
export function sanitizeFilename(input: string): string {
  // Extract filename from path
  const filename = input.split(/[/\\]/).pop() || '';

  // Remove dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars with underscore
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate input against schema
 * Returns typed and validated data
 */
export function validate<T>(input: unknown, schema: z.ZodSchema<T>): ValidationResult<T> {
  try {
    const data = schema.parse(input);
    return {
      valid: true,
      data,
      sanitized: data,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        rule: err.code,
        value: input,
      }));

      return {
        valid: false,
        errors,
      };
    }

    return {
      valid: false,
      errors: [
        {
          field: 'unknown',
          message: 'Validation failed',
          rule: 'unknown',
        },
      ],
    };
  }
}

/**
 * Validate multiple inputs
 * Batch validation with detailed errors
 */
export function validateBatch<T extends Record<string, unknown>>(
  inputs: T,
  schemas: Record<keyof T, z.ZodSchema>
): ValidationResult<T> {
  const errors: ValidationError[] = [];
  const sanitized: Partial<T> = {};

  for (const [key, value] of Object.entries(inputs)) {
    const schema = schemas[key as keyof T];
    if (!schema) continue;

    const result = validate(value, schema);
    if (result.valid) {
      sanitized[key as keyof T] = result.data;
    } else if (result.errors) {
      errors.push(
        ...result.errors.map((err) => ({
          ...err,
          field: `${key}.${err.field}`,
        }))
      );
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return {
    valid: true,
    data: sanitized as T,
    sanitized: sanitized as T,
  };
}

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}

  /**
   * Check if request is allowed
   */
  check(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || entry.resetAt < now) {
      // Create new entry or reset expired one
      this.limits.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || entry.resetAt < Date.now()) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.limits.delete(identifier);
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits) {
      if (entry.resetAt < now) {
        this.limits.delete(key);
      }
    }
  }
}

// Export rate limiter instances
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 req/min
export const authRateLimiter = new RateLimiter(5, 300000); // 5 attempts/5min
export const uploadRateLimiter = new RateLimiter(10, 3600000); // 10 uploads/hour

// ============================================================================
// SECURITY VALIDATION REPORT
// ============================================================================

/**
 * Generate security validation report
 * ASCII chart for visualization
 */
export function generateValidationReport(results: Record<string, ValidationResult>): string {
  let totalValid = 0;
  let totalInvalid = 0;
  let totalErrors = 0;

  for (const result of Object.values(results)) {
    if (result.valid) {
      totalValid++;
    } else {
      totalInvalid++;
      totalErrors += result.errors?.length || 0;
    }
  }

  const successRate =
    totalValid + totalInvalid > 0
      ? ((totalValid / (totalValid + totalInvalid)) * 100).toFixed(1)
      : '0.0';

  let report = `
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INPUT VALIDATION REPORT                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Total Validations: ${(totalValid + totalInvalid).toString().padEnd(10)} Success Rate: ${successRate}%                     │
│  Valid Inputs: ${totalValid.toString().padEnd(15)} Invalid Inputs: ${totalInvalid.toString().padEnd(10)}             │
│  Total Errors: ${totalErrors.toString().padEnd(58)}│
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  FIELD                    │  STATUS  │  ERRORS  │  DETAILS                   │
├─────────────────────────────────────────────────────────────────────────────┤
`;

  for (const [field, result] of Object.entries(results)) {
    const status = result.valid ? '✅' : '❌';
    const errorCount = result.errors?.length || 0;
    const firstError = result.errors?.[0]?.message || 'N/A';
    const displayError = firstError.length > 25 ? firstError.substring(0, 22) + '...' : firstError;

    report += `│  ${field.padEnd(24)} │    ${status}    │    ${errorCount.toString().padEnd(5)} │  ${displayError.padEnd(25)} │\n`;
  }

  report += `├─────────────────────────────────────────────────────────────────────────────┤\n`;

  if (totalInvalid > 0) {
    report += `│  TOP VALIDATION ISSUES:                                                      │\n`;

    // Collect all errors
    const allErrors: Record<string, number> = {};
    for (const result of Object.values(results)) {
      if (result.errors) {
        for (const error of result.errors) {
          allErrors[error.rule] = (allErrors[error.rule] || 0) + 1;
        }
      }
    }

    // Sort by frequency
    const topErrors = Object.entries(allErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    for (const [rule, count] of topErrors) {
      report +=
        `│  • ${rule}: ${count} occurrence(s)                                                    │\n`.substring(
          0,
          82
        ) + '│\n';
    }
  } else {
    report += `│  ✅ All inputs validated successfully!                                       │\n`;
  }

  report += `└─────────────────────────────────────────────────────────────────────────────┘`;

  return report;
}

// ============================================================================
// EXPORT FOR USAGE
// ============================================================================

export default {
  // Schemas
  emailSchema,
  passwordSchema,
  usernameSchema,
  urlSchema,
  phoneSchema,
  dateSchema,
  uuidSchema,
  jsonSchema,

  // Sanitization
  sanitizeHtml,
  sanitizeSql,
  sanitizePath,
  sanitizeFilename,

  // Validation
  validate,
  validateBatch,

  // Rate limiting
  apiRateLimiter,
  authRateLimiter,
  uploadRateLimiter,

  // Reporting
  generateValidationReport,
};
