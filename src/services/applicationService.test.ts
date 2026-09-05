import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma');
import { prisma } from '../lib/prisma';
import { createApplication, updateApplication, deleteApplication } from './applicationService';

describe('applicationService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('createApplication', () => {
    it('crea la candidatura con una entrada inicial de historial en estado APPLIED', async () => {
      (prisma.application.create as any).mockResolvedValue({ id: 'app1' });

      await createApplication('user1', {
        company: 'Acme',
        position: 'Dev',
        jobDescription: 'oferta',
      });

      expect(prisma.application.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user1',
            company: 'Acme',
            statusHistory: { create: { status: 'SAVED' } },
          }),
        })
      );
    });
  });

  describe('updateApplication', () => {
    it('devuelve null si la candidatura no pertenece al usuario', async () => {
      (prisma.application.findFirst as any).mockResolvedValue(null);

      const result = await updateApplication('user1', 'app1', { status: 'INTERVIEW' });

      expect(result).toBeNull();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('escribe una fila de historial cuando el status cambia', async () => {
      (prisma.application.findFirst as any).mockResolvedValue({ id: 'app1', status: 'APPLIED' });
      (prisma.application.update as any).mockResolvedValue({ id: 'app1', status: 'INTERVIEW' });

      await updateApplication('user1', 'app1', { status: 'INTERVIEW' });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.statusHistory.create).toHaveBeenCalledWith({
        data: { applicationId: 'app1', status: 'INTERVIEW' },
      });
    });

    it('NO escribe historial si se actualiza otro campo distinto al status', async () => {
      (prisma.application.findFirst as any).mockResolvedValue({ id: 'app1', status: 'APPLIED' });
      (prisma.application.update as any).mockResolvedValue({ id: 'app1', notes: 'actualizado' });

      await updateApplication('user1', 'app1', { notes: 'actualizado' });

      expect(prisma.statusHistory.create).not.toHaveBeenCalled();
    });

    it('NO escribe historial si el status enviado es el mismo que ya tenia', async () => {
      (prisma.application.findFirst as any).mockResolvedValue({ id: 'app1', status: 'APPLIED' });
      (prisma.application.update as any).mockResolvedValue({ id: 'app1', status: 'APPLIED' });

      await updateApplication('user1', 'app1', { status: 'APPLIED' });

      expect(prisma.statusHistory.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteApplication', () => {
    it('devuelve false si la candidatura no existe para ese usuario', async () => {
      (prisma.application.findFirst as any).mockResolvedValue(null);

      const result = await deleteApplication('user1', 'app1');

      expect(result).toBe(false);
      expect(prisma.application.delete).not.toHaveBeenCalled();
    });

    it('borra y devuelve true si existe', async () => {
      (prisma.application.findFirst as any).mockResolvedValue({ id: 'app1' });

      const result = await deleteApplication('user1', 'app1');

      expect(result).toBe(true);
      expect(prisma.application.delete).toHaveBeenCalledWith({ where: { id: 'app1' } });
    });
  });
});