import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { sendReminderEmail } from './emailService';
import type { ApplicationStatus } from '@prisma/client';

const ACTIVE_STATUSES: ApplicationStatus[] = ['APPLIED', 'INTERVIEW'];

export async function sendStaleApplicationReminders() {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - env.reminderDaysThreshold);

  const staleApplications = await prisma.application.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      updatedAt: { lt: thresholdDate },
    },
    include: { user: { select: { email: true } } },
  });

  const byUser = new Map<string, { email: string; items: { company: string; position: string; daysSinceChange: number }[] }>();

  for (const app of staleApplications) {
    const daysSinceChange = Math.floor((Date.now() - app.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    const entry = byUser.get(app.userId) ?? { email: app.user.email, items: [] };
    entry.items.push({ company: app.company, position: app.position, daysSinceChange });
    byUser.set(app.userId, entry);
  }

  let emailsSent = 0;
  for (const { email, items } of byUser.values()) {
    await sendReminderEmail(email, items);
    emailsSent++;
  }

  return { usersChecked: byUser.size, emailsSent, staleCount: staleApplications.length };
}