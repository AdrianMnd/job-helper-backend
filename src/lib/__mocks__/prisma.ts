import { vi } from 'vitest';

// Mock manual: vitest lo detecta automaticamente al llamar vi.mock('../lib/prisma')
// en un test, sin necesidad de factory function. Cada metodo es un vi.fn()
// que configuras por test con mockResolvedValue/mockRejectedValue.
export const prisma: any = {
  user: { findUnique: vi.fn(), create: vi.fn() },
  profile: { findUnique: vi.fn(), upsert: vi.fn() },
  application: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  generatedDocument: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn() },
  statusHistory: { create: vi.fn(), findMany: vi.fn() },
};

prisma.$transaction = vi.fn(async (fn: any) => fn(prisma));