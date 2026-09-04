import type { Request, Response } from 'express';
import { z } from 'zod';
import { searchJobs } from '../services/jobSearchService';

const searchQuerySchema = z.object({
  query: z.string().min(1),
  location: z.string().default(''),
});

export async function searchJobsController(req: Request, res: Response) {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Falta el parametro "query"' });
  }

  const results = await searchJobs(parsed.data.query, parsed.data.location);
  return res.json(results);
}