import { httpError } from '../utils/httpError.js';
import { cloudinaryReady, createPhoto, listPhotos } from '../services/photoService.js';

export async function index(req, res, next) {
  try {
    res.json(await listPhotos(req.query));
  } catch (error) {
    next(error);
  }
}

export async function upload(req, res, next) {
  try {
    if (!req.body.imageUrl) throw httpError(400, 'imageUrl is required until Cloudinary streaming is connected.');
    const created = await createPhoto(req.body);
    res.status(201).json({
      message: cloudinaryReady() ? 'Photo uploaded and stored.' : 'Cloudinary is not configured. Saved as a local stub record.',
      photo: created
    });
  } catch (error) {
    next(error);
  }
}
