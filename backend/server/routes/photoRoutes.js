import { Router } from 'express';
import * as photoController from '../controllers/photoController.js';

export const photoRouter = Router();

photoRouter.get('/', photoController.index);
photoRouter.post('/upload', photoController.upload);
