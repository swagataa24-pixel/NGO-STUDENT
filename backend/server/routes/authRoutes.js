import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';

export const authRouter = Router();

authRouter.post('/google', authController.googleLogin);
authRouter.get('/google/callback', authController.googleCallback);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', requireAuth, authController.me);
