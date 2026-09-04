import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { profileRouter } from './routes/profile.routes';
import { applicationRouter } from './routes/application.routes';
import { errorHandler } from './middleware/errorHandler';
import { cronRouter } from './routes/cron.routes';
import { jobSearchRouter } from './routes/jobSearch.routes';

// Separado de index.ts para poder importar la app en tests (via Supertest)
// sin necesidad de levantar un puerto real con app.listen().
export function createApp() {
  const app = express();
  const allowedOrigins = env.corsOrigin.split(',').map((o) => o.trim());

  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/auth', authRouter);
  app.use('/profile', profileRouter);
  app.use('/applications', applicationRouter);
  app.use('/cron', cronRouter);
  app.use('/jobs', jobSearchRouter);
  app.use(errorHandler);

  return app;
}