import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../types';

// Deriva SIEMPRE el userId del JWT verificado, nunca de params/body/query.
// Este es el mismo principio que en Task Agent: si el userId pudiera venir
// del cliente, cualquiera podria pedir o modificar datos de otro usuario
// con solo cambiar un id en el request.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Falta el token de autenticacion' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido o caducado' });
  }
}
