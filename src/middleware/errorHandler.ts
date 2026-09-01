import type { Request, Response, NextFunction } from 'express';

// Middleware de errores de Express: se reconoce automaticamente por tener
// 4 argumentos. Cualquier error que llegue aqui (via next(err)) se registra
// y se responde de forma controlada, en vez de dejar que tumbe el servidor.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}