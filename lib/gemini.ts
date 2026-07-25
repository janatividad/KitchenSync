import OpenAI from 'openai';

export const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export function getGeminiClient(): OpenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  const baseURL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/';

  if (!apiKey) {
    console.warn('Gemini API key (GEMINI_API_KEY) is missing.');
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL,
  });
}
