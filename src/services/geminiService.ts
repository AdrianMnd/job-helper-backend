import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { env } from '../config/env';

const client = new GoogleGenerativeAI(env.geminiApiKey);
// Solo se activa con ambas condiciones a la vez: nunca queremos que un
// despiste de configuracion active esto en produccion por accidente.
const E2E_MOCK_ENABLED = process.env.E2E_MOCK_GEMINI === 'true' && process.env.NODE_ENV !== 'production';

export async function generateContent(
  systemPrompt: string,
  userPrompt: string,
  params: { temperature: number; topP: number; responseSchema?: Schema }
): Promise<string> {
  if (E2E_MOCK_ENABLED) {
    return mockGeminiResponse();
  }
  const model = client.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: params.temperature,
      topP: params.topP,
      ...(params.responseSchema
        ? { responseMimeType: 'application/json', responseSchema: params.responseSchema }
        : {}),
    },
  });

  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

export async function generateFromImage(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  mimeType: string,
  responseSchema: Schema
): Promise<string> {
  const model = client.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.2, // baja: queremos extraccion fiel, no interpretacion creativa
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType } },
    userPrompt,
  ]);

  return result.response.text();
}

// Respuesta enlatada para e2e: superset de campos de CV y de extraccion de
// oferta a la vez. Zod no rechaza campos de mas (nuestros schemas no usan
// .strict()), asi que sirve tanto para /generate como para /extract-from-text
// sin necesidad de dos mocks distintos.
function mockGeminiResponse(): string {
  return JSON.stringify({
    keyRequirements: ['Test'],
    fullName: 'Usuario E2E',
    headline: 'Puesto de prueba',
    summary: 'Resumen generado por el mock de e2e',
    skillGroups: [{ category: 'Test', skills: ['Testing'] }],
    experience: [{ role: 'Rol', company: 'Empresa', period: '2020-2024', bullets: ['Bullet de prueba'] }],
    education: [{ degree: 'Grado', institution: 'Universidad', period: '2016-2020' }],
    company: 'Empresa E2E',
    position: 'Puesto E2E',
    jobDescription: 'Descripcion generada por el mock',
  });
}

export { SchemaType };