import crypto from 'node:crypto';
import https from 'node:https';

export function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
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
    req.write(postData);
    req.end();
  });
}
