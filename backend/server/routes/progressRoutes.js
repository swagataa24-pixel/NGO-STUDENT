import { Router } from 'express';
import * as progressController from '../controllers/progressController.js';

export const progressRouter = Router();

progressRouter.get('/:studentId', progressController.index);
progressRouter.post('/:studentId', progressController.create);
