import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { env } from '../config/env';

vi.mock('../lib/prisma');
import { prisma } from '../lib/prisma';

const app = createApp();
const token = jwt.sign({ userId: 'u1', email: 'a@a.com' }, env.jwtSecret);

describe('Profile routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /profile requiere autenticacion', async () => {
    const res = await request(app).get('/profile');
    expect(res.status).toBe(401);
  });

  it('GET /profile devuelve null si el usuario aun no tiene perfil', async () => {
    (prisma.profile.findUnique as any).mockResolvedValue(null);

    const res = await request(app).get('/profile').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('PUT /profile valida el body con Zod', async () => {
    const res = await request(app)
      .put('/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ summary: 'sin nombre' }); // falta fullName, requerido

    expect(res.status).toBe(400);
  });

  it('PUT /profile guarda un perfil valido', async () => {
    (prisma.profile.upsert as any).mockResolvedValue({ id: 'p1', fullName: 'Ada' });

    const res = await request(app)
      .put('/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Ada', skills: ['TypeScript'] });

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Ada');
  });
});