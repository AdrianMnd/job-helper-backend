import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

vi.mock('../lib/prisma');

import { prisma } from '../lib/prisma';

const app = createApp();

describe('POST /auth/register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea un usuario y devuelve un token', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({ id: 'u1', email: 'test@test.com' });

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it('rechaza un email ya registrado con 409', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1' });

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('rechaza una contrasena demasiado corta con 400 (validacion Zod)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: '123' });

    expect(res.status).toBe(400);
  });
});