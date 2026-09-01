import type { ApplicationStatus, DocumentType } from '@prisma/client';

// Payload que viaja dentro del JWT. Nunca incluir datos sensibles aqui:
// el token va y viene en cada request y no esta cifrado, solo firmado.
export interface JwtPayload {
  userId: string;
  email: string;
}

// Express no sabe por defecto que adjuntamos el usuario autenticado al request.
// Este tipo extiende Request para que el resto del codigo tenga autocompletado.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface GenerateDocumentInput {
  docType: DocumentType;
}

export interface ApplicationInput {
  company: string;
  position: string;
  jobDescription: string;
  jobUrl?: string;
  status?: ApplicationStatus;
  appliedDate?: string;
  notes?: string;
}
