export function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

export function buildCloudinaryStubUpload(payload = {}) {
  return {
    imageUrl: payload.imageUrl || payload.fileUrl || '',
    cloudinaryPublicId: payload.cloudinaryPublicId || '',
    caption: payload.caption || '',
    uploadedBy: payload.uploadedBy || '',
    centerId: payload.centerId || '',
    activityDate: payload.activityDate || new Date(),
    relatedSessionId: payload.relatedSessionId || ''
  };
}

export function describeCloudinaryStatus() {
  return isCloudinaryConfigured() ? 'configured' : 'stub';
}
