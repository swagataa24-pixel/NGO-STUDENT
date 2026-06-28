import crypto from 'node:crypto';
import https from 'node:https';
import { httpError } from '../utils/httpError.js';

export function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const DATA_IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;

function validateDataImage(dataUrl) {
  const match = DATA_IMAGE_RE.exec(String(dataUrl || ''));
  if (!match) throw httpError(400, 'Only JPEG, PNG, and WebP image uploads are allowed.');
  const estimatedBytes = Math.floor((match[2].length * 3) / 4);
  if (estimatedBytes > MAX_IMAGE_BYTES) throw httpError(413, 'Image must be 6 MB or smaller.');
}

export function isApprovedCloudinaryUrl(value) {
  try {
    const url = new URL(value);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' && Boolean(cloudName) && url.pathname.startsWith(`/${cloudName}/image/upload/`);
  } catch {
    return false;
  }
}

function isApprovedLegacyImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'images.unsplash.com';
  } catch {
    return false;
  }
}

export async function storeTrustedImage(value) {
  if (isApprovedCloudinaryUrl(value) || isApprovedLegacyImageUrl(value)) return { url: value, publicId: '' };
  if (!isCloudinaryConfigured()) throw httpError(503, 'Secure image storage is not configured.');
  validateDataImage(value);
  try {
    return await uploadToCloudinary(value);
  } catch {
    throw httpError(502, 'The image could not be stored. Please try again.');
  }
}

export function buildCloudinaryStubUpload(payload = {}) {
  return {
    imageUrl: payload.imageUrl || payload.fileUrl || '',
    cloudinaryPublicId: payload.cloudinaryPublicId || '',
    caption: payload.caption || '',
    center: payload.center || '',
    className: payload.className || '',
    activity: payload.activity || '',
    uploadedBy: payload.uploadedBy || '',
    centerId: payload.centerId || '',
    activityDate: payload.activityDate || new Date(),
    relatedSessionId: payload.relatedSessionId || ''
  };
}

export function describeCloudinaryStatus() {
  return isCloudinaryConfigured() ? 'configured' : 'stub';
}

/**
 * Uploads a base64 image (Data URL) to Cloudinary using secure signed HTTP requests.
 * @param {string} base64Image - base64 string or Data URL
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadToCloudinary(base64Image) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials not configured.');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = `timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  const postData = JSON.stringify({
    file: base64Image,
    api_key: apiKey,
    timestamp: timestamp,
    signature: signature
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudinary.com',
      port: 443,
      path: `/v1_1/${cloudName}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode === 200) {
            resolve({
              url: parsed.secure_url,
              publicId: parsed.public_id
            });
          } else {
            reject(new Error(parsed.error ? parsed.error.message : 'Unknown Cloudinary error'));
          }
        } catch (e) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.setTimeout(20_000, () => req.destroy(new Error('Cloudinary upload timed out.')));
    req.write(postData);
    req.end();
  });
}
