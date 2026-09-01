import { PrismaClient } from '@prisma/client';

// Instancia unica de PrismaClient reutilizada en toda la app.
// Crear un cliente nuevo por request agotaria las conexiones a la BD.
export const prisma = new PrismaClient();
