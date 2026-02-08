
import { GoogleGenAI } from "@google/genai";

export const getOperationalAssistance = async (prompt: string, context: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: You are an operations analyst at Deltablue Jet Air. The current data context is: ${context}.
      
      User Prompt: ${prompt}`,
      config: {
        systemInstruction: "Always maintain a professional, airline-ops focused persona. Use clear, concise language."
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble analyzing the data right now. Please check the systems manually.";
  }
};
