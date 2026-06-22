import { Router } from 'express';
import * as classController from '../controllers/classController.js';

export const classRouter = Router();

classRouter.get('/', classController.index);
classRouter.post('/', classController.create);
classRouter.put('/:id', classController.update);
classRouter.patch('/:id/archive', classController.archive);
classRouter.delete('/:id', classController.remove);
