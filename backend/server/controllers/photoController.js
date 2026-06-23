import { httpError } from '../utils/httpError.js';
import { cloudinaryReady, createPhoto, listPhotos, deletePhoto } from '../services/photoService.js';

export async function index(req, res, next) {
  try {
    res.json(await listPhotos(req.query, req.user));
  } catch (error) {
    next(error);
  }
}

export async function upload(req, res, next) {
  try {
    if (!req.body.imageUrl) throw httpError(400, 'imageUrl is required until Cloudinary streaming is connected.');
    const photoData = { ...req.body, uploadedBy: req.body.uploadedBy || req.user.name || req.user.email };
    const created = await createPhoto(photoData);
    res.status(201).json({
      message: cloudinaryReady() ? 'Photo uploaded and stored.' : 'Cloudinary is not configured. Saved as a local stub record.',
      photo: created
    });
  } catch (error) {
    next(error);
  }
}

export async function destroy(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) throw httpError(400, 'Photo ID is required.');
    const deleted = await deletePhoto(id);
    if (!deleted) throw httpError(404, 'Photo not found.');
    res.json({ message: 'Photo deleted successfully.', photo: deleted });
  } catch (error) {
    next(error);
  }
}
