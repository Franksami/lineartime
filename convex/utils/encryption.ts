"use node";

/**
 * Convex-compatible encryption utilities
 * Uses Node.js crypto module in Convex Node.js runtime
 */

import crypto from 'crypto';

export interface EncryptedToken {
  encrypted: string;
  iv: string;
  tag: string;
}

const algorithm = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  
  return Buffer.from(keyHex, 'hex');
}

export function decryptToken(encryptedData: EncryptedToken): string {
  try {
    const key = getEncryptionKey();
    
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
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Failed to decrypt token');
  }
}

export function encryptToken(token: string): EncryptedToken {
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
    console.error('Token encryption failed:', error);
    throw new Error('Failed to encrypt token');
  }
}
