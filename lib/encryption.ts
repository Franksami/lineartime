import crypto from 'crypto';

/**
 * Encryption service for secure token storage
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    
    // Ensure key is 32 bytes (256 bits) for AES-256
    if (keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    
    this.key = Buffer.from(keyHex, 'hex');
  }

  /**
   * Encrypts a string using AES-256-GCM
   * @param text The plain text to encrypt
   * @returns Object containing encrypted text, IV, and auth tag
   */
  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypts a string encrypted with AES-256-GCM
   * @param encrypted The encrypted text in hex format
   * @param iv The initialization vector in hex format
   * @param tag The authentication tag in hex format
   * @returns The decrypted plain text
   */
  decrypt(encrypted: string, iv: string, tag: string): string {
    // Create decipher
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    
    // Set the authentication tag
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Encrypts an object by JSON stringifying it first
   * @param obj The object to encrypt
   * @returns Encrypted data with metadata
   */
  encryptObject<T>(obj: T): { encrypted: string; iv: string; tag: string } {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * Decrypts and parses a JSON object
   * @param encrypted The encrypted text
   * @param iv The initialization vector
   * @param tag The authentication tag
   * @returns The decrypted and parsed object
   */
  decryptObject<T>(encrypted: string, iv: string, tag: string): T {
    const decrypted = this.decrypt(encrypted, iv, tag);
    return JSON.parse(decrypted) as T;
  }

  /**
   * Generates a secure random encryption key
   * @returns A 256-bit key as a hex string
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export a singleton instance
let encryptionService: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    encryptionService = new EncryptionService();
  }
  return encryptionService;
}

// Helper functions for token encryption
export interface EncryptedToken {
  encrypted: string;
  iv: string;
  tag: string;
}

export function encryptToken(token: string): EncryptedToken {
  return getEncryptionService().encrypt(token);
}

export function decryptToken(encryptedData: EncryptedToken): string {
  return getEncryptionService().decrypt(
    encryptedData.encrypted,
    encryptedData.iv,
    encryptedData.tag
  );
}