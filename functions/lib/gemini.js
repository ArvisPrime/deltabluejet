"use strict";
/**
 * Gemini AI Assistant — Cloud Functions
 *
 * Runs the Gemini API server-side so the API key
 * is never exposed in the client bundle.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiAssistant = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
/**
 * Operational AI assistant powered by Gemini.
 * Only callable by authenticated staff.
 */
exports.geminiAssistant = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in.');
    }
    const callerRole = request.auth.token?.role;
    const staffRoles = ['super_admin', 'ops_manager', 'crew_sched', 'cs_agent'];
    if (!callerRole || !staffRoles.includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Staff access required.');
    }
    const { prompt, context } = request.data;
    if (!prompt) {
        throw new https_1.HttpsError('invalid-argument', 'prompt is required.');
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new https_1.HttpsError('failed-precondition', 'Gemini API key not configured.');
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
    }
    catch (error) {
        console.error('Gemini API Error:', error);
        throw new https_1.HttpsError('internal', 'Failed to get AI assistance. Please try again.');
    }
});
//# sourceMappingURL=gemini.js.map