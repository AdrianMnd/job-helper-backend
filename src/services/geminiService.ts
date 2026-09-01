import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

// Capa "cruda" de comunicacion con la API de Gemini. No sabe nada de CVs,
// candidaturas ni dominio de negocio: solo recibe texto + parametros y
// devuelve texto. Esta separacion respecto a promptService es la que permite
// testear promptService (construccion de prompts) sin hacer llamadas reales
// a la API, y viceversa.

const client = new GoogleGenerativeAI(env.geminiApiKey);

export async function generateContent(
  systemPrompt: string,
  userPrompt: string,
  params: { temperature: number; topP: number }
): Promise<string> {
  const model = client.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: params.temperature,
      topP: params.topP,
    },
  });

  const result = await model.generateContent(userPrompt);
  return result.response.text();
}
