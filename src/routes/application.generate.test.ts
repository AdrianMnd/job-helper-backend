import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { env } from '../config/env';

vi.mock('../lib/prisma');
vi.mock('../services/geminiService');

import { prisma } from '../lib/prisma';
import { generateContent } from '../services/geminiService';

const app = createApp();
const token = jwt.sign({ userId: 'u1', email: 'a@a.com' }, env.jwtSecret);

const application = {
  id: 'app1',
  userId: 'u1',
  company: 'Acme',
  position: 'Dev',
  jobDescription: 'oferta de ejemplo',
};
const profile = {
  id: 'p1',
  userId: 'u1',
  fullName: 'Ada',
  summary: '',
  experience: [],
  education: [],
  skills: [],
};

describe('POST /applications/:id/generate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('genera el documento y lo guarda como version 1', async () => {
    (prisma.application.findFirst as any).mockResolvedValue(application);
    (prisma.profile.findUnique as any).mockResolvedValue(profile);
    (prisma.generatedDocument.findFirst as any).mockResolvedValue(null);
    (prisma.generatedDocument.create as any).mockResolvedValue({ id: 'd1', version: 1 });
    (generateContent as any).mockResolvedValue('CV generado');

    const res = await request(app)
      .post('/applications/app1/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ docType: 'CV' });

    expect(res.status).toBe(201);
    expect(prisma.generatedDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ version: 1 }) })
    );
  });

  it('devuelve 400 si el usuario no tiene perfil creado', async () => {
    (prisma.application.findFirst as any).mockResolvedValue(application);
    (prisma.profile.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .post('/applications/app1/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ docType: 'CV' });

    expect(res.status).toBe(400);
  });

  // Este es el test que reproduce el bug de hoy: si no existiera el
  // asyncHandler + errorHandler, esta peticion tiraria el proceso Node
  // entero en vez de devolver un 500 controlado.
  it('devuelve 500 en vez de caerse si Gemini falla', async () => {
    (prisma.application.findFirst as any).mockResolvedValue(application);
    (prisma.profile.findUnique as any).mockResolvedValue(profile);
    (generateContent as any).mockRejectedValue(new Error('Modelo no disponible'));

    const res = await request(app)
      .post('/applications/app1/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ docType: 'CV' });

    expect(res.status).toBe(500);
  });
});