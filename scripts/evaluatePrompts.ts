import { prisma } from '../src/lib/prisma';
import { buildPrompt } from '../src/services/promptService';
import { generateContent } from '../src/services/geminiService';

// Script de evaluacion, no parte de la app en produccion. Genera el mismo
// CV con distintas temperaturas para la misma candidatura y compara
// aspectos objetivos: cuantas keyRequirements identifica, si el JSON es
// valido, y la longitud total (proxy tosco de "cuanto detalle" da).
//
// Uso: npx tsx scripts/evaluatePrompts.ts <applicationId>

async function main() {
  const applicationId = process.argv[2];
  if (!applicationId) {
    console.error('Uso: npx tsx scripts/evaluatePrompts.ts <applicationId>');
    process.exit(1);
  }

  const application = await prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: application.userId } });

  const temperaturesToTest = [0.1, 0.3, 0.5, 0.7];
  const results: Array<{ temperature: number; valid: boolean; keyRequirementsCount: number; length: number }> = [];

  for (const temperature of temperaturesToTest) {
  const { systemPrompt, userPrompt, modelParams } = buildPrompt('CV', profile, application);

  try {
    const raw = await generateContent(systemPrompt, userPrompt, { ...modelParams, temperature });
    try {
      const parsed = JSON.parse(raw);
      results.push({
        temperature,
        valid: true,
        keyRequirementsCount: parsed.keyRequirements?.length ?? 0,
        length: raw.length,
      });
    } catch {
      results.push({ temperature, valid: false, keyRequirementsCount: 0, length: raw.length });
    }
  } catch (err) {
    console.error(`Fallo la llamada con temperature=${temperature}:`, err instanceof Error ? err.message : err);
    results.push({ temperature, valid: false, keyRequirementsCount: 0, length: 0 });
  }
}

  console.table(results);
}

main().then(() => process.exit(0));