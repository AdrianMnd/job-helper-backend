import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { env } from '../config/env';

vi.mock('../lib/prisma');
import { prisma } from '../lib/prisma';

const app = createApp();
const token = jwt.sign({ userId: 'u1', email: 'a@a.com' }, env.jwtSecret);

describe('Application CRUD routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /applications lista solo las del usuario autenticado', async () => {
    (prisma.application.findMany as any).mockResolvedValue([{ id: 'a1' }]);

    const res = await request(app).get('/applications').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } })
    );
  });

  it('POST /applications valida campos requeridos', async () => {
    const res = await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ company: 'Acme' }); // faltan position y jobDescription

    expect(res.status).toBe(400);
  });

  it('GET /applications/:id devuelve 404 si no es del usuario', async () => {
    (prisma.application.findFirst as any).mockResolvedValue(null);

    const res = await request(app).get('/applications/x').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('PATCH /applications/:id actualiza y devuelve la candidatura', async () => {
    (prisma.application.findFirst as any).mockResolvedValue({ id: 'a1', status: 'APPLIED' });
    (prisma.application.update as any).mockResolvedValue({ id: 'a1', status: 'INTERVIEW' });

    const res = await request(app)
      .patch('/applications/a1')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INTERVIEW' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('INTERVIEW');
  });

  it('DELETE /applications/:id devuelve 204 si se borra correctamente', async () => {
    (prisma.application.findFirst as any).mockResolvedValue({ id: 'a1' });

    const res = await request(app).delete('/applications/a1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it('GET /applications/:id/history devuelve el historial ordenado', async () => {
    (prisma.application.findFirst as any).mockResolvedValue({ id: 'a1' });
    (prisma.statusHistory.findMany as any).mockResolvedValue([{ status: 'APPLIED' }]);

    const res = await request(app)
      .get('/applications/a1/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ status: 'APPLIED' }]);
  });

  it('GET /applications/:id/documents devuelve los documentos generados', async () => {
    (prisma.application.findFirst as any).mockResolvedValue({ id: 'a1' });
    (prisma.generatedDocument.findMany as any).mockResolvedValue([{ id: 'd1' }]);

    const res = await request(app)
      .get('/applications/a1/documents')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 'd1' }]);
  });
});