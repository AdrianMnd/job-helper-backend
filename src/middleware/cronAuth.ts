import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// Autenticacion simple para endpoints disparados por procesos automatizados
// (GitHub Actions), no por usuarios. Un secreto compartido en un header
// es suficiente aqui: no hay sesion de usuario que gestionar, solo
// verificar que quien llama conoce el secreto.
export function requireCronSecret(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-cron-secret'];
  if (secret !== env.cronSecret) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}