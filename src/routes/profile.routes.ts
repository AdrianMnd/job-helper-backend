import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getProfile, updateProfile } from '../controllers/profileController';
import { asyncHandler } from '../lib/asyncHandler';

export const profileRouter = Router();

profileRouter.use(requireAuth);
profileRouter.get('/', asyncHandler(getProfile));
profileRouter.put('/', asyncHandler(updateProfile));