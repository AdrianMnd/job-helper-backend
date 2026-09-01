import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { env } from '../config/env';

const client = new GoogleGenerativeAI(env.geminiApiKey);

export async function generateContent(
  systemPrompt: string,
  userPrompt: string,
  params: { temperature: number; topP: number; responseSchema?: Schema }
): Promise<string> {
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

export { SchemaType };