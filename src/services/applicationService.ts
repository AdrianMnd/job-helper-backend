import { prisma } from '../lib/prisma';
import type { ApplicationInput } from '../types';
import type { ApplicationStatus } from '@prisma/client';

export function listApplicationsByUser(userId: string) {
  return prisma.application.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export function getApplicationForUser(userId: string, id: string) {
  return prisma.application.findFirst({ where: { id, userId } });
}

export function createApplication(userId: string, input: ApplicationInput) {
  return prisma.application.create({
    data: {
      userId,
      company: input.company,
      position: input.position,
      jobDescription: input.jobDescription,
      jobUrl: input.jobUrl,
      notes: input.notes,
      appliedDate: input.appliedDate ? new Date(input.appliedDate) : undefined,
      // La fila inicial de status_history se crea junto a la candidatura,
      // asi el historial siempre empieza completo desde el primer estado.
      statusHistory: {
        create: { status: 'APPLIED' },
      },
    },
  });
}

interface UpdateApplicationInput extends Partial<ApplicationInput> {}

// Si la actualizacion incluye un cambio de status, escribe la nueva fila de
// historial en la MISMA transaccion que la actualizacion de la candidatura.
// Si solo actualizaramos una de las dos tablas y la otra fallara, el
// historial quedaria inconsistente con el estado real.
export async function updateApplication(
  userId: string,
  id: string,
  input: UpdateApplicationInput
) {
  const existing = await getApplicationForUser(userId, id);
  if (!existing) return null;

  const statusChanged = input.status && input.status !== existing.status;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id },
      data: {
        ...input,
        appliedDate: input.appliedDate ? new Date(input.appliedDate) : undefined,
      },
    });

    if (statusChanged) {
      await tx.statusHistory.create({
        data: { applicationId: id, status: input.status as ApplicationStatus },
      });
    }

    return updated;
  });
}

export async function deleteApplication(userId: string, id: string) {
  const existing = await getApplicationForUser(userId, id);
  if (!existing) return false;
  await prisma.application.delete({ where: { id } });
  return true;
}
