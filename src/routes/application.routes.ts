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
  getApplicationHistory,
  extractJobFromImage,
  extractJobFromText,
  exportDocument 
} from '../controllers/applicationController';
import multer from 'multer';
import { getMetrics } from '../controllers/applicationController';

export const applicationRouter = Router();

applicationRouter.use(requireAuth);
applicationRouter.get('/', asyncHandler(listApplications));
applicationRouter.post('/', asyncHandler(createApplication));
// Guarda el archivo en memoria (no en disco) - solo lo necesitamos
// momentaneamente para pasarlo a Gemini como base64, no para persistirlo.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB, suficiente para una captura de pantalla
});

applicationRouter.post(
  '/extract-from-image',
  upload.single('image'),
  asyncHandler(extractJobFromImage)
);
applicationRouter.get('/metrics/summary', asyncHandler(getMetrics));
applicationRouter.post('/extract-from-text', asyncHandler(extractJobFromText));
applicationRouter.get('/:id', asyncHandler(getApplication));
applicationRouter.patch('/:id', asyncHandler(updateApplication));
applicationRouter.delete('/:id', asyncHandler(deleteApplication));
applicationRouter.post('/:id/generate', asyncHandler(generateDocument));
applicationRouter.get('/:id/documents', asyncHandler(listDocuments));
applicationRouter.get('/:id/history', asyncHandler(getApplicationHistory));
applicationRouter.get('/:id/documents/:documentId/export', asyncHandler(exportDocument));