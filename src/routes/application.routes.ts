import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../lib/asyncHandler';
import {
  listApplications,
  createApplication,
  getApplication,
  updateApplication,
  deleteApplication,
  generateDocument,
  listDocuments,
} from '../controllers/applicationController';

export const applicationRouter = Router();

applicationRouter.use(requireAuth);
applicationRouter.get('/', asyncHandler(listApplications));
applicationRouter.post('/', asyncHandler(createApplication));
applicationRouter.get('/:id', asyncHandler(getApplication));
applicationRouter.patch('/:id', asyncHandler(updateApplication));
applicationRouter.delete('/:id', asyncHandler(deleteApplication));
applicationRouter.post('/:id/generate', asyncHandler(generateDocument));
applicationRouter.get('/:id/documents', asyncHandler(listDocuments));