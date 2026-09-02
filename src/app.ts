import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { profileRouter } from './routes/profile.routes';
import { applicationRouter } from './routes/application.routes';
import { errorHandler } from './middleware/errorHandler';
import { cronRouter } from './routes/cron.routes';

// Separado de index.ts para poder importar la app en tests (via Supertest)
// sin necesidad de levantar un puerto real con app.listen().
export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/auth', authRouter);
  app.use('/profile', profileRouter);
  app.use('/applications', applicationRouter);
  app.use('/cron', cronRouter);

  app.use(errorHandler);

  return app;
}