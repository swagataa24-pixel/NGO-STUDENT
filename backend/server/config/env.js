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
  const required = [
    'MONGO_URI',
    'CLIENT_URL',
    'JWT_SECRET',
    'SESSION_SECRET',
    'FIELD_ENCRYPTION_KEY',
    'HMAC_SECRET'
  ];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (isProduction) {
    const prodRequired = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'];
    const prodMissing = prodRequired.filter((name) => !process.env[name]);

    if (prodMissing.length) {
      throw new Error(`Missing required production environment variables: ${prodMissing.join(', ')}`);
    }

    if (!/^https:\/\//.test(primaryClientUrl())) {
      throw new Error('CLIENT_URL must use HTTPS in production.');
    }
    if (!/^https:\/\//.test(process.env.GOOGLE_CALLBACK_URL)) {
      throw new Error('GOOGLE_CALLBACK_URL must use HTTPS in production.');
    }
  }
  
  // Only check that secrets are present; cryptoService handles extracting correct lengths
  // No strict length or format validation required anymore!
}
