import type { Request, Response } from 'express';
import { z } from 'zod';
import { getProfileByUserId, upsertProfile } from '../services/profileService';

const profileSchema = z.object({
  fullName: z.string().min(1),
  summary: z.string().optional(),
  experience: z.array(z.unknown()).default([]),
  education: z.array(z.unknown()).default([]),
  skills: z.array(z.unknown()).default([]),
});

export async function getProfile(req: Request, res: Response) {
  const profile = await getProfileByUserId(req.user!.userId);
  return res.json(profile);
}

export async function updateProfile(req: Request, res: Response) {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const profile = await upsertProfile(req.user!.userId, parsed.data);
  return res.json(profile);
}
