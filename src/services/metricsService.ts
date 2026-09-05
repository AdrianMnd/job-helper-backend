import { prisma } from '../lib/prisma';
import type { ApplicationStatus } from '@prisma/client';

export interface FunnelStage {
  status: ApplicationStatus;
  count: number;
}

export interface StageDuration {
  status: ApplicationStatus;
  averageDays: number | null;
}

export interface ProcessMetrics {
  totalApplications: number;
  currentStatusCounts: Record<string, number>;
  funnel: FunnelStage[];
  averageDaysInStage: StageDuration[];
}

const FUNNEL_ORDER: ApplicationStatus[] = ['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER'];

export async function getProcessMetrics(userId: string): Promise<ProcessMetrics> {
  const applications = await prisma.application.findMany({
    where: { userId },
    select: {
      id: true,
      status: true,
      statusHistory: { select: { status: true, changedAt: true }, orderBy: { changedAt: 'asc' } },
    },
  });

  const totalApplications = applications.length;

  const currentStatusCounts: Record<string, number> = {};
  for (const app of applications) {
    currentStatusCounts[app.status] = (currentStatusCounts[app.status] ?? 0) + 1;
  }

  // Funnel: cuantas candidaturas alcanzaron cada fase EN ALGUN MOMENTO,
  // no solo las que estan ahi ahora mismo.
  const funnel: FunnelStage[] = FUNNEL_ORDER.map((status) => ({
    status,
    count: applications.filter((app) => app.statusHistory.some((h) => h.status === status)).length,
  }));

  // Tiempo medio en cada fase: duracion entre un cambio de estado y el
  // siguiente. El ultimo tramo (fase actual, aun en curso) se excluye a
  // proposito - incluirlo sesgaria la media con datos incompletos.
  const durationsByStatus = new Map<string, number[]>();
  for (const app of applications) {
    const history = app.statusHistory;
    for (let i = 0; i < history.length - 1; i++) {
      const days =
        (history[i + 1].changedAt.getTime() - history[i].changedAt.getTime()) / (1000 * 60 * 60 * 24);
      const list = durationsByStatus.get(history[i].status) ?? [];
      list.push(days);
      durationsByStatus.set(history[i].status, list);
    }
  }

  const averageDaysInStage: StageDuration[] = FUNNEL_ORDER.map((status) => {
    const list = durationsByStatus.get(status);
    if (!list?.length) return { status, averageDays: null };
    return { status, averageDays: Math.round((list.reduce((s, d) => s + d, 0) / list.length) * 10) / 10 };
  });

  return { totalApplications, currentStatusCounts, funnel, averageDaysInStage };
}