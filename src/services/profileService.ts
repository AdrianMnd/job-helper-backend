import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export function getProfileByUserId(userId: string) {
  return prisma.profile.findUnique({ where: { userId } });
}

interface UpsertProfileInput {
  fullName: string;
  summary?: string;
  experience?: unknown[];
  education?: unknown[];
  skills?: unknown[];
}

// Los campos experience/education/skills son JSON flexible por diseño (el
// frontend define su propia forma). Prisma exige tipos JSON estrictos para
// esa columna, asi que hacemos la conversion aqui, en el unico punto donde
// estos datos entran a la BD, en vez de tipar todo el backend contra el
// formato interno de Prisma.
export function upsertProfile(userId: string, data: UpsertProfileInput) {
  const jsonData = data as unknown as Omit<Prisma.ProfileUncheckedCreateInput, 'userId'>;
  return prisma.profile.upsert({
    where: { userId },
    create: { ...jsonData, userId },
    update: jsonData,
  });
}