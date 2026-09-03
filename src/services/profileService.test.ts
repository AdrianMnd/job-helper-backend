import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma');
import { prisma } from '../lib/prisma';
import { getProfileByUserId, upsertProfile } from './profileService';

describe('profileService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getProfileByUserId busca por userId', async () => {
    (prisma.profile.findUnique as any).mockResolvedValue({ id: 'p1' });

    const result = await getProfileByUserId('user1');

    expect(prisma.profile.findUnique).toHaveBeenCalledWith({ where: { userId: 'user1' } });
    expect(result).toEqual({ id: 'p1' });
  });

  it('upsertProfile usa el userId correcto sin dejar que los datos lo sobreescriban', async () => {
    (prisma.profile.upsert as any).mockResolvedValue({ id: 'p1' });

    await upsertProfile('user1', { fullName: 'Ada' } as any);

    const call = (prisma.profile.upsert as any).mock.calls[0][0];
    expect(call.where).toEqual({ userId: 'user1' });
    expect(call.create.userId).toBe('user1');
  });
});