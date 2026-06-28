import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

// Helper to safely extract and prepare keys
function prepareHexKey(input, requiredLength) {
  if (!input) {
    throw new Error(`Required environment variable missing`);
  }
  
  // First, hash the input to get consistent, clean hex
  const hash = crypto.createHash('sha512').update(input).digest('hex');
  // Take first N characters from the hash (N is requiredLength)
  return hash.slice(0, requiredLength);
}

function getKey() {
  const KEY_INPUT = process.env.FIELD_ENCRYPTION_KEY;
  // Extract exactly 64 hex characters (first 32 bytes of hash)
  const keyHex = prepareHexKey(KEY_INPUT, 64);
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypts a string value using AES-256-GCM.
 * Returns a colon-delimited string: iv:authTag:ciphertext (all hex).
 */
export function encrypt(text) {
  if (!text) return text;
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a value previously encrypted with encrypt().
 * Returns the original string, or the value as-is if not in encrypted format.
 */
export function decrypt(stored) {
  if (!stored || typeof stored !== 'string') return stored;
  const parts = stored.split(':');
  if (parts.length !== 3) return stored; // not encrypted format, return as-is
  try {
    const key = getKey();
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString('utf8');
  } catch {
    return stored; // return raw if decryption fails (e.g. legacy plaintext data)
  }
}

/**
 * HMAC-SHA256 blind index — deterministic, used for encrypted field lookups.
 * e.g. look up encrypted email by storing and querying this hash.
 */
export function hmacIndex(value) {
  if (!value) return '';
  const HMAC_INPUT = process.env.HMAC_SECRET;
  if (!HMAC_INPUT) {
    throw new Error('HMAC_SECRET is required');
  }
  // Hash input and take first 64 chars (32 bytes) for HMAC key
  const hmacKey = prepareHexKey(HMAC_INPUT, 64);
  return crypto.createHmac('sha256', hmacKey).update(String(value).toLowerCase().trim()).digest('hex');
}
