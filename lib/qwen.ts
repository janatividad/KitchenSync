import OpenAI from 'openai';

export const QWEN_MODEL_NAME = process.env.QWEN_MODEL || '';

export function getQwenClient(): OpenAI | null {
  const apiKey = process.env.QWEN_API_KEY;
  const baseURL = process.env.QWEN_BASE_URL;
  const modelName = process.env.QWEN_MODEL;

  if (!apiKey || !baseURL || !modelName) {
    console.warn('Qwen Cloud environment variables (QWEN_API_KEY, QWEN_BASE_URL, and/or QWEN_MODEL) are missing.');
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL,
  });
}
