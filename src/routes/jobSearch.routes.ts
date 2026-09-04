import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../lib/asyncHandler';
import { searchJobsController } from '../controllers/jobSearchController';

export const jobSearchRouter = Router();

jobSearchRouter.use(requireAuth);
jobSearchRouter.get('/search', asyncHandler(searchJobsController));