import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.FIELD_ENCRYPTION_KEY || '';
const HMAC_SECRET = process.env.HMAC_SECRET || 'dev-hmac-secret';

function getKey() {
  if (KEY_HEX && KEY_HEX.length === 64) {
    return Buffer.from(KEY_HEX, 'hex');
  }
  // Derive a consistent 32-byte key from a fallback passphrase (dev only)
  return crypto.scryptSync('upay-dev-key', 'upay-salt', 32);
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
  return crypto.createHmac('sha256', HMAC_SECRET).update(String(value).toLowerCase().trim()).digest('hex');
}
