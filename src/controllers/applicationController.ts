import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import {
  listApplicationsByUser,
  createApplication as createApplicationService,
  getApplicationForUser,
  updateApplication as updateApplicationService,
  deleteApplication as deleteApplicationService,
} from '../services/applicationService';
import { getProfileByUserId } from '../services/profileService';
import { buildPrompt } from '../services/promptService';
import { generateContent } from '../services/geminiService';

const applicationSchema = z.object({
  company: z.string().min(1),
  position: z.string().min(1),
  jobDescription: z.string().min(1),
  jobUrl: z.string().url().optional(),
  notes: z.string().optional(),
  appliedDate: z.string().optional(),
});

const updateSchema = applicationSchema.partial().extend({
  status: z.enum(['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
});

const generateSchema = z.object({
  docType: z.enum(['CV', 'COVER_LETTER']),
});

export async function listApplications(req: Request, res: Response) {
  const applications = await listApplicationsByUser(req.user!.userId);
  return res.json(applications);
}

export async function createApplication(req: Request, res: Response) {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const application = await createApplicationService(req.user!.userId, parsed.data);
  return res.status(201).json(application);
}

export async function getApplication(req: Request, res: Response) {
  const application = await getApplicationForUser(req.user!.userId, req.params.id);
  if (!application) return res.status(404).json({ error: 'Candidatura no encontrada' });
  return res.json(application);
}

export async function updateApplication(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const updated = await updateApplicationService(req.user!.userId, req.params.id, parsed.data);
  if (!updated) return res.status(404).json({ error: 'Candidatura no encontrada' });
  return res.json(updated);
}

export async function deleteApplication(req: Request, res: Response) {
  const deleted = await deleteApplicationService(req.user!.userId, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Candidatura no encontrada' });
  return res.status(204).send();
}

// Ruta "cara": dispara una llamada real a Gemini. Por eso conviene que el
// frontend pida confirmacion antes de invocarla, igual que las acciones
// irreversibles en Task Agent.
export async function generateDocument(req: Request, res: Response) {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { docType } = parsed.data;

  const application = await getApplicationForUser(req.user!.userId, req.params.id);
  if (!application) return res.status(404).json({ error: 'Candidatura no encontrada' });

  const profile = await getProfileByUserId(req.user!.userId);
  if (!profile) {
    return res.status(400).json({ error: 'Completa tu perfil antes de generar documentos' });
  }

  const { prompt, modelParams } = buildPrompt(docType, profile, application);
  const content = await generateContent(prompt, modelParams);

  const lastVersion = await prisma.generatedDocument.findFirst({
    where: { applicationId: application.id, docType },
    orderBy: { version: 'desc' },
  });

  const document = await prisma.generatedDocument.create({
    data: {
      applicationId: application.id,
      docType,
      version: (lastVersion?.version ?? 0) + 1,
      content,
      promptUsed: prompt,
      modelParams,
    },
  });

  return res.status(201).json(document);
}

export async function listDocuments(req: Request, res: Response) {
  const application = await getApplicationForUser(req.user!.userId, req.params.id);
  if (!application) return res.status(404).json({ error: 'Candidatura no encontrada' });

  const documents = await prisma.generatedDocument.findMany({
    where: { applicationId: application.id },
    orderBy: [{ docType: 'asc' }, { version: 'desc' }],
  });
  return res.json(documents);
}
