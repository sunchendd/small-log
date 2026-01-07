export type ViewMode = 'editor' | 'analytics' | 'settings' | 'calendar';
export type ThemeMode = 'light' | 'dark';
export type ReportType = 'weekly' | 'monthly' | 'yearly';
export type AIProviderType = 'gemini' | 'deepseek';

// AI Provider Configuration
export interface AIProviderConfig {
  type: AIProviderType;
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface DeepSeekConfig extends AIProviderConfig {
  type: 'deepseek';
  model: 'deepseek-chat' | 'deepseek-reasoner';
}

export interface GeminiConfig extends AIProviderConfig {
  type: 'gemini';
  model: 'gemini-2.0-flash' | 'gemini-2.0-flash-lite' | 'gemini-1.5-pro';
}

// App Settings
export interface AppSettings {
  activeProvider: AIProviderType;
  providers: {
    gemini: GeminiConfig;
    deepseek: DeepSeekConfig;
  };
  language: 'zh' | 'en';
  autoAnalyze: boolean;
}

// Report
export interface Report {
  id: string;
  type: ReportType;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  entryCount: number;
}

export interface Entry {
  id: string;
  title: string;
  content: string; // Markdown/Rich text
  date: string; // ISO String
  updatedAt: string; // ISO String
  tags: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number; // 0 - 100
  summary?: string;
  mood?: string; // Emoji or short word
  aiAnalysis?: {
    suggestions?: string[];
    keywords?: string[];
  };
}

export interface AnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  summary: string;
  tags: string[];
  mood: string;
  suggestions: string[];
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  activeProvider: 'deepseek',
  providers: {
    gemini: {
      type: 'gemini',
      apiKey: '',
      model: 'gemini-2.0-flash',
      enabled: false,
    },
    deepseek: {
      type: 'deepseek',
      apiKey: '',
      model: 'deepseek-chat',
      enabled: true,
    },
  },
  language: 'zh',
  autoAnalyze: false,
};
