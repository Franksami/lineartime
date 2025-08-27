import crypto from 'node:crypto';

/**
 * Generate HMAC signature for webhook verification
 */
export function generateHMACSignature(payload: string | Buffer, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

/**
 * Verify HMAC signature from webhook
 */
export function verifyHMACSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateHMACSignature(payload, secret);

  // Use timingSafeEqual to prevent timing attacks
  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

/**
 * Generate a secure webhook token
 */
export function generateWebhookToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a webhook secret for HMAC signing
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Create a webhook verification token with expiry
 */
export function createWebhookVerificationToken(
  userId: string,
  provider: string,
  expiresInMs: number = 5 * 60 * 1000 // 5 minutes default
): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + expiresInMs;
  const data = `${userId}:${provider}:${expiresAt}`;
  const token = generateHMACSignature(data, process.env.WEBHOOK_SECRET || 'default-secret');

  return {
    token,
    expiresAt,
  };
}

/**
 * Verify a webhook verification token
 */
export function verifyWebhookVerificationToken(
  token: string,
  userId: string,
  provider: string,
  expiresAt: number
): boolean {
  const data = `${userId}:${provider}:${expiresAt}`;
  const expectedToken = generateHMACSignature(data, process.env.WEBHOOK_SECRET || 'default-secret');

  // Check if token matches
  if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
    return false;
  }

  // Check if token has expired
  if (Date.now() > expiresAt) {
    return false;
  }

  return true;
}
