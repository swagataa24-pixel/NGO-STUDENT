import { Router } from 'express';
import * as volunteerController from '../controllers/volunteerController.js';

export const volunteerRouter = Router();

volunteerRouter.get('/', volunteerController.index);
volunteerRouter.post('/', volunteerController.create);
volunteerRouter.put('/:id', volunteerController.update);
