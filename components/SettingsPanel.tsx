import React, { useState } from 'react';
import { Settings, Key, Bot, Check, X, Eye, EyeOff, Sparkles, Zap, Brain, Globe } from 'lucide-react';
import { AppSettings, AIProviderType, DEFAULT_SETTINGS } from '../types';
import { AIProviderService } from '../services/aiProviderService';

interface SettingsPanelProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  theme: 'light' | 'dark';
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, theme }) => {
  const [showApiKey, setShowApiKey] = useState<{ gemini: boolean; deepseek: boolean }>({
    gemini: false,
    deepseek: false,
  });
  const [validating, setValidating] = useState<AIProviderType | null>(null);
  const [validationResult, setValidationResult] = useState<{ provider: AIProviderType; valid: boolean } | null>(null);

  const handleProviderToggle = (provider: AIProviderType) => {
    const newSettings = {
      ...settings,
      activeProvider: provider,
      providers: {
        ...settings.providers,
        [provider]: {
          ...settings.providers[provider],
          enabled: true,
        },
      },
    };
    onSettingsChange(newSettings);
  };

  const handleApiKeyChange = (provider: AIProviderType, apiKey: string) => {
    const newSettings = {
      ...settings,
      providers: {
        ...settings.providers,
        [provider]: {
          ...settings.providers[provider],
          apiKey,
        },
      },
    };
    onSettingsChange(newSettings);
    setValidationResult(null);
  };

  const handleModelChange = (provider: AIProviderType, model: string) => {
    const newSettings = {
      ...settings,
      providers: {
        ...settings.providers,
        [provider]: {
          ...settings.providers[provider],
          model,
        },
      },
    };
    onSettingsChange(newSettings);
  };

  const handleValidateApiKey = async (provider: AIProviderType) => {
    const apiKey = settings.providers[provider].apiKey;
    if (!apiKey) return;

    setValidating(provider);
    try {
      const valid = await AIProviderService.validateApiKey(provider, apiKey);
      setValidationResult({ provider, valid });
    } catch {
      setValidationResult({ provider, valid: false });
    } finally {
      setValidating(null);
    }
  };

  const handleLanguageChange = (language: 'zh' | 'en') => {
    onSettingsChange({ ...settings, language });
  };

  const handleAutoAnalyzeToggle = () => {
    onSettingsChange({ ...settings, autoAnalyze: !settings.autoAnalyze });
  };

  const ProviderCard: React.FC<{ provider: AIProviderType; icon: React.ReactNode; name: string; description: string }> = ({
    provider,
    icon,
    name,
    description,
  }) => {
    const isActive = settings.activeProvider === provider;
    const config = settings.providers[provider];
    const models = AIProviderService.getModels(provider);

    return (
      <div
        className={`rounded-xl border-2 p-6 transition-all duration-200 ${
          isActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isActive ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
          </div>
          <button
            onClick={() => handleProviderToggle(provider)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {isActive ? '当前使用' : '切换'}
          </button>
        </div>

        {/* API Key Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Key className="w-4 h-4 inline mr-1" />
              API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey[provider] ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                  placeholder={`输入 ${name} API Key`}
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey({ ...showApiKey, [provider]: !showApiKey[provider] })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showApiKey[provider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => handleValidateApiKey(provider)}
                disabled={!config.apiKey || validating === provider}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {validating === provider ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : validationResult?.provider === provider ? (
                  validationResult.valid ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )
                ) : (
                  '验证'
                )}
              </button>
            </div>
            {validationResult?.provider === provider && (
              <p className={`mt-1 text-sm ${validationResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                {validationResult.valid ? '✓ API Key 有效' : '✗ API Key 无效，请检查'}
              </p>
            )}
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Bot className="w-4 h-4 inline mr-1" />
              模型选择
            </label>
            <select
              value={config.model}
              onChange={(e) => handleModelChange(provider, e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/50">
              <Settings className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">配置 AI 服务和应用偏好</p>
        </div>

        {/* AI Provider Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            AI 服务提供商
          </h2>
          <div className="grid gap-4">
            <ProviderCard
              provider="deepseek"
              icon={<Brain className="w-5 h-5" />}
              name="DeepSeek"
              description="国产大模型，支持深度推理"
            />
            <ProviderCard
              provider="gemini"
              icon={<Zap className="w-5 h-5" />}
              name="Google Gemini"
              description="Google 最新 AI 模型"
            />
          </div>
        </section>

        {/* General Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-500" />
            通用设置
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Language */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">语言 / Language</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">选择界面和 AI 响应语言</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange('zh')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.language === 'zh'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  中文
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.language === 'en'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Auto Analyze */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">自动分析</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">保存日记时自动进行 AI 分析</p>
              </div>
              <button
                onClick={handleAutoAnalyzeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoAnalyze ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoAnalyze ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-primary-100 dark:border-primary-800">
          <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">💡 使用提示</h3>
          <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-1">
            <li>• <strong>DeepSeek</strong>: 推荐使用 <code className="bg-primary-100 dark:bg-primary-800 px-1 rounded">deepseek-chat</code> 进行日常分析，<code className="bg-primary-100 dark:bg-primary-800 px-1 rounded">deepseek-reasoner</code> 适合深度思考</li>
            <li>• <strong>Gemini</strong>: <code className="bg-primary-100 dark:bg-primary-800 px-1 rounded">gemini-2.0-flash</code> 速度最快，<code className="bg-primary-100 dark:bg-primary-800 px-1 rounded">gemini-1.5-pro</code> 质量最高</li>
            <li>• 获取 DeepSeek API Key: <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="underline">platform.deepseek.com</a></li>
            <li>• 获取 Gemini API Key: <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline">aistudio.google.com</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
};
