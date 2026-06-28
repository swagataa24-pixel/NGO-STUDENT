import dotenv from 'dotenv';

dotenv.config();

export const isProduction = process.env.NODE_ENV === 'production';

export function envList(name) {
  return (process.env[name] || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function primaryClientUrl() {
  return envList('CLIENT_URL')[0] || 'http://localhost:5173';
}

export function validateProductionEnvironment() {
  if (!isProduction) return;

  const required = [
    'MONGO_URI',
    'CLIENT_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'JWT_SECRET',
    'SESSION_SECRET',
    'FIELD_ENCRYPTION_KEY',
    'HMAC_SECRET'
  ];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
  if (!/^https:\/\//.test(primaryClientUrl())) {
    throw new Error('CLIENT_URL must use HTTPS in production.');
  }
  if (!/^https:\/\//.test(process.env.GOOGLE_CALLBACK_URL)) {
    throw new Error('GOOGLE_CALLBACK_URL must use HTTPS in production.');
  }
  if (!/^[0-9a-fA-F]{64}$/.test(process.env.FIELD_ENCRYPTION_KEY)) {
    throw new Error('FIELD_ENCRYPTION_KEY must be exactly 64 hexadecimal characters.');
  }
  if (process.env.JWT_SECRET.length < 32 || process.env.SESSION_SECRET.length < 32 || process.env.HMAC_SECRET.length < 32) {
    throw new Error('JWT_SECRET, SESSION_SECRET, and HMAC_SECRET must each be at least 32 characters.');
  }
}
