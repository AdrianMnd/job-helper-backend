import type { Request, Response } from 'express';
import { sendStaleApplicationReminders } from '../services/reminderService';

export async function triggerReminders(req: Request, res: Response) {
  const result = await sendStaleApplicationReminders();
  return res.json(result);
}