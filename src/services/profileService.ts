import { prisma } from '../lib/prisma';

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

// upsert (update-or-insert) porque el perfil es 1:1 con el usuario: la primera
// vez que guarda no existe fila todavia, las siguientes veces si.
export function upsertProfile(userId: string, data: UpsertProfileInput) {
  return prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}
