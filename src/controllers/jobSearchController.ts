import type { Request, Response } from 'express';
import { z } from 'zod';
import { searchJobs } from '../services/jobSearchService';

const searchQuerySchema = z.object({
  query: z.string().min(1),
  location: z.string().default(''),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  contractHours: z.enum(['full_time', 'part_time']).optional(),
  contractType: z.enum(['permanent', 'contract']).optional(),
  sortBy: z.enum(['relevance', 'date', 'salary']).optional(),
  maxDaysOld: z.coerce.number().optional(),
  remoteOnly: z.coerce.boolean().optional(),
});

export async function searchJobsController(req: Request, res: Response) {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Parametros de busqueda invalidos' });
  }

  const { query, location, ...filters } = parsed.data;
  const results = await searchJobs(query, location, filters);
  return res.json(results);
}
