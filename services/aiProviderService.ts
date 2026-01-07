import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Entry, AnalysisResult, AppSettings, ReportType, AIProviderType } from "../types";

// Analysis schema for structured output
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

// Prompts for different report types
const REPORT_PROMPTS: Record<ReportType, { title: string; prompt: string }> = {
  weekly: {
    title: '周报',
    prompt: `Generate a weekly summary report based on the following diary entries. 
Identify recurring themes, emotional trends, and key events.
Provide actionable insights and encouragement.
Format in Markdown with sections: 
- 📊 本周概览 (Overview)
- 💭 情绪趋势 (Emotional Trends)
- 🎯 主要话题 (Key Topics)
- 💡 洞察与建议 (Insights & Suggestions)
- ✨ 下周展望 (Looking Ahead)`
  },
  monthly: {
    title: '月报',
    prompt: `Generate a monthly summary report based on the following diary entries.
Analyze the overall emotional journey, identify patterns and growth areas.
Format in Markdown with sections:
- 📅 本月回顾 (Monthly Overview)
- 📈 情绪变化曲线 (Emotional Journey)
- 🏆 本月成就 (Achievements)
- 🔄 反复出现的主题 (Recurring Themes)
- 🌱 成长与变化 (Growth & Changes)
- 💪 下月目标建议 (Goals for Next Month)`
  },
  yearly: {
    title: '年度报告',
    prompt: `Generate a comprehensive yearly review based on the following diary entries.
This is a deep reflection on the entire year's journey.
Format in Markdown with sections:
- 🎊 年度总结 (Year in Review)
- 📊 情绪全景图 (Emotional Landscape)
- ⭐ 年度高光时刻 (Highlights of the Year)
- 🎓 学到的人生经验 (Life Lessons Learned)
- 🔮 个人成长轨迹 (Personal Growth Trajectory)
- 💫 新年寄语 (Message for the New Year)`
  }
};

const ANALYSIS_PROMPT = `Analyze the following diary entry. Provide sentiment analysis, a brief summary, extract relevant tags, identify the mood (as an emoji), and offer 1-2 writing suggestions or reflective questions.

Entry:
`;

const SYSTEM_INSTRUCTION_ANALYSIS = "You are an empathetic, insightful personal diary assistant. Your goal is to help the user organize their thoughts and gain insights. Always respond in Chinese.";
const SYSTEM_INSTRUCTION_REPORT = "You are a professional life coach and analyst. Provide a warm, encouraging, but analytical summary. Always respond in Chinese.";

// DeepSeek API adapter
class DeepSeekAdapter {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.deepseek.com';

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(systemPrompt: string, userPrompt: string, jsonMode: boolean = false): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt + (jsonMode ? '\n\nYou must respond with valid JSON only.' : '') },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        ...(jsonMode && { response_format: { type: 'json_object' } })
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API Error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async analyzeEntry(text: string): Promise<AnalysisResult> {
    const prompt = `${ANALYSIS_PROMPT}${text}

Please respond with a JSON object containing:
- sentiment: "positive", "neutral", or "negative"
- sentimentScore: number from 0 to 100
- summary: brief summary in Chinese (max 2 sentences)
- tags: array of relevant tags in Chinese
- mood: a single emoji
- suggestions: array of 1-2 suggestions or questions in Chinese`;

    const result = await this.chat(SYSTEM_INSTRUCTION_ANALYSIS, prompt, true);
    return JSON.parse(result) as AnalysisResult;
  }

  async generateReport(entries: Entry[], reportType: ReportType): Promise<string> {
    if (!entries.length) return "没有可分析的日记条目。";

    const context = entries
      .map(e => `日期: ${e.date.split('T')[0]}\n标题: ${e.title}\n内容: ${e.content}`)
      .join('\n---\n');

    const { prompt } = REPORT_PROMPTS[reportType];
    const fullPrompt = `${prompt}\n\n日记条目:\n${context}`;

    return await this.chat(SYSTEM_INSTRUCTION_REPORT, fullPrompt, false);
  }
}

// Gemini API adapter
class GeminiAdapter {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async analyzeEntry(text: string): Promise<AnalysisResult> {
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: `${ANALYSIS_PROMPT}${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini AI");
    return JSON.parse(jsonText) as AnalysisResult;
  }

  async generateReport(entries: Entry[], reportType: ReportType): Promise<string> {
    if (!entries.length) return "没有可分析的日记条目。";

    const context = entries
      .map(e => `日期: ${e.date.split('T')[0]}\n标题: ${e.title}\n内容: ${e.content}`)
      .join('\n---\n');

    const { prompt } = REPORT_PROMPTS[reportType];

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: `${prompt}\n\n日记条目:\n${context}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_REPORT
      }
    });

    return response.text || "无法生成报告。";
  }
}

// Unified AI Provider Service
export const AIProviderService = {
  async analyzeEntry(text: string, settings: AppSettings): Promise<AnalysisResult> {
    const { activeProvider, providers } = settings;
    const providerConfig = providers[activeProvider];

    if (!providerConfig.apiKey) {
      throw new Error(`请先配置 ${activeProvider.toUpperCase()} 的 API Key`);
    }

    if (!providerConfig.enabled) {
      throw new Error(`${activeProvider.toUpperCase()} 提供商未启用`);
    }

    try {
      if (activeProvider === 'deepseek') {
        const adapter = new DeepSeekAdapter(providerConfig.apiKey, providerConfig.model);
        return await adapter.analyzeEntry(text);
      } else {
        const adapter = new GeminiAdapter(providerConfig.apiKey, providerConfig.model);
        return await adapter.analyzeEntry(text);
      }
    } catch (error) {
      console.error(`AI Analysis Failed (${activeProvider}):`, error);
      throw error;
    }
  },

  async generateReport(entries: Entry[], reportType: ReportType, settings: AppSettings): Promise<string> {
    const { activeProvider, providers } = settings;
    const providerConfig = providers[activeProvider];

    if (!providerConfig.apiKey) {
      throw new Error(`请先配置 ${activeProvider.toUpperCase()} 的 API Key`);
    }

    if (!providerConfig.enabled) {
      throw new Error(`${activeProvider.toUpperCase()} 提供商未启用`);
    }

    try {
      if (activeProvider === 'deepseek') {
        const adapter = new DeepSeekAdapter(providerConfig.apiKey, providerConfig.model);
        return await adapter.generateReport(entries, reportType);
      } else {
        const adapter = new GeminiAdapter(providerConfig.apiKey, providerConfig.model);
        return await adapter.generateReport(entries, reportType);
      }
    } catch (error) {
      console.error(`Report Generation Failed (${activeProvider}):`, error);
      throw error;
    }
  },

  // Get available models for a provider
  getModels(provider: AIProviderType): string[] {
    if (provider === 'deepseek') {
      return ['deepseek-chat', 'deepseek-reasoner'];
    } else {
      return ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro'];
    }
  },

  // Validate API key by making a test request
  async validateApiKey(provider: AIProviderType, apiKey: string): Promise<boolean> {
    try {
      if (provider === 'deepseek') {
        const adapter = new DeepSeekAdapter(apiKey, 'deepseek-chat');
        await adapter.chat('You are a test assistant.', 'Say "OK" if you can hear me.', false);
        return true;
      } else {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: 'Say "OK"',
        });
        return true;
      }
    } catch {
      return false;
    }
  },

  getReportTypeInfo(type: ReportType) {
    return REPORT_PROMPTS[type];
  }
};
