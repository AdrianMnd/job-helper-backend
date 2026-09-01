import { describe, it, expect } from 'vitest';
import { buildPrompt } from './promptService';
import type { Profile, Application } from '@prisma/client';

const profile = {
  fullName: 'Ada Lovelace',
  summary: 'Backend developer',
  experience: [],
  education: [],
  skills: ['TypeScript'],
} as unknown as Profile;

const application = {
  company: 'Acme',
  position: 'Backend Developer',
  jobDescription: 'Buscamos backend developer con TypeScript',
} as unknown as Application;

describe('promptService', () => {
  it('el prompt de CV incluye los datos del perfil y usa temperatura baja', () => {
    const { systemPrompt, userPrompt, modelParams } = buildPrompt('CV', profile, application);
    expect(userPrompt).toContain('Ada Lovelace');
    expect(userPrompt).toContain('Buscamos backend developer con TypeScript');
    expect(modelParams.temperature).toBe(0.3);
  });

  it('el prompt de carta usa temperatura mas alta que el de CV', () => {
    const { modelParams } = buildPrompt('COVER_LETTER', profile, application);
    expect(modelParams.temperature).toBeGreaterThan(0.3);
  });

  it('el prompt incluye una advertencia explicita contra prompt injection', () => {
    const { systemPrompt } = buildPrompt('CV', profile, application);
    expect(systemPrompt.toLowerCase()).toContain('nunca instrucciones');
  });
});