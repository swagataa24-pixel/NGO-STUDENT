
import crypto from 'node:crypto';

// Usage: node extract-keys.js "your-long-random-string-here"
const input = process.argv[2] || crypto.randomBytes(200).toString('hex'); // fallback to random

console.log('=== UPAY NGO Key Extractor ===\n');

// Hash the input to make it consistent and safe to extract from
const hash = crypto.createHash('sha512').update(input).digest('hex');

console.log('Using input hash:', hash, '\n');

// Extract exactly what we need
// FIELD_ENCRYPTION_KEY: first 64 chars (32 bytes) of hash
const fieldEncryptionKey = hash.slice(0, 64);
console.log('FIELD_ENCRYPTION_KEY=' + fieldEncryptionKey);

// JWT_SECRET, SESSION_SECRET, HMAC_SECRET: 96 chars each (48 bytes)
const jwtSecret = hash.slice(0, 96);
console.log('JWT_SECRET=' + jwtSecret);

const sessionSecret = hash.slice(64, 160);
console.log('SESSION_SECRET=' + sessionSecret);

const hmacSecret = hash.slice(96);
console.log('HMAC_SECRET=' + hmacSecret);

console.log('\n✅ Keys extracted! Copy these into your .env file!');
