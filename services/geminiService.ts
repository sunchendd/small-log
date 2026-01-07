import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Entry, AnalysisResult } from "../types";

// Ensure API Key is available
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sentiment: {
      type: Type.STRING,
      enum: ['positive', 'neutral', 'negative'],
      description: "The overall sentiment of the text."
    },
    sentimentScore: {
      type: Type.INTEGER,
      description: "A score from 0 to 100 representing positivity."
    },
    summary: {
      type: Type.STRING,
      description: "A concise summary of the diary entry (max 2 sentences)."
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Relevant topics or keywords extracted from the text."
    },
    mood: {
      type: Type.STRING,
      description: "A single emoji representing the mood."
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Writing improvements or reflective questions based on the content."
    }
  },
  required: ["sentiment", "sentimentScore", "summary", "tags", "mood", "suggestions"]
};

export const GeminiService = {
  async analyzeEntry(text: string): Promise<AnalysisResult> {
    if (!API_KEY) {
      throw new Error("API Key is missing. Please configure your environment.");
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following diary entry. Provide sentiment analysis, a brief summary, extract relevant tags, identify the mood (as an emoji), and offer 1-2 writing suggestions or reflective questions.\n\nEntry:\n${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
          systemInstruction: "You are an empathetic, insightful personal diary assistant. Your goal is to help the user organize their thoughts and gain insights."
        }
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error("No response from AI");
      
      return JSON.parse(jsonText) as AnalysisResult;

    } catch (error) {
      console.error("Gemini Analysis Failed:", error);
      throw error;
    }
  },

  async generateWeeklyReport(entries: Entry[]): Promise<string> {
    if (!entries.length) return "No entries to analyze.";

    const context = entries.map(e => `Date: ${e.date.split('T')[0]}\nTitle: ${e.title}\nContent: ${e.content}`).join('\n---\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a weekly summary report based on the following diary entries. Identify recurring themes, emotional trends, and key events. Format in Markdown.\n\nEntries:\n${context}`,
        config: {
            systemInstruction: "You are a professional life coach and analyst. Provide a warm, encouraging, but analytical summary."
        }
      });
      
      return response.text || "Could not generate report.";
    } catch (error) {
      console.error("Report Generation Failed:", error);
      return "Error generating report. Please check your connection.";
    }
  }
};
