
import crypto from 'node:crypto';

console.log('=== UPAY NGO Secure Key Generator ===\n');

// FIELD_ENCRYPTION_KEY: exactly 64 hex characters (32 bytes)
const fieldEncryptionKey = crypto.randomBytes(32).toString('hex');
console.log('FIELD_ENCRYPTION_KEY=' + fieldEncryptionKey);

// JWT_SECRET, SESSION_SECRET, HMAC_SECRET: at least 32 characters
const jwtSecret = crypto.randomBytes(48).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

const sessionSecret = crypto.randomBytes(48).toString('hex');
console.log('SESSION_SECRET=' + sessionSecret);

const hmacSecret = crypto.randomBytes(48).toString('hex');
console.log('HMAC_SECRET=' + hmacSecret);

console.log('\n✅ Keys generated! Copy these into your .env file!');
