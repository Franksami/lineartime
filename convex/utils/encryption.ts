"use node";

/**
 * Convex-compatible encryption utilities
 * Uses Node.js crypto module in Convex Node.js runtime
 * 
 * SECURITY: This module implements fail-fast behavior to prevent
 * silent failures or use of placeholder tokens in production.
 */

import crypto from 'crypto';

export interface EncryptedToken {
  encrypted: string;
  iv: string;
  tag: string;
}

const algorithm = 'aes-256-gcm';

// Detect environment - Convex runtime doesn't have NODE_ENV by default
const isProduction = process.env.CONVEX_DEPLOYMENT !== undefined || 
                     process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || 
                      process.env.NODE_ENV === 'test';

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  
  if (!keyHex) {
    const errorMsg = `ENCRYPTION_KEY environment variable is not set.
    
To fix this:
1. Generate a secure key: openssl rand -hex 32
2. Set the environment variable:
   - For Convex: npx convex env set ENCRYPTION_KEY <your-key>
   - For local dev: Add to .env.local file
3. Ensure the key is 64 hex characters (32 bytes)

See: /docs/SECURITY.md for detailed encryption setup instructions`;
    
    // Always fail fast when encryption key is missing
    throw new Error(errorMsg);
  }
  
  if (keyHex.length !== 64) {
    throw new Error(`ENCRYPTION_KEY must be 64 hex characters (32 bytes), got ${keyHex.length} characters`);
  }
  
  // Validate hex format
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error('ENCRYPTION_KEY must contain only valid hexadecimal characters');
  }
  
  return Buffer.from(keyHex, 'hex');
}

export function decryptToken(encryptedData: EncryptedToken): string {
  // Fail fast if encryption is not properly configured
  if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.tag) {
    throw new Error('Invalid encrypted data structure. Required fields: encrypted, iv, tag');
  }
  
  // Never return placeholder tokens - always fail fast
  if (encryptedData.encrypted === 'placeholder' || 
      encryptedData.encrypted === 'mock' || 
      encryptedData.encrypted === 'test') {
    throw new Error(`Placeholder tokens are not allowed in ${isProduction ? 'production' : 'this'} environment. 
Please provide properly encrypted tokens using encryptToken().
See: /convex/utils/encryption.ts for implementation details.`);
  }
  
  try {
    const key = getEncryptionKey();
    
    // Validate input format
    if (!/^[0-9a-fA-F]+$/.test(encryptedData.encrypted) ||
        !/^[0-9a-fA-F]+$/.test(encryptedData.iv) ||
        !/^[0-9a-fA-F]+$/.test(encryptedData.tag)) {
      throw new Error('Encrypted data must be in hexadecimal format');
    }
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    // Set the authentication tag
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    // Decrypt the text
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Validate decrypted token is not empty
    if (!decrypted || decrypted.trim() === '') {
      throw new Error('Decrypted token is empty');
    }
    
    return decrypted;
  } catch (error) {
    // Log error details in development only
    if (isDevelopment) {
      console.error('Token decryption failed:', error);
    }
    
    // Provide actionable error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to decrypt token: ${errorMessage}. 
Ensure the token was encrypted with the same ENCRYPTION_KEY.
See: /convex/utils/encryption.ts for troubleshooting.`);
  }
}

export function encryptToken(token: string): EncryptedToken {
  // Fail fast with clear error messages
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }
  
  if (token.trim() === '') {
    throw new Error('Token cannot be empty or whitespace only');
  }
  
  // Never allow placeholder tokens to be encrypted
  if (token === 'placeholder' || token === 'mock' || token === 'test-token') {
    throw new Error(`Cannot encrypt placeholder tokens. 
Please provide a real authentication token.
If you're testing, use a properly formatted test token or mock the encryption service.`);
  }
  
  try {
    const key = getEncryptionKey();
    
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    // Log error details in development only
    if (isDevelopment) {
      console.error('Token encryption failed:', error);
    }
    
    // Provide actionable error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to encrypt token: ${errorMessage}.
Ensure ENCRYPTION_KEY is properly configured.
To generate a key: openssl rand -hex 32
To set in Convex: npx convex env set ENCRYPTION_KEY <key>
See: /docs/SECURITY.md for detailed instructions.`);
  }
}
