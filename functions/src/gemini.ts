/**
 * Gemini AI Assistant — Cloud Functions
 *
 * Runs the Gemini API server-side so the API key
 * is never exposed in the client bundle.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) initializeApp();

/**
 * Operational AI assistant powered by Gemini.
 * Only callable by authenticated staff.
 */
export const geminiAssistant = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }

    const callerRole = request.auth.token?.role as string | undefined;
    const staffRoles = ['super_admin', 'ops_manager', 'crew_sched', 'cs_agent'];
    if (!callerRole || !staffRoles.includes(callerRole)) {
        throw new HttpsError('permission-denied', 'Staff access required.');
    }

    const { prompt, context } = request.data;
    if (!prompt) {
        throw new HttpsError('invalid-argument', 'prompt is required.');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new HttpsError('failed-precondition', 'Gemini API key not configured.');
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Context: You are an operational assistant for Deltablue Jet Air. The current data context is: ${context || 'none'}.\n\nUser Prompt: ${prompt}`,
            config: {
                systemInstruction: 'Always maintain a professional, airline-ops focused persona. Use clear, concise language.',
            },
        });
        return { text: response.text };
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new HttpsError('internal', 'Failed to get AI assistance. Please try again.');
    }
});
