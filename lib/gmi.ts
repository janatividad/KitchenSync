import OpenAI from 'openai';

export const GMI_MODEL_NAME = process.env.GMI_MODEL || '';

export function getGmiClient(): OpenAI | null {
  const apiKey = process.env.GMI_API_KEY;
  const baseURL = process.env.GMI_BASE_URL;
  const modelName = process.env.GMI_MODEL;

  if (!apiKey || !baseURL || !modelName) {
    console.warn('GMI Cloud environment variables (GMI_API_KEY, GMI_BASE_URL, and/or GMI_MODEL) are missing.');
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL,
  });
}
