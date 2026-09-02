import { Router } from 'express';
import { requireCronSecret } from '../middleware/cronAuth';
import { asyncHandler } from '../lib/asyncHandler';
import { triggerReminders } from '../controllers/cronController';

export const cronRouter = Router();

cronRouter.post('/reminders', requireCronSecret, asyncHandler(triggerReminders));