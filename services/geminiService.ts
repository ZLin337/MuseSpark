import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InspirationNote, Message, Attachment } from "../types";

// NOTE: In a real app, API_KEY should be handled securely. 
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for the Inspiration Note
const noteSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    project: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "One sentence summary" },
        targetAudience: { type: Type.STRING },
        scenarios: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        details: { type: Type.STRING }
      },
      required: ["summary", "targetAudience", "scenarios", "tags", "details"]
    },
    business: {
      type: Type.OBJECT,
      properties: {
        valueProps: { type: Type.ARRAY, items: { type: Type.STRING } },
        difficulties: { type: Type.ARRAY, items: { type: Type.STRING } },
        mvpFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
        strategy: { type: Type.STRING }
      },
      required: ["valueProps", "difficulties", "mvpFeatures", "strategy"]
    },
    legal: {
      type: Type.OBJECT,
      properties: {
        risks: { type: Type.ARRAY, items: { type: Type.STRING } },
        disclaimer: { type: Type.STRING }
      },
      required: ["risks", "disclaimer"]
    }
  },
  required: ["project", "business", "legal"]
};

export const chatWithGemini = async (
  history: Message[],
  newMessage: Message,
  lang: string
) => {
  const systemInstruction = `You are MuseSpark, an expert product consultant. 
  Current Language: ${lang}.
  Analyze images if provided.
  If the user's idea is vague, ask clarifying questions. 
  Be encouraging but realistic.`;

  try {
    // Transform history for API
    const formattedHistory = history.map(h => {
      const parts: any[] = [{ text: h.content }];
      if (h.attachment) {
         // History attachments not fully supported in this simple mapping without strict order, 
         // but consistent with current simple usage. 
         parts.unshift({ 
           inlineData: { 
             mimeType: h.attachment.mimeType, 
             data: h.attachment.data 
           } 
         });
      }
      return {
        role: h.role,
        parts: parts
      };
    });

    const currentParts: any[] = [{ text: newMessage.content }];
    if (newMessage.attachment) {
      currentParts.unshift({
        inlineData: {
          mimeType: newMessage.attachment.mimeType,
          data: newMessage.attachment.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...formattedHistory.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: currentParts }
      ],
      config: { systemInstruction }
    });

    return response.text;
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble connecting. Please try again.";
  }
};

export const analyzeAndGenerateNote = async (
  conversationContext: string,
  lang: string
): Promise<InspirationNote | null> => {
  try {
    const prompt = `
      Create a structured Inspiration Note based on the conversation.
      Language: ${lang}.
      
      Conversation:
      ${conversationContext}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: noteSchema
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        ...data,
        id: Date.now().toString(),
        createdAt: Date.now()
      };
    }
    return null;
  } catch (error) {
    console.error("Analysis Error:", error);
    return null;
  }
};

export const translateNoteContent = async (
  note: InspirationNote,
  targetLang: string
): Promise<InspirationNote | null> => {
  try {
    const prompt = `
      Translate this entire JSON object values into ${targetLang}. 
      Keep the same JSON structure.
      
      Input:
      ${JSON.stringify(note)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: noteSchema
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return { ...note, ...data }; // Preserve IDs etc
    }
    return note;
  } catch (e) {
    console.error("Translation failed", e);
    return note;
  }
};

export const getMindMapSuggestion = async (
  nodesSummary: string,
  query: string,
  lang: string
): Promise<string | null> => {
  try {
    const prompt = `
      Context: Mind map nodes: ${nodesSummary}.
      User Idea: ${query}.
      Language: ${lang}.
      Task: Provide a short, single phrase suggestion (max 5 words) to add as a new node related to the idea.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("MindMap suggestion failed", error);
    return null;
  }
};