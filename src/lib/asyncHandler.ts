import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Express 4 no captura errores lanzados dentro de handlers async: una
// promesa rechazada sin capturar se convierte en una excepcion no
// controlada que tira abajo todo el proceso Node (como acaba de pasar
// con el fallo de Gemini). Este wrapper reenvia cualquier error a next(),
// que Express si sabe gestionar via el middleware de errores.
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}