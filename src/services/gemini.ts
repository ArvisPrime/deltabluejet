/**
 * Gemini AI Service — Deltablue Jet Air
 *
 * Routes all AI requests through the `geminiAssistant` Cloud Function
 * so the API key is never exposed in the client bundle.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase.config';

const geminiAssistantFn = httpsCallable<
  { prompt: string; context: string },
  { text: string }
>(functions, 'geminiAssistant');

export const getOperationalAssistance = async (prompt: string, context: string): Promise<string> => {
  try {
    const result = await geminiAssistantFn({ prompt, context });
    return result.data.text;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return "I'm sorry, I'm having trouble analyzing the data right now. Please check the systems manually.";
  }
};
