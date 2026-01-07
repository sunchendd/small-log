import React, { useState, useEffect } from 'react';
import { Entry, AppSettings } from '../types';
import { ChevronLeft, Sparkles, Loader2, Tag, Hash, Save } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { AIProviderService } from '../services/aiProviderService';

interface EditorProps {
  entry: Entry;
  onUpdate: (updates: Partial<Entry>) => void;
  onBack: () => void;
  settings: AppSettings;
}

export const Editor: React.FC<EditorProps> = ({ entry, onUpdate, onBack, settings }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localTitle, setLocalTitle] = useState(entry.title);
  const [localContent, setLocalContent] = useState(entry.content);

  useEffect(() => {
    setLocalTitle(entry.title);
    setLocalContent(entry.content);
  }, [entry.id]);

  const handleBlur = () => {
    if (localTitle !== entry.title || localContent !== entry.content) {
      onUpdate({ title: localTitle, content: localContent });
    }
  };

  const handleAnalyze = async () => {
    if (!localContent.trim()) return;
    
    // Check if API key is configured
    if (!settings.providers[settings.activeProvider].apiKey) {
      alert('请先在设置中配置 API Key');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      // Save first
      onUpdate({ title: localTitle, content: localContent });
      
      const result = await AIProviderService.analyzeEntry(localContent, settings);
      onUpdate({
        sentiment: result.sentiment,
        sentimentScore: result.sentimentScore,
        summary: result.summary,
        tags: [...new Set([...entry.tags, ...result.tags])],
        mood: result.mood,
        aiAnalysis: {
            suggestions: result.suggestions
        }
      });
    } catch (error: any) {
      alert(error.message || "AI 分析失败，请检查 API Key 配置");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center">
            <button onClick={onBack} className="md:hidden mr-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                <ChevronLeft />
            </button>
            <div className="text-sm text-slate-400">
                {format(new Date(entry.date), 'yyyy年M月d日', { locale: zhCN })} &bull; {format(new Date(entry.date), 'HH:mm')}
            </div>
        </div>
        
        <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-300 dark:text-slate-600 hidden sm:inline-block">
                {localContent.length} 字
            </span>
            <button
                onClick={() => onUpdate({ title: localTitle, content: localContent })}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors md:hidden"
            >
                <Save className="w-5 h-5" />
            </button>
            <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !localContent}
                className={`
                    flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm
                    ${isAnalyzing 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:shadow-md'
                    }
                `}
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        分析中...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI 分析
                    </>
                )}
            </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Text Area */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-6 md:px-12 md:py-8 custom-scrollbar">
            <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleBlur}
                placeholder="给这篇日记起个标题..."
                className="text-3xl md:text-4xl font-serif font-bold text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-700 border-none outline-none bg-transparent mb-6 w-full"
            />
            <textarea
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                onBlur={handleBlur}
                placeholder="今天有什么想说的？"
                className="flex-1 w-full resize-none border-none outline-none bg-transparent text-lg leading-relaxed text-slate-600 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-700 font-sans"
            />
        </div>

        {/* AI Insights Sidebar (Right side, collapsible or persistent based on screen) */}
        {(entry.summary || entry.aiAnalysis) && (
            <div className="w-72 bg-slate-50 dark:bg-slate-950 border-l border-gray-100 dark:border-slate-800 overflow-y-auto hidden xl:block p-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" /> AI 分析
                </h4>
                
                {entry.mood && (
                    <div className="mb-6 text-center p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                        <span className="text-4xl block mb-2">{entry.mood}</span>
                        <span className="text-xs font-medium text-slate-500 capitalize">
                          {entry.sentiment === 'positive' ? '积极' : entry.sentiment === 'negative' ? '消极' : '中性'}
                        </span>
                        {entry.sentimentScore !== undefined && (
                             <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-1.5 mt-2">
                                <div 
                                    className={`h-1.5 rounded-full ${entry.sentimentScore > 60 ? 'bg-green-500' : entry.sentimentScore < 40 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                                    style={{ width: `${entry.sentimentScore}%` }}
                                ></div>
                             </div>
                        )}
                    </div>
                )}

                {entry.summary && (
                    <div className="mb-6">
                        <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">摘要</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-800">
                            "{entry.summary}"
                        </p>
                    </div>
                )}

                {entry.tags && entry.tags.length > 0 && (
                     <div className="mb-6">
                        <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">标签</h5>
                        <div className="flex flex-wrap gap-2">
                            {entry.tags.map(t => (
                                <span key={t} className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs text-slate-500 flex items-center">
                                    <Hash className="w-2 h-2 mr-1 opacity-50" />{t}
                                </span>
                            ))}
                        </div>
                     </div>
                )}

                {entry.aiAnalysis?.suggestions && (
                    <div>
                         <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">建议</h5>
                         <ul className="space-y-2">
                            {entry.aiAnalysis.suggestions.map((s, i) => (
                                <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start">
                                    <span className="text-indigo-500 mr-2">•</span>
                                    {s}
                                </li>
                            ))}
                         </ul>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
