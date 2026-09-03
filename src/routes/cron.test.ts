// routes/cron.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { env } from '../config/env';

vi.mock('../services/reminderService');
import { sendStaleApplicationReminders } from '../services/reminderService';

const app = createApp();

describe('POST /cron/reminders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza sin el secreto', async () => {
    const res = await request(app).post('/cron/reminders');
    expect(res.status).toBe(401);
  });

  it('rechaza con un secreto incorrecto', async () => {
    const res = await request(app).post('/cron/reminders').set('x-cron-secret', 'incorrecto');
    expect(res.status).toBe(401);
  });

  it('ejecuta el envio de recordatorios con el secreto correcto', async () => {
    (sendStaleApplicationReminders as any).mockResolvedValue({
      usersChecked: 1,
      emailsSent: 1,
      staleCount: 1,
    });

    const res = await request(app).post('/cron/reminders').set('x-cron-secret', env.cronSecret);

    expect(res.status).toBe(200);
    expect(res.body.emailsSent).toBe(1);
  });
});